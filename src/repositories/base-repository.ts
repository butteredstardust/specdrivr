import { executeQuery } from '@/lib/db-helpers';
import Redis from 'ioredis';
import { env } from '@/lib/env';

export abstract class BaseRepository {
  private redis: Redis | null = null;

  protected async executeQuery<T>(operation: () => Promise<T>): Promise<T> {
    const result = await executeQuery(operation);

    if (!result.success) {
      throw result.error;
    }

    return result.data;
  }

  /**
   * Publishes a message to a session-specific Redis channel.
   */
  protected async publishToSession(
    sessionId: number,
    channel: 'logs' | 'updates' | 'events',
    payload: unknown
  ): Promise<void> {
    try {
      if (!this.redis) {
        this.redis = new Redis(env.REDIS_URL || 'redis://localhost:6379');
      }
      const fullChannel = `session:${sessionId}:${channel}`;
      await this.redis.publish(fullChannel, JSON.stringify(payload));
    } catch (err) {
      // Don't crash the repository operation if Redis fails
      console.error(
        `[BaseRepository] Failed to publish to Redis session:${sessionId}:${channel}`,
        err
      );
    }
  }
}
