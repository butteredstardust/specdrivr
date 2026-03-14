import { z } from 'zod';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

export const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .url('DATABASE_URL must be a valid URL'),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, 'BETTER_AUTH_SECRET must be at least 32 characters for security'),
  BETTER_AUTH_URL: z
    .string()
    .url('BETTER_AUTH_URL must be a valid URL')
    .default('http://localhost:3000'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  REDIS_URL: z
    .string()
    .url('REDIS_URL must be a valid URL')
    .optional()
    .default('redis://localhost:6379'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),
  CRON_SECRET: z.string().min(32),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  RESEND_FROM_EMAIL: z.string().email().default('noreply@specdrivr.dev'),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(): Env {
  // Try to load dotenv
  const dotEnvPath = path.resolve(process.cwd(), '.env');
  const dotEnvLocalPath = path.resolve(process.cwd(), '.env.local');

  if (fs.existsSync(dotEnvPath)) {
    const envConfig = config({ path: dotEnvPath }).parsed || {};
    for (const k in envConfig) {
      process.env[k] = process.env[k] || envConfig[k];
    }
  }
  if (fs.existsSync(dotEnvLocalPath)) {
    const envConfig = config({ path: dotEnvLocalPath }).parsed || {};
    for (const k in envConfig) {
      process.env[k] = envConfig[k]; // .local overrides .env
    }
  }

  const envToParse = {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET:
      process.env.BETTER_AUTH_SECRET || (process.env.VITEST ? 'a'.repeat(32) : undefined),
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL,
    REDIS_URL: process.env.REDIS_URL,
    NODE_ENV: process.env.NODE_ENV,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET,
    CRON_SECRET:
      process.env.CRON_SECRET ||
      (process.env.NODE_ENV === 'production' && process.env.CI ? undefined : 'a'.repeat(32)),
    RESEND_API_KEY:
      process.env.RESEND_API_KEY ||
      (process.env.NODE_ENV === 'production' && process.env.CI
        ? undefined
        : 're_dummy_key_for_testing'),
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  };

  if (process.env.VITEST && !process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is missing during Vitest execution.');
  }

  try {
    return envSchema.parse(envToParse);
  } catch (error) {
    if (process.env.VITEST) {
      console.error('Environment validation failed during Vitest:', error);
    }
    throw error;
  }
}
