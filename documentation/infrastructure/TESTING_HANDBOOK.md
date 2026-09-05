SPECDRIVR

Master Product Specification — Testing Handbook

---

## 1. Overview

Use Vitest for unit and integration tests. Use Playwright for E2E tests. This handbook defines mock and test-data patterns.

CI runs `pnpm test:coverage`. It rejects coverage below these repository baselines: 46% lines,
45% statements, 38% functions, and 33% branches. Raise these floors only. Maintain at least 80%
coverage for business logic and repository code as the long-term target.

## 2. Mocking the Database

WARNING: Do NOT mock Drizzle directly. Use the **Test DB + Factory** pattern.

### 2.1 The Factory Pattern

Use helpers from `tests/helpers.ts` to create clean test database state.

```typescript
import { cleanDatabase, createTestUser, createTestProject } from 'tests/helpers';

describe('My Module', () => {
  beforeEach(async () => {
    await cleanDatabase(); // Truncates all 17+ tables
  });

  it('should execute logic with real DB', async () => {
    const user = await createTestUser('u1', 'test@specdrivr.dev', 'admin');
    const project = await createTestProject('My Site', user.id);
    // ... test your repository or logic
  });
});
```

## 3. Mocking AI (Gemini/Claude)

Use Vitest `vi.mock` to intercept external API calls at the library level.

```typescript
import { geminiService } from '@/lib/gemini';

vi.mock('@/lib/gemini', () => ({
  geminiService: {
    generatePlan: vi.fn().mockResolvedValue({
      intent: 'Test Plan',
      tasks: [{ title: 'T1', dependsOn: [] }],
    }),
  },
}));
```

## 4. E2E Testing (Playwright)

### 4.1 ARIA-First Selectors

Always use ARIA labels. They support accessibility and resilient tests.

- **Good**: `page.getByRole('button', { name: 'Approve' })`
- **Bad**: `page.locator('.btn-primary')`

### 4.2 Agent-First Selectors (data-testid)

Use `data-testid` when ARIA labels are insufficient. Use it for complex agent-facing surfaces. It provides a stable hook for Playwright and AI Agents.

| **Target Element**    | **Recommended data-testid** |
| --------------------- | --------------------------- |
| Main Page Header      | `page-header`               |
| Primary Action Button | `action-primary`            |
| Task Detail Drawer    | `task-drawer`               |
| Agent Log Container   | `agent-logs`                |
| Session Status Badge  | `session-status`            |
| Spec Editor Container | `spec-editor`               |
| Project Switcher      | `project-switcher`          |

**Usage Example:**

```tsx
// In the component
<button data-testid="action-primary" ...>
  Execute Spec
</button>

// In the test
await page.getByTestId('action-primary').click();
```

### 4.3 Auth State

Use the `auth.setup.ts` pattern to preserve login state across tests. This avoids repeated login flows.

## 5. Testing Checklist for Agents

1.  **Unit**: Create a Vitest integration test for every new Repository method.
2.  **Edge Cases**: Test `NotFoundError` and `ValidationError`.
3.  **Sanity**: Run `pnpm test:unit` before pushing. Check that no regressions exist.
