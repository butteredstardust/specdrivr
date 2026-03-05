import { Page } from '@playwright/test';

export interface TestCredentials {
  username: string;
  password: string;
}

export const testUsers = {
  admin: {
    username: 'Admin',
    password: 'demo',
  },
  user: {
    username: 'test-user',
    password: 'test123',
  },
  invalid: {
    username: 'invalid-user',
    password: 'wrong-password',
  },
};

export async function login(page: Page, credentials: TestCredentials) {
  await page.goto('/auth/login');
  await page.fill('input[name="username"]', credentials.username);
  await page.fill('input[name="password"]', credentials.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
}

export async function logout(page: Page) {
  const logoutButton = page.locator('[data-testid="logout-button"]');
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL('/auth/login');
  }
}

export async function ensureLoggedOut(page: Page) {
  const currentURL = page.url();
  if (!currentURL.includes('/auth/login')) {
    await logout(page);
  }
}

export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

export async function clickAndWait(page: Page, selector: string) {
  await Promise.all([
    page.waitForNavigation(),
    page.click(selector),
  ]);
}

export const testData = {
  testProject: {
    name: 'Test Automation Project',
    mission: 'Testing automated workflows',
    description: 'A project for end-to-end testing',
    techStack: ['TypeScript', 'Next.js', 'Playwright'],
  },

  testTask: {
    description: 'Test task from automated testing',
    priority: 'high',
    filesInvolved: ['src/test.spec.ts'],
  },
};

export const selectors = {
  login: {
    username: 'input[name="username"]',
    password: 'input[name="password"]',
    submit: 'button[type="submit"]',
    togglePassword: '[data-testid="toggle-password"]',
    errorMessage: '[data-testid="error-message"]',
  },
  dashboard: {
    sidebar: '[data-testid="project-sidebar"]',
    projectLink: '[data-testid="project-link"]',
    newProjectButton: '[data-testid="new-project-button"]',
  },
  project: {
    kanbanBoard: '[data-testid="kanban-board"]',
    taskCard: '[data-testid="task-card"]',
    taskColumn: '[data-testid="task-column"]',
    agentStart: '[data-testid="agent-start"]',
    agentPause: '[data-testid="agent-pause"]',
    agentStop: '[data-testid="agent-stop"]',
  },
  navigation: {
    logoutButton: '[data-testid="logout-button"]',
    sidebarWrapper: '[data-testid="project-sidebar-wrapper"]',
  },
};

export function generateUniqueId(prefix: string = 'test') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export async function waitForSelector(page: Page, selector: string, timeout: number = 5000) {
  await page.waitForSelector(selector, { timeout });
}

export async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  try {
    const element = page.locator(selector);
    return await element.isVisible();
  } catch {
    return false;
  }
}

export async function expectToastMessage(page: Page, message: string | RegExp) {
  const toast = page.locator('[data-testid="toast-message"]');
  await expect(toast).toContainText(message);
}

export const navigation = {
  async toProject(page: Page, projectId: number) {
    await page.goto(`/projects/${projectId}`);
    await expect(page).toHaveURL(`/projects/${projectId}`);
  },

  async toDashboard(page: Page) {
    await page.goto('/');
    await expect(page).toHaveURL('/');
  },

  async toLogin(page: Page) {
    await page.goto('/auth/login');
    await expect(page).toHaveURL('/auth/login');
  },
};