import { NextRequest, NextResponse } from 'next/server';
import { verifyAgentToken } from '@/lib/agent-auth';
import {
  taskRepository,
  planRepository,
  agentSessionRepository,
  specificationRepository,
} from '@/repositories';
import { handleApiError } from '@/lib/error-handler';
import { z } from 'zod';
import Redis from 'ioredis';
import { env } from '@/lib/env';

const CompleteTaskSchema = z.object({
  output: z.string().max(50000).optional(),
  status: z.enum(['done', 'failed']),
  exitCode: z.number().int().optional(),
  errorMessage: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

const redis = new Redis(env.REDIS_URL || 'redis://localhost:6379');

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

    await taskRepository.completeTaskAttempt(taskId, parsed);

    // Notify clients via SSE
    try {
      const task = await taskRepository.getById(taskId);
      if (task) {
        const plan = await planRepository.getById(task.planId);
        if (plan) {
          const spec = await specificationRepository.getById(plan.specId);
          if (spec) {
            // Find the active session for this plan
            const sessions = await agentSessionRepository.getByProjectId(spec.projectId);
            const activeSession = sessions.find(
              (s) => s.planId === plan.id && ['running', 'paused'].includes(s.status)
            );
            if (activeSession) {
              await redis.publish(
                `session:${activeSession.id}:updates`,
                JSON.stringify({ type: 'update' })
              );
            }
          }
        }
      }
    } catch {
      // ignore publish errors
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
