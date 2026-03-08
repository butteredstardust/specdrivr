import { Page } from '@playwright/test';

/**
 * Test user credentials for end-to-end testing
 * These users are created by tests/seed-test-data.mjs
 */
export const testUsers = {
  admin: {
    username: 'test-admin',
    password: 'test123',
    role: 'admin'
  },
  user: {
    username: 'test-user',
    password: 'test123',
    role: 'developer'
  }
};

/**
 * Login helper function
 * Fills in the login form and submits it
 */
export async function login(page: Page, user: { username: string; password: string }) {
  await page.goto('/auth/login');
  await page.fill('#username', user.username);
  await page.fill('#password', user.password);
  await page.click('button[type="submit"]');
}

export async function logout(page: Page) {
  await page.goto('/api/auth/logout');
}

export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}
