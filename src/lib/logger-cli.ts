import pino from 'pino';

/**
 * Logger for CLI scripts (e.g., seeding, migrations).
 * This instance does NOT include 'server-only' to allow execution in Node.js processes.
 */
export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  }),
});
