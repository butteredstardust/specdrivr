import { planJobRepository } from '@/repositories/plan-job-repository';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import { planJobQuerySchema } from '@/lib/schemas';

export async function getProjectPlanQueue(searchParams: Record<string, string | undefined> = {}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { data: null, total: 0, error: 'UNAUTHORIZED' as const };
  }

  const result = planJobQuerySchema.safeParse(searchParams);
  if (!result.success) {
    return { data: null, total: 0, error: 'INVALID_INPUT' as const };
  }

  const { allowed } = await requireAdmin(session.user.id, result.data.projectId);
  if (!allowed) {
    return { data: null, total: 0, error: 'FORBIDDEN' as const };
  }

  try {
    const { projectId, status, limit, offset } = result.data;

    // Convert status to the expected format of null vs undefined if needed, or just pass directly
    const optionsStatus = status as 'pending' | 'running' | 'completed' | 'failed' | undefined;

    const [data, total] = await Promise.all([
      planJobRepository.getFilteredByProject(projectId, { status: optionsStatus }, limit, offset),
      planJobRepository.countFilteredByProject(projectId, { status: optionsStatus }),
    ]);

    return { data, total, error: null };
  } catch (error) {
    logger.error({ error, userId: session.user.id }, 'Query getProjectPlanQueue failed');
    return { data: null, total: 0, error: 'INTERNAL_ERROR' as const };
  }
}
