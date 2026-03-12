import { z } from 'zod';
import { config } from 'dotenv';

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').url('DATABASE_URL must be a valid URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters for security'),
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters for security'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL').default('http://localhost:3000'),
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL').optional().default('redis://localhost:6379'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(): Env {
  // Try to load dotenv only if we're not in the Edge runtime
  if (typeof process !== 'undefined' && process.env && typeof process.cwd === 'function') {
    try {
      config({ path: '.env' });
      config({ path: '.env.local' });
    } catch {
      // Ignore if dotenv isn't available or fails
    }
  }

  const envToParse = {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || (process.env.VITEST ? 'a'.repeat(32) : undefined),
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || (process.env.VITEST ? 'a'.repeat(32) : undefined),
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    REDIS_URL: process.env.REDIS_URL,
    NODE_ENV: process.env.NODE_ENV,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET,
  };

  if (process.env.VITEST && !process.env.DATABASE_URL) {
    console.warn('Warning: DATABASE_URL is missing during Vitest execution.');
  }

  try {
    return envSchema.parse(envToParse);
  } catch (error) {
    if (process.env.VITEST) {
      console.error('Environment validation failed during Vitest:', JSON.stringify(error, null, 2));
    }
    throw error;
  }
}
