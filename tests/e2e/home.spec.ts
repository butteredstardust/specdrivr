import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login');

    // Verify the page loads without error
    await expect(page).toHaveTitle(/Specdrivr/);

    // Verify core elements are present
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('homepage loads', async ({ page }) => {
    await page.goto('/');

    // Verify the page loads without error
    await expect(page).toHaveTitle(/Specdrivr/);

    // Verify the main heading exists
    await expect(page.getByText('Specdrivr Debug')).toBeVisible();
  });
});
