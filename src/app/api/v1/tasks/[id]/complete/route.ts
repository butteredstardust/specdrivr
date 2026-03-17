import { NextRequest, NextResponse } from 'next/server';
import { verifyAgentToken } from '@/lib/agent-auth';
import { taskRepository, agentSessionRepository } from '@/repositories';
import { handleApiError } from '@/lib/error-handler';
import { db } from '@/db';
import { taskAttempts, agentSessions } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const CompleteTaskSchema = z.object({
  output: z.string().max(50000).optional(),
  status: z.enum(['done', 'failed']),
  exitCode: z.number().int().optional(),
  errorMessage: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const authResult = await verifyAgentToken(request.headers.get('Authorization'));
  if (!authResult.success) {
    return authResult.response;
  }

  const { id } = await params;
  const taskId = parseInt(id, 10);

  try {
    const body = await request.json();
    const parsed = CompleteTaskSchema.parse(body);

    const task = await taskRepository.getById(taskId);
    if (!task) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Task not found' } },
        { status: 404 }
      );
    }

    // 1. Update task status
    await taskRepository.update(taskId, {
      status: parsed.status === 'done' ? 'done' : 'failed',
      completedAt: new Date(),
    });

    // 2. Create task attempt record
    // Get latest seq for this task
    const [latestAttempt] = await db
      .select({ seq: taskAttempts.seq })
      .from(taskAttempts)
      .where(eq(taskAttempts.taskId, taskId))
      .orderBy(sql`${taskAttempts.seq} DESC`)
      .limit(1);

    const nextSeq = (latestAttempt?.seq ?? 0) + 1;

    // Find the running session for this plan to associate with the attempt
    const [runningSession] = await db
      .select({ id: agentSessions.id })
      .from(agentSessions)
      .where(and(eq(agentSessions.planId, task.planId), eq(agentSessions.status, 'running')))
      .limit(1);

    await db.insert(taskAttempts).values({
      taskId,
      sessionId: runningSession?.id || null,
      seq: nextSeq,
      status: parsed.status === 'done' ? 'succeeded' : 'failed',
      logLines: parsed.output ? [parsed.output] : [],
      exitCode: parsed.exitCode,
      errorMessage: parsed.errorMessage,
      endedAt: new Date(),
    });

    // 3. Check if all tasks in the plan are done
    const allTasks = await taskRepository.getByPlanId(task.planId);
    const allDone = allTasks.every((t) => t.status === 'done' || t.status === 'skipped');

    if (allDone) {
      // Find the running session for this plan
      const [session] = await db
        .select()
        .from(agentSessions)
        .where(and(eq(agentSessions.planId, task.planId), eq(agentSessions.status, 'running')))
        .limit(1);

      if (session) {
        await agentSessionRepository.update(session.id, {
          status: 'completed',
          endedAt: new Date(),
        });
      }
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
