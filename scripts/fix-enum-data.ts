import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../src/lib/env-script';
import { sql } from 'drizzle-orm';

async function main() {
  const queryClient = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(queryClient);

  console.log('Fixing enum data in database...');

  // 1. Update plan_status in plans table
  console.log('Updating plans table...');
  await db.execute(sql`UPDATE plans SET status = 'executing' WHERE status = 'approved'`);
  await db.execute(sql`UPDATE plans SET status = 'completed' WHERE status = 'complete'`);

  // 2. Update spec_status in specifications table
  console.log('Updating specifications table...');
  await db.execute(sql`UPDATE specifications SET status = 'completed' WHERE status = 'complete'`);

  // 3. Update task_status in tasks table (just in case)
  // No changes needed for tasks as 'complete' was likely only in plans/specs

  console.log('Data fixed.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
