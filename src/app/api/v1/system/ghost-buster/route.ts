import { NextRequest, NextResponse } from 'next/server';
import { agentSessionRepository } from '@/repositories/agent-session-repository';
import { handleApiError } from '@/lib/error-handler';
import { parseEnv } from '@/lib/env-core';
import { logger } from '@/lib/logger';

// C-6: Module-level idempotency guard. Vercel Cron can fire twice on cold starts.
// We reject runs that arrive within 60 seconds of the last successful run.
let lastRunAt: number | null = null;
const MIN_INTERVAL_MS = 60_000;

export async function POST(request: NextRequest) {
  const env = parseEnv();
  const authHeader = request.headers.get('Authorization');

  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid CRON_SECRET' } },
      { status: 401 }
    );
  }

  // Idempotency guard
  const now = Date.now();
  if (lastRunAt !== null && now - lastRunAt < MIN_INTERVAL_MS) {
    logger.info('Ghost Buster skipped — ran too recently');
    return NextResponse.json({ data: { skipped: true, reason: 'ran_too_recently' } });
  }

  const { searchParams } = new URL(request.url);
  // I-5: Clamp threshold to a safe range (1–60 minutes) to prevent abuse
  const threshold = Math.max(1, Math.min(60, parseInt(searchParams.get('threshold') || '5', 10)));

  try {
    logger.info(`👻 System Ghost Buster starting (threshold: ${threshold}m)...`);
    const recoveredCount = await agentSessionRepository.recoverGhostSessions(threshold);
    lastRunAt = Date.now();

    return NextResponse.json({
      data: {
        recoveredCount,
        message:
          recoveredCount > 0
            ? `Recovered ${recoveredCount} stale sessions.`
            : 'No stale sessions found.',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
