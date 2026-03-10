import 'server-only';
import { redis } from './redis';

const DEFAULT_TTL_MS = 30_000; // 30 seconds

/**
 * Distributed lock using Redis SET NX EX.
 * Used to prevent concurrent plan generation for the same spec.
 *
 * Lock key pattern: lock:plan-generate:{specId}
 */
export async function acquireLock(
  key: string,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<string | null> {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const result = await redis.set(key, token, 'PX', ttlMs, 'NX');
  return result === 'OK' ? token : null;
}

export async function releaseLock(key: string, token: string): Promise<boolean> {
  // Lua script ensures we only delete the key we own
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  const result = await redis.eval(script, 1, key, token);
  return result === 1;
}

export function planGenerateLockKey(specId: number): string {
  return `lock:plan-generate:${specId}`;
}
