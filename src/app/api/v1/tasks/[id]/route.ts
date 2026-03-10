import { NextRequest, NextResponse } from 'next/server';
import { taskRepository } from '@/repositories/task-repository';
import { formatErrorResponse, handleApiError } from '@/lib/error-handler';
import { NotFoundError } from '@/lib/errors';
import { updateTaskSchema } from '@/lib/schemas';
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
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await params;
    const taskId = parseInt(id, 10);

    if (isNaN(taskId) || taskId <= 0) {
      return NextResponse.json(
        formatErrorResponse({ message: 'Invalid task ID - must be a positive number' }),
        { status: 400 }
      );
    }

    const task = await taskRepository.getById(taskId);

    if (!task) {
      throw new NotFoundError(`Task with ID ${taskId} not found`);
    }

    return NextResponse.json({
      success: true,
      data: task,
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
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await params;
    const taskId = parseInt(id, 10);

    if (isNaN(taskId) || taskId <= 0) {
      return NextResponse.json(
        formatErrorResponse({ message: 'Invalid task ID - must be a positive number' }),
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const task = await taskRepository.update(taskId, parsed.data);

    return NextResponse.json({
      success: true,
      data: task,
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
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await params;
    const taskId = parseInt(id, 10);

    if (isNaN(taskId) || taskId <= 0) {
      return NextResponse.json(
        formatErrorResponse({ message: 'Invalid task ID - must be a positive number' }),
        { status: 400 }
      );
    }

    await taskRepository.delete(taskId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
