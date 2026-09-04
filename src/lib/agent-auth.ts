import 'server-only';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { tokenRepository, type AgentToken } from '@/repositories/token-repository';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limiter';

type AgentAuthResult =
  | { success: true; token: AgentToken }
  | { success: false; response: Response };

export async function verifyAgentToken(authHeader: string | null): Promise<AgentAuthResult> {
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      success: false,
      response: NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Missing token' } },
        { status: 401 }
      ),
    };
  }

  const rawToken = authHeader.replace('Bearer ', '');
  const prefix = rawToken.slice(0, 10);

  const agentToken = await tokenRepository.getByPrefix(prefix);
  if (!agentToken) {
    return {
      success: false,
      response: NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid token' } },
        { status: 401 }
      ),
    };
  }

  if (
    agentToken.projectId === null ||
    agentToken.revokedAt !== null ||
    (agentToken.expiresAt !== null && agentToken.expiresAt <= new Date())
  ) {
    return {
      success: false,
      response: NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid token' } },
        { status: 401 }
      ),
    };
  }

  const isValid = await bcrypt.compare(rawToken, agentToken.tokenHash);
  if (!isValid) {
    return {
      success: false,
      response: NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Invalid token' } },
        { status: 401 }
      ),
    };
  }

  const rateLimit = await checkRateLimit('agent', String(agentToken.id));
  if (!rateLimit.allowed) {
    return { success: false, response: rateLimitResponse(rateLimit.resetAt) };
  }

  await tokenRepository.updateLastUsed(agentToken.id);
  return { success: true, token: agentToken };
}
