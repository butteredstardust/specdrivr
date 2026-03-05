/**
 * E2E tests for critical user workflows
 * Tests button clicks, navigation, and interactions to catch silent failures
 */

import { test, expect } from '@playwright/test';

test.describe('Critical Workflows - Silent Failure Detection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test.describe('Project Creation Workflow', () => {
    test('New Project button opens dialog and project creation works', async ({ page }) => {
      // Click New Project button
      await page.click('button:has-text("New Project")');

      // Verify dialog opened (don't just check for text - verify it's actually interactive)
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Verify form fields are present and interactive
      const projectNameInput = dialog.locator('input[name="name"]');
      await expect(projectNameInput).toBeVisible();
      await expect(projectNameInput).toBeEnabled();

      // Fill in the form
      await projectNameInput.fill('Test Silent Failure Project');
      await dialog.locator('textarea[name="mission"]').fill('Test mission');
      await dialog.locator('textarea[name="description"]').fill('Test description');
      await dialog.locator('textarea[name="techStack"]').fill('Test tech stack');
      await dialog.locator('textarea[name="instructions"]').fill('Test instructions');

      // Click Create button
      await dialog.click('button:has-text("Create")');

      // Verify dialog closes and project appears in sidebar (actual action happened)
      await expect(dialog).not.toBeVisible();

      // Verify project was created by checking navigation
      // Wait for navigation to project detail page
      await page.waitForURL(/\/projects\/\d+$/);

      // Verify project name appears on the page
      await expect(page.locator('text=Test Silent Failure Project')).toBeVisible();
    });

    test('Cancel button in New Project dialog actually closes dialog', async ({ page }) => {
      await page.click('button:has-text("New Project")');

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Click Cancel
      await dialog.click('button:has-text("Cancel")');

      // Verify dialog actually closed, not just hidden
      await expect(dialog).not.toBeVisible();

      // Verify we're still on the same page (no navigation)
      await expect(page).toHaveURL('http://localhost:3000/');
    });
  });

  test.describe('Task Management - Kanban Board', () => {
    test('Clicking task card opens detail modal', async ({ page }) => {
      // Navigate to a project with tasks
      await page.click('a[href*="/projects/1"]');
      await page.waitForURL(/\/projects\/1$/);

      // Click on a task card
      const taskCard = page.locator('[data-testid="task-card"]').first();
      await expect(taskCard).toBeVisible();

      const taskDescription = await taskCard.locator('.ios-body').textContent();
      await taskCard.click();

      // Verify modal opened with task details
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      await expect(modal.locator(`text=${taskDescription}`)).toBeVisible();
    });

    test('Task status change buttons actually change status', async ({ page }) => {
      await page.goto('http://localhost:3000/projects/1');

      // Open a task modal
      const taskCard = page.locator('[data-testid="task-card"]').first();
      await taskCard.click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Find the current status
      const currentStatusElement = modal.locator('[data-testid^="task-status-"]').first();
      const currentStatus = await currentStatusElement.getAttribute('data-testid');

      // Click a different status button
      const newStatusButton = modal.locator('[data-testid="task-status-done"]');
      await expect(newStatusButton).toBeEnabled();
      await newStatusButton.click();

      // Verify status actually changed (don't just check button clicked)
      // The button should now be highlighted in the task list when we close and reopen
      await modal.click('button:has-text("Close")');
      await expect(modal).not.toBeVisible();

      // Reopen the same task
      await taskCard.click();
      await expect(modal).toBeVisible();

      // Verify the new status is showing
      const updatedStatus = modal.locator('[data-testid="task-status-done"]');
      await expect(updatedStatus).toHaveClass(/bg-green-50/);
    });

    test('Drag and drop actually moves task between columns', async ({ page }) => {
      await page.goto('http://localhost:3000');

      // Get initial task counts
      const todoColumn = page.locator('[data-testid="column-todo"]');
      const todoCountBefore = await todoColumn.locator('[data-testid="task-card"]').count();

      const inProgressColumn = page.locator('[data-testid="column-in_progress"]');
      const inProgressCountBefore = await inProgressColumn.locator('[data-testid="task-card"]').count();

      // Drag first task from todo to in_progress
      const taskCard = todoColumn.locator('[data-testid="task-card"]').first();
      const taskTitle = await taskCard.locator('.ios-body').textContent();

      // Perform drag and drop
      await taskCard.hover();
      await page.mouse.down();
      await inProgressColumn.hover();
      await page.mouse.up();

      // Wait for any animations to complete
      await page.waitForTimeout(500);

      // Verify task was actually moved (counts changed)
      const todoCountAfter = await todoColumn.locator('[data-testid="task-card"]').count();
      const inProgressCountAfter = await inProgressColumn.locator('[data-testid="task-card"]').count();

      expect(todoCountAfter).toBe(todoCountBefore - 1);
      expect(inProgressCountAfter).toBe(inProgressCountBefore + 1);

      // Verify the moved task is in the new column by checking for its title
      await expect(inProgressColumn.locator(`text=${taskTitle}`)).toBeVisible();
    });
  });

  test.describe('Project Sidebar Navigation', () => {
    test('Clicking project in sidebar navigates to project page', async ({ page }) => {
      // Get first project link
      const projectLink = page.locator('a[href*="/projects/"]').first();
      const projectName = await projectLink.textContent();
      const projectHref = await projectLink.getAttribute('href');

      // Click the project link
      await projectLink.click();

      // Verify navigation actually happened
      await page.waitForURL(projectHref!);

      // Verify we're on the project page
      await expect(page.locator('h1')).toContainText(projectName!.trim());
    });

    test('Home button in sidebar actually navigates to home', async ({ page }) => {
      // First navigate to a project page
      await page.click('a[href*="/projects/1"]');
      await page.waitForURL(/\/projects\/1$/);

      // Now click Home
      await page.click('a[href="/"]');

      // Verify navigation back to home
      await page.waitForURL('http://localhost:3000/');

      // Verify we're on home page (has project list)
      await expect(page.locator('text=Projects')).toBeVisible();
    });
  });

  test.describe('Add Log Dialog', () => {
    test('Add Log button opens dialog and submitting creates log', async ({ page }) => {
      await page.goto('http://localhost:3000/projects/1');

      // Click Add Log button
      await page.click('button:has-text("Add Log")');

      // Verify dialog opened
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible();

      // Fill form
      await dialog.locator('select').selectOption({ index: 1 }); // Select first task
      await dialog.locator('textarea').fill('Test log message');

      // Click Add Log
      await dialog.click('button:has-text("Add Log")');

      // Verify dialog closed
      await expect(dialog).not.toBeVisible();

      // Verify log was actually created by checking Agent Logs panel
      await expect(page.locator('text=Test log message')).toBeVisible();
    });
  });

  test.describe('Settings Navigation', () => {
    test('Settings button in sidebar navigates to settings page', async ({ page }) => {
      // Click Settings
      await page.click('a[href="/settings"]');

      // Verify navigation
      await page.waitForURL(/\/settings$/);

      // Verify we're on settings page (check for expected content)
      await expect(page.locator('text=Settings')).toBeVisible();
    });
  });

  test.describe('Error Handling - Button Clicks With Network Issues', () => {
    test('Submitting form shows error when API fails', async ({ page }) => {
      await page.goto('http://localhost:3000/projects/1');

      // Mock API failure for status update
      await page.route('**/api/agent/tasks/*', route => {
        route.abort();
      });

      // Open task modal
      const taskCard = page.locator('[data-testid="task-card"]').first();
      await taskCard.click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Try to change status
      const newStatusButton = modal.locator('[data-testid="task-status-done"]');
      await newStatusButton.click();

      // Verify error is shown to user (not silent failure)
      await expect(page.locator('text=Failed')).toBeVisible();
    });
  });
});
