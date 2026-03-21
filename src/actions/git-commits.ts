'use server';

import { insertGitCommitSchema } from '@/lib/schemas';
import { gitCommitRepository } from '@/repositories/git-commit-repository';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/rbac';
import { logger } from '@/lib/logger';

export async function recordGitCommitAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const rawData = Object.fromEntries(formData.entries());
  let metadata = null;
  if (rawData.metadata && typeof rawData.metadata === 'string') {
    try {
      metadata = JSON.parse(rawData.metadata);
    } catch {
      // ignore JSON parse error
    }
  }

  const payload = {
    projectId: Number(rawData.projectId),
    taskId: rawData.taskId ? Number(rawData.taskId) : null,
    commitSha: String(rawData.commitSha || ''),
    branch: String(rawData.branch || ''),
    message: String(rawData.message || ''),
    author: rawData.author ? String(rawData.author) : null,
    metadata,
  };

  const result = insertGitCommitSchema.safeParse(payload);
  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
  }

  const { allowed } = await requireAdmin(session.user.id, result.data.projectId);
  if (!allowed) {
    return { success: false, error: { code: 'FORBIDDEN', message: 'Requires admin permission' } };
  }

  try {
    const commit = await gitCommitRepository.create(
      result.data as import('@/db/schema').GitCommitInsert
    );
    return { success: true, data: commit };
  } catch (error: unknown) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        userId: session.user.id,
        projectId: result.data.projectId,
      },
      'Failed to record git commit'
    );
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to record commit' },
    };
  }
}
