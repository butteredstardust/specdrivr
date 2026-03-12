import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';
import { env } from '../src/lib/env-script';
import { eq } from 'drizzle-orm';

const { agentSessions } = schema;
const queryClient = postgres(env.DATABASE_URL, { max: 1 });
const db = drizzle(queryClient, { schema });

async function main() {
  console.log('Updating session for test...');
  await db.update(agentSessions)
    .set({ status: 'completed', startedAt: new Date(), totalPromptTokens: 1000, totalCompletionTokens: 500, totalCostUsd: 0.05, tasksExecuted: 10 })
    .where(eq(agentSessions.id, 1));
  console.log('Session updated.');
  process.exit(0);
}

main().catch(console.error);
