'use server';

import { revalidatePath } from 'next/cache';
import { projectRepository } from '@/repositories/project-repository';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { updateAgentConfigSchema } from '@/lib/schemas';
import { requireAdmin } from '@/lib/rbac';

export async function updateAgentConfigAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const projectId = Number(formData.get('projectId'));

  // Extract and convert form data
  const rawData = {
    projectId,
    modelId: formData.get('modelId'),
    planModelId: formData.get('planModelId'),
    maxConcurrentTasks: Number(formData.get('maxConcurrentTasks')),
    taskTimeoutSeconds: Number(formData.get('taskTimeoutSeconds')),
    maxRetriesPerTask: Number(formData.get('maxRetriesPerTask')),
    retryDelaySeconds: Number(formData.get('retryDelaySeconds')),
    requireApproval: formData.get('requireApproval') === 'true',
    autoGeneratePlan: formData.get('autoGeneratePlan') === 'true',
    branchPrefix: formData.get('branchPrefix'),
    commitMessagePrefix: formData.get('commitMessagePrefix'),
    maxDiffSizeKb: Number(formData.get('maxDiffSizeKb')),
    prAutoCreate: formData.get('prAutoCreate') === 'true',
    prTargetBranch: formData.get('prTargetBranch'),
    allowedFileGlobs: formData.getAll('allowedFileGlobs').map(String),
    forbiddenFileGlobs: formData.getAll('forbiddenFileGlobs').map(String),
    testCommand: formData.get('testCommand'),
    lintCommand: formData.get('lintCommand'),
    setupCommand: formData.get('setupCommand'),
  };

  const result = updateAgentConfigSchema.safeParse(rawData);
  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
  }

  const { allowed } = await requireAdmin(session.user.id, projectId);
  if (!allowed) {
    return {
      success: false,
      error: { code: 'FORBIDDEN', message: 'You must be a project admin to update settings' },
    };
  }

  try {
    const config = await projectRepository.updateAgentConfig(
      projectId,
      result.data,
      session.user.id
    );

    revalidatePath(`/projects/${projectId}/settings`);

    return { success: true, data: config };
  } catch (error: unknown) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        userId: session.user.id,
        projectId,
      },
      'Failed to update agent config'
    );

    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    };
  }
}
