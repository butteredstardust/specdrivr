# DEVELOPMENT.md | Human Developer Guide

[Status: GROUND TRUTH]

Development standards and best practices for Specdrivr, an AI-native orchestration platform.

> **Cross-reference**: For AI agent operations, see `AGENTS.md`. For AI constraints, see `CLAUDE.md`.

## Code Standards

### TypeScript

- **Strict mode enabled** - No exceptions
- **No `any` type** - Use `unknown` or explicit types
- **Prefer interfaces** for object shapes, **type aliases** for unions
- **Explicit return types** on all functions
- **No type assertions** (`as Type`) - use type guards instead

### Component Architecture

- **Server Components by default**
- Add `"use client"` directive only when needed:
  - Event handlers
  - Browser APIs (localStorage, etc.)
  - Hooks (useState, useEffect, etc.)
- **Never use `useEffect` for data fetching** - use Server Components instead

### Database Access

- **Always use repositories** - No direct DB calls in components
- **Wrap operations in executeQuery** for error handling
- **Retry logic** for transient failures (connection drops)
- **Type-safe queries** with Drizzle ORM

```typescript
// Good
const projects = await projectRepository.getAll();

// Bad - never do this in a component
const projects = await db.select().from(projects);
```

### Error Handling

- **Use custom error classes** from `src/lib/errors.ts`
- **Consistent error responses** from `src/lib/error-handler.ts`
- **Error boundaries** at route and component level
- **Never swallow errors** - log and re-throw or handle

### Validation

- **Zod schemas** for all API inputs
- **Validate at boundaries** (API routes, form submissions)
- **Descriptive validation errors**
- **Never trust client input**

### UI Components

- **shadcn/ui** - Prefer standard components. Use `@/components/ui/*`.
- **Custom Components** - Only build custom components if no `shadcn/ui` equivalent exists.

### Styling

- **Standard Imports** - Standard component imports from `@/components/ui/`.
- **shadcn/ui components** - Use provided components
- **Design tokens** from CSS variables in `src/app/globals.css`
- **Tailwind utility classes** - No custom CSS unless necessary
- **Consistent spacing** - Use Tailwind scale (sm, md, lg, etc.)

```css
/* Wrong */
background: #ff0000;

/* Right */
background: var(--destructive);
```

### Imports

- **Group imports**:
  1. React, Next.js
  2. External libraries
  3. Internal lib files
  4. Components
  5. Relative imports
- **Path mapping** - Use `@/` alias, no relative paths from deep directories
- **Named exports** - Prefer over default exports for clarity

### Node Version Management

Always use the Node version specified in `.nvmrc`:

```bash
nvm use  # Auto-switches to correct version
```

This ensures consistent behavior across all environments. The current project requires Node.js v25.6.1 with pnpm package manager.

## Environment Configuration Architecture

Environment variables must be validated with Zod and protected from client exposure using the `server-only` package.

**For Next.js code (server components, API routes, server actions, repositories):**

```typescript
import { env } from '@/lib/env'; // Has server-only protection
```

**For standalone Node.js scripts (seed, migrations, CLI tools):**

```typescript
import { env } from '@/lib/env-script'; // No server-only, safe for scripts
```

**Never import directly from `env-core.ts`** - use one of the wrapper files above.

**Rationale:**

- `server-only` is a Next.js runtime package that throws when imported outside Next.js environment
- We decouple validation logic (`env-core.ts`) from the security boundary (`env.ts`)
- Standalone scripts use `env-script.ts` which bypasses the server-only import
- This maintains security boundaries while enabling script usage

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

See `package.json` for full dependency list.

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

- **Components:** `PascalCase.tsx`
- **Utilities:** `kebab-case.ts`
- **API routes:** `kebab-case/` directories with `route.ts`
- **Repositories:** `kebab-case-repository.ts`

### Variables

- **Constants:** `UPPER_SNAKE_CASE`
- **Functions:** `camelCase` with action-oriented names (`fetchUser`, `createProject`)
- **Booleans:** Prefixed with `is`, `has`, `should` (`isLoading`, `hasPermission`)
- **Arrays:** Plural names (`users`, `projects`)

### Types/Interfaces

- **Interfaces:** `PascalCase` (`UserInterface`, `ProjectConfig`)
- **Types:** `PascalCase` (`UserId`, `ProjectStatus`)
- **Generics:** `Single uppercase letter` (`T`, `K`, `V`)

## API Route Standards

### Structure

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

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Error Handling Patterns

### Try-Catch

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

- **Unit Testing**: Vitest 4.x with @testing-library/react for component unit tests
- **E2E Testing**: Playwright 1.42.x with ARIA-first selectors
- **Test Environment**: jsdom 28.1.0 for DOM testing
- **Mocking**: Use test factories (tests/factories) rather than fixtures

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

- **Describe blocks** for class/function being tested
- **Nested describes** for methods
- **Clear test names** - "should [action] when [condition]"
- **AAA pattern:** Arrange, Act, Assert

### Mocking

- **Mock external dependencies** (APIs, DB)
- **Don't mock** the system under test
- **Use factories** for test data, not fixtures

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

Never use `pnpm db:push` for schema changes. Follow the migration flow:

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

- **Add indexes** for frequently queried columns
- **Use pagination** for large result sets
- **Fetch only needed fields**
- **Avoid N+1 queries** by eager loading

## Security Libraries

### Rate Limiting (`src/lib/rate-limiter.ts`)

Uses ioredis with Redis to protect API routes from abuse. This implements token bucket algorithm across distributed systems.

