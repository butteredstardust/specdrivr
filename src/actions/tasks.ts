'use server';

import { revalidatePath } from 'next/cache';
import { taskRepository } from '@/repositories/task-repository';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { 
  unblockTaskSchema, 
  overrideTaskStatusSchema,
  taskStatusSchema
} from '@/lib/schemas';
import { requireAdmin, requireMember } from '@/lib/rbac';
import { planRepository } from '@/repositories/plan-repository';
import { specificationRepository } from '@/repositories/specification-repository';
import type { z } from 'zod';

type TaskStatus = z.infer<typeof taskStatusSchema>;

export async function retryTaskAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const taskId = Number(formData.get('id'));
  if (isNaN(taskId)) {
    return { success: false, error: { code: 'INVALID_INPUT', message: 'Task ID is required' } };
  }

  const task = await taskRepository.getById(taskId);
  if (!task) return { success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } };

  const plan = await planRepository.getById(task.planId);
  if (!plan) return { success: false, error: { code: 'NOT_FOUND', message: 'Plan not found' } };

  const spec = await specificationRepository.getById(plan.specId);
  if (!spec) return { success: false, error: { code: 'NOT_FOUND', message: 'Specification not found' } };

  const { allowed } = await requireMember(session.user.id, spec.projectId);
  if (!allowed) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to retry tasks in this project' } };
  }

  try {
    const updatedTask = await taskRepository.retryTask(taskId, session.user.id);

    revalidatePath(`/specs/${spec.id}`);
    
    return { success: true, data: updatedTask };
  } catch (error: unknown) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error), 
      userId: session.user.id,
      taskId
    }, 'Failed to retry task');
    
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } };
  }
}

export async function unblockTaskAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const rawData = {
    id: Number(formData.get('id')),
    humanContext: formData.get('humanContext'),
  };

  const result = unblockTaskSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
  }

  const task = await taskRepository.getById(result.data.id);
  if (!task) return { success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } };

  const plan = await planRepository.getById(task.planId);
  if (!plan) return { success: false, error: { code: 'NOT_FOUND', message: 'Plan not found' } };

  const spec = await specificationRepository.getById(plan.specId);
  if (!spec) return { success: false, error: { code: 'NOT_FOUND', message: 'Specification not found' } };

  const { allowed } = await requireMember(session.user.id, spec.projectId);
  if (!allowed) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to unblock tasks in this project' } };
  }

  try {
    const updatedTask = await taskRepository.unblockTask(result.data.id, result.data.humanContext, session.user.id);

    revalidatePath(`/specs/${spec.id}`);
    
    return { success: true, data: updatedTask };
  } catch (error: unknown) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error), 
      userId: session.user.id,
      taskId: result.data.id
    }, 'Failed to unblock task');
    
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } };
  }
}

export async function overrideTaskStatusAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const rawData = {
    id: Number(formData.get('id')),
    status: formData.get('status'),
    notes: formData.get('notes'),
  };

  const result = overrideTaskStatusSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
  }

  const task = await taskRepository.getById(result.data.id);
  if (!task) return { success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } };

  const plan = await planRepository.getById(task.planId);
  if (!plan) return { success: false, error: { code: 'NOT_FOUND', message: 'Plan not found' } };

  const spec = await specificationRepository.getById(plan.specId);
  if (!spec) return { success: false, error: { code: 'NOT_FOUND', message: 'Specification not found' } };

  const { allowed } = await requireAdmin(session.user.id, spec.projectId);
  if (!allowed) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'You must be a project admin to override task status' } };
  }

  try {
    const updatedTask = await taskRepository.overrideStatus(
      result.data.id, 
      result.data.status as TaskStatus, 
      session.user.id, 
      result.data.notes
    );

    revalidatePath(`/specs/${spec.id}`);
    
    return { success: true, data: updatedTask };
  } catch (error: unknown) {
    logger.error({ 
      error: error instanceof Error ? error.message : String(error), 
      userId: session.user.id,
      taskId: result.data.id
    }, 'Failed to override task status');
    
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } };
  }
}
