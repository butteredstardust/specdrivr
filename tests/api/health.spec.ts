/**
 * API tests for health check endpoints
 * Tests database connectivity and system health
 */

import { test, expect } from '@playwright/test';

test.test.describe('Health API', () => {
  test('GET /api/health/db returns database health status', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/health/db');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('healthy');
    expect(data.healthy).toBe(true);
  });
});
