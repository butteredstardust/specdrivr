import { NextRequest, NextResponse } from 'next/server';
import { taskRepository } from '@/repositories/task-repository';
import { type TaskSelect as Task } from '@/db/schema';
import { handleApiError } from '@/lib/error-handler';
import { taskQuerySchema, createTaskSchema } from '@/lib/schemas';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = {
      status: searchParams.get('status'),
      planId: searchParams.get('planId'),
    };

    const validationResult = taskQuerySchema.safeParse(query);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validationResult.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { status, planId } = validationResult.data;
    let tasks: Task[] = [];

    if (planId) {
      tasks = await taskRepository.getByPlanId(planId);
      if (status) {
        tasks = tasks.filter((task) => task.status === status);
      }
    } else if (status) {
      tasks = await taskRepository.getByStatus(status as import('@/db/schema').TaskStatus);
    } else {
      tasks = await taskRepository.getAll();
    }

    return NextResponse.json({ data: tasks });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = createTaskSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid task data',
            details: validationResult.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const taskData = {
      externalId: `T-${Date.now()}`,
      title: data.description.substring(0, 50),
      ...data,
      createdBy: session.user.id,
    };
    const newTask = await taskRepository.create(taskData);

    return NextResponse.json({ data: newTask }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
