#!/usr/bin/env tsx
import { agentSessionRepository } from '../src/repositories/agent-session-repository';
import { logger } from '../src/lib/logger';

async function main() {
  const threshold = parseInt(process.env.GHOST_THRESHOLD_MINUTES || '5');
  logger.info(`👻 Ghost Buster starting (threshold: ${threshold}m)...`);

  try {
    const recoveredCount = await agentSessionRepository.recoverGhostSessions(threshold);
    
    if (recoveredCount > 0) {
      logger.info(`✓ Ghost Buster: Recovered ${recoveredCount} stale sessions.`);
    } else {
      logger.info('✓ Ghost Buster: No stale sessions found.');
    }
    
    process.exit(0);
  } catch (err) {
    logger.error({ err }, '❌ Ghost Buster failed');
    process.exit(1);
  }
}

main();
