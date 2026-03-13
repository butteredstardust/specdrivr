import { NextRequest, NextResponse } from 'next/server';
import { planRepository } from '@/repositories/plan-repository';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';
import { requireMember } from '@/lib/rbac';
import { specificationRepository } from '@/repositories/specification-repository';
import { abandonPlanSchema } from '@/lib/schemas';

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
    const planId = parseInt(id, 10);

    const plan = await planRepository.getById(planId);
    if (!plan)
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Plan not found' } },
        { status: 404 }
      );

    const spec = await specificationRepository.getById(plan.specId);
    if (!spec)
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Specification not found' } },
        { status: 404 }
      );

    // RBAC: require member to abandon
    const { allowed } = await requireMember(session.user.id, spec.projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You must be a project member to abandon plans' } },
        { status: 403 }
      );
    }

    const parsed = abandonPlanSchema.parse({ id: planId });

    const updatedPlan = await planRepository.abandonPlan({
      planId: parsed.id,
      userId: session.user.id,
    });

    return NextResponse.json({
      data: updatedPlan,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
