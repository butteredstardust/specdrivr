# DEVELOPMENT.md | Human Developer Guide

Use these development standards for Specdrivr.

> For AI agent operations, see `AGENTS.md`. For AI constraints, see `CLAUDE.md`.

## Code Standards

### TypeScript

- Enable strict mode. Allow no exceptions.
- Do not use `any`. Use `unknown` or explicit types.
- Use interfaces for object shapes. Use type aliases for unions.
- Declare return types on all functions.
- Do not use type assertions (`as Type`). Use type guards.

### Component Architecture

- Use Server Components by default.
- Add `"use client"` only when required:
  - Event handlers
  - Browser APIs (localStorage, etc.)
  - Hooks (useState, useEffect, etc.)
- Do not use `useEffect` for data fetching. Use Server Components.

### Database Access

- Use repositories. Do not make direct DB calls in components.
- Wrap operations in `executeQuery` for error handling.
- Use retry logic for transient failures such as connection drops.
- Use type-safe Drizzle ORM queries.

```typescript
// Good
const projects = await projectRepository.getAll();

// Bad - never do this in a component
const projects = await db.select().from(projects);
```

### Error Handling

- Use custom error classes from `src/lib/errors.ts`.
- Use consistent responses from `src/lib/error-handler.ts`.
- Add error boundaries at route and component level.
- Do not swallow errors. Log and re-throw or handle them.

### Validation

- Use Zod schemas for all API inputs.
- Validate at boundaries: API routes and form submissions.
- Return descriptive validation errors.
- Do not trust client input.

### UI Components

- Prefer shadcn/ui components from `@/components/ui/*`.
- Create a custom component only when shadcn/ui has no equivalent.

### Styling

- Import standard components from `@/components/ui/`.
- Use provided shadcn/ui components.
- Use CSS-variable design tokens from `src/app/globals.css`.
- Use Tailwind utilities. Add custom CSS only when necessary.
- Use the Tailwind spacing scale (sm, md, lg, etc.).

```css
/* Wrong */
background: #ff0000;

/* Right */
background: var(--destructive);
```

### Imports

- Group imports in this order:
  1. React, Next.js
  2. External libraries
  3. Internal lib files
  4. Components
  5. Relative imports
- Use the `@/` alias. Do not use relative paths from deep directories.
- Prefer named exports for clarity.

### Node Version Management

Use the Node version in `.nvmrc`:

```bash
nvm use  # Auto-switches to correct version
```

This keeps behaviour consistent across environments. The project requires Node.js v25.6.1 and pnpm.

## Environment Configuration Architecture

Validate environment variables with Zod. Protect them from clients with `server-only`.

**For Next.js code (server components, API routes, server actions, repositories):**

```typescript
import { env } from '@/lib/env'; // Has server-only protection
```

**For standalone Node.js scripts (seed, migrations, CLI tools):**

```typescript
import { env } from '@/lib/env-script'; // No server-only, safe for scripts
```

Do not import `env-core.ts` directly. Use one of the wrapper files above.

**Rationale:**

- `server-only` throws when code imports it outside the Next.js environment.
- `env-core.ts` separates validation logic from the `env.ts` security boundary.
- Standalone scripts use `env-script.ts`, which bypasses the `server-only` import.
- This preserves the security boundary and supports scripts.

## 3. Architecture & Component Rules

## 4. Technical Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript 5.9.3
- **Database**: PostgreSQL (v16+) with Drizzle ORM 0.45.1
- **Styling**: Tailwind CSS 4.2.1
- **Auth**: better-auth 1.5.4
- **Authentication**: better-auth 1.5.4 with Drizzle adapter
- **Data Validation**: Zod 3.22.0
- **Testing**: Vitest 4 (unit), Playwright 1.42 (E2E)
- **State/Interactivity**: @dnd-kit (drag-and-drop), Base UI
- **Rich Text**: @uiw/react-md-editor
- **Security**: bcryptjs, ioredis, RBAC utilities, lock-manager
- **Utilities**: clsx, tailwind-merge, lucide icons, next-themes (dark mode), DOMPurify (sanitization)

