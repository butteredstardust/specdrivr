import { gitCommitsQuerySchema } from '@/lib/schemas';
import { gitCommitRepository } from '@/repositories/git-commit-repository';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/rbac';
import { logger } from '@/lib/logger';

export async function getProjectGitCommits(params: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { data: [], total: 0, error: 'UNAUTHORIZED' as const };
  }

  const result = gitCommitsQuerySchema.safeParse(params);
  if (!result.success) {
    return { data: [], total: 0, error: 'INVALID_INPUT' as const };
  }

  try {
    const { projectId, branch, limit, offset } = result.data;

    // Only project admins can view raw commit history for security
    const { allowed } = await requireAdmin(session.user.id, projectId);
    if (!allowed) {
      return { data: [], total: 0, error: 'FORBIDDEN' as const };
    }

    const [data, total] = await Promise.all([
      gitCommitRepository.getFilteredByProject(projectId, { branch }, limit, offset),
      gitCommitRepository.countFilteredByProject(projectId, { branch }),
    ]);

    return { data, total, error: null };
  } catch (error) {
    logger.error({ error, userId: session.user.id }, 'Query getProjectGitCommits failed');
    return { data: [], total: 0, error: 'INTERNAL_ERROR' as const };
  }
}
