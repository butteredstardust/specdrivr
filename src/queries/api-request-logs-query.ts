import { apiLogsQuerySchema } from '@/lib/schemas';
import { apiRequestLogRepository } from '@/repositories/api-request-log-repository';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/rbac';
import { logger } from '@/lib/logger';

export async function getProjectApiLogs(params: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { data: [], total: 0, error: 'UNAUTHORIZED' as const };
  }

  const result = apiLogsQuerySchema.safeParse(params);
  if (!result.success) {
    return { data: [], total: 0, error: 'INVALID_INPUT' as const };
  }

  try {
    const { projectId, endpoint, statusCode, limit, offset } = result.data;

    // Only project admins can view API usage logs
    const { allowed } = await requireAdmin(session.user.id, projectId);
    if (!allowed) {
      return { data: [], total: 0, error: 'FORBIDDEN' as const };
    }

    const [data, total] = await Promise.all([
      apiRequestLogRepository.getFilteredByProject(
        projectId,
        { endpoint, statusCode },
        limit,
        offset
      ),
      apiRequestLogRepository.countFilteredByProject(projectId, { endpoint, statusCode }),
    ]);

    return { data, total, error: null };
  } catch (error) {
    logger.error({ error, userId: session.user.id }, 'Query getProjectApiLogs failed');
    return { data: [], total: 0, error: 'INTERNAL_ERROR' as const };
  }
}
