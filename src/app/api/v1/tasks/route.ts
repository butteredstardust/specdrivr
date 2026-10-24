import { NextRequest, NextResponse } from 'next/server';
import { taskRepository } from '@/repositories/task-repository';
import { planRepository } from '@/repositories/plan-repository';
import { specificationRepository } from '@/repositories/specification-repository';
import type { TaskSelect as Task } from '@/db/schema';
import { handleApiError } from '@/lib/error-handler';
import { taskQuerySchema, createTaskSchema } from '@/lib/schemas';
import { auth } from '@/lib/auth';
import { canPerform, requireMember } from '@/lib/rbac';

function forbidden() {
  return NextResponse.json(
    { error: { code: 'FORBIDDEN', message: 'You do not have access to this project' } },
    { status: 403 }
  );
}

function notFound(message: string) {
  return NextResponse.json({ error: { code: 'NOT_FOUND', message } }, { status: 404 });
}

async function getProjectIdForPlan(planId: number): Promise<number | null> {
  const plan = await planRepository.getById(planId);
  if (!plan) return null;
  const spec = await specificationRepository.getById(plan.specId);
  return spec?.projectId ?? null;
}

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
      status: searchParams.get('status') ?? undefined,
      planId: searchParams.get('planId') ?? undefined,
      specId: searchParams.get('specId') ?? undefined,
      projectId: searchParams.get('projectId') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    };

    const validationResult = taskQuerySchema.safeParse(query);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validationResult.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { status, planId, specId, page, limit } = validationResult.data;

    // Every listing is scoped to one project the caller belongs to.
    let projectId: number | null | undefined = validationResult.data.projectId;
    if (specId) {
      const spec = await specificationRepository.getById(specId);
      if (!spec) return notFound('Specification not found');
      projectId = spec.projectId;
    } else if (planId) {
      projectId = await getProjectIdForPlan(planId);
      if (projectId === null) return notFound('Plan not found');
    }

    if (!projectId) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'One of specId, planId or projectId is required',
          },
        },
        { status: 400 }
      );
    }

    const { allowed } = await requireMember(session.user.id, projectId);
    if (!allowed) return forbidden();

    if (specId || planId) {
      let tasks: Task[] = specId
        ? await taskRepository.getBySpecId(specId)
        : await taskRepository.getByPlanId(planId as number);
      if (status) {
        tasks = tasks.filter((task) => task.status === status);
      }
      return NextResponse.json({ data: tasks });
    }

    const result = await taskRepository.getByProjectId(projectId, { status, page, limit });
    return NextResponse.json({ data: result.data, meta: result.meta });
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
            details: validationResult.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Tasks carry a verifyCommand that the project's agent runs in a shell,
    // so creating one requires member rights on the plan's project.
    const projectId = await getProjectIdForPlan(data.planId);
    if (projectId === null) return notFound('Plan not found');
    if (!(await canPerform(session.user.id, projectId, 'member'))) return forbidden();

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
