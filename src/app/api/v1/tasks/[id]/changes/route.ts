import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { taskRepository } from '@/repositories/task-repository';
import { planRepository } from '@/repositories/plan-repository';
import { specificationRepository } from '@/repositories/specification-repository';
import { handleApiError } from '@/lib/error-handler';
import { requireMember } from '@/lib/rbac';
import { NotFoundError } from '@/lib/errors';

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
    const taskId = parseInt(id, 10);

    const task = await taskRepository.getById(taskId);
    if (!task) throw new NotFoundError(`Task with ID ${taskId} not found`);

    const plan = await planRepository.getById(task.planId);
    if (!plan) throw new NotFoundError(`Plan not found`);

    const spec = await specificationRepository.getById(plan.specId);
    if (!spec) throw new NotFoundError(`Specification not found`);

    // RBAC: require member to view changes
    const { allowed } = await requireMember(session.user.id, spec.projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You do not have access to this project' } },
        { status: 403 }
      );
    }

    const changes = await taskRepository.getFileChanges(taskId);
    return NextResponse.json({ data: changes });
  } catch (error) {
    return handleApiError(error);
  }
}
