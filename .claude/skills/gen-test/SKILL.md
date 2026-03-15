---
name: gen-test
description: Generate Vitest unit tests for a given source file
disable-model-invocation: true
---

# Generate Vitest Tests

Generate comprehensive Vitest unit tests for a source file.

## Usage

```
/gen-test src/repositories/project-repository.ts
/gen-test src/actions/create-project.ts
```

## Workflow

1. **Read the target file** to understand exports, functions, types
2. **Check for existing tests** in the same directory or `__tests__/`
3. **Identify test scenarios:**
   - Happy path for each exported function
   - Error/edge cases (null inputs, invalid data, auth failures)
   - Boundary conditions
4. **Generate test file** following project patterns

## Test Structure

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('[FunctionName]', () => {
  beforeEach(async () => {
    // Setup per test
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should [expected behavior] when [condition]', async () => {
    // Arrange
    // Act
    // Assert
  });

  it('should reject when unauthorized', async () => {
    // Auth check tests for server actions
  });

  it('should handle invalid input', async () => {
    // Zod validation failure tests
  });
});
```

## Rules

- **File naming**: `[source-name].test.ts` in same directory
- **No mocking the database** for repository tests — use transactions
- **Mock auth** for server action tests using `vi.mock('@/lib/auth')`
- **Test Zod validation** with `safeParse` — verify error messages
- **Use `@testing-library/react`** for component tests
- **Coverage target**: aim for 80%+ of the source file
- **No `console.log`** — use Pino logger if needed
- **Import from `vitest`** not `jest`

## Server Action Test Template

```typescript
describe('createProjectAction', () => {
  it('should create project for authenticated user', async () => {
    const result = await createProjectAction({
      name: 'Test Project',
      description: 'A test',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid input', async () => {
    const result = await createProjectAction({ name: '', description: '' });
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('should reject unauthenticated requests', async () => {
    vi.mock('@/lib/auth', () => ({
      auth: vi.fn().mockResolvedValue(null),
    }));
    const result = await createProjectAction({ name: 'Test', description: 'Test' });
    expect(result.success).toBe(false);
  });
});
```

## Repository Test Template

```typescript
describe('ProjectRepository', () => {
  it('should find project by id', async () => {
    const project = await projectRepository.findById(testProjectId);
    expect(project).toBeDefined();
    expect(project?.id).toBe(testProjectId);
  });

  it('should return null for non-existent id', async () => {
    const project = await projectRepository.findById('non-existent');
    expect(project).toBeNull();
  });
});
```
