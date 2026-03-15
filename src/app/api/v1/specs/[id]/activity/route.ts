import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { specificationRepository } from '@/repositories/specification-repository';
import { agentSessionRepository } from '@/repositories/agent-session-repository';
import { handleApiError } from '@/lib/error-handler';
import { requireMember } from '@/lib/rbac';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const specId = parseInt(id, 10);

    if (Number.isNaN(specId)) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Invalid spec id' } },
        { status: 400 }
      );
    }

    const spec = await specificationRepository.getById(specId);
    if (!spec) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Specification not found' } },
        { status: 404 }
      );
    }

    const { allowed } = await requireMember(session.user.id, spec.projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    const events = await agentSessionRepository.getEventsBySpecId(specId);

    const data = events.map((e) => ({
      id: e.id,
      type: e.eventType,
      message: e.message,
      timestamp: e.createdAt,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
