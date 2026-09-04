import { toNextJsHandler } from 'better-auth/next-js';
import { authInstance } from '@/lib/auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limiter';

const handlers = toNextJsHandler(authInstance);

export const GET = handlers.GET;
export async function POST(request: Request): Promise<Response> {
  const identifier = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const result = await checkRateLimit('auth', identifier);
  if (!result.allowed) return rateLimitResponse(result.resetAt);
  return handlers.POST(request);
}
