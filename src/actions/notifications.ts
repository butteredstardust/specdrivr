'use server';

import { revalidatePath } from 'next/cache';
import { notificationRepository } from '@/repositories/notification-repository';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { updateNotificationPreferencesSchema } from '@/lib/schemas';

export async function markNotificationAsReadAction(id: number) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  if (!id || isNaN(id)) {
    return { success: false, error: { code: 'INVALID_INPUT', message: 'Invalid notification ID' } };
  }

  try {
    const success = await notificationRepository.markAsRead(id, session.user.id);
    if (!success) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } };
    }

    // Adjust path invalidation as needed depending on where notifications are rendered
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error: unknown) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        userId: session.user.id,
        notificationId: id,
      },
      'Failed to mark notification as read'
    );

    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    };
  }
}

export async function markAllNotificationsAsReadAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  try {
    await notificationRepository.markAllAsRead(session.user.id);

    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error: unknown) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        userId: session.user.id,
      },
      'Failed to mark all notifications as read'
    );

    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    };
  }
}

export async function updateNotificationPreferencesAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  try {
    const rawPreferences = formData.get('preferences');
    if (!rawPreferences || typeof rawPreferences !== 'string') {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Missing preferences' } };
    }

    const parsedData = JSON.parse(rawPreferences);
    const result = updateNotificationPreferencesSchema.safeParse({ preferences: parsedData });

    if (!result.success) {
      return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
    }

    await notificationRepository.upsertPreferences(session.user.id, result.data.preferences);

    revalidatePath('/settings');

    return { success: true };
  } catch (error: unknown) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        userId: session.user.id,
      },
      'Failed to update notification preferences'
    );

    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    };
  }
}
