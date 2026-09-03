import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { agentSessionRepository } from '@/repositories/agent-session-repository';
import { handleApiError } from '@/lib/error-handler';
import { requireAdmin } from '@/lib/rbac';
import { NotFoundError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const sessionId = parseInt(id, 10);
    if (isNaN(sessionId)) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Invalid session ID' } },
        { status: 400 }
      );
    }

    const agentSession = await agentSessionRepository.getById(sessionId);
    if (!agentSession) {
      throw new NotFoundError(`Agent session with ID ${sessionId} not found`);
    }

    const { allowed } = await requireAdmin(session.user.id, agentSession.projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Project admin access is required' } },
        { status: 403 }
      );
    }

    const updated = await agentSessionRepository.update(
      sessionId,
      { status: 'running' },
      session.user.id
    );
    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
