import { NextRequest, NextResponse } from 'next/server';
import { planRepository, projectRepository, specificationRepository } from '@/repositories';
import { requireMember } from '@/lib/rbac';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';
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
    const specId = parseInt(id, 10);

    const spec = await specificationRepository.getById(specId);
    if (!spec) {
      throw new NotFoundError(`Specification with ID ${specId} not found`);
    }
    const { allowed } = await requireMember(session.user.id, spec.projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Project access required' } },
        { status: 403 }
      );
    }

    const plans = await planRepository.getBySpecId(specId);

    // Return the latest plan if multiple exist, or null
    const latestPlan =
      plans.length > 0
        ? plans.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
        : null;

    const project = await projectRepository.getById(spec.projectId);
    return NextResponse.json({
      data: latestPlan
        ? {
            ...latestPlan,
            executionTarget: {
              repository: project?.repositoryUrl ?? 'Not configured',
              branch: project?.repositoryBranch ?? 'main',
            },
          }
        : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
