import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../src/lib/env-script';
import { sql } from 'drizzle-orm';

async function main() {
  const queryClient = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(queryClient);

  console.log('Nuking database schema to allow fresh migration...');

  // 1. Drop all tables
  const tablesResult = await db.execute(sql`
    SELECT tablename FROM pg_catalog.pg_tables 
    WHERE schemaname = 'public' AND tablename != 'drizzle_migrations'
  `);

  for (const row of tablesResult) {
    const tableName = row.tablename;
    console.log(`Dropping table: ${tableName}`);
    await db.execute(sql.raw(`DROP TABLE IF EXISTS "${tableName}" CASCADE`));
  }

  // 2. Drop all enums/types
  const typesResult = await db.execute(sql`
    SELECT typname FROM pg_type t 
    JOIN pg_namespace n ON n.oid = t.typnamespace 
    WHERE n.nspname = 'public' AND typtype = 'e'
  `);

  for (const row of typesResult) {
    const typeName = row.typname;
    console.log(`Dropping type: ${typeName}`);
    await db.execute(sql.raw(`DROP TYPE IF EXISTS "${typeName}" CASCADE`));
  }

  console.log('Database nuked.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
