import { fileChangeRepository } from '@/repositories/file-change-repository';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { fileChangesQuerySchema } from '@/lib/schemas';

export async function getTaskFileChanges(searchParams: Record<string, string | undefined> = {}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { data: null, error: 'UNAUTHORIZED' as const };
  }

  const result = fileChangesQuerySchema.safeParse(searchParams);
  if (!result.success) {
    return { data: null, error: 'INVALID_INPUT' as const };
  }

  try {
    const data = await fileChangeRepository.getByTaskId(result.data.taskId);
    return { data, error: null };
  } catch (error) {
    logger.error({ error, userId: session.user.id }, 'Query getTaskFileChanges failed');
    return { data: null, error: 'INTERNAL_ERROR' as const };
  }
}
