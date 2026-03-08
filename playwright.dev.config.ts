import { defineConfig, devices } from '@playwright/test';
import { execSync } from 'child_process';

/**
 * Developer Playwright Configuration
 *
 * This config is for running tests against an already-running dev server
 * Use this when you have `npm run dev` or `npm run dev:seed` running
 */

// Check if dev server is running on 3000 or 3001
function detectRunningServer() {
  try {
    const ports = [3000, 3001];
    for (const port of ports) {
      try {
        execSync(`curl -s http://localhost:${port} > /dev/null`, { timeout: 1000 });
        console.log(`✅ Found running dev server on port ${port}`);
        return `http://localhost:${port}`;
      } catch {
        // Not running on this port, try next
      }
    }
  } catch (error) {
    console.log('⚠️  Could not detect running server');
  }

  return 'http://localhost:3001'; // Default fallback
}

const baseURL = detectRunningServer();

export default defineConfig({
  testDir: './tests',
  testMatch: 'tests/e2e/**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // NO webServer config - assume dev server is already running
});
