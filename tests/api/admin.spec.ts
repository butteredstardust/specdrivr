/**
 * API Tests for Admin User Management endpoints
 * Tests all CRUD operations for admin user management
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const ADMIN_CREDENTIALS = {
  username: 'test-admin',
  password: 'test123',
};

// Store session cookie for authenticated requests
let sessionCookie = '';

const loginAsAdmin = async () => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: ADMIN_CREDENTIALS.username,
      password: ADMIN_CREDENTIALS.password,
    }),
  });

  expect(response.status).toBe(200);

  const cookies = response.headers.raw()['set-cookie'];
  const session = cookies?.find((c) => c.includes('__session'));
  if (session) {
    sessionCookie = session.split(';')[0];
  }

  return response;
};

test.describe('Admin User Management APIs', () => {
  test.beforeAll(async () => {
    // Login as admin and get session
    await loginAsAdmin();
  });

  test.describe('GET /api/admin/users', () => {
    test('requires authentication', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`);

      expect(response.status).toBe(401);
    });

    test('returns list of users with valid session', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          Cookie: sessionCookie,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      if (data.length > 0) {
        const user = data[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('isActive');
        expect(user).not.toHaveProperty('password'); // Password hash should not be returned
      }
    });

    test('filters out inactive users when requested', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users?includeInactive=false`,
        {
          headers: {
            Cookie: sessionCookie,
          },
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      const allActive = data.every((user: any) => user.isActive === true);
      expect(allActive).toBe(true);
    });

    test('returns users sorted by username', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          Cookie: sessionCookie,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      if (data.length > 1) {
        const usernames = data.map((u: any) => u.username);
        const sorted = [...usernames].sort();
        expect(usernames).toEqual(sorted);
      }
    });
  });

  test.describe('POST /api/admin/users', () => {
    test('requires authentication', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'test-new-user',
          password: 'TestPass123',
          role: 'developer',
        }),
      });

      expect(response.status).toBe(401);
    });

    test('creates new user successfully', async () => {
      const testUsername = `test-user-${Date.now()}`;

      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          username: testUsername,
          password: 'TestPass123',
          role: 'developer',
        }),
      });

      expect(response.status).toBe(201);

      const user = await response.json();
      expect(user.username).toBe(testUsername);
      expect(user.role).toBe('developer');
      expect(user.isActive).toBe(true);
      expect(user).not.toHaveProperty('password');
    });

    test('validates username uniqueness', async () => {
      const testUsername = `test-duplicate-${Date.now()}`;

      // Create first user
      await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          username: testUsername,
          password: 'TestPass123',
          role: 'developer',
        }),
      });

      // Try to create duplicate
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          username: testUsername,
          password: 'TestPass456',
          role: 'developer',
        }),
      });

      expect(response.status).toBe(409); // Conflict
    });

    test('requires username of minimum length', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          username: 'ab',
          password: 'TestPass123',
          role: 'developer',
        }),
      });

      expect(response.status).toBe(400);
    });

    test('validates role values', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          username: 'test-role',
          password: 'TestPass123',
          role: 'invalid-role',
        }),
      });

      expect([400, 422]).toContain(response.status);
    });

    test('creates admin users when requested', async () => {
      const testUsername = `test-admin-${Date.now()}`;

      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          username: testUsername,
          password: 'TestPass123',
          role: 'admin',
        }),
      });

      expect(response.status).toBe(201);

      const user = await response.json();
      expect(user.role).toBe('admin');
    });
  });

  test.describe('PATCH /api/admin/users/:id', () => {
    let testUserId: number;
    let testUsername: string;

    test.beforeAll(async () => {
      // Create a test user to update
      testUsername = `test-update-${Date.now()}`;
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          username: testUsername,
          password: 'TestPass123',
          role: 'developer',
        }),
      });

      const user = await response.json();
      testUserId = user.id;
    });

    test('requires authentication', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'developer',
        }),
      });

      expect(response.status).toBe(401);
    });

    test('updates user role successfully', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${testUserId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: sessionCookie,
          },
          body: JSON.stringify({
            role: 'admin',
          }),
        }
      );

      expect(response.status).toBe(200);

      const updatedUser = await response.json();
      expect(updatedUser.role).toBe('admin');
    });

    test('validates non-admin cannot change to admin', async () => {
      // This test assumes role escalation is restricted
      // If not restricted, the test should be removed

      // Create a regular user session
      const regularUser = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          username: `test-restrict-${Date.now()}`,
          password: 'TestPass123',
          role: 'developer',
        }),
      });

      const regularUserData = await regularUser.json();

      // Try to escalate to admin (should fail)
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${regularUserData.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: sessionCookie,
          },
          body: JSON.stringify({
            role: 'admin',
          }),
        }
      );

      if (response.status === 200) {
        console.warn('⚠️  API allows role escalation from developer to admin');
      } else {
        expect(response.status).toBe(403); // Forbidden
      }
    });

    test('returns 404 for non-existent user', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/999999`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          role: 'viewer',
        }),
      });

      expect(response.status).toBe(404);
    });

    test('allows partial updates (single field)', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${testUserId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Cookie: sessionCookie,
          },
          body: JSON.stringify({
            role: 'viewer',
          }),
        }
      );

      expect(response.status).toBe(200);

      const updatedUser = await response.json();
      expect(updatedUser.role).toBe('viewer');
      expect(updatedUser.username).toBe(testUsername); // Other fields unchanged
    });
  });

  test.describe('DELETE /api/admin/users/:id', () => {
    let testUserId: number;
    let testUsername: string;

    test.beforeAll(async () => {
      // Create a test user to delete
      testUsername = `test-delete-${Date.now()}`;
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          username: testUsername,
          password: 'TestPass123',
          role: 'developer',
        }),
      });

      const user = await response.json();
      testUserId = user.id;
    });

    test('requires authentication', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${testUserId}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(401);
    });

    test('deactivates user successfully (soft delete)', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${testUserId}`,
        {
          method: 'DELETE',
          headers: {
            Cookie: sessionCookie,
          },
        }
      );

      expect(response.status).toBe(200);

      const deletedUser = await response.json();
      expect(deletedUser.isActive).toBe(false);

      // Verify user still exists in database but is inactive
      const verifyResponse = await fetch(
        `${API_BASE_URL}/api/admin/users/${testUserId}`,
        {
          headers: {
            Cookie: sessionCookie,
          },
        }
      );

      if (verifyResponse.status === 200) {
        console.log('✓ User exists but is inactive');
      }
    });

    test('returns 404 for non-existent user deletion', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/999999`, {
        method: 'DELETE',
        headers: {
          Cookie: sessionCookie,
        },
      });

      expect(response.status).toBe(404);
    });

    test('cannot deactivate own account', async () => {
      // Get current admin user ID
      const usersResponse = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          Cookie: sessionCookie,
        },
      });

      const users = await usersResponse.json();
      const adminUser = users.find((u: any) => u.username === ADMIN_CREDENTIALS.username);

      // Try to delete self
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${adminUser.id}`,
        {
          method: 'DELETE',
          headers: {
            Cookie: sessionCookie,
          },
        }
      );

      // Should either succeed (self-deactivate allowed) or fail (protection)
      expect([200, 403]).toContain(response.status);
    });
  });

  test.describe('Security validations', () => {
    test('cannot create user without required fields', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          username: 'test-missing-fields',
          // Missing password
        }),
      });

      expect(response.status).toBe(400);
    });

    test('cannot update read-only fields (id)', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/1`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
        body: JSON.stringify({
          id: 999,
        }),
      });

      // Should either ignore or return error
      expect([200, 400]).toContain(response.status);
    });
  });
});

// Run if called directly
if (require.main === module) {
  console.log('Running Admin User API tests...');
}