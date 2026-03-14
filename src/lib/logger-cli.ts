import pino from 'pino';
import { parseEnv } from './env-core';

const env = parseEnv();

/**
 * Logger for CLI scripts (e.g., seeding, migrations).
 * This instance does NOT include 'server-only' to allow execution in Node.js processes.
 */
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  ...(env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  }),
});
