import { NextRequest, NextResponse } from 'next/server';
import { projectRepository } from '@/repositories/project-repository';
import { formatErrorResponse, handleApiError } from '@/lib/error-handler';
import { NotFoundError } from '@/lib/errors';
import { updateProjectSchema } from '@/lib/schemas';
import { auth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
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

    return NextResponse.json({
      data: project,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json(
        formatErrorResponse({ message: 'Invalid project ID' }),
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = updateProjectSchema.parse({ id: projectId, ...body });

    const project = await projectRepository.update(projectId, parsed);

    return NextResponse.json({
      data: project,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json(
        formatErrorResponse({ message: 'Invalid project ID' }),
        { status: 400 }
      );
    }

    await projectRepository.delete(projectId);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
