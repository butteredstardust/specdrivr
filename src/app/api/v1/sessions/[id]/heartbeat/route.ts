import { NextResponse } from 'next/server';
import { verifyAgentToken } from '@/lib/agent-auth';
import { agentSessionRepository } from '@/repositories/agent-session-repository';
import { handleApiError } from '@/lib/error-handler';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // No body — no Zod needed
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

    await agentSessionRepository.heartbeatForProject(sessionId, authResult.token.projectId);
    const shouldStop = session?.status !== 'running';

    return NextResponse.json({ data: { shouldStop } });
  } catch (error) {
    return handleApiError(error);
  }
}
