import { usageRepository } from '@/repositories/usage-repository';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import { usageSnapshotsQuerySchema } from '@/lib/schemas';

export async function getProjectUsageSnapshots(
  searchParams: Record<string, string | undefined> = {}
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { data: null, meta: null, error: 'UNAUTHORIZED' as const };
  }

  const result = usageSnapshotsQuerySchema.safeParse(searchParams);
  if (!result.success) {
    return { data: null, meta: null, error: 'INVALID_INPUT' as const };
  }

  const { allowed } = await requireAdmin(session.user.id, result.data.projectId);
  if (!allowed) {
    return { data: null, meta: null, error: 'FORBIDDEN' as const };
  }

  try {
    const { projectId, days, page, limit } = result.data;

    const data = await usageRepository.getByProjectId(projectId, { days, page, limit });
    return { data: data.data, meta: data.meta, error: null };
  } catch (error) {
    logger.error({ error, userId: session.user.id }, 'Query getProjectUsageSnapshots failed');
    return { data: null, meta: null, error: 'INTERNAL_ERROR' as const };
  }
}
