---
name: vitest-playwright-auditor
description: Audit Vitest unit tests and Playwright E2E tests for coverage and quality
type: subagent
user-invocable: true
---

# Vitest/Playwright Test Auditor Agent

**Purpose:** Ensure test suite has sufficient coverage and follows best practices.

**Invocation:** Code review or quarterly

**Speed:** ~2-3 min

## How to Use

```bash
claude agent vitest-playwright-auditor "Audit test coverage"
claude agent vitest-playwright-auditor "Review test patterns"
```

## What It Checks

### 1. Vitest Unit Test Structure

```typescript
// ✓ CORRECT - Well-structured unit test
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db';
import { validateEmail } from '@/lib/validators';

describe('validateEmail', () => {
  it('should accept valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.user+tag@domain.co.uk')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(validateEmail(' user@example.com ')).toBe(false);
    expect(validateEmail('user@example.com ')).toBe(false);
  });
});

// ❌ WRONG - Vague test names and poor organization
describe('email validation', () => {
  it('works', () => {
    const result = validateEmail('test@test.com');
    expect(result).toBeTruthy();
  });

  it('fails on bad input', () => {
    expect(validateEmail('invalid')).toBeFalsy();
  });
});
```

### 2. Server Action Testing

```typescript
// ✓ CORRECT - Test Server Actions with auth
import { describe, it, expect, vi } from 'vitest';
import { createProjectAction } from '@/actions/projects';

describe('createProjectAction', () => {
  it('should create project for authenticated user', async () => {
    const result = await createProjectAction({
      name: 'Test Project',
      description: 'A test project',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBeDefined();
      expect(result.data.name).toBe('Test Project');
    }
  });

  it('should reject invalid input', async () => {
    const result = await createProjectAction({
      name: '', // Invalid: empty
      description: 'Test',
    });

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('should reject unauthorized requests', async () => {
    // Mock auth to return null
    vi.mock('@/lib/auth', () => ({
      auth: vi.fn().mockResolvedValue(null),
    }));

    const result = await createProjectAction({
      name: 'Project',
      description: 'Test',
    });

    expect(result.success).toBe(false);
  });
});

// ❌ WRONG - Testing implementation details
describe('createProjectAction', () => {
  it('calls database insert', async () => {
    const insertSpy = vi.spyOn(db, 'insert');
    await createProjectAction({ name: 'Test', description: 'Test' });
    expect(insertSpy).toHaveBeenCalled();
  });
});
```

### 3. Database Testing Patterns

```typescript
// ✓ CORRECT - Test with real database or transactions
import { describe, it, expect, beforeEach } from 'vitest';

describe('User Repository', () => {
  beforeEach(async () => {
    // Run in transaction that rolls back after each test
    await db.transaction(async (tx) => {
      // Test runs here with rolled back data
    });
  });

  it('should find user by email', async () => {
    const user = await createUser({
      email: 'test@example.com',
      name: 'Test User',
    });

    const found = await getUserByEmail('test@example.com');
    expect(found?.id).toBe(user.id);
  });

  it('should return null for non-existent user', async () => {
    const found = await getUserByEmail('nonexistent@example.com');
    expect(found).toBeNull();
  });
});

// ❌ WRONG - Mocking database without integration testing
describe('User Repository', () => {
  it('should find user', async () => {
    vi.mock('@/lib/db', () => ({
      query: {
        users: {
          findFirst: vi.fn().mockResolvedValue({ id: '1', email: 'test@test.com' }),
        },
      },
    }));

    const user = await getUserByEmail('test@test.com');
    expect(user?.email).toBe('test@test.com');
  });
});
```

### 4. Playwright E2E Test Structure

