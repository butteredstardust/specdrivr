import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';
import { env } from '../src/lib/env-script';
import { sql } from 'drizzle-orm';
import { logger } from '../src/lib/logger-cli';

const queryClient = postgres(env.DATABASE_URL, { max: 1 });
const db = drizzle(queryClient, { schema });

async function main() {
  logger.info('Starting database verification...');

  try {
    // 1. Check Connectivity
    await db.execute(sql`SELECT 1`);
    logger.info('✅ Database connectivity verified');

    // 2. Check Tables count
    const tablesResult = await db.execute(sql`
      SELECT count(*) FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public'
    `);
    const tableCount = Number(tablesResult[0].count);
    logger.info({ tableCount }, '✅ Public tables verified');

    // 3. Check for Orphaned Projects (no owner)
    const orphans = await db.execute(sql`
      SELECT p.id, p.name FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.created_by IS NOT NULL AND u.id IS NULL
    `);
    
    if (orphans.length > 0) {
      logger.warn({ orphans }, '⚠️ Found projects with invalid owner references');
    } else {
      logger.info('✅ No orphaned projects found');
    }

    // 4. Check for Specs without versions
    const specsWithoutVersions = await db.execute(sql`
      SELECT s.id, s.name FROM specifications s
      LEFT JOIN spec_versions v ON s.id = v.spec_id
      WHERE v.id IS NULL
    `);

    if (specsWithoutVersions.length > 0) {
      logger.warn({ count: specsWithoutVersions.length }, '⚠️ Found specifications without any versions');
    } else {
      logger.info('✅ All specifications have versions');
    }

    logger.info('Database verification complete');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, '❌ Database verification failed');
    process.exit(1);
  }
}

main();
