import 'server-only';
import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

// ioredis 6 defaults to RESP3; stay on RESP2 so reply and pub/sub shapes match v5.
export const redis = new Redis(env.REDIS_URL, {
  protocol: 2,
  maxRetriesPerRequest: 2,
  connectTimeout: 5_000,
  commandTimeout: 5_000,
});

redis.on('error', (error) => {
  logger.warn({ error }, 'Redis connection error');
});
