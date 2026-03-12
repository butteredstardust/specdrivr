# AGENTS.md | AI Agent Guide | Keep under 500 lines

**AI Agent Operations Manual** for Specdrivr - an AI-native orchestration platform.

> **Cross-reference:** For AI constraints, see `CLAUDE.md`. For human developer guidance, see `documentation/DEVELOPMENT.md`.

## Environment & Workflow

**Project Type:** Next.js 16 App Router (React Server Components with Client Components as needed). TypeScript project with ESLint and strict types.

### Workflow Rules
1. Work on feature branches; use descriptive names: `feature/...`, `bugfix/...`, `refactor/...`
2. Keep changes small and scoped. One logical change per PR.
3. Run `pnpm test` and `pnpm lint` before opening a PR.
4. Follow Conventional Commits for commit messages: `feat(auth): add JWT support`.
5. Never commit secrets (`.env`) or lockfile misconfigurations.
6. Do not modify or delete files in `drizzle/` (migrations). Always generate new migrations for schema changes.
7. Do not create temporary fix scripts (`fix.mjs`). Fix issues directly in source files.
8. One-time scripts (e.g., `db/migrate-*.ts`) should be removed after execution; do not commit artifact files.

### Off-Limits
- Infrastructure CI/CD configs (`.github/`, `infrastructure/`)
- Raw SQL scripts for seeding (use `tsx db/seed.ts`)
- Direct `process.env` usage outside `@/lib/env` or `@/lib/env-script`

### CI Fix Procedures
When CI fails on typecheck, lint, or tests:
- Investigate root cause in source files
- Make the fix directly in the affected code
- Re-run tests locally before pushing
- Do **not** add scripts that auto-modify files as a workaround

## Package Manager Commands

**Absolute rule:** Use `pnpm` for all package manager operations. Never use `npm` or `yarn`.

| Scope                | Command                                  |
|----------------------|------------------------------------------|
| Install              | `pnpm install --frozen-lockfile`        |
| Development server   | `pnpm dev` (Turbopack)                  |
| Build                | `pnpm build`                             |
| Start (prod)         | `pnpm start`                             |
| Lint                 | `pnpm lint . --ext .ts,.tsx,.js,.jsx`   |
| DB generate          | `pnpm db:generate`                       |
| DB push (local)      | `pnpm db:push`                           |
| DB migrate (prod)    | `pnpm db:migrate`                        |
| DB studio            | `pnpm db:studio`                         |
| DB seed              | `pnpm db:seed`                           |
| Setup (push + seed)  | `pnpm setup`                             |
| Unit tests           | `pnpm test:unit`                         |
| Unit tests (watch)   | `pnpm test:unit:watch`                   |
| E2E tests            | `pnpm test:e2e`                          |
| E2E UI mode          | `pnpm test:e2e:ui`                       |
| All tests            | `pnpm test`                              |

> **Note:** Internal scripts in `package.json` may call `drizzle-kit` or `vitest` directly; you always invoke them through `pnpm <script>`.

## Tech Stack Reference

| Category          | Technology & Version                                      |
|-------------------|-----------------------------------------------------------|
| Framework         | Next.js 16.1.6 (App Router)                              |
| React             | 19.2.4                                                   |
| TypeScript        | 5.9.3                                                    |
| Styling           | Tailwind CSS 4.2.1                                       |
| UI Components     | shadcn/ui (with Radix UI primitives)                     |
| Icons             | Lucide React                                             |
| Database          | PostgreSQL                                               |
| ORM               | Drizzle ORM 0.45.1                                       |
| Auth              | better-auth 1.5.4 with Drizzle adapter                  |
| Validation        | Zod 3.22.0                                               |
| Testing (Unit)    | Vitest 4 + @testing-library/react                        |
| Testing (E2E)     | Playwright 1.42                                          |
| Drag & Drop       | @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0            |
| Markdown Editing  | @uiw/react-md-editor 4.0.11                              |
| Base UI           | @base-ui/react 1.2.0                                     |
| Security          | bcryptjs 3.0.3, @upstash/ratelimit 2.0.8, @upstash/redis 1.36.3, RBAC, lock-manager |
| Logging           | pino 10.3.1 + pino-pretty                                |
| Utilities         | clsx, tailwind-merge, next-themes, DOMPurify             |

