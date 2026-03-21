'use server';

import { revalidatePath } from 'next/cache';
import { testResultRepository } from '@/repositories/test-result-repository';
import { taskRepository } from '@/repositories/task-repository';
import { planRepository } from '@/repositories/plan-repository';
import { specificationRepository } from '@/repositories/specification-repository';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/rbac';
import { testResultUploadSchema } from '@/lib/schemas';

export async function uploadTestResultsAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const rawData = {
    taskId: Number(formData.get('taskId')),
    success: formData.get('success') === 'true',
    logs: formData.get('logs') ? String(formData.get('logs')) : undefined,
  };

  const result = testResultUploadSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
  }

  // Find the project via hierarchy to authorize
  const task = await taskRepository.getById(result.data.taskId);
  if (!task) return { success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } };

  const plan = await planRepository.getById(task.planId);
  if (!plan) return { success: false, error: { code: 'NOT_FOUND', message: 'Plan not found' } };

  const spec = await specificationRepository.getById(plan.specId);
  if (!spec) return { success: false, error: { code: 'NOT_FOUND', message: 'Spec not found' } };

  // Require admin to upload test results? Or member? Admin is safer for system mutations.
  const { allowed } = await requireAdmin(session.user.id, spec.projectId);
  if (!allowed) {
    return {
      success: false,
      error: { code: 'FORBIDDEN', message: 'You must be a project admin to upload test results' },
    };
  }

  try {
    const testResult = await testResultRepository.create({
      taskId: result.data.taskId,
      success: result.data.success,
      logs: result.data.logs,
    });

    revalidatePath(`/projects/${spec.projectId}/tests`);
    return { success: true, data: testResult };
  } catch (error: unknown) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        userId: session.user.id,
        taskId: result.data.taskId,
      },
      'Failed to upload test results'
    );
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to upload test results' },
    };
  }
}
