/**
 * API tests for authentication endpoints
 * Tests login, logout, session management
 */

import { test, expect } from '@playwright/test';

test.describe('Auth API', () => {
  test('POST /api/auth/login authenticates user', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/auth/login', {
      data: {
        email: 'admin@specdrivr.com',
        password: 'specdrivr',
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('user');
  });

  test('GET /api/auth/session returns current session', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/auth/session');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('authenticated');
    expect(data).toHaveProperty('user');
  });

  test('POST /api/auth/logout clears session', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/auth/logout');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
  });

  test('GET / redirects unauthenticated users to login', async ({ request }) => {
    // We cannot easily test Next.js middleware using pure API request bypassing the browser if we just check status codes,
    // as it might redirect. So we'll check that a request to '/' returns a redirect or the login page HTML.
    const response = await request.get('http://localhost:3000/', { maxRedirects: 0 });

    // Should be a 307 Temporary Redirect to login
    expect([307, 308, 302, 301]).toContain(response.status());
    expect(response.headers().location).toContain('/auth/login');
  });

  test('POST /api/tasks blocks unauthenticated requests', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/tasks', {
      data: {
        planId: 1,
        description: 'Test task without auth',
      },
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
  });

  test('GET /api/auth/auto-login attempts silent authentication', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/auth/auto-login');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('redirect');
  });
});
