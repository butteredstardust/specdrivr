import { db } from '@/db';
import {
  notifications,
  type NotificationSelect as Notification,
  type NotificationInsert,
} from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
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
}

export const notificationRepository = new NotificationRepository();
