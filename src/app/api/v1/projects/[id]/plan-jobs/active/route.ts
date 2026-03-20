import { NextRequest, NextResponse } from 'next/server';
import { planJobRepository, memberRepository } from '@/repositories';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';
import { AuthorizationError } from '@/lib/errors';

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

    // RBAC check: member or above
    const role = await memberRepository.getRoleForUser(session.user.id, projectId);
    if (!role) {
      throw new AuthorizationError('You do not have access to this project');
    }

    // Fetch jobs that are pending or running for this project
    const activeJobs = await planJobRepository.getActiveByProject(projectId);

    return NextResponse.json({ data: activeJobs });
  } catch (error) {
    return handleApiError(error);
  }
}
