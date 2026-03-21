import { NextRequest, NextResponse } from 'next/server';
import { specificationRepository, memberRepository, planJobRepository } from '@/repositories';
import { db } from '@/db';
import { plans } from '@/db/schema';
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
    if (isNaN(specId)) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Invalid spec ID' } },
        { status: 400 }
      );
    }

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

    // I-6: Wrap all 3 writes atomically. If job creation fails, the plan and spec
    // status change are rolled back — the spec cannot get stuck in 'pending_plan'.
    const plan = await db.transaction(async (tx) => {
      const [createdPlan] = await tx
        .insert(plans)
        .values({
          specId,
          specVersionId: spec.currentVersionId ?? null,
          status: 'pending_approval',
          createdBy: session.user.id,
        })
        .returning();

      await specificationRepository.updateStatus(specId, 'pending_plan');

      await planJobRepository.create({
        projectId: spec.projectId,
        specId,
        planId: createdPlan.id,
        type: 'generate_plan',
        status: 'pending',
      });

      return createdPlan;
    });

    logger.info({ specId, planId: plan.id }, 'Plan generation job queued');

    return NextResponse.json({ data: plan }, { status: 202 });
  } catch (error) {
    return handleApiError(error);
  }
}
