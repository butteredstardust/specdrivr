import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// For migrations & querying
const queryClient = postgres(process.env.DATABASE_URL!, {
  max: 10,
});

export const db = drizzle(queryClient, { schema });

export * from './schema';
