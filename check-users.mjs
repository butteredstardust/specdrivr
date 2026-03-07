import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/db/schema.ts';
import dotenv from 'dotenv';
dotenv.config();

const queryClient = postgres("postgresql://specdrivr:specdrivr_password@localhost:5432/specdrivr");
const db = drizzle(queryClient, { schema });

async function check() {
  const users = await db.select().from(schema.users);
  console.log(users.map(u => u.username));
  process.exit(0);
}
check();
