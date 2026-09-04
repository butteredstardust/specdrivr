import { NextResponse } from 'next/server';
import { verifyAgentToken } from '@/lib/agent-auth';
import { agentSessionRepository } from '@/repositories/agent-session-repository';
import { handleApiError } from '@/lib/error-handler';
import { z } from 'zod';

const completeSchema = z.object({
  totalPromptTokens: z.number().int().nonnegative(),
  totalCompletionTokens: z.number().int().nonnegative(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await verifyAgentToken(request.headers.get('Authorization'));
  if (!authResult.success) {
    return authResult.response;
  }

  const { id } = await params;
  const sessionId = parseInt(id, 10);
  if (Number.isNaN(sessionId)) {
    return NextResponse.json(
      { error: { code: 'INVALID_INPUT', message: 'Invalid session ID' } },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { totalPromptTokens, totalCompletionTokens } = completeSchema.parse(body);

    const session = await agentSessionRepository.getById(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Session not found' } },
        { status: 404 }
      );
    }
    if (session.projectId !== authResult.token.projectId) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Session does not belong to this project' } },
        { status: 403 }
      );
    }

    await agentSessionRepository.complete(sessionId, authResult.token.projectId, {
      totalPromptTokens,
      totalCompletionTokens,
    });

    return NextResponse.json({ data: { status: 'completed' } });
  } catch (error) {
    return handleApiError(error);
  }
}
