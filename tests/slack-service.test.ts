import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSlackConfig, sendSlackNotification } from '../src/lib/slack';
import { db } from '../src/db';

vi.mock('../src/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('Slack Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSlackConfig', () => {
    it('should return null when Slack is not configured', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const config = await getSlackConfig(1);
      expect(config).toBeNull();
    });

    it('should return config when configured', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ botToken: 'xoxb-123', channelId: 'C123' }]),
          }),
        }),
      });

      const config = await getSlackConfig(1);
      expect(config).toEqual({ botToken: 'xoxb-123', channelId: 'C123' });
    });
  });

  describe('sendSlackNotification', () => {
    it('should return immediately if Slack is not configured', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      await sendSlackNotification(1, 'session_started', {
        projectId: 1,
        projectName: 'Project Alpha',
        appUrl: 'http://localhost:3000',
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should call Slack API with correct blocks', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ botToken: 'xoxb-123', channelId: 'C123' }]),
          }),
        }),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockResolvedValue({
        json: () => Promise.resolve({ ok: true }),
      });

      await sendSlackNotification(1, 'session_started', {
        projectId: 1,
        projectName: 'Project Alpha',
        sessionId: 101,
        specName: 'Auth System',
        appUrl: 'http://localhost:3000',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://slack.com/api/chat.postMessage',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer xoxb-123',
          }),
        })
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.channel).toBe('C123');
      expect(callBody.blocks).toHaveLength(4);
      expect(callBody.blocks[0].type).toBe('header');
      expect(callBody.blocks[0].text.text).toContain('Session Started');
    });
  });
});
