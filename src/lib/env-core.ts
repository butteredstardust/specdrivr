import { z } from 'zod';
import { config } from 'dotenv';

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').url('DATABASE_URL must be a valid URL'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required').optional().default('development-secret'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL').optional(),
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL').optional().default('redis://localhost:6379'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
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

  return envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    REDIS_URL: process.env.REDIS_URL,
    NODE_ENV: process.env.NODE_ENV,
  });
}
