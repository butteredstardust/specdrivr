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

  test('GET /api/auth/auto-login attempts silent authentication', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/auth/auto-login');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('redirect');
  });
});