```typescript
// ✓ CORRECT - Organized E2E tests
import { test, expect } from '@playwright/test';

test.describe('Project Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display user projects', async ({ page }) => {
    await page.goto('/dashboard');
    const projectsSection = page.locator('[data-testid="projects-section"]');
    await expect(projectsSection).toBeVisible();
  });

  test('should create new project', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('button:has-text("New Project")');

    await page.fill('input[name="name"]', 'Test Project');
    await page.fill('textarea[name="description"]', 'A test project');
    await page.click('button:has-text("Create")');

    await expect(page.locator('text=Test Project')).toBeVisible();
  });

  test('should delete project', async ({ page }) => {
    // First create a project
    await createProject(page, 'Project to Delete');

    // Then delete it
    await page.click('[data-testid="project-menu"]');
    await page.click('text=Delete');
    await page.click('button:has-text("Confirm")');

    await expect(page.locator('text=Project to Delete')).not.toBeVisible();
  });
});

// ❌ WRONG - Flaky tests without proper waits
test('create project', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('button:has-text("New Project")');
  await page.fill('input[name="name"]', 'Test');
  await page.click('button[type="submit"]');
  // No wait for navigation or element visibility
  expect(page.locator('text=Test')).toBeVisible();
});
```

### 5. Test Isolation and Cleanup

```typescript
// ✓ CORRECT - Proper test isolation
describe('Auth Flow', () => {
  let testUser: User;

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  afterEach(async () => {
    await deleteTestUser(testUser.id);
  });

  it('should authenticate valid credentials', async () => {
    const result = await loginAction({
      email: testUser.email,
      password: 'password123',
    });

    expect(result.success).toBe(true);
  });
});

// ❌ WRONG - Shared state between tests
let testUser: User;

describe('Auth Flow', () => {
  it('setup', async () => {
    testUser = await createTestUser(); // Shared state!
  });

  it('should authenticate', async () => {
    expect(testUser).toBeDefined(); // Depends on test order
  });
});
```

### 6. Coverage Requirements

```typescript
// ✓ CORRECT - Tests covering multiple scenarios
describe('updateProjectStatus', () => {
  it('should update status for owner', async () => {
    // Happy path
  });

  it('should reject update from non-owner', async () => {
    // Permission check
  });

  it('should reject invalid status', async () => {
    // Validation
  });

  it('should log the update', async () => {
    // Side effects
  });

  it('should notify collaborators', async () => {
    // Integration
  });
});

// Coverage target: 80%+ for src/, 60%+ for tests/
// ❌ WRONG - Only happy path tested
describe('updateProjectStatus', () => {
  it('should update status', async () => {
    // Only tests successful case
  });
});
```

### 7. Async and Error Testing

```typescript
// ✓ CORRECT - Test error scenarios
describe('API Error Handling', () => {
  it('should handle network timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('timeout')), 5000);
          })
      )
    );

    const result = await fetchData();
    expect(result.success).toBe(false);
    expect(result.error).toContain('timeout');
  });

  it('should retry on transient error', async () => {
    let attempts = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        attempts++;
        if (attempts < 2) throw new Error('Service unavailable');
        return { ok: true, json: async () => ({ data: 'test' }) };
      })
    );

    const result = await fetchDataWithRetry();
    expect(result.success).toBe(true);
    expect(attempts).toBe(2);
  });
});

// ❌ WRONG - No error handling tests
describe('API', () => {
  it('should fetch data', async () => {
    const data = await fetchData();
    expect(data).toBeDefined();
  });
});
```

## Report Includes

- Test coverage below target (80% for src)
- Missing edge case tests
- Vague test names or descriptions
- Tests depending on execution order
- Hardcoded test data instead of factories
- Flaky Playwright tests (missing waits)
- Not testing error scenarios
- Mocking database instead of integration testing
- E2E tests that should be unit tests
- Missing test cleanup (afterEach)

## Integration

Add to CI/CD:

```yaml
# .github/workflows/test.yml
- name: Run unit tests
  run: pnpm test

- name: Check coverage
  run: pnpm test:coverage

- name: Run E2E tests
  run: pnpm test:e2e
```

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## Testing Checklist

- **Coverage**: ≥80% for src/, ≥60% for libraries
- **Unit Tests**: Vitest for logic, mocks for external deps
- **Integration**: Database tests with transactions
- **E2E**: Playwright for critical user paths
- **Error Handling**: Test failures and edge cases
- **Isolation**: No test interdependencies
- **Cleanup**: beforeEach/afterEach proper setup
- **Speed**: Tests complete in <5 minutes

## Performance Targets

- Unit tests: < 100ms per test
- Integration tests: < 500ms per test
- E2E tests: < 5 seconds per test
- Full suite: < 5 minutes

---

**Good tests catch bugs. Great tests prevent them.**
