import { auditRepository } from '@/repositories/audit-repository';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import { auditLogQuerySchema } from '@/lib/schemas';

export async function getProjectAuditLogs(searchParams: Record<string, string | undefined> = {}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { data: null, total: 0, error: 'UNAUTHORIZED' as const };
  }

  const result = auditLogQuerySchema.safeParse(searchParams);
  if (!result.success) {
    return { data: null, total: 0, error: 'INVALID_INPUT' as const };
  }

  const { allowed } = await requireAdmin(session.user.id, result.data.projectId);
  if (!allowed) {
    return { data: null, total: 0, error: 'FORBIDDEN' as const };
  }

  try {
    const { projectId, limit, offset, search, actor, action, from, to } = result.data;

    // Check if we even need to filter
    const hasFilters = Boolean(search || actor || action || from || to);

    const [data, total] = await Promise.all([
      hasFilters
        ? auditRepository.getFilteredByProjectId(
            projectId,
            { search, actor, action, from, to },
            limit,
            offset
          )
        : auditRepository.getByProjectId(projectId, limit, offset),
      hasFilters
        ? auditRepository.countFilteredByProjectId(projectId, { search, actor, action, from, to })
        : auditRepository.countByProjectId(projectId),
    ]);

    return { data, total, error: null };
  } catch (error) {
    logger.error({ error, userId: session.user.id }, 'Query getProjectAuditLogs failed');
    return { data: null, total: 0, error: 'INTERNAL_ERROR' as const };
  }
}
