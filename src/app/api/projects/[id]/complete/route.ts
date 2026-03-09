import { NextRequest, NextResponse } from 'next/server';
import { projectRepository } from '@/repositories/project-repository';
import { formatErrorResponse, handleApiError } from '@/lib/error-handler';
import { NotFoundError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
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

    // Note: Status enum is only 'active' | 'archived' in current schema
    // 'completed' status might need to be added to the schema
    if (project.status !== 'active') {
      return NextResponse.json(
        formatErrorResponse({ message: 'Project must be active to be completed' }),
        { status: 400 }
      );
    }

    const completedProject = await projectRepository.complete(projectId);

    return NextResponse.json({
      success: true,
      data: completedProject,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
