import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';
import { memberRepository, agentSessionRepository } from '@/repositories';
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
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Invalid project ID' } },
        { status: 400 }
      );
    }

    const role = await memberRepository.getRoleForUser(session.user.id, projectId);
    if (!role) {
      throw new AuthorizationError('You do not have access to this project');
    }

    const activity = await agentSessionRepository.getProjectActivity(projectId);
    return NextResponse.json({ data: activity });
  } catch (error) {
    return handleApiError(error);
  }
}
