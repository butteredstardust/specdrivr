import { test, expect } from '@playwright/test';

test.describe('Unauthenticated entry flow', () => {
  test('redirects the protected homepage to a usable login form', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login\?next=%2F$/);
    await expect(page).toHaveTitle(/Specdrivr/);
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeEnabled();
  });
});