## Code Standards & Patterns

### TypeScript Safety
- **Strict mode** on. No `any`. Use `unknown` with type guards for dynamic values.
- **No type assertions** (`as Type`). Use runtime checks with Zod or custom type guards.
- **Explicit return types** on all functions and methods.
- **Prefer `z.infer<typeof schema>`** for deriving types from Zod schemas.
- **Never duplicate** types from Drizzle or Zod. Use `typeof table.$inferSelect`, `typeof table.$inferInsert`, `z.infer`.
- **Use interfaces** for object shapes, **type aliases** for unions.

### Component Architecture
- **Server Components by default.** No `"use client"` unless you need: event handlers, React state, effects, or browser APIs.
- **Client Components** must be explicitly marked with `"use client"` at top.
- **Data fetching:** Use Server Components with repository calls passed as props. Avoid client-side `useEffect` for data.
- **Streaming:** Consider `Suspense` and streaming for large data.

### Database Access
- **Always use repositories** from `src/repositories/`. Never import `db` directly in components or pages.
- **Wrap queries in `executeQuery`** (from base-repository) for connection handling and error logging.
- **Multi-step writes** must be in a transaction: `db.transaction(async (tx) => { ... })`.
- **Use Drizzle's relational API** (`relations()`) for related records.
- **No raw SQL.** Use Drizzle query builder or `sql` template.
- **Infer types** from schema.

### API Design
- Use Next.js 16+ Route Handlers (`app/api/**/route.ts`).
- **Place route handlers properly:** `app/api/<resource>/route.ts` with `GET`, `POST`, `PATCH`, `DELETE`.
- **Never use Pages Router patterns** (`pages/api`, `getServerSideProps`, `getStaticProps`).
- `params` and `searchParams` **must be awaited**: `const { id } = await params;`.
- For UI mutations, **prefer Server Actions** (see `Server Actions Pattern`). Use Route Handlers for external APIs.
- **Validate with Zod** (see `Validation`).
- **Return consistent JSON:** `{ success: true, data: T }` or `{ success: false, error: string }`.
- **Use proper HTTP status codes** (200, 201, 400, 401, 403, 404, 500).
- **Never throw errors** directly from Server Actions to client; return structured error objects.

### Validation
- **Zod is the single source of truth** for both validation and TS types.
- **Validate all incoming data** at API boundaries.
- Use `.safeParse()` for manual handling or `.parse()` for auto-throw.
- **Never trust client input.**

### Styling
- **Use shadcn/ui components** from `@/components/ui/`. Do not modify those files; customize via CSS variables.
- **Design tokens** in `src/app/globals.css` as CSS variables (`var(--brand-primary)`). Never use hex codes.
- **Linear design patterns** in `src/lib/ios-styles.ts`. Note `taskStatusColors` provides `bg` and `text` only.
- **Tailwind utility classes** for layout. Avoid custom CSS.
- **CSS specificity:** use `!text-slate-500` (with `!` prefix), never `!important` as separate string.

### Logging
- **Strictly use Pino** via `@/lib/logger.ts`.
- **Never use `console.log` or `console.error`** in production code.
- **Log levels:** `debug`, `info`, `warn`, `error`.
- **Never log raw request bodies, passwords, or PII.** Mask sensitive data.
- **Include correlation IDs** when handling requests (generate request ID at entry).
- **Development transport:** `pino-pretty` auto-enabled in non-production.

### Imports
- **Group imports** in this order: React/Next.js, External libs (alphabetical), Internal libs (`@/lib`), Components (`@/components`), Relative.
- **Use `@/` alias**; never deep relative paths.
- **Prefer named exports** over default.
- **Avoid circular dependencies**.

## Security Requirements

### Authentication
- **Always verify auth** before protected actions: `const session = await auth();` in API routes and Server Actions. Return 401 if unauthorized.
- **Passwords/tokens** must be hashed (bcrypt cost 12).
- **Session cookies:** Managed by `better-auth` (default: `better-auth.session_token`).
- **Never expose user IDs or emails** in error messages.

