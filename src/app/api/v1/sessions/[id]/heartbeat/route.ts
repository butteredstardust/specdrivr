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
  const sessionId = parseInt(id);

  try {
    await agentSessionRepository.update(sessionId, { lastHeartbeatAt: new Date() });

    const session = await agentSessionRepository.getById(sessionId);
    const shouldStop = session?.status !== 'running';

    return NextResponse.json({ data: { shouldStop } });
  } catch (error) {
    return handleApiError(error);
  }
}
