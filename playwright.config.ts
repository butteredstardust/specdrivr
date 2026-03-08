import { defineConfig, devices } from '@playwright/test';

/**
 * Main Playwright Configuration
 *
 * This config works in conjunction with scripts/test-e2e-setup.ts
 * The setup script handles PostgreSQL detection and data seeding before tests run
 */

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
    baseURL: process.env.BASE_URL || 'http://localhost:3001',
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
  // Web server is started by scripts/test-e2e-setup.ts if needed
  webServer: process.env.PLAYWRIGHT_SKIP_WEB_SERVER ? undefined : {
    command: `PORT=${process.env.PORT || '3001'} npm run dev`,
    url: `http://localhost:${process.env.PORT || '3001'}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});