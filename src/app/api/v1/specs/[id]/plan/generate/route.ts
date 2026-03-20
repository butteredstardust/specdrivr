import { NextRequest, NextResponse } from 'next/server';
import {
  planRepository,
  specificationRepository,
  memberRepository,
  notificationRepository,
  agentConfigRepository,
  planJobRepository,
} from '@/repositories';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';
import { NotFoundError, AuthorizationError } from '@/lib/errors';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const specId = parseInt(id, 10);

    const spec = await specificationRepository.getById(specId);
    if (!spec) {
      throw new NotFoundError(`Specification with ID ${specId} not found`);
    }

    // RBAC check
    const role = await memberRepository.getRoleForUser(session.user.id, spec.projectId);
    if (!role || (role !== 'admin' && role !== 'owner' && role !== 'member')) {
      throw new AuthorizationError('You do not have permission to generate plans for this project');
    }

    if (spec.status !== 'drafting' && spec.status !== 'stalled') {
      return NextResponse.json(
        {
          error: {
            code: 'PRECONDITION_FAILED',
            message: 'Specification must be in drafting or stalled status to generate a plan',
          },
        },
        { status: 422 }
      );
    }

    // 1. Create a plan record immediately
    const plan = await planRepository.create({
      specId,
      specVersionId: spec.currentVersionId,
      status: 'pending_approval',
      createdBy: session.user.id,
    });

    // 2. Update spec status to 'pending_plan'
    await specificationRepository.updateStatus(specId, 'pending_plan');

    // 3. Queue background job
    await planJobRepository.create({
      projectId: spec.projectId,
      specId,
      planId: plan.id,
      type: 'generate_plan',
      status: 'pending',
    });

    logger.info({ specId, planId: plan.id }, 'Plan generation job queued');

    return NextResponse.json({ data: plan }, { status: 202 });
  } catch (error) {
    return handleApiError(error);
  }
}
