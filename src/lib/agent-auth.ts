import 'server-only';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { tokenRepository, type AgentToken } from '@/repositories/token-repository';

type AgentAuthResult =
  | { success: true; token: AgentToken }
  | { success: false; response: NextResponse };

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

  return { success: true, token: agentToken };
}
