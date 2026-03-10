import { NextRequest, NextResponse } from 'next/server';
import { planRepository } from '@/repositories';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/error-handler';
import { NotFoundError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await params;
    const planId = parseInt(id, 10);

    if (isNaN(planId) || planId <= 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid plan ID' } },
        { status: 400 }
      );
    }

    const plan = await planRepository.getById(planId);
    if (!plan) {
      throw new NotFoundError(`Plan with ID ${planId} not found`);
    }

    // Update plan status to approved
    const updatedPlan = await planRepository.approve(planId, Number(session.user.id));

    return NextResponse.json({
      success: true,
      data: updatedPlan,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
