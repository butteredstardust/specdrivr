import { NextRequest, NextResponse } from 'next/server';
import { agentSessionRepository } from '@/repositories/agent-session-repository';
import { handleApiError } from '@/lib/error-handler';
import { parseEnv } from '@/lib/env-core';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const env = parseEnv();
  const authHeader = request.headers.get('Authorization');

  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid CRON_SECRET' } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const threshold = parseInt(searchParams.get('threshold') || '5');

  try {
    logger.info(`👻 System Ghost Buster starting (threshold: ${threshold}m)...`);
    const recoveredCount = await agentSessionRepository.recoverGhostSessions(threshold);
    
    return NextResponse.json({
      data: {
        recoveredCount,
        message: recoveredCount > 0 
          ? `Recovered ${recoveredCount} stale sessions.`
          : 'No stale sessions found.',
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
