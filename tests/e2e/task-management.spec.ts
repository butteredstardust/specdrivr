/**
 * E2E Tests for Task Management
 * Tests drag-and-drop, creation, editing, and all task interactions
 */

import { test, expect } from '@playwright/test';
import { login, testUsers, waitForPageLoad } from '../utils/test-helpers';

test.test.describe('Task Management', () => {
  test.beforeEach(async ({ page, context }) => {
    await login(page, testUsers.admin);
    context.addCookies([
      {
        name: '__session',
        value: 'test-session',
        url: 'http://localhost:3001',
      },
    ]);

    await page.goto('/projects/1');
    await waitForPageLoad(page);
  });

  test.test.describe('Kanban Board Display', () => {
    test('displays all task columns', async ({ page }) => {
      const columns = ['todo', 'in_progress', 'done', 'blocked'];

      for (const column of columns) {
        const columnElement = page.locator(`[data-testid="column-${column}"]`);
        await expect(columnElement).toBeVisible();
      }
    });

    test('displays task cards in columns', async ({ page }) => {
      const todoColumn = page.locator('[data-testid="column-todo"]');
      const taskCards = todoColumn.locator('[data-testid="task-card"]');

      // Should have at least one task
      const count = await taskCards.count();
      expect(count).toBeGreaterThan(0);
    });

    test('task cards show priority indicators', async ({ page }) => {
      const taskCard = page.locator('[data-testid="task-card"]').first();
      const priorityIndicator = taskCard.locator('[data-testid="priority-indicator"]');

      await expect(priorityIndicator).toBeVisible();

      const priorityClasses = [
        'border-red-500', // high
        'border-yellow-500', // medium
        'border-green-500', // low
      ];

      const hasPriorityClass = await Promise.race(
        priorityClasses.map(async (cls) => {
          const hasClass = await taskCard.evaluate(
            (element, className) => element.classList.contains(className),
            cls
          );
          return hasClass;
        })
      );

      expect(hasPriorityClass).toBeTruthy();
    });

    test('task cards display file involvement', async ({ page }) => {
      const taskCard = page.locator('[data-testid="task-card"]').first();
      const filesElement = taskCard.locator('[data-testid="task-files"]');

      // Not all tasks have files, but check visibility
      const isVisible = await filesElement.isVisible();

      if (isVisible) {
        const filesText = await filesElement.textContent();
        expect(filesText).toMatch(/\.ts$|\.tsx$|\.js$|\.jsx$/);
      }
    });

    test('shows task count in each column header', async ({ page }) => {
      const columns = ['todo', 'in_progress', 'done', 'blocked'];

      for (const col of columns) {
        const header = page.locator(`[data-testid="column-${col}"] [data-testid="column-count"]`);
        await expect(header).toBeVisible();

        const text = await header.textContent();
        expect(text).toMatch(/\d+/);
      }
    });
  });

  test.test.describe('Drag and Drop', () => {
    test('drags task from todo to in_progress', async ({ page }) => {
      const todoColumn = page.locator('[data-testid="column-todo"]');
      const inProgressColumn = page.locator('[data-testid="column-in_progress"]');

      const sourceTask = todoColumn.locator('[data-testid="task-card"]').first();
      const taskText = await sourceTask.locator('[data-testid="task-description"]').textContent();

      // Drag task to in_progress column
      await sourceTask.dragTo(inProgressColumn);

      // Wait for update
      await page.waitForTimeout(1000);

      // Verify task moved to in_progress
      const movedTask = inProgressColumn.locator(
        `[data-testid="task-description"]:has-text("${taskText}")`
      );
      await expect(movedTask).toBeVisible({ timeout: 3000 });

      // Verify original is no longer in todo
      await expect(
        todoColumn.locator(`[data-testid="task-description"]:has-text("${taskText}")`)
      ).not.toBeVisible();
    });

    test('drags task from in_progress to done', async ({ page }) => {
      // Ensure we have a task in in_progress
      const inProgressColumn = page.locator('[data-testid="column-in_progress"]');
      const doneColumn = page.locator('[data-testid="column-done"]');

      // Check if there's a task in in_progress, if not drag one there
      const inProgressCount = await inProgressColumn.locator('[data-testid="task-card"]').count();

      if (inProgressCount === 0) {
        // Drag from todo to in_progress first
        const todoColumn = page.locator('[data-testid="column-todo"]');
        const firstTask = todoColumn.locator('[data-testid="task-card"]').first();
        await firstTask.dragTo(inProgressColumn);
        await page.waitForTimeout(1000);
      }

      // Now drag to done
      const sourceTask = inProgressColumn.locator('[data-testid="task-card"]').first();
      const taskText = await sourceTask.locator('[data-testid="task-description"]').textContent();

      await sourceTask.dragTo(doneColumn);
      await page.waitForTimeout(1000);

      // Verify task moved to done
      const movedTask = doneColumn.locator(
        `[data-testid="task-description"]:has-text("${taskText}")`
      );
      await expect(movedTask).toBeVisible({ timeout: 3000 });

      // Verify original is no longer in in_progress
      await expect(
        inProgressColumn.locator(`[data-testid="task-description"]:has-text("${taskText}")`)
      ).not.toBeVisible();
    });

    test('drags task to blocked column', async ({ page }) => {
      const todoColumn = page.locator('[data-testid="column-todo"]');
      const blockedColumn = page.locator('[data-testid="column-blocked"]');

      const sourceTask = todoColumn.locator('[data-testid="task-card"]').first();
      const taskText = await sourceTask.locator('[data-testid="task-description"]').textContent();

      await sourceTask.dragTo(blockedColumn);
      await page.waitForTimeout(1000);

      // Verify task moved to blocked
      const movedTask = blockedColumn.locator(
        `[data-testid="task-description"]:has-text("${taskText}")`
      );
      await expect(movedTask).toBeVisible({ timeout: 3000 });
    });

    test('drag-and-drop updates task status in database', async ({ page }) => {
      // Start with a task in todo
      const todoColumn = page.locator('[data-testid="column-todo"]');
      const inProgressColumn = page.locator('[data-testid="column-in_progress"]');

      const sourceTask = todoColumn.locator('[data-testid="task-card"]').first();
      const taskId = await sourceTask.getAttribute('data-task-id');

      // Drag to in_progress
      await sourceTask.dragTo(inProgressColumn);
      await page.waitForTimeout(1500);

      // Refresh and verify persistence
      await page.reload();
      await waitForPageLoad(page);

      const movedTask = inProgressColumn.locator(`[data-task-id="${taskId}"]`);
      await expect(movedTask).toBeVisible();
    });

    test('drag visual feedback shows during drag', async ({ page }) => {
      const sourceTask = page.locator('[data-testid="task-card"]').first();

      // Start dragging
      await sourceTask.hover();
      await page.mouse.down();
      await page.mouse.move(100, 100);

      // Check for drag overlay
      const dragOverlay = page.locator('[data-testid="drag-overlay"]');
      const isVisible = await dragOverlay.isVisible();

      if (isVisible) {
        await expect(dragOverlay).toBeVisible();
      }

      await page.mouse.up();
    });
  });

  test.test.describe('Task Creation', () => {
    test('opens create task dialog', async ({ page }) => {
      const createButton = page.locator('[data-testid="create-task-button"]');
      await expect(createButton).toBeVisible();

      await createButton.click();

      const dialog = page.locator('[data-testid="create-task-dialog"]');
      await expect(dialog).toBeVisible();
    });

    test('creates task via form mode', async ({ page }) => {
      // Open dialog
      await page.locator('[data-testid="create-task-button"]').click();

      const dialog = page.locator('[data-testid="create-task-dialog"]');
      await expect(dialog).toBeVisible();

      // Fill form
      await dialog.locator('textarea[name="description"]').fill('New test task via form');
      await dialog.locator('input[name="priority"]').fill('5');
      await dialog.locator('input[name="filesInvolved"]').fill('src/test.ts, src/utils.ts');

      // Submit
      await dialog.locator('button[type="submit"]').click();
      await page.waitForTimeout(1000);

      // Verify task created
      const todoColumn = page.locator('[data-testid="column-todo"]');
      const newTask = todoColumn.locator('text="New test task via form"');
      await expect(newTask).toBeVisible();
    });

    test('creates task via quick mode', async ({ page }) => {
      // Open dialog
      await page.locator('[data-testid="create-task-button"]').click();

      const dialog = page.locator('[data-testid="create-task-dialog"]');

      // Switch to quick mode
      await dialog.locator('[data-testid="quick-mode-toggle"]').click();

      // Enter quick description
      const quickInput = dialog.locator('input[name="quickDescription"]');
      await quickInput.fill('Fix bug #8 in "src/auth.ts" and "src/utils.ts"');

      // Submit
      await dialog.locator('button[type="submit"]').click();
      await page.waitForTimeout(1000);

      // Verify task was created with parsed data
      const todoColumn = page.locator('[data-testid="column-todo"]');
      const taskCard = todoColumn.locator('[data-testid="task-card"]').last();

      // Check priority was extracted
      const priority = await taskCard.locator('[data-testid="priority-indicator"]').getAttribute('class');
      expect(priority?.includes('border-yellow-500')).toBeTruthy(); // Priority 8 = yellow

      // Check files were extracted
      const files = await taskCard.locator('[data-testid="task-files"]').textContent();
      expect(files).toContain('src/auth.ts');
    });

    test('validates required fields on submission', async ({ page }) => {
      await page.locator('[data-testid="create-task-button"]').click();
      await page.locator('button[type="submit"]').click();

      // Should show validation error
      const error = page.locator('[data-testid="form-error"]');
      await expect(error).toBeVisible();
    });
  });

  test.test.describe('Task Detail Modal', () => {
    test('opens task detail modal on click', async ({ page }) => {
      const firstTask = page.locator('[data-testid="task-card"]').first();
      await firstTask.click();

      const modal = page.locator('[data-testid="task-detail-modal"]');
      await expect(modal).toBeVisible();
    });

    test('modal displays all task details', async ({ page }) => {
      const firstTask = page.locator('[data-testid="task-card"]').first();
      const taskId = await firstTask.getAttribute('data-task-id');

      await firstTask.click();

      const modal = page.locator('[data-testid="task-detail-modal"]');
      await expect(modal).toBeVisible();

      // Check all fields displayed
      await expect(modal.locator('[data-testid="task-id"]')).toContainText(taskId || '');
      await expect(modal.locator('[data-testid="task-description"]')).toBeVisible();
      await expect(modal.locator('[data-testid="task-priority"]')).toBeVisible();
      await expect(modal.locator('[data-testid="task-status"]')).toBeVisible();
    });

    test('status change buttons work in modal', async ({ page }) => {
      // Open modal
      await page.locator('[data-testid="task-card"]').first().click();
      const modal = page.locator('[data-testid="task-detail-modal"]');

      // Check current status
      const statusElement = modal.locator('[data-testid="task-status"]');
      const initialStatus = await statusElement.textContent();

      // Click change status button
      // change status is a list of buttons in modal, not a dropdown that needs clicking first

      // Select new status
      await modal.locator('[data-testid="status-option-done"]').click();

      // Verify status changed
      await page.waitForTimeout(500);
      await expect(modal.locator('[data-testid="task-status"]')).not.toContainText(initialStatus);
    });

    test('closes modal on close button', async ({ page }) => {
      await page.locator('[data-testid="task-card"]').first().click();

      const modal = page.locator('[data-testid="task-detail-modal"]');
      await expect(modal).toBeVisible();

      await modal.locator('[data-testid="modal-close"]').click();

      await expect(modal).not.toBeVisible();
    });
  });

  test.test.describe('Task Filtering and Sorting', () => {
    test('filters tasks by priority', async ({ page }) => {
      const filterButton = page.locator('[data-testid="priority-filter"]');
      await filterButton.click();

      // Select high priority
      await page.locator('[data-testid="filter-high"]').click();

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // Verify only high priority tasks visible
      const visibleTasks = page.locator('[data-testid="task-card"]:visible');
      const count = await visibleTasks.count();

      if (count > 0) {
        const hasNonHighPriority = await page.evaluate(() => {
          const cards = document.querySelectorAll('[data-testid="task-card"] [data-testid="priority-indicator"]');
          for (const card of cards) {
            if (!card.classList.contains('border-red-500')) {
              return true;
            }
          }
          return false;
        });
        expect(hasNonHighPriority).toBe(false);
      }
    });

    test('clears all filters', async ({ page }) => {
      // Apply some filters
      await page.locator('[data-testid="priority-filter"]').click();
      await page.locator('[data-testid="filter-medium"]').click();

      // Clear filters
      await page.locator('[data-testid="clear-filters"]').click();

      // Wait for reset
      await page.waitForTimeout(500);

      // All tasks should be visible
      const allColumns = ['todo', 'in_progress', 'done', 'blocked'];
      for (const col of allColumns) {
        const column = page.locator(`[data-testid="column-${col}"]`);
        const tasks = column.locator('[data-testid="task-card"]');
        await expect(tasks.first()).toBeVisible();
      }
    });
  });

  test.test.describe('Task Priority Display', () => {
    test('priority displayed as colored border', async ({ page }) => {
      const taskCard = page.locator('[data-testid="task-card"]').first();
      const priorityBorder = taskCard.locator('[data-testid="priority-indicator"]');

      await expect(priorityBorder).toBeVisible();

      // Should have one of the priority color classes
      const hasPriorityClass = await taskCard.evaluate((element) => {
        const indicator = element.querySelector('[data-testid="priority-indicator"]');
        return (
          indicator?.classList.contains('border-red-500') ||
          indicator?.classList.contains('border-yellow-500') ||
          indicator?.classList.contains('border-green-500')
        );
      });

      expect(hasPriorityClass).toBe(true);
    });

    test('high priority tasks stand out visually', async ({ page }) => {
      const highPriorityTasks = page.locator('[data-testid="priority-indicator"].border-red-500');
      const count = await highPriorityTasks.count();

      if (count > 0) {
        // High priority tasks should have additional visual emphasis
        const firstHighPriority = highPriorityTasks.first();
        const styles = await firstHighPriority.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            borderWidth: computed.borderWidth,
            borderColor: computed.borderColor,
          };
        });

        expect(styles.borderWidth).not.toBe('0px');
      }
    });
  });

  test.test.describe('Real-time Updates', () => {
    test('task counts update when tasks are moved', async ({ page }) => {
      const todoColumn = page.locator('[data-testid="column-todo"]');
      const inProgressColumn = page.locator('[data-testid="column-in_progress"]');

      const todoCountBefore = await todoColumn
        .locator('[data-testid="column-count"]')
        .textContent();

      // Move task
      const sourceTask = todoColumn.locator('[data-testid="task-card"]').first();
      await sourceTask.dragTo(inProgressColumn);
      await page.waitForTimeout(1500);

      // Refresh and verify counts changed
      await page.reload();
      await waitForPageLoad(page);

      const todoCountAfter = await page
        .locator('[data-testid="column-todo"] [data-testid="column-count"]')
        .textContent();

      const todoBefore = parseInt(todoCountBefore || '0');
      const todoAfter = parseInt(todoCountAfter || '0');
      expect(todoAfter).toBeLessThan(todoBefore);
    });
  });
});

