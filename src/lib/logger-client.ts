const isDev = process.env.NODE_ENV === 'development';

export const clientLogger = {
  error: (msg: string, ...args: unknown[]) => {
    if (isDev) console.error('[specdrivr]', msg, ...args);
  },
  warn: (msg: string, ...args: unknown[]) => {
    if (isDev) console.warn('[specdrivr]', msg, ...args);
  },
};
