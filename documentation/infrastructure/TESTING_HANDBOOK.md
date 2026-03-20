**SPECDRIVR**

Master Product Specification — Testing Handbook

[Status: GROUND TRUTH]

---

## 1. Overview

Specdrivr uses Vitest for unit/integration testing and Playwright for E2E testing. This handbook provides standardized patterns for mocking and data generation.

## 2. Mocking the Database

Do NOT mock Drizzle directly. Use the **Test DB + Factory** pattern.

### 2.1 The Factory Pattern

Use helpers from `tests/helpers.ts` to populate the test database with clean state.

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

Use Vitest's `vi.mock` to intercept external API calls at the library level.

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

Always use ARIA labels to ensure accessibility and resilient tests.

- **Good**: `page.getByRole('button', { name: 'Approve' })`
- **Bad**: `page.locator('.btn-primary')`

### 4.2 Agent-First Selectors (data-testid)

When ARIA labels are insufficient or the element is a complex agent-facing surface, use `data-testid` to provide a stable hook for both Playwright and AI Agents.

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

Use the `auth.setup.ts` pattern to preserve login state across tests, avoiding repeated login flows.

## 5. Testing Checklist for Agents

1.  **Unit**: Every new Repository method MUST have a Vitest integration test.
2.  **Edge Cases**: Test for `NotFoundError` and `ValidationError`.
3.  **Sanity**: Run `pnpm test:unit` before pushing to verify no regressions.
