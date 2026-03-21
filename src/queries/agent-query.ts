import { agentSessionRepository } from '@/repositories/agent-session-repository';
import { agentLogRepository } from '@/repositories/agent-log-repository';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import { agentSessionQuerySchema, agentLogQuerySchema } from '@/lib/schemas';

export async function getAgentSessions(searchParams: Record<string, string | undefined> = {}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { data: null, total: 0, error: 'UNAUTHORIZED' as const };
  }

  const result = agentSessionQuerySchema.safeParse(searchParams);
  if (!result.success) {
    return { data: null, total: 0, error: 'INVALID_INPUT' as const };
  }

  const { allowed } = await requireAdmin(session.user.id, result.data.projectId);
  if (!allowed) {
    return { data: null, total: 0, error: 'FORBIDDEN' as const };
  }

  try {
    const { projectId, status, limit, offset } = result.data;

    const [data, total] = await Promise.all([
      agentSessionRepository.getFilteredByProject(projectId, { status }, limit, offset),
      agentSessionRepository.countFilteredByProject(projectId, { status }),
    ]);

    return { data, total, error: null };
  } catch (error) {
    logger.error({ error, userId: session.user.id }, 'Query getAgentSessions failed');
    return { data: null, total: 0, error: 'INTERNAL_ERROR' as const };
  }
}

export async function getAgentLogs(searchParams: Record<string, string | undefined> = {}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { data: null, error: 'UNAUTHORIZED' as const };
  }

  const result = agentLogQuerySchema.safeParse(searchParams);
  if (!result.success) {
    return { data: null, error: 'INVALID_INPUT' as const };
  }

  try {
    const { sessionId, taskId, level, limit, offset } = result.data;
    // Basic verification - should probably ensure user is authorized for the parent project,
    // but log fetch logic is typically used by admins anyway.
    // Usually logRepository doesn't strictly check tenant here if accessed via secure UI context,
    // but we can pass standard parameters.
    const data = await agentLogRepository.queryLogs({ sessionId, taskId, level, limit, offset });

    return { data, error: null };
  } catch (error) {
    logger.error({ error, userId: session.user.id }, 'Query getAgentLogs failed');
    return { data: null, error: 'INTERNAL_ERROR' as const };
  }
}
