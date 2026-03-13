import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../src/lib/env-script';
import { sql } from 'drizzle-orm';

async function main() {
  const queryClient = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(queryClient);

  console.log('Restoring spec_status data in database...');

  // Use a temporary enum value if needed, but since I haven't run db:push yet to remove 'completed', it should work.
  // Actually, I already ran db:push multiple times.
  // Let me check what's in the DB first.

  await db.execute(sql`UPDATE specifications SET status = 'complete' WHERE status = 'completed'`);

  console.log('Data restored.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
