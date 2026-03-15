import { NextRequest, NextResponse } from 'next/server';
import { taskRepository } from '@/repositories/task-repository';
import type { TaskSelect as Task, TaskStatus } from '@/db/schema';
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

    if (planId) {
      let tasks: Task[] = await taskRepository.getByPlanId(planId);
      if (status) {
        tasks = tasks.filter((task) => task.status === status);
      }
      return NextResponse.json({ data: tasks });
    } else if (status) {
      const tasks: Task[] = await taskRepository.getByStatus(status as TaskStatus);
      return NextResponse.json({ data: tasks });
    } else {
      const pageParam = parseInt(request.nextUrl.searchParams.get('page') ?? '1', 10);
      const limitParam = parseInt(request.nextUrl.searchParams.get('limit') ?? '50', 10);
      const result = await taskRepository.getAll({
        page: isNaN(pageParam) || pageParam < 1 ? 1 : pageParam,
        limit: isNaN(limitParam) || limitParam < 1 ? 50 : limitParam,
      });
      return NextResponse.json({ data: result.data, meta: result.meta });
    }
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
