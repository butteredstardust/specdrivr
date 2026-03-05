import { z } from 'zod';

/**
 * Environment validation schema
 * Validates all required environment variables at startup
 */

const envSchema = z.object({
  // Required: Core configuration
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection URL'),
  AGENT_TOKEN: z.string().min(1, 'AGENT_TOKEN is required for agent authentication'),

  // Required: Next.js
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET must be set for session security'),

  // Optional: Testing
  TEST_DATABASE_URL: z.string().url().optional(),

  // Optional: Future features
  REDIS_URL: z.string().url().optional(),

  // Derived (not in process.env)
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
}).transform((data) => ({
  ...data,
  isDevelopment: data.NODE_ENV === 'development',
  isProduction: data.NODE_ENV === 'production',
  isTest: data.NODE_ENV === 'test',
}));

/**
 * Parse and validate environment variables
 * Throws if validation fails
 */
export function parseEnv(): z.infer<typeof envSchema> {
  try {
    return envSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL,
      AGENT_TOKEN: process.env.AGENT_TOKEN,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      TEST_DATABASE_URL: process.env.TEST_DATABASE_URL,
      REDIS_URL: process.env.REDIS_URL,
      NODE_ENV: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((issue: z.ZodIssue) => {
        const path = issue.path.join('.');
        return `  ${path}: ${issue.message}`;
      }).join('\n');

      console.error('❌ Environment validation failed:\n' + errors);
      console.error('\nPlease check your .env.local file and ensure all required variables are set.');
    } else {
      console.error('❌ Unexpected error validating environment:', error);
    }

    // Exit in non-test environments
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }

    // Re-throw for test environments
    throw error;
  }
}

/**
 * Type-safe environment variables
 */
export const env = parseEnv();

/**
 * Type for environment variables
 */
export type Env = z.infer<typeof envSchema>;

// Re-export commonly used values for convenience
export const {
  DATABASE_URL,
  AGENT_TOKEN,
  NEXTAUTH_URL,
  NEXTAUTH_SECRET,
  TEST_DATABASE_URL,
  isDevelopment,
  isProduction,
  isTest,
} = env;