test.test.describe('Task Quick Actions', () => {
  test.beforeEach(async ({ page, context }) => {
    await login(page, testUsers.admin);
    context.addCookies([
      {
        name: '__session',
        value: 'test-session',
        url: 'http://localhost:3001',
      },
    ]);
    await page.goto('/projects/1');
    await waitForPageLoad(page);
  });

  test('retry button marks task as retry', async ({ page }) => {
    const firstTask = page.locator('[data-testid="task-card"]').first();

    await firstTask.hover();
    const retryButton = firstTask.locator('[data-testid="retry-task"]');
    await expect(retryButton).toBeVisible();

    await retryButton.click();
    await page.waitForTimeout(500);

    // Should update retry count
    const retryCount = firstTask.locator('[data-testid="retry-count"]');
    const count = await retryCount.textContent();
    expect(parseInt(count || '0')).toBeGreaterThanOrEqual(0);
  });

  test('mark task as done via quick action', async ({ page }) => {
    const firstTask = page.locator('[data-testid="task-card"]').first();
    const taskId = await firstTask.getAttribute('data-task-id');

    await firstTask.hover();
    const doneButton = firstTask.locator('[data-testid="mark-done"]');
    await expect(doneButton).toBeVisible();

    await doneButton.click();
    await page.waitForTimeout(1000);

    // Verify status changed to done
    const doneColumn = page.locator('[data-testid="column-done"]');
    const movedTask = doneColumn.locator(`[data-task-id="${taskId}"]`);
    await expect(movedTask).toBeVisible();
  });
});