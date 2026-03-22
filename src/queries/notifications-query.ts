import { notificationRepository } from '@/repositories/notification-repository';
import { auth } from '@/lib/auth';
import { notificationQuerySchema } from '@/lib/schemas';
import { logger } from '@/lib/logger';

export async function getUserNotifications(searchParams: Record<string, string | undefined> = {}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { data: null, error: 'UNAUTHORIZED' as const };
  }

  const result = notificationQuerySchema.safeParse(searchParams);
  if (!result.success) {
    return { data: null, error: 'INVALID_INPUT' as const };
  }

  try {
    const data = await notificationRepository.getByUserId(session.user.id, result.data);
    return { data, error: null };
  } catch (error) {
    logger.error({ error, userId: session.user.id }, 'Query getUserNotifications failed');
    return { data: null, error: 'INTERNAL_ERROR' as const };
  }
}

export async function getUserNotificationPreferences() {
  const session = await auth();
  if (!session?.user?.id) {
    return { data: null, error: 'UNAUTHORIZED' as const };
  }

  try {
    const data = await notificationRepository.getPreferences(session.user.id);
    return { data, error: null };
  } catch (error) {
    logger.error({ error, userId: session.user.id }, 'Query getUserNotificationPreferences failed');
    return { data: null, error: 'INTERNAL_ERROR' as const };
  }
}
