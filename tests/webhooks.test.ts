import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { logger } from '@/lib/logger';
import { webhookRepository } from '@/repositories/webhook-repository';

vi.mock('@/db', () => ({
  db: { insert: vi.fn() },
}));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}));
vi.mock('@/repositories/webhook-repository', () => ({
  webhookRepository: { getActiveWebhooksForEvent: vi.fn() },
}));
vi.unmock('@/lib/webhooks');

describe('dispatchWebhookEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs and contains enqueue failures for fire-and-forget callers', async () => {
    vi.mocked(webhookRepository.getActiveWebhooksForEvent).mockRejectedValue(
      new Error('database unavailable')
    );
    const { dispatchWebhookEvent } = await import('@/lib/webhooks');

    await expect(
      dispatchWebhookEvent(42, 'spec.updated', {
        specId: 7,
        data: { status: 'drafting' },
      })
    ).resolves.toBeUndefined();

    expect(db.insert).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 42, event: 'spec.updated' }),
      'Failed to queue webhook event'
    );
  });
});