```typescript
import { ratelimit } from '@/lib/rate-limiter';

const { success } = await ratelimit.limit(identifier, 10, 'MINUTE');
if (!success) {
  return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
}
```

### RBAC (`src/lib/rbac.ts`)

Role-based access control utilities. Use to check project membership and permissions before database operations.

```typescript
import { canAccessProject } from '@/lib/rbac';

if (!(await canAccessProject(userId, projectId))) {
  return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
}
```

### Lock Manager (`src/lib/lock-manager.ts`)

Distributed locking via Redis for concurrency control (e.g., task assignment, project locks).

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

Uses `isomorphic-dompurify`. Mandatory for all Markdown and Spec content rendering in the UI to prevent XSS. Always sanitize before using `dangerouslySetInnerHTML`.

### Auth Utilities (`src/lib/auth.ts`)

Better Auth integration. Always use the `auth()` helper to retrieve the current session in Server Components and API routes.

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

Abstracted access to Redis through ioredis (TCP). Production-grade Redis client used for rate limiting, auth sessions, and distributed locking. Configured with connection pooling and error recovery.

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

- **Small scope** - One feature or fix per PR
- **Tests included** - Unit and E2E tests
- **Documentation** - Update docs for API changes
- **Review checklist:**
  - [ ] TypeScript passes
  - [ ] ESLint passes
  - [ ] Tests pass
  - [ ] No console.log statements
  - [ ] Security review completed

## Performance Best Practices

### Client-Side

- **Code splitting** - Route-based with Next.js
- **Image optimization** - Use Next.js Image component
- **Memoization** - useMemo/useCallback where beneficial
- **Bundle analysis** - Keep bundle size small

### Server-Side

- **Streaming** - Use React streaming for large responses
- **Caching** - Cache DB queries where appropriate
- **Connection pooling** - Reuse DB connections
- **Lazy loading** - Load heavy libraries on demand

### Database

- **Index foreign keys**
- **Normalize data** - But denormalize for read-heavy operations
- **Query optimization** - Use EXPLAIN ANALYZE
- **Connection limits** - Monitor pool size

## Common Pitfalls to Avoid

1. **Don't use `any` type** - Use `unknown` with type guards
2. **Don't disable ESLint rules** - Fix the underlying issue
3. **Don't skip validation** - Validate all inputs at boundaries
4. **Don't use client-side data fetching** - Use Server Components
5. **Don't ignore error cases** - Handle all error paths
6. **Don't duplicate logic** - Use repositories and helpers
7. **Don't hardcode values** - Use design tokens and env vars
8. **Don't skip tests** - Write tests as you code
9. **Don't commit dead code** - Remove unused code
10. **Don't ignore security warnings** - Address all pnpm audit issues
11. **Don't use `console.log`** - Use Pino logger from `@/lib/logger`
12. **Don't mix npm/pnpm** - Use pnpm for all commands
13. **Don't forget to await dynamic APIs** - `params`, `searchParams`, `cookies`, `headers` require await in Next.js 16
14. **Don't import env-core.ts** - Use `@/lib/env` or `@/lib/env-script` instead
15. **Don't bypass type safety** - Avoid `as Type` assertions; use type guards

### Package Manager Security

When pnpm audit reveals vulnerabilities, address them using pnpm overrides in package.json:

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

AI coding assistants may produce code that violates project standards. Be vigilant:

- **Environment file misuse**: Importing from `env-core.ts` instead of `env.ts` or `env-script.ts`
- **Command confusion**: Using `npm` instead of `pnpm` for all commands
- **Console logging**: Using `console.log`/`console.error` instead of Pino logger
- **Type assertions**: Using `as Type` to bypass type checking - prefer type guards
- **Missing validation**: Skipping Zod validation on API inputs
- **Hardcoded styles**: Using hex values instead of CSS variables (`var(--color)`)
- **Side-effect imports**: Importing server-only modules in client components
- **Direct DB access**: Bypassing repositories
- **Unawaited Next.js APIs**: Accessing `params`, `searchParams` without await in Next.js 16
- **Global state mutation**: Modifying global variables or DB without transactions
- **Missing error handling**: Not wrapping operations in try/catch with structured responses
- **Incorrect error responses**: Throwing errors from Server Actions instead of returning `{ error }`
- **Server Actions misplacement**: Using API Routes for UI-invoked mutations when Server Actions are appropriate
- **Design token avoidance**: Not using the `ios-styles.ts` status colors or token system

If an AI-generated snippet fails review, correct it following the patterns in this document.

## Code Review Checklist

### Functionality

- [ ] Feature works as expected
- [ ] Edge cases handled
- [ ] Error states handled
- [ ] Loading states handled

### Code Quality

- [ ] TypeScript strict mode passes
- [ ] ESLint passes with no overrides
- [ ] No `any` types
- [ ] Clear variable names
- [ ] Functions are small and focused

### Testing

- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Tests cover happy paths and error cases
- [ ] Test coverage maintains or improves

### Documentation

- [ ] JSDoc comments for public APIs
- [ ] README updated if needed
- [ ] Inline comments for complex logic
- [ ] Type definitions are clear

### Security

- [ ] Input validation added
- [ ] No sensitive data in responses
- [ ] No SQL injection vulnerabilities
- [ ] Dependencies have no vulnerabilities

### Performance

- [ ] No unnecessary re-renders
- [ ] Efficient queries
- [ ] Proper caching strategy
- [ ] Bundle size considered