See `package.json` for the full dependency list.

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── api/             # API routes
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   ├── error.tsx        # Error boundary
│   └── global-error.tsx # Global error handler
├── components/          # React components
│   └── ui/              # shadcn/ui components (do not modify)
├── repositories/        # Data access layer
│   ├── base-repository.ts
│   └── project-repository.ts
├── lib/                # Utilities
│   ├── db-helpers.ts   # Safe DB operations
│   ├── errors.ts       # Custom errors
│   ├── error-handler.ts # Error formatting
│   ├── env.ts          # Environment validation
│   ├── schemas.ts      # Zod schemas
│   └── utils.ts        # General utilities
├── db/                 # Database
│   ├── index.ts        # DB connection
│   └── schema.ts       # Drizzle schema
├── types/             # Type definitions
├── hooks/             # Custom hooks (client-only)
└── actions/           # Server actions
```

## Naming Conventions

### Files

- Name components `PascalCase.tsx`.
- Name utilities `kebab-case.ts`.
- Use `kebab-case/` directories with `route.ts` for API routes.
- Name repositories `kebab-case-repository.ts`.

### Variables

- Name constants `UPPER_SNAKE_CASE`.
- Name functions `camelCase` with actions (`fetchUser`, `createProject`).
- Prefix booleans with `is`, `has`, or `should` (`isLoading`, `hasPermission`).
- Use plural names for arrays (`users`, `projects`).

### Types/Interfaces

- Name interfaces `PascalCase` (`UserInterface`, `ProjectConfig`).
- Name types `PascalCase` (`UserId`, `ProjectStatus`).
- Name generics with one uppercase letter (`T`, `K`, `V`).

## API Route Standards

### Structure

Use this route structure.

```typescript
// GET /api/projects
export async function GET(request: NextRequest) {
  const validation = querySchema.safeParse(searchParams);

  if (!validation.success) {
    return handleApiError(new ValidationError('Invalid parameters'));
  }

  try {
    const data = await repository.getAll();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Response Format

Return responses in this format.

```typescript
// Success
{
  success: true,
  data: T
}

// Error
{
  success: false,
  error: string
}
```

### Status Codes

Use these status codes.

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Error Handling Patterns

### Try-Catch

Use this pattern to handle an operation.

```typescript
try {
  const result = await operation();
  return { success: true, data: result };
} catch (error) {
  if (error instanceof ValidationError) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return handleApiError(error);
}
```

### Custom Errors

Use these error classes for the related condition.

```typescript
import { DatabaseError, NotFoundError, ValidationError } from '@/lib/errors';

// Database operation failed
catch (error) {
  throw new DatabaseError('Failed to create project', error);
}

// Resource not found
if (!project) {
  throw new NotFoundError('Project', id);
}

// Validation failed
if (!isValid) {
  throw new ValidationError('Invalid project data', validation.errors);
}
```

### Error Boundaries

Use this boundary for routes.

```typescript
// For routes
export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Error occurred</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Testing Standards

### Testing Stack Details

- Use Vitest 4.x and @testing-library/react for component unit tests.
- Use Playwright 1.42.x with ARIA-first selectors for E2E tests.
- Use jsdom 28.1.0 for DOM tests.
- Use test factories (`tests/factories`) instead of fixtures.

### Unit Tests

```typescript
describe('ProjectRepository', () => {
  describe('getById', () => {
    it('should return project when found', async () => {
      // Arrange
      const repository = new ProjectRepository();

      // Act
      const result = await repository.getById(1);

      // Assert
      expect(result).toEqual(expectedProject);
    });

    it('should return null when not found', async () => {
      const result = await repository.getById(999);
      expect(result).toBeNull();
    });
  });
});
```

### Test Organization

- Use describe blocks for the class or function under test.
- Use nested describes for methods.
- Name tests "should [action] when [condition]".
- Use Arrange, Act, Assert.

### Mocking

- Mock external dependencies such as APIs and DB.
- Do not mock the system under test.
- Use factories for test data, not fixtures.

### E2E Tests

```typescript
test('should create new project', async ({ page }) => {
  // Navigate
  await page.goto('/');

  // Interact
  await page.click('button:has-text("New Project")');
  await page.fill('input[name="name"]', 'Test Project');
  await page.click('button:has-text("Create")');

  // Assert
  await expect(page.locator('text="Test Project"')).toBeVisible();
});
```

## Database Practices

### Database Schema Updates

WARNING: Do not use `pnpm db:push` for schema changes. Use this migration flow:

1. `pnpm db:generate` - Create a new migration file.
2. `pnpm db:migrate` - Apply the migration to the database.

```bash
# Right
pnpm db:generate  # Generate migration
pnpm db:migrate  # Apply to prod
pnpm db:seed      # TypeScript seeding with Drizzle ORM

# Wrong
# Directly editing drizzle/ files
# Using `psql` with raw SQL files
```

### Query Patterns

```typescript
// Use Drizzle query builder
const result = await db.select().from(projects).where(eq(projects.id, id));

// Never use raw SQL
const result = await db.execute('SELECT * FROM projects WHERE id = ?', [id]);
```

### Performance

- Add indexes for frequently queried columns.
- Use pagination for large result sets.
- Fetch only required fields.
- Avoid N+1 queries with eager loading.

## Security Libraries

### Rate Limiting (`src/lib/rate-limiter.ts`)

Use ioredis with Redis to protect API routes from abuse. It uses a distributed token bucket algorithm.

```typescript
import { ratelimit } from '@/lib/rate-limiter';

const { success } = await ratelimit.limit(identifier, 10, 'MINUTE');
if (!success) {
  return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
}
```

### RBAC (`src/lib/rbac.ts`)

Use these role-based access control utilities to check project membership and permissions before database operations.

```typescript
import { canAccessProject } from '@/lib/rbac';

if (!(await canAccessProject(userId, projectId))) {
  return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
}
```

### Lock Manager (`src/lib/lock-manager.ts`)

Use Redis distributed locks for concurrency control, such as task assignment and project locks.

```typescript
import { acquireLock, releaseLock } from '@/lib/lock-manager';

const lockAcquired = await acquireLock(resourceId, ttl);
if (lockAcquired) {
  try {
    // perform operation
  } finally {
    await releaseLock(resourceId);
  }
}
```

### Sanitization (`src/lib/sanitize.ts`)

Use `isomorphic-dompurify` for all Markdown and specification content in the UI. Sanitize before `dangerouslySetInnerHTML`.

### Auth Utilities (`src/lib/auth.ts`)

Use the Better Auth `auth()` helper to read the current session in Server Components and API routes.

```typescript
import { auth } from '@/lib/auth';

const session = await auth();
if (!session) {
  // handle unauthorized
}

// Good: Return structured object
export async function createItem(data: unknown) {
  const session = await auth(); // always first
  if (!session) return { success: false, error: 'Unauthorized' };

  try {
    const result = await repository.create(data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Failed to create item' };
  }
}

// Bad: Do not throw errors
export async function badAction() {
  throw new Error('This is prohibited');
}
```

### Redis Utilities (`src/lib/redis.ts`)

Use this ioredis TCP client for rate limiting, auth sessions, and distributed locking. It uses connection pooling and error recovery.

## Git Workflow

### Commit Messages

```
type(scope): description

feat(auth): add JWT authentication
fix: resolve race condition in project creation
docs: update API documentation
refactor: simplify error handling logic
test: add unit tests for project repository
chore: update dependencies
```

### Branch Names

```
feature/user-authentication
bugfix/login-redirect
refactor/project-repository
```

### Pull Requests

Use these checks for each pull request.

- Keep a small scope: one feature or fix per PR.
- Include unit and E2E tests.
- Update documentation for API changes.
- **Review checklist:**
  - [ ] TypeScript passes
  - [ ] ESLint passes
  - [ ] Tests pass
  - [ ] No console.log statements
  - [ ] Security review completed

## Performance Best Practices

### Client-Side

- Use Next.js route-based code splitting.
- Use the Next.js Image component for image optimization.
- Use useMemo/useCallback when beneficial.
- Keep bundle size small.

### Server-Side

- Use React streaming for large responses.
- Cache DB queries where appropriate.
- Reuse DB connections through connection pooling.
- Load heavy libraries on demand.

### Database

- Index foreign keys.
- Normalize data. Denormalize read-heavy operations.
- Use EXPLAIN ANALYZE to optimize queries.
- Monitor connection pool size.

## Common Pitfalls to Avoid

Avoid these errors.

1. Do not use `any`. Use `unknown` with type guards.
2. Do not disable ESLint rules. Fix the issue.
3. Validate every input at its boundary.
4. Do not use client-side data fetching. Use Server Components.
5. Handle every error path.
6. Do not duplicate logic. Use repositories and helpers.
7. Do not hardcode values. Use design tokens and environment variables.
8. Write tests with the code.
9. Remove unused code before commit.
10. Address every pnpm audit warning.
11. Do not use `console.log`. Use the Pino logger from `@/lib/logger`.
12. Use pnpm for all commands. Do not mix npm and pnpm.
13. Await `params`, `searchParams`, `cookies`, and `headers` in Next.js 16.
14. Do not import `env-core.ts`. Use `@/lib/env` or `@/lib/env-script`.
15. Do not bypass type safety. Use type guards instead of `as Type` assertions.

### Package Manager Security

When pnpm audit finds vulnerabilities, use pnpm overrides in package.json to address them:

```bash
# Check for vulnerabilities
pnpm audit

# Example override for a security issue:
# In package.json:
{
  "pnpm": {
    "overrides": {
      "esbuild": "^0.25.0"
    }
  }
}
```

## AI-Generated Code Issues

Check AI-generated code against these project standards:

- **Environment files:** Do not import `env-core.ts`; use `env.ts` or `env-script.ts`.
- **Commands:** Use pnpm, not npm.
- **Logging:** Use Pino, not `console.log` or `console.error`.
- **Type assertions:** Use type guards, not `as Type`.
- **Validation:** Validate API input with Zod.
- **Styles:** Use CSS variables, not hex values (`var(--color)`).
- **Imports:** Do not import server-only modules in client components.
- **Database:** Use repositories.
- **Next.js APIs:** Await `params` and `searchParams` in Next.js 16.
- **State:** Do not modify global variables or DB without transactions.
- **Error handling:** Use try/catch with structured responses.
- **Server Actions:** Return `{ error }`; do not throw errors.
- **Mutation routes:** Use Server Actions for UI-invoked mutations when appropriate.
- **Tokens:** Use `ios-styles.ts` status colours and the token system.

Correct a failed AI-generated review by following this document.

## Code Review Checklist

### Functionality

Check functionality before review.

- [ ] Feature works as expected
- [ ] Edge cases handled
- [ ] Error states handled
- [ ] Loading states handled

### Code Quality

Check code quality before review.

- [ ] TypeScript strict mode passes
- [ ] ESLint passes with no overrides
- [ ] No `any` types
- [ ] Clear variable names
- [ ] Functions are small and focused

### Testing

Check testing before review.

- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Tests cover happy paths and error cases
- [ ] Test coverage maintains or improves

### Documentation

Check documentation before review.

- [ ] JSDoc comments for public APIs
- [ ] README updated if needed
- [ ] Inline comments for complex logic
- [ ] Type definitions are clear

### Security

Check security before review.

- [ ] Input validation added
- [ ] No sensitive data in responses
- [ ] No SQL injection vulnerabilities
- [ ] Dependencies have no vulnerabilities

### Performance

Check performance before review.

- [ ] No unnecessary re-renders
- [ ] Efficient queries
- [ ] Proper caching strategy
- [ ] Bundle size considered
