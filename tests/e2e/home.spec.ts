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

test.describe('Authenticated application shell', () => {
  test('renders one authoritative Mission Control heading', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('alex@specdrivr.dev');
    await page.getByLabel('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/$/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { level: 1, name: 'Mission Control' })).toHaveCount(1);
  });
});
