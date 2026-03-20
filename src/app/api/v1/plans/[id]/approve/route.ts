import { NextRequest, NextResponse } from 'next/server';
import { planRepository, specificationRepository, planJobRepository } from '@/repositories';
import { auth } from '@/lib/auth';
import { handleApiError, formatErrorResponse } from '@/lib/error-handler';
import { requireAdmin } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const ApprovePlanSchema = z.object({
  id: z.number().int().positive('Plan ID is required'),
  notes: z.string().max(2000, 'Notes too long').optional().nullable(),
});

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
    const planId = parseInt(id, 10);

    const plan = await planRepository.getById(planId);
    if (!plan)
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Plan not found' } },
        { status: 404 }
      );

    const spec = await specificationRepository.getByIdWithVersion(plan.specId);
    if (!spec || !spec.currentVersion)
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Specification or version not found' } },
        { status: 404 }
      );

    // RBAC: require admin to approve
    const { allowed } = await requireAdmin(session.user.id, spec.projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You must be a project admin to approve plans' } },
        { status: 403 }
      );
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is okay for simple approval
    }

    const parsed = ApprovePlanSchema.parse({ id: planId, ...body });

    // 1. Approve the plan and create agent session
    const { plan: updatedPlan, sessionId } = await planRepository.approvePlan({
      planId: parsed.id,
      userId: session.user.id,
      notes: parsed.notes,
    });

    // 2. Queue background job for task generation
    await planJobRepository.create({
      projectId: spec.projectId,
      specId: spec.id,
      planId: updatedPlan.id,
      type: 'generate_tasks',
      status: 'pending',
    });

    logger.info({ planId: updatedPlan.id, sessionId }, 'Task generation job queued after approval');

    return NextResponse.json({
      data: { plan: updatedPlan, sessionId },
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
