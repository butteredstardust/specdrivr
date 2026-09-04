import { expect, vi, beforeAll } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { config } from 'dotenv';
import path from 'path';
import postgres from 'postgres';

// Mock server-only to allow importing server-side modules in tests
vi.mock('server-only', () => ({}));

// Repository methods intentionally dispatch webhooks outside their database
// transactions. Unit/integration tests exercise persistence invariants, not
// outbound delivery, so prevent those detached reads from leaking into the
// next test's database reset. Webhook behavior has a dedicated test boundary.
vi.mock('@/lib/webhooks', () => ({
  dispatchWebhookEvent: vi.fn().mockResolvedValue(undefined),
  webhookService: { dispatch: vi.fn().mockResolvedValue(undefined) },
}));

// Node 25+ ships a native localStorage that lacks the full Storage API
const createLocalStorageMock = () => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
};
vi.stubGlobal('localStorage', createLocalStorageMock());

// Load environment variables for tests
config({ path: path.resolve(process.cwd(), '.env') });
config({ path: path.resolve(process.cwd(), '.env.local') });

// --- Dynamic Worker Database Setup ---
const workerId = process.env.VITEST_POOL_ID || '1';
const dbName = `specdrivr_test_${workerId}`;
const baseDbUrl =
  process.env.DATABASE_URL || 'postgresql://specdrivr:specdrivr_password@localhost:5432/specdrivr';

const workerUrl = new URL(baseDbUrl);
workerUrl.pathname = `/${dbName}`;
process.env.DATABASE_URL = workerUrl.toString();

beforeAll(async () => {
  const adminUrl = new URL(baseDbUrl);
  adminUrl.pathname = '/postgres';
  const sql = postgres(adminUrl.toString(), { max: 1 });

  try {
    // Drop and recreate from template every time to ensure schema matches latest migration
    await sql.unsafe(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid()`
    );
    await sql.unsafe(`DROP DATABASE IF EXISTS "${dbName}"`);
    await sql.unsafe(`CREATE DATABASE "${dbName}" TEMPLATE specdrivr_test_template`);
  } catch (e) {
    process.stderr.write(`[test setup] Failed to create worker db ${dbName}: ${String(e)}\n`);
    // Re-throw so the worker fails loudly rather than silently continuing
    throw e;
  } finally {
    await sql.end();
  }
});
// -------------------------------------

expect.extend(matchers);
