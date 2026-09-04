import { NextRequest, NextResponse } from 'next/server';
import { verifyAgentToken } from '@/lib/agent-auth';
import { taskRepository } from '@/repositories';
import { handleApiError } from '@/lib/error-handler';
import { z } from 'zod';

const CompleteTaskSchema = z.object({
  attemptId: z.number().int().positive(),
  sessionId: z.number().int().positive(),
  completionKey: z.string().uuid(),
  output: z.string().max(50000).optional(),
  status: z.enum(['done', 'failed']),
  exitCode: z.number().int().optional(),
  errorMessage: z.string().optional(),
  gitBranch: z.string().optional(),
  gitCommitHash: z.string().optional(),
  totalCostUsd: z.number().optional(),
  verificationPassed: z.boolean().optional(),
  verificationOutput: z.string().max(50000).optional(),
  verificationExitCode: z.number().int().optional(),
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
  if (Number.isNaN(taskId)) {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: 'Invalid task ID' } },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const parsed = CompleteTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const projectId = await taskRepository.getProjectId(taskId);
    if (projectId === null) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Task not found' } },
        { status: 404 }
      );
    }
    if (projectId !== authResult.token.projectId) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Task does not belong to this project' } },
        { status: 403 }
      );
    }

    const { sessionId: _sessionId } = await taskRepository.completeTaskAttempt(
      taskId,
      authResult.token.projectId,
      parsed.data
    );

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