### Authorization
- **Project-level RBAC** must check `project_members` table, not just a global user role. Use `src/lib/rbac.ts` helpers.
- **Admin actions** require both authentication and explicit membership checks.

### Secrets Management
- **Never commit secrets.** Use `.env.local` locally; environment variables in production.
- **All environment variables** validated in `src/lib/env-core.ts` (Zod). Use `@/lib/env` or `@/lib/env-script`.
- **`NEXTAUTH_SECRET`** must be long and random.

### Rate Limiting
- Protect public APIs with `@upstash/ratelimit` + Redis per IP or user ID. Return 429 when limit exceeded.

### Audit Logging
- Critical state changes (user creation, project updates, permission changes) must log to `audit_log` within same DB transaction. Include actor ID, action, resource type, resource ID, timestamp.

## Testing Requirements

- **Vitest** for unit tests (`pnpm test:unit`). Mock Drizzle DB with test doubles.
- **Playwright** for E2E (`pnpm test:e2e`). Use ARIA-first selectors (`getByRole`). Tests may mock API calls in `tests/mocks` without live DB for UI runs.
- **Coverage target:** ≥80% on repository business logic.
- **Mock external services only**; don't mock system under test.
- **Write tests** alongside implementation.

### Test Structure
```typescript
describe('ProjectRepository', () => {
  describe('getById', () => {
    it('should return project when found', async () => {
      const repository = new ProjectRepository();
      const result = await repository.getById(1);
      expect(result).toEqual(expectedProject);
    });
    it('should return null when not found', async () => {
      const result = await repository.getById(999);
      expect(result).toBeNull();
    });
  });
});
```

## Environment Variables

Never access `process.env` directly.

**For Next.js code:**
```typescript
import { env } from '@/lib/env'; // server-only protected
```

**For standalone scripts:**
```typescript
import { env } from '@/lib/env-script'; // no server-only
```

**Validated schema** (env-core.ts):
- `DATABASE_URL` (required, URL)
- `DATABASE_URL` (required, URL)
- `NEXTAUTH_SECRET` (required, string) - Reused as Better Auth secret
- `NODE_ENV` (default 'development')

**Never import** from `env-core.ts` directly; use the wrappers above.

## Common AI Agent Mistakes

**Package & Commands**
1. Using `npm` or `yarn` - always `pnpm`.
2. Forgetting `--frozen-lockfile` in CI install.
3. Running `db:seed` without `db:push` first.

**TypeScript & Types**
4. Using `as Type` instead of type guards.
5. Duplicating Zod/Drizzle types manually.
6. Introducing `any` types.
7. Omitting explicit return types.
8. Ignoring strict null checks (`null`/`undefined`).

**Database**
9. Direct `db` calls in components; bypassing repositories.
10. Multi-step writes without transaction.
11. Using raw SQL (`db.execute` or template literals).
12. Not using `executeQuery` in repository methods.
13. Editing or deleting files in `drizzle/` migrations.

**Security & Auth**
14. Forgetting `await auth()` before protected actions.
15. Checking only global user role, ignoring project membership.
16. Logging sensitive data (passwords, tokens) via Pino.
17. Hardcoding secrets in code.
18. Missing rate limiting on public endpoints.
19. Forgetting to log audit events in same transaction.
20. Using `auth.api.getSession` in server components instead of the `auth()` helper.

**API & Validation**
20. Skipping Zod validation on inputs.
21. Returning raw error objects to client.
22. Using `pages/api` (Pages Router) instead of App Router.
23. Incorrect HTTP status codes (using 200 for errors).
24. Not awaiting `params`, `searchParams`, `cookies`, `headers` in Next.js 16.
25. Using Route Handlers for simple button clicks (use Server Actions instead).

**Server Actions**
26. Throwing from Server Action; should return `{ success, error }`.
27. Forgetting `'use server'` directive.
28. Not calling `revalidatePath` or `updateTag` after mutations.

