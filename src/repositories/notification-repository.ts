import { db } from '@/db';
import {
  notifications,
  notificationPreferences,
  type NotificationSelect as Notification,
  type NotificationInsert,
} from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { DatabaseError } from '@/lib/errors';

export { type NotificationSelect as Notification } from '@/db/schema';

export class NotificationRepository extends BaseRepository {
  async getByUserId(userId: string): Promise<Notification[]> {
    return await this.executeQuery(() =>
      db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
    );
  }

  async markAsRead(id: number, userId: string): Promise<boolean> {
    const result = await this.executeQuery(() =>
      db
        .update(notifications)
        .set({ readAt: new Date() })
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
        .returning()
    );

    return result.length > 0;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.executeQuery(() =>
      db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.userId, userId))
    );
  }

  async create(data: Omit<NotificationInsert, 'id' | 'createdAt'>): Promise<Notification> {
    const [notification] = await this.executeQuery(() =>
      db.insert(notifications).values(data).returning()
    );

    if (!notification) {
      throw new DatabaseError('Failed to create notification');
    }

    return notification;
  }

  async createMany(data: Omit<NotificationInsert, 'id' | 'createdAt'>[]): Promise<void> {
    if (data.length === 0) return;
    await this.executeQuery(() => db.insert(notifications).values(data));
  }

  async getPreferences(
    userId: string
  ): Promise<Array<{ eventType: string; emailEnabled: boolean; inAppEnabled: boolean }>> {
    const EVENT_TYPES = [
      'plan_generated',
      'plan_approved',
      'plan_rejected',
      'changes_requested',
      'session_complete',
      'task_blocked',
      'session_failed',
      'member_invited',
      'role_changed',
    ];

    const rows = await this.executeQuery(() =>
      db
        .select({
          eventType: notificationPreferences.eventType,
          emailEnabled: notificationPreferences.emailEnabled,
          inAppEnabled: notificationPreferences.inAppEnabled,
        })
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId))
    );

    const map = new Map(rows.map((r) => [r.eventType, r]));
    return EVENT_TYPES.map(
      (et) => map.get(et) ?? { eventType: et, emailEnabled: false, inAppEnabled: true }
    );
  }

  async upsertPreferences(
    userId: string,
    prefs: Array<{ eventType: string; emailEnabled: boolean; inAppEnabled: boolean }>
  ): Promise<void> {
    if (prefs.length === 0) return;
    const rows = prefs.map((p) => ({
      userId,
      eventType: p.eventType,
      emailEnabled: p.emailEnabled,
      inAppEnabled: p.inAppEnabled,
      updatedAt: new Date(),
    }));
    await this.executeQuery(() =>
      db
        .insert(notificationPreferences)
        .values(rows)
        .onConflictDoUpdate({
          target: [notificationPreferences.userId, notificationPreferences.eventType],
          set: {
            emailEnabled: sql`excluded.email_enabled`,
            inAppEnabled: sql`excluded.in_app_enabled`,
            updatedAt: new Date(),
          },
        })
    );
  }
}

export const notificationRepository = new NotificationRepository();
