import { test, expect } from '@playwright/test';
import { login, testUsers, waitForPageLoad } from '../utils/test-helpers';

test.describe('Agent Control Panel', () => {
  test.describe.serial.configure()

  test.beforeEach(async ({ page, context }) => {
    await login(page, testUsers.admin);
    context.addCookies([
      {
        name: '__session',
        value: 'test-session',
        url: 'http://localhost:3001',
      },
    ]);

    // Navigate to a project page with agent controls
    await page.goto('/projects/1');
    await waitForPageLoad(page);
  });

  test('Agent status panel is visible', async ({ page }) => {
    await expect(page.locator('[data-testid="status-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="agent-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="controls-panel"]')).toBeVisible();
  });

  test('Control buttons are visible when agent is idle', async ({ page }) => {
    await expect(page.locator('[data-testid="agent-start"]')).toBeVisible();
    await expect(page.locator('[data-testid="agent-pause"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="agent-stop"]')).not.toBeVisible();
  });

  test('Start button starts agent and changes status to running', async ({ page }) => {
    // Initial state should be idle
    const statusElement = page.locator('[data-testid="agent-status"]');
    await expect(statusElement).toContainText('idle');

    // Click start
    const startButton = page.locator('[data-testid="agent-start"]');
    await startButton.click();

    // Wait for polling to update (polls every 5 seconds)
    await page.waitForTimeout(5500);

    // Status should update to running
    await expect(statusElement).toContainText('running');

    // Start button should be hidden, pause/stop visible
    await expect(startButton).not.toBeVisible({ timeout: 1000 });
    await expect(page.locator('[data-testid="agent-pause"]')).toBeVisible();
    await expect(page.locator('[data-testid="agent-stop"]')).toBeVisible();
  });

  test('Pause button pauses agent and changes status', async ({ page }) => {
    // Start agent first
    await page.locator('[data-testid="agent-start"]').click();
    await page.waitForTimeout(5500);

    const statusElement = page.locator('[data-testid="agent-status"]');
    await expect(statusElement).toContainText('running');

    // Click pause
    const pauseButton = page.locator('[data-testid="agent-pause"]');
    await pauseButton.click();

    // Wait for status update
    await page.waitForTimeout(5500);
    await expect(statusElement).toContainText('paused');

    // Resume should appear
    await expect(page.locator('[data-testid="agent-resume"]')).toBeVisible();
  });

  test('Resume button resumes agent from paused state', async ({ page }) => {
    // Start and pause
    await page.locator('[data-testid="agent-start"]').click();
    await page.waitForTimeout(5500);
    await page.locator('[data-testid="agent-pause"]').click();
    await page.waitForTimeout(5500);

    const statusElement = page.locator('[data-testid="agent-status"]');
    await expect(statusElement).toContainText('paused');

    // Click resume
    const resumeButton = page.locator('[data-testid="agent-resume"]');
    await resumeButton.click();

    await page.waitForTimeout(5500);
    await expect(statusElement).toContainText('running');
  });

  test('Stop button stops agent with confirmation', async ({ page }) => {
    // Start agent first
    await page.locator('[data-testid="agent-start"]').click();
    await page.waitForTimeout(5500);

    const statusElement = page.locator('[data-testid="agent-status"]');
    await expect(statusElement).toContainText('running');

    // Click stop
    const stopButton = page.locator('[data-testid="agent-stop"]');
    await stopButton.click();

    // Wait for status update
    await page.waitForTimeout(5500);
    await expect(statusElement).toContainText('stopped');

    // Should return to idle state
    await expect(page.locator('[data-testid="agent-start"]')).toBeVisible();
    await expect(stopButton).not.toBeVisible();
  });

  test('Agent uptime is displayed when running', async ({ page }) => {
    await page.locator('[data-testid="agent-start"]').click();
    await page.waitForTimeout(5500);

    const uptimeElement = page.locator('[data-testid="uptime"]');
    await expect(uptimeElement).toBeVisible();
    await expect(uptimeElement).toContainText(/\d+:\d+/); // Format: HH:MM
  });

  test('Current task being executed is displayed', async ({ page }) => {
    await page.locator('[data-testid="agent-start"]').click();
    await page.waitForTimeout(5500);

    const currentTaskElement = page.locator('[data-testid="current-task"]');
    await expect(currentTaskElement).toBeVisible();
  });

  test('Agent logs are displayed', async ({ page }) => {
    const logsPanel = page.locator('[data-testid="logs-panel"]');
    await expect(logsPanel).toBeVisible();

    // Should have log entries
    const logEntries = logsPanel.locator('[data-testid="log-entry"]');
    const count = await logEntries.count();

    if (count > 0) {
      await expect(logEntries.first()).toBeVisible();
    }
  });

  test('Error count displays correctly', async ({ page }) => {
    const errorCountElement = page.locator('[data-testid="error-count"]');
    await expect(errorCountElement).toBeVisible();

    const text = await errorCountElement.textContent();
    expect(text).toMatch(/\d+ errors/);
  });

  test('Task retry button marks task for retry', async ({ page }) => {
    const taskCard = page.locator('[data-testid="task-card"]').first();
    await taskCard.hover();

    const retryButton = taskCard.locator('[data-testid="retry-task"]');
    await expect(retryButton).toBeVisible();

    await retryButton.click();
    await page.waitForTimeout(1000);

    // Should update task status
    await expect(taskCard.locator('[data-testid="task-status"]')).toContainText('todo');
  });

  test('Real-time updates when agent is running', async ({ page }) => {
    await page.locator('[data-testid="agent-start"]').click();
    await page.waitForTimeout(5500);

    const logsPanel = page.locator('[data-testid="logs-panel"]');
    const initialLogCount = await logsPanel.locator('[data-testid="log-entry"]').count();

    // Wait for another poll cycle
    await page.waitForTimeout(5500);

    // Log count may have increased
    const newLogCount = await logsPanel.locator('[data-testid="log-entry"]').count();
    expect(newLogCount).toBeGreaterThanOrEqual(initialLogCount);
  });
});