**Styling**
29. Hardcoded hex colors; use design tokens.
30. Adding custom CSS instead of Tailwind utility classes.
31. Creating new CSS files for minor tweaks; extend existing tokens.

**General**
32. Adding `console.log`/`console.error`; use Pino.
33. Duplicating logic instead of reusing repositories/helpers.
34. Skipping tests for new features.
35. Leaving `// TODO` or `// FIXME` without creating follow-up issue.
36. Committing dead/commented-out code.
37. Large PRs (>300 lines) without discussion.
38. Creating fix scripts (`fix.mjs`) instead of editing sources directly.
39. Not checking for outdated dependencies regularly.
40. Ignoring pnpm audit security warnings.
41. Committing AI artifact files (`*.exp`, `*_output.txt`, `*_results.txt`, `migrate-*.ts`).

## Prohibited Patterns

**These patterns are strictly forbidden:**

- NO using `any` to bypass type checking.
- NO forgetting to `await` Next.js dynamic APIs (`params`, `cookies`, `headers`, `searchParams`).
- NO implicit types or duplicating schema types; always infer.
- NO `useEffect` for data fetching.
- NO Pages Router (`pages/api`, `getServerSideProps`, `getStaticProps`).
- NO manual mutation of `drizzle/` migration files.
- NO `process.env` access outside `@/lib/env` or `@/lib/env-script`.
- NO Route Handlers for UI button clicks (use Server Actions).
- NO throwing errors from Server Actions; return `{ success: false, error }`.
- NO `npm` or `yarn`; always `pnpm`.
- NO `console.log`/`console.error` in production code; use Pino.
- NO direct DB calls in components; use repositories.
- NO hardcoded colors/sizes; always use design tokens.
- NO committing temporary fix scripts (`*.mjs`).
- NO committing unused files (dead code, backups).
- NO committing AI artifact files (`*.exp`, `*_output.txt`, `*_results.txt`, `migrate-*.ts`).

## Server Actions Pattern

**Recommended** for UI-driven mutations colocated with components. Note: `src/actions/` directory does not yet exist; follow this pattern when adding Server Actions.

```typescript
// app/actions/create-project.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { projectRepository } from '@/repositories/project-repository';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
});

export async function createProject(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } };
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string | null;

  const result = schema.safeParse({ name, description });
  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT', details: result.error.errors } };
  }

  try {
    const project = await projectRepository.create({
      name,
      description,
      createdBy: session.user.id,
    });
    revalidatePath('/dashboard');
    return { success: true, data: project };
  } catch (error) {
    logger.error('Failed to create project', { error, userId: session.user.id });
    return { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create project' } };
  }
}
```

**Key rules:**
- `'use server'` at the very top.
- Call `await auth()` for session.
- Validate with Zod; return validation errors in `{ success: false, error: { code, details } }`.
- Never throw; always return structured objects.
- Use `revalidatePath` or `updateTag` for cache invalidation.
- Import `@/lib/env` if needed (server-only protection).

## Automated Branch Review & Documentation

Before submitting any Pull Request:

1. Create directory `documentation/branches/{branch-name}`.
2. Inside, create `BRANCH_CHANGES.md` with a markdown table:
   `File Name | Summary of Changes | Summary Reason for Change | Expected Impact | Best Practice Evaluation Score (e.g., 8/10 because ...) | Reason for Deletion` (or 'not deleted').
3. At the end, include a summary of any changes to CI config or test files and why.
4. Create `BRANCH_CODE_REVIEW.md`. Write a thoughtful senior review of the changes, listing problems and improvements with reasoning.
5. Commit these documentation files as part of final pre-commit steps before invoking `submit`.

## Summary

Specdrivr enforces strict type safety, security, and performance standards. Always use repositories, validate inputs with Zod, log with Pino, and avoid prohibited patterns. When in doubt, consult `documentation/DEVELOPMENT.md` for implementations and `CLAUDE.md` for AI-specific constraints. Cross-reference all three docs to maintain consistency.

Remember: your changes will be reviewed by humans and automated systems. Follow these guidelines precisely.

<!-- Keep this file under 500 lines total -->
