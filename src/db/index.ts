import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '@/lib/env';

/**
 * Persist the database connection across Fast Refresh in development.
 * This prevents reaching the max connection limit of the database.
 */
const globalForDb = global as unknown as {
  queryClient: postgres.Sql | undefined;
};

const queryClient =
  globalForDb.queryClient ??
  postgres(env.DATABASE_URL, {
    max: 10,
    idle_timeout: 20, // Close idle connections after 20 seconds
    connect_timeout: 10,
  });

if (env.NODE_ENV !== 'production') {
  globalForDb.queryClient = queryClient;
}

export const db = drizzle(queryClient, { schema });

export * from './schema';
