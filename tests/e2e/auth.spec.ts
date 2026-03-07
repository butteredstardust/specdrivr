import { test, expect } from '../mocks/fixture';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('User can access login page', async ({ page }) => {
    await expect(page).toHaveURL('/auth/login');
    await expect(page.locator('h2')).toContainText('Log in to your account');
  });

  test('Login form should be visible', async ({ page }) => {
    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const submitButton = page.locator('button[type="submit"]');

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('Failed login shows error message', async ({ page }) => {
    await page.fill('#username', 'wronguser');
    await page.fill('#password', 'wrongpass');
    await page.click('button[type="submit"]');

    const errorMessage = page.locator('text="Invalid credentials"');
    await expect(errorMessage).toBeVisible();
  });

  test('Successful login with test credentials', async ({ page }) => {
    await page.fill('#username', 'Admin');
    await page.fill('#password', 'demo');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
    await expect(page.locator('body')).toContainText('Dashboard');
  });

  test('Password show/hide functionality', async ({ page }) => {
    const passwordInput = page.locator('#password');
    const toggleButton = page.locator('[data-testid="toggle-password"]');

    await expect(passwordInput).toHaveAttribute('type', 'password');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('Username field should be focused on load', async ({ page }) => {
    const usernameInput = page.locator('#username');
    await expect(usernameInput).toBeFocused();
  });

  test('Login with Enter key', async ({ page }) => {
    await page.fill('#username', 'Admin');
    await page.fill('#password', 'demo');
    await page.press('#password', 'Enter');

    await expect(page).toHaveURL('/');
  });
});

test.describe('Session Management', () => {
  test('Session persists after refresh', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('#username', 'Admin');
    await page.fill('#password', 'demo');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');

    await page.reload();
    await expect(page).toHaveURL('/');

    const logoutButton = page.locator('[data-testid="logout-button"]');
    await expect(logoutButton).toBeVisible();
  });

  test('Session cookie is set after login', async ({ page, context }) => {
    await page.goto('/auth/login');
    await page.fill('#username', 'Admin');
    await page.fill('#password', 'demo');
    await page.click('button[type="submit"]');

    const cookies = await context.cookies();
    const sessionCookie = cookies.find(cookie => cookie.name.includes('session'));
    expect(sessionCookie).toBeDefined();
  });
});

test.describe('Protected Routes', () => {
  test('Unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('Authenticated user can access protected routes', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('#username', 'Admin');
    await page.fill('#password', 'demo');
    await page.click('button[type="submit"]');

    await page.goto('/');
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });
});