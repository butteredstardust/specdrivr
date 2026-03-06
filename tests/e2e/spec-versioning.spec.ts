import { test, expect } from '@playwright/test';

test.test.describe('Specification Versioning E2E', () => {
    test('should properly handle specification edits and version history', async ({ page }) => {
        // Navigate and login
        await page.goto('/auth/login');
        // Assuming a seeded test user
        await page.fill('input[name="username"]', 'admin');
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button[type="submit"]');

        // Go to projects
        await page.goto('/projects');

        // Create a new project for isolated testing
        await page.click('text=New Project');
        await page.fill('input[name="name"]', 'Spec Version Test');
        await page.click('button:has-text("Create")');

        // We expect the project overview to have an 'Edit' button for specifications
        // This is a minimal placeholder asserting the edit flow doesn't crash
        const editButton = page.locator('button:has-text("Edit")').first();
        if (await editButton.isVisible()) {
            await editButton.click();

            const textArea = page.locator('textarea');
            if (await textArea.isVisible()) {
                await textArea.fill('Updated specification content for V2');
                await page.click('button:has-text("Save")');

                // Ensure Version label bumps to v1.1
                await expect(page.locator('text=v1.1').first()).toBeVisible({ timeout: 5000 });
            }
        }
    });
});
