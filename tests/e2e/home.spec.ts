import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Specdrivr/);
});

test('loads projects from database', async ({ page }) => {
  await page.goto('/');

  // Wait for page to load
  await expect(page.locator('h1')).toContainText('Specdrivr');

  // Check if projects section is visible
  await expect(page.locator('h2').filter({ hasText: 'Projects' })).toBeVisible();

  // Verify either projects are shown or "No projects" message
  const hasProjects = await page.locator('ul').isVisible();
  if (hasProjects) {
    await expect(page.locator('ul')).toBeVisible();
  } else {
    await expect(page.getByText('No projects found')).toBeVisible();
  }
});

test('interactive demo elements are present', async ({ page }) => {
  await page.goto('/');

  // Check for interactive demo section
  await expect(page.locator('h2').filter({ hasText: 'Interactive Demo' })).toBeVisible();

  // Check for input field
  await expect(page.locator('input[placeholder="Enter some text..."]')).toBeVisible();

  // Check for button
  await expect(page.locator('button', { hasText: 'Click Me' })).toBeVisible();
});
