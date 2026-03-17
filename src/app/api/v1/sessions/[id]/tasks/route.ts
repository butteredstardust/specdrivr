import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { agentSessionRepository } from '@/repositories/agent-session-repository';
import { taskRepository } from '@/repositories/task-repository';
import { handleApiError } from '@/lib/error-handler';
import { requireMember } from '@/lib/rbac';
import { NotFoundError } from '@/lib/errors';

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
    const sessionId = parseInt(id, 10);

    const agentSession = await agentSessionRepository.getById(sessionId);
    if (!agentSession) {
      throw new NotFoundError(`Agent session with ID ${sessionId} not found`);
    }

    const { allowed } = await requireMember(session.user.id, agentSession.projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You do not have access to this project' } },
        { status: 403 }
      );
    }

    if (!agentSession.planId) {
      return NextResponse.json({ data: [] });
    }

    const tasks = await taskRepository.getByPlanId(agentSession.planId);

    const data = tasks.map((t) => ({
      id: t.id,
      externalId: t.externalId,
      title: t.title,
      description: t.description,
      status: t.status,
      startedAt: t.startedAt ? t.startedAt.toISOString() : null,
      completedAt: t.completedAt ? t.completedAt.toISOString() : null,
      actualDurationMs: t.actualDurationMs ?? null,
      dependsOn: t.dependsOn ?? [],
      orderIndex: t.executionOrder,
      blockedReason: t.blockedReason,
      attemptCount: t.attemptCount,
      verificationPassed: t.verificationPassed,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
