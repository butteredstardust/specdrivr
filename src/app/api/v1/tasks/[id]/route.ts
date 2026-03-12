import { NextRequest, NextResponse } from 'next/server';
import { taskRepository } from '@/repositories/task-repository';
import { planRepository } from '@/repositories/plan-repository';
import { specificationRepository } from '@/repositories/specification-repository';
import { handleApiError } from '@/lib/error-handler';
import { NotFoundError } from '@/lib/errors';
import { updateTaskSchema } from '@/lib/schemas';
import { auth } from '@/lib/auth';
import { requireAdmin, requireMember } from '@/lib/rbac';

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
    const taskId = parseInt(id, 10);

    const task = await taskRepository.getById(taskId);
    if (!task) throw new NotFoundError(`Task with ID ${taskId} not found`);

    const plan = await planRepository.getById(task.planId);
    if (!plan) throw new NotFoundError(`Plan not found`);

    const spec = await specificationRepository.getById(plan.specId);
    if (!spec) throw new NotFoundError(`Specification not found`);

    // RBAC: require member to view task
    const { allowed } = await requireMember(session.user.id, spec.projectId);
    if (!allowed) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You do not have access to this project' } }, { status: 403 });
    }

    return NextResponse.json({
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
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await params;
    const taskId = parseInt(id, 10);

    const task = await taskRepository.getById(taskId);
    if (!task) throw new NotFoundError(`Task with ID ${taskId} not found`);

    const plan = await planRepository.getById(task.planId);
    if (!plan) throw new NotFoundError(`Plan not found`);

    const spec = await specificationRepository.getById(plan.specId);
    if (!spec) throw new NotFoundError(`Specification not found`);

    // RBAC: require admin to override task
    const { allowed } = await requireAdmin(session.user.id, spec.projectId);
    if (!allowed) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You must be a project admin to override tasks' } }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const updatedTask = await taskRepository.update(taskId, parsed.data);

    return NextResponse.json({
      data: updatedTask,
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
    const taskId = parseInt(id, 10);

    const task = await taskRepository.getById(taskId);
    if (!task) throw new NotFoundError(`Task with ID ${taskId} not found`);

    const plan = await planRepository.getById(task.planId);
    if (!plan) throw new NotFoundError(`Plan not found`);

    const spec = await specificationRepository.getById(plan.specId);
    if (!spec) throw new NotFoundError(`Specification not found`);

    // RBAC: require admin to delete task
    const { allowed } = await requireAdmin(session.user.id, spec.projectId);
    if (!allowed) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You must be a project admin to delete tasks' } }, { status: 403 });
    }

    await taskRepository.delete(taskId);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
