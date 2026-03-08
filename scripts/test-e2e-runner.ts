#!/usr/bin/env node

/**
 * E2E Test Runner
 *
 * This script intelligently runs e2e tests based on database availability:
 * - If PostgreSQL is available: seeds test data and runs tests normally
 * - If PostgreSQL is NOT available: uses mock APIs (VITE_USE_MOCKS=true)
 *
 * Usage: npm run test:e2e:dev [playwright-args]
 *   This runs tests against an existing dev server (avoids lock conflicts)
 */

import { execSync } from 'child_process';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://specdrivr:specdrivr_password@localhost:5432/specdrivr';
const TEST_PORT = process.env.PORT || '3001';

async function checkDatabase(): Promise<boolean> {
  try {
    const pool = new Pool({ connectionString: DATABASE_URL });
    await pool.query('SELECT 1');
    await pool.end();
    return true;
  } catch (error) {
    return false;
  }
}

async function seedTestData(): Promise<void> {
  try {
    execSync('node ./tests/seed-test-data.mjs', { stdio: 'inherit' });
    console.log('✅ Test data seeded');
  } catch (error) {
    console.error('❌ Failed to seed test data');
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);

  console.log('🔍 Checking database connectivity...');
  const hasDatabase = await checkDatabase();

  if (hasDatabase) {
    console.log('✅ PostgreSQL is available');
    console.log('🌱 Seeding test data...');
    await seedTestData();
    console.log('🎯 Running tests with real API backend...');
  } else {
    console.log('⚠️  PostgreSQL not available, using mock APIs');
    process.env.VITE_USE_MOCKS = 'true';
  }

  // Don't start a new dev server - assume one is running or will be started separately
  process.env.PW_IGNORE_WEBSERVER = 'true';

  try {
    execSync(`npx playwright test ${args.join(' ')}`, {
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: TEST_PORT,
        VITE_USE_MOCKS: process.env.VITE_USE_MOCKS || 'false'
      }
    });
  } catch (error) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Test run failed:', error);
  process.exit(1);
});
