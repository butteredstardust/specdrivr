import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/db/schema.ts';

const queryClient = postgres("postgresql://specdrivr:specdrivr_password@localhost:5432/specdrivr");

async function check() {
  const result = await queryClient`SELECT username FROM users`;
  console.log(result.map(r => r.username));
  process.exit(0);
}
check();
