import { NextRequest, NextResponse } from 'next/server';
import { projectRepository } from '@/repositories/project-repository';
import { formatErrorResponse, handleApiError } from '@/lib/error-handler';
import { NotFoundError } from '@/lib/errors';
import { auth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json(
        formatErrorResponse({ message: 'Invalid project ID' }),
        { status: 400 }
      );
    }

    const project = await projectRepository.getById(projectId);

    if (!project) {
      throw new NotFoundError(`Project with ID ${projectId} not found`);
    }

    if (project.status === 'archived') {
      return NextResponse.json(
        formatErrorResponse({ message: 'Project is already archived' }),
        { status: 400 }
      );
    }

    const archivedProject = await projectRepository.archive(projectId);

    return NextResponse.json({
      success: true,
      data: archivedProject,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
