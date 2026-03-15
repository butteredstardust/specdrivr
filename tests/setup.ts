import { expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { config } from 'dotenv';
import path from 'path';

// Mock server-only to allow importing server-side modules in tests
vi.mock('server-only', () => ({}));

// Node 25+ ships a native localStorage that lacks the full Storage API
// (e.g., .clear() is missing). Replace it with a proper in-memory mock
// so React component tests can use localStorage as expected in jsdom.
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
// Use override: false (default) to ensure shell/CI env variables take precedence
config({ path: path.resolve(process.cwd(), '.env') });
config({ path: path.resolve(process.cwd(), '.env.local') });

expect.extend(matchers);
