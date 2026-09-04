import { NextRequest, NextResponse } from 'next/server';
import { taskRepository } from '@/repositories/task-repository';
import { planRepository } from '@/repositories/plan-repository';
import { specificationRepository } from '@/repositories/specification-repository';
import { handleApiError, formatErrorResponse } from '@/lib/error-handler';
import { NotFoundError } from '@/lib/errors';
import { auth } from '@/lib/auth';
import { requireAdmin, requireMember } from '@/lib/rbac';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).max(5000).optional(),
  status: z.enum(['todo', 'in_progress', 'done', 'blocked', 'failed', 'skipped']).optional(),
  estimateHours: z.number().nonnegative().optional(),
  recommendedModel: z.string().optional(),
  humanContext: z.string().max(5000).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

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
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You do not have access to this project' } },
        { status: 403 }
      );
    }

    return NextResponse.json({
      data: task,
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
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You must be a project admin to override tasks' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = UpdateTaskSchema.parse(body);

    const { status, notes, ...taskUpdates } = parsed;
    const hasTaskUpdates = Object.values(taskUpdates).some((value) => value !== undefined);
    if (status && hasTaskUpdates) {
      return NextResponse.json(
        formatErrorResponse({
          message: 'Status overrides must be submitted separately from task edits',
        }),
        { status: 400 }
      );
    }

    const updatedTask = status
      ? await taskRepository.overrideStatus(taskId, status, session.user.id, notes)
      : await taskRepository.update(taskId, taskUpdates);

    return NextResponse.json({
      data: updatedTask,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        formatErrorResponse({ message: 'Validation failed', details: error.errors }),
        { status: 400 }
      );
    }
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
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You must be a project admin to delete tasks' } },
        { status: 403 }
      );
    }

    await taskRepository.delete(taskId);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
