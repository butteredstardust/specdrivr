import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { requireMember } from '@/lib/rbac';
import { planRepository, specificationRepository } from '@/repositories';
import { handleApiError, formatErrorResponse } from '@/lib/error-handler';
import { NotFoundError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updatePlanSchema = z.object({
  markdownContent: z.string().min(1, 'Content cannot be empty'),
});

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
    const planId = parseInt(id, 10);

    const plan = await planRepository.getById(planId);
    if (!plan) {
      throw new NotFoundError(`Plan with ID ${planId} not found`);
    }

    const spec = await specificationRepository.getById(plan.specId);
    if (!spec) {
      throw new NotFoundError(`Specification not found`);
    }

    // RBAC: require member to edit plans
    const { allowed } = await requireMember(session.user.id, spec.projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You do not have access to this project' } },
        { status: 403 }
      );
    }

    // Only allow editing if the plan is pending approval or changes requested
    if (plan.status !== 'pending_approval' && plan.status !== 'changes_requested') {
      return NextResponse.json(
        {
          error: {
            code: 'PRECONDITION_FAILED',
            message: `Cannot edit plan in state: ${plan.status}`,
          },
        },
        { status: 422 }
      );
    }

    const body = await request.json();
    const parsed = updatePlanSchema.parse(body);

    const updatedPlan = await planRepository.update(planId, {
      markdownContent: parsed.markdownContent,
    });

    return NextResponse.json({ data: updatedPlan });
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
