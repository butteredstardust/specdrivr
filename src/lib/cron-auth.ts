import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Checks an `Authorization: Bearer <secret>` header against the expected secret
 * in constant time. Both sides are hashed first so their lengths always match.
 */
export function isValidBearerSecret(authHeader: string | null, secret: string): boolean {
  if (!secret || !authHeader?.startsWith('Bearer ')) return false;
  const provided = createHash('sha256').update(authHeader.slice('Bearer '.length)).digest();
  const expected = createHash('sha256').update(secret).digest();
  return timingSafeEqual(provided, expected);
}
