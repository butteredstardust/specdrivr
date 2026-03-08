#!/usr/bin/env node

/**
 * E2E Test Setup and Runner
 *
 * This script handles all test setup intelligently:
 * 1. Detects if PostgreSQL is running (docker or local)
 * 2. Seeds test data if database is available
 * 3. Sets up appropriate environment variables
 * 4. Runs tests with correct configuration
 *
 * Usage:
 *   npm run test:e2e:setup    - Full setup + run tests
 *   npm run test:e2e:quick   - Just run tests (no setup)
 */

import { execSync } from 'child_process';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { existsSync } from 'fs';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://specdrivr:specdrivr_password@localhost:5432/specdrivr';
const TEST_PORT = process.env.PORT || '3001';

/**
 * Check if PostgreSQL is accessible
 */
async function checkDatabase(): Promise<boolean> {
  try {
    const pool = new Pool({ connectionString: DATABASE_URL });
    await pool.query('SELECT 1');
    await pool.end();
    return true;
  } catch (error) {
    console.log('PostgreSQL not available:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * Check if dev server is running
 */
function checkDevServer(): boolean {
  const ports = [3000, 3001];
  for (const port of ports) {
    try {
      execSync(`curl -s http://localhost:${port} > /dev/null 2>&1`, { timeout: 1000 });
      console.log(`✅ Found dev server running on port ${port}`);
      return true;
    } catch {
      // Not running on this port
    }
  }
  return false;
}

/**
 * Seed test data
 */
async function seedTestData(): Promise<void> {
  console.log('🌱 Seeding test data...');
  try {
    execSync('node ./tests/seed-test-data.mjs', { stdio: 'inherit' });
    console.log('✅ Test data seeded');
  } catch (error) {
    console.error('❌ Failed to seed test data');
    throw error;
  }
}

/**
 * Start dev server if not running
 */
function startDevServer(useMocks: boolean) {
  const isRunning = checkDevServer();
  if (isRunning) {
    console.log('✅ Using existing dev server');
    return;
  }

  console.log('🚀 Starting dev server...');
  const cmd = useMocks
    ? `PORT=${TEST_PORT} VITE_USE_MOCKS=true npm run dev > /tmp/nextjs-dev.log 2>&1 &`
    : `PORT=${TEST_PORT} npm run dev > /tmp/nextjs-dev.log 2>&1 &`;

  execSync(cmd);

  // Wait for server to start
  console.log('⏳ Waiting for dev server...');
  for (let i = 0; i < 30; i++) {
    if (checkDevServer()) {
      console.log('✅ Dev server started');
      return;
    }
    process.stdout.write('.');
    execSync('sleep 2');
  }

  throw new Error('❌ Dev server failed to start');
}

/**
 * Get playwright args
 */
function getPlaywrightArgs(): string[] {
  // Filter out the node script name
  const args = process.argv.slice(2);
  return args;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   Specdrivr E2E Test Setup & Runner              ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const args = getPlaywrightArgs();
  const setupMode = args.includes('--setup');
  const quickMode = args.includes('--quick');

  console.log('🔍 Step 1: Checking database connectivity...\n');
  const hasDatabase = await checkDatabase();

  if (hasDatabase) {
    console.log('✅ PostgreSQL is available');
    console.log('🎯 Pattern: Testing with real database & backend\n');

    if (!quickMode) {
      console.log('🔍 Step 2: Seeding test data...\n');
      await seedTestData();
    }

    startDevServer(false); // Start without mocks
  } else {
    console.log('⚠️  PostgreSQL not available');
    console.log('🎯 Pattern: Testing with mock APIs\n');

    process.env.VITE_USE_MOCKS = 'true';
    console.log('🔄 VITE_USE_MOCKS=true set automatically\n');

    if (!quickMode) {
      console.log('🔍 Step 2: Verifying mock data files...\n');
      if (!existsSync('./tests/mocks/data/seed-data.ts')) {
        console.error('❌ Mock data file not found at ./tests/mocks/data/seed-data.ts');
        console.error('   Please ensure mocks are properly configured');
        process.exit(1);
      }
      console.log('✅ Mock data files found\n');
    }

    startDevServer(true); // Start with mocks
  }

  console.log('\n🔍 Step 3: Running Playwright tests...\n');

  // Filter out our flags from playwright args
  const playwrightArgs = args.filter(arg => !['--setup', '--quick'].includes(arg));

  const env = {
    ...process.env,
    PORT: TEST_PORT,
    VITE_USE_MOCKS: process.env.VITE_USE_MOCKS || 'false',
  };

  // If dev server is already running, skip web server startup
  if (hasDatabase || checkDevServer()) {
    env.PLAYWRIGHT_SKIP_WEB_SERVER = '1';
  }

  try {
    const cmd = `npx playwright test ${playwrightArgs.join(' ')}`;
    console.log(`  Running: ${cmd}\n`);
    execSync(cmd, { stdio: 'inherit', env });
  } catch (error) {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  }

  console.log('\n✅ All tests passed!');
}

main().catch(error => {
  console.error('\n❌ Test run failed:', error);
  process.exit(1);
});
