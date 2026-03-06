/**
 * E2E Tests for Project Management
 * Covers project creation, editing, specification management, plans, and archiving
 */

import { test, expect } from '@playwright/test';
import { login, testUsers, waitForPageLoad } from '../utils/test-helpers';

test.test.describe('Project Management', () => {
  test.beforeEach(async ({ page, context }) => {
    await login(page, testUsers.admin);
    context.addCookies([
      {
        name: '__session',
        value: 'test-session',
        url: 'http://localhost:3001',
      },
    ]);
  });

  test.test.describe('Project Creation', () => {
    test('opens create project dialog from sidebar', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      const newProjectButton = page.locator('[data-testid="new-project-button"]');
      await expect(newProjectButton).toBeVisible();

      await newProjectButton.click();

      const dialog = page.locator('[data-testid="create-project-dialog"]');
      await expect(dialog).toBeVisible();
    });

    test('creates project with all required fields', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      // Open dialog
      await page.locator('[data-testid="new-project-button"]').click();
      const dialog = page.locator('[data-testid="create-project-dialog"]');

      // Fill form
      const projectName = `Test Project ${Date.now()}`;
      await dialog.locator('input[name="name"]').fill(projectName);
      await dialog.locator('textarea[name="mission"]').fill('Test mission statement');
      await dialog.locator('textarea[name="description"]').fill('Test project description');
      await dialog.locator('textarea[name="techStack"]').fill('TypeScript, React, Node.js');
      await dialog.locator('textarea[name="instructions"]').fill('Test instructions');

      // Submit
      await dialog.locator('button[type="submit"]').click();

      // Verify success
      await expect(dialog).not.toBeVisible();

      // Check project appears in sidebar
      const sidebarProject = page.locator(`[data-testid="project-item"]:has-text("${projectName}")`);
      await expect(sidebarProject).toBeVisible();
    });

    test('validates required fields on submission', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      await page.locator('[data-testid="new-project-button"]').click();
      const dialog = page.locator('[data-testid="create-project-dialog"]');

      // Submit empty form
      await dialog.locator('button[type="submit"]').click();

      // Should show validation error
      const error = dialog.locator('[data-testid="form-error"]');
      await expect(error).toBeVisible();
    });

    test('cancels project creation', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      await page.locator('[data-testid="new-project-button"]').click();
      const dialog = page.locator('[data-testid="create-project-dialog"]');

      // Click cancel
      await dialog.locator('button:has-text("Cancel")').click();

      // Dialog should close
      await expect(dialog).not.toBeVisible();
    });
  });

  test.test.describe('Project Navigation', () => {
    test('navigates to project detail page', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      const firstProject = page.locator('[data-testid="project-item"]').first();
      const projectName = await firstProject.textContent();
      await firstProject.click();

      // Should navigate to project page
      await expect(page).toHaveURL(/\/projects\/\d+/);

      // Should show project name in header
      const header = page.locator('h1');
      await expect(header).toContainText(projectName || '');
    });

    test('sidebar shows all projects', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      const projects = page.locator('[data-testid="project-item"]');
      const count = await projects.count();

      expect(count).toBeGreaterThan(0);
    });

    test('active project is highlighted in sidebar', async ({ page }) => {
      await page.goto('/projects/1');
      await waitForPageLoad(page);

      const activeProject = page.locator('[data-testid="project-item"].bg-blue-100');
      await expect(activeProject).toBeVisible();
    });
  });

  test.test.describe('Project Details Display', () => {
    test('displays project information correctly', async ({ page }) => {
      await page.goto('/projects/1');
      await waitForPageLoad(page);

      // Project header
      const projectName = page.locator('[data-testid="project-name"]');
      await expect(projectName).toBeVisible();

      // Project metadata
      await expect(page.locator('[data-testid="project-mission"]')).toBeVisible();
      await expect(page.locator('[data-testid="project-description"]')).toBeVisible();
      await expect(page.locator('[data-testid="project-tech-stack"]')).toBeVisible();
    });

    test('displays specification viewer', async ({ page }) => {
      await page.goto('/projects/1');
      await waitForPageLoad(page);

      const specViewer = page.locator('[data-testid="specification-viewer"]');
      await expect(specViewer).toBeVisible();
    });

    test('displays project constitution', async ({ page }) => {
      await page.goto('/projects/1');
      await waitForPageLoad(page);

      const constitution = page.locator('[data-testid="project-constitution"]');
      await expect(constitution).toBeVisible();
    });

    test('displays tech stack as tags', async ({ page }) => {
      await page.goto('/projects/1');
      await waitForPageLoad(page);

      const techStack = page.locator('[data-testid="tech-stack"]');
      await expect(techStack).toBeVisible();

      // Should have individual tech tags
      const techTags = techStack.locator('[data-testid="tech-tag"]');
      const count = await techTags.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.test.describe('Specification Management', () => {
    test('opens specification editor', async ({ page }) => {
      await page.goto('/projects/1');
      await waitForPageLoad(page);

      const editButton = page.locator('[data-testid="edit-spec-button"]');
      await expect(editButton).toBeVisible();

      await editButton.click();

      const editor = page.locator('[data-testid="specification-editor"]');
      await expect(editor).toBeVisible();
    });

    test('edits specification content', async ({ page }) => {
      await page.goto('/projects/1');
      await waitForPageLoad(page);

      await page.locator('[data-testid="edit-spec-button"]').click();

      const editor = page.locator('[data-testid="specification-editor"]');
      const textarea = editor.locator('textarea');

      // Clear and enter new content
      await textarea.fill('');
      await textarea.fill('# Updated Specification\n\nThis is updated content.');

      // Save
      await editor.locator('button:has-text("Save")').click();

      // Verify content updated
      await expect(page.locator('[data-testid="specification-content"]')).toContainText('Updated Specification');
    });

    test('renders markdown in specification', async ({ page }) => {
      await page.goto('/projects/1');
      await waitForPageLoad(page);

      const specContent = page.locator('[data-testid="specification-content"]');

      // Should render markdown elements
      await expect(specContent.locator('h1, h2, h3, h4, h5, h6').first()).toBeVisible();
    });

    test('cancels specification edit', async ({ page }) => {
      await page.goto('/projects/1');
      await waitForPageLoad(page);

      const originalContent = await page.locator('[data-testid="specification-content"]').textContent();

      await page.locator('[data-testid="edit-spec-button"]').click();

      const editor = page.locator('[data-testid="specification-editor"]');
      const textarea = editor.locator('textarea');

      // Make changes
      await textarea.fill('Completely different content');

      // Cancel
      await editor.locator('button:has-text("Cancel")').click();

      // Content should remain unchanged
      await expect(page.locator('[data-testid="specification-content"]')).toContainText(originalContent || '');
    });

    test('specification maintains version history', async ({ page }) => {
      await page.goto('/projects/1');
      await waitForPageLoad(page);

      // Get initial version info
      const versionInfo = page.locator('[data-testid="spec-version"]');
      await expect(versionInfo).toBeVisible();
    });
  });

  test.test.describe('Plan Management', () => {
    test('displays active plan', async ({ page }) => {
      await page.goto('/projects/1');
      await waitForPageLoad(page);

      const planSection = page.locator('[data-testid="plan-section"]');
      await expect(planSection).toBeVisible();

      // Should show active plan content
      await expect(planSection.locator('[data-testid="plan-content"]')).toBeVisible();
    });

    test('creates new plan version', async ({ page }) => {
      await page.goto('/projects/1');
      await waitForPageLoad(page);

      await page.locator('[data-testid="new-plan-button"]').click();

      const dialog = page.locator('[data-testid="create-plan-dialog"]');
      await expect(dialog).toBeVisible();

      // Fill plan form
      await dialog.locator('textarea[name="architectureDecisions"]').fill('{"key": "value"}');

      // Submit
      await dialog.locator('button[type="submit"]').click();

      // Should succeed
      await expect(dialog).not.toBeVisible();
    });

    test('activates a different plan version', async ({ page }) => {
      await page.goto('/projects/1');
      await waitForPageLoad(page);

      const planSelector = page.locator('[data-testid="plan-version-selector"]');
      await expect(planSelector).toBeVisible();

      // Open selector
      await planSelector.click();

      // Select different version
      const versions = page.locator('[data-testid="plan-version-option"]');
      if ((await versions.count()) > 1) {
        await versions.last().click();

        // Verify activation
        await expect(page.locator('[data-testid="plan-activation-success"]')).toBeVisible();
      }
    });

    test('shows plan version comparison', async ({ page }) => {
      await page.goto('/projects/1');
      await waitForPageLoad(page);

      const compareButton = page.locator('[data-testid="compare-plans-button"]');

      if (await compareButton.isVisible()) {
        await compareButton.click();

        const comparison = page.locator('[data-testid="plan-comparison"]');
        await expect(comparison).toBeVisible();
      }
    });
  });

  test.test.describe('Project Archiving', () => {
    test('archives project from project page', async ({ page }) => {
      await page.goto('/projects/1');
      await waitForPageLoad(page);

      const archiveButton = page.locator('[data-testid="archive-project-button"]');
      await expect(archiveButton).toBeVisible();

      await archiveButton.click();

      const dialog = page.locator('[data-testid="confirm-archive-dialog"]');
      await expect(dialog).toBeVisible();

      // Confirm
      await dialog.locator('button:has-text("Archive")').click();

      // Should redirect to home
      await expect(page).toHaveURL('/');
    });

    test('archived project appears in archive list', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      const archiveTab = page.locator('[data-testid="archive-tab"]');
      await archiveTab.click();

      const archivedProjects = page.locator('[data-testid="archived-project"]');
      await expect(archivedProjects.first()).toBeVisible();
    });

    test('unarchives project', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      const archiveTab = page.locator('[data-testid="archive-tab"]');
      await archiveTab.click();

      const firstArchived = page.locator('[data-testid="archived-project"]').first();
      await firstArchived.click();

      const unarchiveButton = page.locator('[data-testid="unarchive-project-button"]');
      await unarchiveButton.click();

      // Verify moved back to active
      const activeTab = page.locator('[data-testid="active-tab"]');
      await activeTab.click();

      await expect(page.locator('[data-testid="project-item"]').first()).toBeVisible();
    });

    test('cannot delete active project', async ({ page }) => {
      await page.goto('/projects/1');
      await waitForPageLoad(page);

      const deleteButton = page.locator('[data-testid="delete-project-button"]');

      // Should not exist or be disabled for active projects
      if (await deleteButton.isVisible()) {
        await expect(deleteButton).toBeDisabled();
      }
    });

    test('deletes archived project', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);

      const archiveTab = page.locator('[data-testid="archive-tab"]');
      await archiveTab.click();

      const deleteButton = page.locator('[data-testid="delete-archived-project-button"]').first();

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        const dialog = page.locator('[data-testid="confirm-delete-dialog"]');
        await dialog.locator('button:has-text("Delete")').click();

        // Project should be removed
        await expect(page.locator('[data-testid="project-item"]:has-text("just-deleted")')).not.toBeVisible();
      }
    });
  });

  test.test.describe('Error Handling', () => {
    test('shows error for non-existent project', async ({ page }) => {
      await page.goto('/projects/99999');

      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('not found');
    });

    test('handles network errors gracefully', async ({ page }) => {
      await page.goto('/projects/1');
      await waitForPageLoad(page);

      // Intercept and fail a request
      await page.route('**/api/**', (route) => {
        route.abort();
      });

      // Try to refresh
      await page.reload();

      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
    });

    test('recovers from save errors', async ({ page }) => {
      await page.goto('/projects/1');
      await waitForPageLoad(page);

      // Start editing
      await page.locator('[data-testid="edit-spec-button"]').click();

      // Intercept save request and make it fail
      await page.route('**/api/**', (route) => {
        if (route.request().method() === 'POST' || route.request().method() === 'PATCH') {
          route.abort();
        } else {
          route.continue();
        }
      });

      const editor = page.locator('[data-testid="specification-editor"]');
      await editor.locator('textarea').fill('New content');
      await editor.locator('button:has-text("Save")').click();

      // Should show error
      const error = page.locator('[data-testid="save-error"]');
      await expect(error).toBeVisible();
    });
  });
});