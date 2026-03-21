import { testResultRepository } from '@/repositories/test-result-repository';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/rbac';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const projectTestQuerySchema = z.object({
  projectId: z.coerce.number().positive(),
});

export async function getProjectTestResults(searchParams: Record<string, string | undefined> = {}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { data: null, error: 'UNAUTHORIZED' as const };
  }

  const result = projectTestQuerySchema.safeParse(searchParams);
  if (!result.success) {
    return { data: null, error: 'INVALID_INPUT' as const };
  }

  const { allowed } = await requireAdmin(session.user.id, result.data.projectId);
  if (!allowed) {
    return { data: null, error: 'FORBIDDEN' as const };
  }

  try {
    const data = await testResultRepository.getLatestByProject(result.data.projectId);
    return { data, error: null };
  } catch (error) {
    logger.error({ error, userId: session.user.id }, 'Query getProjectTestResults failed');
    return { data: null, error: 'INTERNAL_ERROR' as const };
  }
}
