import { NextRequest, NextResponse } from 'next/server';
import { taskRepository } from '@/repositories/task-repository';
import { planRepository } from '@/repositories/plan-repository';
import { specificationRepository } from '@/repositories/specification-repository';
import { handleApiError, formatErrorResponse } from '@/lib/error-handler';
import { auth } from '@/lib/auth';
import { requireMember } from '@/lib/rbac';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const UnblockTaskSchema = z.object({
  humanContext: z.string().min(1, 'Context is required to unblock a task').max(5000, 'Context too long'),
});

export async function POST(
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
    if (!task) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Task not found' } }, { status: 404 });
    }

    const plan = await planRepository.getById(task.planId);
    if (!plan) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Plan not found' } }, { status: 404 });
    }

    const spec = await specificationRepository.getById(plan.specId);
    if (!spec) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Specification not found' } }, { status: 404 });
    }

    // RBAC: require member to unblock task
    const { allowed } = await requireMember(session.user.id, spec.projectId);
    if (!allowed) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You do not have permission to unblock tasks in this project' } }, { status: 403 });
    }

    const body = await request.json();
    const parsed = UnblockTaskSchema.parse(body);

    const updatedTask = await taskRepository.unblockTask(taskId, parsed.humanContext, session.user.id);

    return NextResponse.json({ data: updatedTask });
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
