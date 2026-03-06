import { test as base, expect } from '@playwright/test';
import { mockProjects, mockSession, mockTasks, mockUsers, mockPlans, mockSpecifications } from './data/seed-data';

// Determine if we should use mock APIs
const USE_MOCKS = process.env.VITE_USE_MOCKS === 'true';

export const test = base.extend({
  page: async ({ page, context }, use) => {
    if (USE_MOCKS) {
      console.log('🧪 Running with MOCKED APIs (VITE_USE_MOCKS=true)');

      // Mock session endpoint
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSession)
        });
      });

      // Mock auto-login endpoint
      await page.route('**/api/auth/auto-login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      // Mock login endpoint
      await page.route('**/api/auth/login', async (route) => {
        const postData = route.request().postDataJSON();
        if (postData && postData.username === 'Admin' && postData.password === 'demo') {
          // Playwright's fulfill allows headers:
          // We set the specdrivr_session cookie to pass the middleware checks
          await context.addCookies([
            {
              name: 'specdrivr_session',
              value: 'mocked-session-token',
              domain: 'localhost',
              path: '/',
              expires: Date.now() / 1000 + 3600
            }
          ]);
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, redirectUrl: '/' })
          });
        } else {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ success: false, error: 'Invalid credentials' })
          });
        }
      });

      // Mock admin users endpoint
      await page.route('**/api/admin/users', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, users: Object.values(mockUsers) })
        });
      });

      // Mock projects endpoints
      await page.route('**/api/projects', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, projects: mockProjects })
        });
      });
    }

    await use(page);
  }
});

export { expect };
