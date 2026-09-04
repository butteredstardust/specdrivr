#!/usr/bin/env tsx
import { agentSessionRepository } from '../src/repositories/agent-session-repository';
import { planJobRepository } from '../src/repositories/plan-job-repository';
import { logger } from '../src/lib/logger';

const INTERVAL_MS = 30_000;
const SESSION_THRESHOLD_SECONDS = 60;

async function recover(): Promise<void> {
  const [sessions, jobs] = await Promise.all([
    agentSessionRepository.recoverGhostSessions(SESSION_THRESHOLD_SECONDS),
    planJobRepository.recoverStuckJobs(15),
  ]);
  if (sessions > 0 || jobs > 0) {
    logger.warn({ sessions, jobs }, 'Recovered stale orchestration work');
  }
}

async function main(): Promise<void> {
  logger.info(
    { intervalMs: INTERVAL_MS, sessionThresholdSeconds: SESSION_THRESHOLD_SECONDS },
    'Recovery worker started'
  );
  for (;;) {
    try {
      await recover();
    } catch (error) {
      logger.error({ error }, 'Recovery cycle failed');
    }
    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
  }
}

void main();
