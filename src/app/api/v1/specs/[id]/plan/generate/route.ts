import { NextRequest, NextResponse } from 'next/server';
import { specificationRepository, memberRepository } from '@/repositories';
import { db } from '@/db';
import { planJobs, plans, specifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';
import { NotFoundError, AuthorizationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { randomUUID } from 'node:crypto';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const correlationId = request.headers.get('x-request-id') ?? randomUUID();
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

      await tx
        .update(specifications)
        .set({ status: 'pending_plan', updatedAt: new Date() })
        .where(eq(specifications.id, specId));

      await tx.insert(planJobs).values({
        projectId: spec.projectId,
        specId,
        planId: createdPlan.id,
        specVersionId: spec.currentVersionId,
        generationToken: correlationId,
        type: 'generate_plan',
        status: 'pending',
      });

      return createdPlan;
    });

    logger.info({ correlationId, specId, planId: plan.id }, 'Plan generation job queued');

    return NextResponse.json({ data: plan }, { status: 202 });
  } catch (error) {
    return handleApiError(error);
  }
}
