import { NextRequest, NextResponse } from 'next/server';
import { verifyAgentToken } from '@/lib/agent-auth';
import { taskRepository } from '@/repositories';
import { handleApiError } from '@/lib/error-handler';
import { z } from 'zod';

const CompleteTaskSchema = z.object({
  output: z.string().max(50000).optional(),
  status: z.enum(['done', 'failed']),
  exitCode: z.number().int().optional(),
  errorMessage: z.string().optional(),
  gitBranch: z.string().optional(),
  gitCommitHash: z.string().optional(),
  totalCostUsd: z.number().optional(),
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
    const parsed = CompleteTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const { sessionId } = await taskRepository.completeTaskAttempt(taskId, parsed.data);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
