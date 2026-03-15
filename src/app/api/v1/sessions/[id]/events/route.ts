import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { agentSessionRepository } from '@/repositories/agent-session-repository';
import { handleApiError } from '@/lib/error-handler';
import { NotFoundError } from '@/lib/errors';
import { requireMember } from '@/lib/rbac';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    if (Number.isNaN(sessionId)) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Invalid session id' } },
        { status: 400 }
      );
    }

    const agentSession = await agentSessionRepository.getById(sessionId);
    if (!agentSession) throw new NotFoundError(`Session ${sessionId} not found`);

    const { allowed } = await requireMember(session.user.id, agentSession.projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    const limitParam = request.nextUrl.searchParams.get('limit');
    const parsed = parseInt(limitParam ?? '', 10);
    const limit = Number.isNaN(parsed) ? 30 : Math.min(parsed, 100);

    const events = await agentSessionRepository.getEvents(sessionId, limit);
    return NextResponse.json({ data: events });
  } catch (error) {
    return handleApiError(error);
  }
}
