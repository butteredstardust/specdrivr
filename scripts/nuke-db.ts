import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../src/lib/env-script';
import { sql } from 'drizzle-orm';

async function main() {
  const queryClient = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(queryClient);

  console.log('Nuking database schema to allow fresh migration...');

  // 1. Drop all tables in public schema
  await db.execute(sql`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `);
  console.log('Dropped all tables.');

  // 2. Drop all enums/types in public schema
  await db.execute(sql`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND typtype = 'e') LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
      END LOOP;
    END $$;
  `);
  console.log('Dropped all types.');

  console.log('Database nuked.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