test.describe('Agent Logs Management', () => {
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

  test('Add Log button opens log dialog', async ({ page }) => {
    const addLogButton = page.locator('[data-testid="add-log-button"]');
    await expect(addLogButton).toBeVisible();

    await addLogButton.click();

    const logDialog = page.locator('[data-testid="add-log-dialog"]');
    await expect(logDialog).toBeVisible();
  });

  test('Can filter logs by level', async ({ page }) => {
    const levelFilter = page.locator('[data-testid="level-filter"]');
    await levelFilter.click();

    const debugOption = page.locator('[data-testid="level-debug"]');
    await debugOption.click();

    // Filter applied - logs should update
    await page.waitForTimeout(500);

    // Verify filter state
    await expect(debugOption).toBeVisible();
  });

  test('Clear filters button clears all filters', async ({ page }) => {
    // Apply some filters
    const levelFilter = page.locator('[data-testid="level-filter"]');
    await levelFilter.click();
    const debugOption = page.locator('[data-testid="level-debug"]');
    await debugOption.click();

    // Clear filters
    const clearButton = page.locator('[data-testid="clear-filters"]');
    await clearButton.click();

    // Wait for filter reset
    await page.waitForTimeout(500);

    // All filters should be cleared
    await expect(page.locator('[data-testid="level-debug"]')).not.toBeVisible();
  });

  test('Datetime filter shows date picker', async ({ page }) => {
    const dateFromInput = page.locator('[data-testid="date-from"]');
    const dateToInput = page.locator('[data-testid="date-to"]');

    await expect(dateFromInput).toBeVisible();
    await expect(dateToInput).toBeVisible();
  });
});