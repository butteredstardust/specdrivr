import { NextRequest, NextResponse } from 'next/server';
import { projectRepository } from '@/repositories/project-repository';
import { formatErrorResponse, handleApiError } from '@/lib/error-handler';
import { NotFoundError } from '@/lib/errors';
import { updateProjectSchema } from '@/lib/schemas';
import { auth } from '@/lib/auth';
import { requireAdmin, requireOwner, requireMember } from '@/lib/rbac';

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

    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json(formatErrorResponse({ message: 'Invalid project ID' }), {
        status: 400,
      });
    }

    // RBAC: Ensure user is at least a member to view project details
    const { allowed } = await requireMember(session.user.id, projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You do not have access to this project' } },
        { status: 403 }
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

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json(formatErrorResponse({ message: 'Invalid project ID' }), {
        status: 400,
      });
    }

    // RBAC: require admin to update project
    const { allowed } = await requireAdmin(session.user.id, projectId);
    if (!allowed) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You must be a project admin to update this project',
          },
        },
        { status: 403 }
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

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
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

    if (isNaN(projectId) || projectId <= 0) {
      return NextResponse.json(formatErrorResponse({ message: 'Invalid project ID' }), {
        status: 400,
      });
    }

    // RBAC: require owner to delete project
    const { allowed } = await requireOwner(session.user.id, projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Only the project owner can delete this project' } },
        { status: 403 }
      );
    }

    await projectRepository.delete(projectId);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
