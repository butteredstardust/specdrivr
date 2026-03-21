import { describe, it, expect, beforeEach } from 'vitest';
import { testDb, cleanDatabase, createTestUser, createTestProject } from '../helpers';
import { notificationRepository } from '@/repositories/notification-repository';
import * as schema from '@/db/schema';

describe('NotificationRepository Integration Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('getByUserId', () => {
    it('returns notifications and correct unread counts', async () => {
      const user = await createTestUser('user_notif', 'notif@example.com');

      // 1. Create mixed notifications
      await testDb.insert(schema.notifications).values([
        {
          userId: user.id,
          type: 'info',
          title: 'Unread 1',
          body: 'Msg 1',
          linkUrl: '/',
          readAt: null,
        },
        {
          userId: user.id,
          type: 'info',
          title: 'Unread 2',
          body: 'Msg 2',
          linkUrl: '/',
          readAt: null,
        },
        {
          userId: user.id,
          type: 'info',
          title: 'Read 1',
          body: 'Msg 3',
          linkUrl: '/',
          readAt: new Date(),
        },
      ]);

      // 2. Fetch all
      const allResult = await notificationRepository.getByUserId(user.id);
      expect(allResult.notifications).toHaveLength(3);
      expect(allResult.total).toBe(3);
      expect(allResult.unreadCount).toBe(2);

      // 3. Fetch unread only
      const unreadResult = await notificationRepository.getByUserId(user.id, { unreadOnly: true });
      expect(unreadResult.notifications).toHaveLength(2);
      expect(unreadResult.total).toBe(2);
      expect(unreadResult.unreadCount).toBe(2);
      expect(unreadResult.notifications[0].readAt).toBeNull();
    });

    it('handles project filtering', async () => {
      const user = await createTestUser('user_proj', 'proj@example.com');
      const project = await createTestProject('Test Project', user.id);

      await testDb.insert(schema.notifications).values([
        {
          userId: user.id,
          projectId: project.id,
          type: 'info',
          title: 'Proj Notif',
          body: 'Msg',
          linkUrl: '/',
        },
        {
          userId: user.id,
          projectId: null,
          type: 'info',
          title: 'Global Notif',
          body: 'Msg',
          linkUrl: '/',
        },
      ]);

      const filtered = await notificationRepository.getByUserId(user.id, { projectId: project.id });
      expect(filtered.notifications).toHaveLength(1);
      expect(filtered.total).toBe(1);
      expect(filtered.notifications[0].projectId).toBe(project.id);
    });
  });
});
