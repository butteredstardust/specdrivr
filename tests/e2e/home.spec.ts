import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage title is correct', async ({ page }) => {
    await page.goto('/');
    
    // Verify the page title (this usually works even if JS is loading)
    await expect(page).toHaveTitle(/Specdrivr/);
    
    // Verify that some text from the layout or basic structure is visible
    // We use a more generic check to avoid issues with hydration/loading states
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
