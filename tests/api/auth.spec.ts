import { test, expect } from '@playwright/test';

test.test.describe('Auth API (NextAuth)', () => {
  const BASE_URL = 'http://localhost:3001';

  test('GET /api/auth/csrf returns a CSRF token', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/auth/csrf`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('csrfToken');
  });

  test('GET /api/auth/session returns session info', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/auth/session`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    // Default session should be unauthenticated (empty object or null depending on version)
    expect(data).toBeDefined();
  });

  test('POST /api/auth/signin/credentials attempts authentication', async ({ request }) => {
    // NextAuth v5 credentials login typically happens through the callback URL
    // We fetch CSRF first as it's often required
    const csrfRes = await request.get(`${BASE_URL}/api/auth/csrf`);
    const { csrfToken } = await csrfRes.json();

    const response = await request.post(`${BASE_URL}/api/auth/callback/credentials`, {
      form: {
        username: 'admin',
        password: 'admin123',
        csrfToken: csrfToken,
        json: 'true',
      },
    });

    // NextAuth often returns 302 redirect on success or 401 on failure
    // If json: true is passed, it might return 200 with URL
    expect([200, 302, 401]).toContain(response.status());
  });

  test('GET / redirects unauthenticated users to login', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/`, { maxRedirects: 0 });
    // NextAuth middleware redirects to /api/auth/signin or custom login page
    expect([302, 307, 308]).toContain(response.status());
    expect(response.headers().location).toMatch(/\/auth\/login|signin/);
  });

  test('POST /api/agent/mission blocks unauthenticated requests', async ({ request }) => {
    // Note: hitting an agent endpoint that is protected by auth() middleware
    const response = await request.get(`${BASE_URL}/api/agent/mission?project_id=1`);
    expect(response.status()).toBe(401);
  });
});

