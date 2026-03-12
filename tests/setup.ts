import { expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { config } from 'dotenv';
import path from 'path';

// Mock server-only to allow importing server-side modules in tests
vi.mock('server-only', () => ({}));

// Load environment variables for tests
config({ path: path.resolve(process.cwd(), '.env') });
config({ path: path.resolve(process.cwd(), '.env.local') });

expect.extend(matchers);
