import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Only load .env files when DATABASE_URL is not already in the environment.
// .env.local is committed to the repo for local dev; without this guard its
// override: true would clobber DATABASE_URL injected by CI / Docker / etc.
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: '.env' });
  dotenv.config({ path: '.env.local', override: true });
}

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
