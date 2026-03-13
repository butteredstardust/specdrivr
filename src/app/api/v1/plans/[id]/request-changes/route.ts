import { NextRequest, NextResponse } from 'next/server';
import { planRepository } from '@/repositories/plan-repository';
import { auth } from '@/lib/auth';
import { handleApiError, formatErrorResponse } from '@/lib/error-handler';
import { requireAdmin } from '@/lib/rbac';
import { specificationRepository } from '@/repositories/specification-repository';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const RequestChangesSchema = z.object({
  id: z.number().int().positive('Plan ID is required'),
  notes: z
    .string()
    .min(1, 'Notes are required when requesting changes')
    .max(2000, 'Notes too long'),
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

    const spec = await specificationRepository.getById(plan.specId);
    if (!spec)
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Specification not found' } },
        { status: 404 }
      );

    // RBAC: require admin to request changes
    const { allowed } = await requireAdmin(session.user.id, spec.projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You must be a project admin to request changes' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = RequestChangesSchema.parse({ id: planId, ...body });

    const updatedPlan = await planRepository.requestChanges({
      planId: parsed.id,
      userId: session.user.id,
      notes: parsed.notes,
    });

    return NextResponse.json({
      data: updatedPlan,
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
