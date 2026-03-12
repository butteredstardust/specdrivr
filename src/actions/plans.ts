'use server';

import { revalidatePath } from 'next/cache';
import { planRepository } from '@/repositories/plan-repository';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { 
  approvePlanSchema, 
  rejectPlanSchema, 
  requestChangesSchema,
  abandonPlanSchema
} from '@/lib/schemas';
import { requireAdmin, requireMember } from '@/lib/rbac';
import { specificationRepository } from '@/repositories/specification-repository';
import { webhookService } from '@/lib/webhooks';

export async function approvePlanAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const rawData = {
    id: Number(formData.get('id')),
    notes: formData.get('notes'),
  };

  const result = approvePlanSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
  }

  const plan = await planRepository.getById(result.data.id);
  if (!plan) return { success: false, error: { code: 'NOT_FOUND', message: 'Plan not found' } };

  const spec = await specificationRepository.getById(plan.specId);
  if (!spec) return { success: false, error: { code: 'NOT_FOUND', message: 'Specification not found' } };

  const { allowed } = await requireAdmin(session.user.id, spec.projectId);
  if (!allowed) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'You must be a project admin to approve plans' } };
  }

  try {
    const { plan: updatedPlan, sessionId } = await planRepository.approvePlan({
      planId: result.data.id,
      userId: session.user.id,
      notes: result.data.notes,
    });
    
    // Dispatch webhook
    await webhookService.dispatch(spec.projectId, 'plan_approved', updatedPlan, {
      specId: spec.id,
      sessionId,
    });

    revalidatePath(`/specs/${plan.specId}`);
    revalidatePath('/dashboard');
    
    return { success: true, data: { plan: updatedPlan, sessionId } };
  } catch (error: unknown) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error), 
      userId: session.user.id,
      planId: result.data.id
    }, 'Failed to approve plan');
    
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } };
  }
}

export async function rejectPlanAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const rawData = {
    id: Number(formData.get('id')),
    notes: formData.get('notes'),
  };

  const result = rejectPlanSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
  }

  const plan = await planRepository.getById(result.data.id);
  if (!plan) return { success: false, error: { code: 'NOT_FOUND', message: 'Plan not found' } };

  const spec = await specificationRepository.getById(plan.specId);
  if (!spec) return { success: false, error: { code: 'NOT_FOUND', message: 'Specification not found' } };

  const { allowed } = await requireAdmin(session.user.id, spec.projectId);
  if (!allowed) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'You must be a project admin to reject plans' } };
  }

  try {
    const updatedPlan = await planRepository.rejectPlan({
      planId: result.data.id,
      userId: session.user.id,
      notes: result.data.notes,
    });
    
    // Dispatch webhook
    await webhookService.dispatch(spec.projectId, 'plan_rejected', updatedPlan, {
      specId: spec.id,
    });

    revalidatePath(`/specs/${plan.specId}`);
    
    return { success: true, data: updatedPlan };
  } catch (error: unknown) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error), 
      userId: session.user.id,
      planId: result.data.id
    }, 'Failed to reject plan');
    
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } };
  }
}

export async function requestChangesAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const rawData = {
    id: Number(formData.get('id')),
    notes: formData.get('notes'),
  };

  const result = requestChangesSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
  }

  const plan = await planRepository.getById(result.data.id);
  if (!plan) return { success: false, error: { code: 'NOT_FOUND', message: 'Plan not found' } };

  const spec = await specificationRepository.getById(plan.specId);
  if (!spec) return { success: false, error: { code: 'NOT_FOUND', message: 'Specification not found' } };

  const { allowed } = await requireAdmin(session.user.id, spec.projectId);
  if (!allowed) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'You must be a project admin to request changes' } };
  }

  try {
    const updatedPlan = await planRepository.requestChanges({
      planId: result.data.id,
      userId: session.user.id,
      notes: result.data.notes,
    });
    
    // Dispatch webhook
    await webhookService.dispatch(spec.projectId, 'changes_requested', updatedPlan, {
      specId: spec.id,
    });

    revalidatePath(`/specs/${plan.specId}`);
    
    return { success: true, data: updatedPlan };
  } catch (error: unknown) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error), 
      userId: session.user.id,
      planId: result.data.id
    }, 'Failed to request changes on plan');
    
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } };
  }
}

export async function abandonPlanAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const rawData = {
    id: Number(formData.get('id')),
  };

  const result = abandonPlanSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
  }

  const plan = await planRepository.getById(result.data.id);
  if (!plan) return { success: false, error: { code: 'NOT_FOUND', message: 'Plan not found' } };

  const spec = await specificationRepository.getById(plan.specId);
  if (!spec) return { success: false, error: { code: 'NOT_FOUND', message: 'Specification not found' } };

  const { allowed } = await requireMember(session.user.id, spec.projectId);
  if (!allowed) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'You must be a project member to abandon plans' } };
  }

  try {
    const updatedPlan = await planRepository.abandonPlan({
      planId: result.data.id,
      userId: session.user.id,
    });
    
    revalidatePath(`/specs/${plan.specId}`);
    
    return { success: true, data: updatedPlan };
  } catch (error: unknown) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error), 
      userId: session.user.id,
      planId: result.data.id
    }, 'Failed to abandon plan');
    
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } };
  }
}
