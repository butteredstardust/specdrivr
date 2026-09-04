import 'server-only';
import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 2,
  connectTimeout: 5_000,
  commandTimeout: 5_000,
});

redis.on('error', (error) => {
  logger.warn({ error }, 'Redis connection error');
});
