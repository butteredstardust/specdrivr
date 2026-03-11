import { NextRequest, NextResponse } from 'next/server';
import { projectRepository } from '@/repositories/project-repository';
import { createProjectSchema, updateProjectSchema } from '@/lib/schemas';
import { formatErrorResponse, handleApiError } from '@/lib/error-handler';
import { auth } from '@/lib/auth';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let projects;

    if (userId) {
      const userIdNum = parseInt(userId, 10);
      if (isNaN(userIdNum)) {
        return NextResponse.json(
          formatErrorResponse({ message: 'Invalid userId parameter' }),
          { status: 400 }
        );
      }
      projects = await projectRepository.getByUserId(userIdNum);
    } else if (status === 'active') {
      projects = await projectRepository.getActive();
    } else {
      projects = await projectRepository.getAll();
    }

    return NextResponse.json({
      data: projects,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createProjectSchema.parse(body);

    const project = await projectRepository.create({
      name: parsed.name,
      description: parsed.description ?? undefined,
      createdBy: Number(session.user.id),
    });

    return NextResponse.json({
      data: project,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        formatErrorResponse({
          message: 'Validation failed',
          details: error.errors,
        }),
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateProjectSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.description !== undefined) updateData.description = parsed.description;

    const project = await projectRepository.update(parsed.id, {
      name: updateData.name as string | undefined,
      description: updateData.description as string | null | undefined,
    });

    return NextResponse.json({
      data: project,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        formatErrorResponse({
          message: 'Validation failed',
          details: error.errors,
        }),
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        formatErrorResponse({ message: 'Project ID is required' }),
        { status: 400 }
      );
    }

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
