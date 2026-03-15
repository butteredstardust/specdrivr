import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { usageRepository } from '@/repositories/usage-repository';
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
    const projectId = parseInt(id, 10);

    const { allowed } = await requireMember(session.user.id, projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You do not have access to this project' } },
        { status: 403 }
      );
    }

    const snapshots = await usageRepository.getByProjectId(projectId, 30);

    const summary = snapshots.reduce(
      (acc, s) => ({
        totalSessions: acc.totalSessions + s.sessionsRun,
        totalTasks: acc.totalTasks + s.tasksExecuted,
        totalTokens: acc.totalTokens + s.promptTokens + s.completionTokens,
        totalCostUsd: acc.totalCostUsd + s.estimatedCostUsd,
      }),
      { totalSessions: 0, totalTasks: 0, totalTokens: 0, totalCostUsd: 0 }
    );

    return NextResponse.json({ data: { snapshots, summary } });
  } catch (error) {
    return handleApiError(error);
  }
}
