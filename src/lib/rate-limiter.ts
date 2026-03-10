import 'server-only';
import { redis } from './redis';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // unix ms
}

/**
 * Sliding window rate limiter backed by ioredis.
 *
 * Tiers (per spec §17.2):
 *   auth_endpoints   — 10 req / 60s  per IP
 *   api_endpoints    — 100 req / 60s per userId
 *   agent_endpoints  — 1000 req / 60s per token
 */
const TIERS = {
  auth:  { limit: 10,   windowMs: 60_000 },
  api:   { limit: 100,  windowMs: 60_000 },
  agent: { limit: 1000, windowMs: 60_000 },
} as const;

type Tier = keyof typeof TIERS;

export async function checkRateLimit(
  tier: Tier,
  identifier: string
): Promise<RateLimitResult> {
  const { limit, windowMs } = TIERS[tier];
  const key = `rl:${tier}:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    // Sliding window using a sorted set — score = timestamp, member = unique request id
    const pipe = redis.pipeline();
    pipe.zremrangebyscore(key, '-inf', windowStart);
    pipe.zadd(key, now, `${now}-${Math.random()}`);
    pipe.zcard(key);
    pipe.pexpire(key, windowMs);
    const results = await pipe.exec();

    const count = (results?.[2]?.[1] as number) ?? 0;
    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);
    const resetAt = now + windowMs;

    return { allowed, remaining, resetAt };
  } catch {
    // If Redis is unavailable, fail open to avoid blocking all traffic
    return { allowed: true, remaining: limit, resetAt: now + windowMs };
  }
}

/**
 * Returns a Response with 429 status and Retry-After header.
 * Call this when checkRateLimit returns allowed: false.
 */
export function rateLimitResponse(resetAt: number): Response {
  const retryAfterSecs = Math.ceil((resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({ error: { code: 'RATE_LIMITED', message: 'Too many requests' } }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSecs),
        'X-RateLimit-Reset': String(resetAt),
      },
    }
  );
}
