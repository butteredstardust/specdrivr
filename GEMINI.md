# GEMINI.md | Gemini Code Assistant | Keep under 500 lines

**Specdrivr AI-native orchestration platform**

---

## Core Principles

### Technical Stack
| Component | Version |
|-----------|---------|
| Framework | Next.js 16.1.6 + React 19.2.4 + TypeScript 5.9.3 |
| Database | PostgreSQL + Drizzle ORM 0.45.1 |
| UI | pxlkit/ui, shadcn/ui, Tailwind CSS 4.2.1 |
| Auth | better-auth 1.5.4 |
| Validation | Zod 3.22.0 |
| Testing | Vitest 4 + Playwright 1.42 |
| Package | `pnpm` (never npm/yarn) |

### Project Fundamentals
- **Zero `any` types** - Use explicit types or `unknown` + type guards
- **No `as Type`** - Use type guards
- **Repository pattern** - Never import `db` directly
- **`executeQuery` wrapper** on all repository methods
- **Zod validation** at every boundary
- **`await auth()` FIRST** before other awaits
- **Never throw** from Server Actions
- **Pino logging** only (`/lib/logger.ts`)
- **No bypassing hooks** - Multi-layer protection

---

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── api/         # API routes
│   ├── layout.tsx   # Root layout
│   ├── page.tsx     # Home page
│   └── error.tsx    # Error boundary
├── components/      # React components
│   └── ui/         # pxlkit/ui or shadcn/ui (do not modify)
├── repositories/    # Data access layer (use this, never db directly)
├── lib/            # Utilities (logger, env, errors, schemas, auth)
├── db/             # Database connection and Drizzle schema
├── types/          # Type definitions
├── hooks/          # Custom hooks (client-only)
└── actions/        # Server actions
```

**Key paths:** `@/lib/logger`, `@/lib/env` (Next.js), `@/lib/env-script` (standalone)

---

## Naming Conventions

| Category | Convention | Examples |
|----------|-----------|----------|
| Components | PascalCase.tsx | `UserProfile.tsx`, `ProjectList.tsx` |
| Utilities | kebab-case.ts | `format-date.ts`, `api-client.ts` |
| Repositories | kebab-case-repository.ts | `user-repository.ts` |
| API Routes | kebab-case/ directory | `api/users/route.ts` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRY_COUNT` |
| Functions | camelCase, action-oriented | `fetchUser()`, `createProject()` |
| Booleans | is/has/should prefix | `isLoading`, `hasPermission` |
| Arrays | Plural names | `users`, `projects` |
| Interfaces | PascalCase | `UserData`, `ProjectConfig` |
| Types | PascalCase | `UserId`, `ProjectStatus` |

---

## Import Guidelines

**Order:**
1. React, Next.js (`import { useState } from 'react'`)
2. External libraries (`import { z } from 'zod'`)
3. Internal lib files (`import { logger } from '@/lib/logger'`)
4. Components (`import { Button } from '@/components/ui/button'`)
5. Relative imports (`import { helper } from './helper'`)

**Use path mapping:** `@/` alias, no relative paths from deep directories

**Prefer:** `import type` for type-only imports

---

## Essential Commands

```bash
pnpm install --frozen-lockfile    # Install
pnpm dev                         # Dev server
pnpm build                       # Production
pnpm lint                        # Lint
pnpm test                        # Unit tests
pnpm test:e2e                    # E2E tests
pnpm db:generate                 # Generate migrations
pnpm db:push                     # Push schema (local)
pnpm db:migrate                  # Apply migration (prod)
```

---

## Code Patterns

### TypeScript Type Inference
```typescript
// Always infer from Drizzle/Zod
type User = typeof users.$inferSelect;
type NewUser = typeof users.$inferInsert;
type UserSchema = z.infer<typeof userSchema>;

// Type guard over assertion
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}
```

### Repository Pattern (Required)
```typescript
import { executeQuery } from '@/lib/base-repository';

async function getUser(id: number) {
  return executeQuery(async () => {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  });
}
```

### API Route (Standard Response)
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    );
  }

  const data = await repository.create(result.data);
  return NextResponse.json({ success: true, data }, { status: 201 });
}
```

### Server Action
```typescript
'use server';

export async function createUser(formData: FormData) {
  const session = await auth(); // FIRST
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED' } };
  }

  const result = schema.safeParse(formData);
  if (!result.success) {
    return { success: false, error: { code: 'INVALID_INPUT' } };
  }

  try {
    const data = await repository.create(result.data);
    revalidatePath('/users');
    return { success: true, data };
  } catch (error) {
    logger.error('Failed to create user', { error });
    return { success: false, error: { code: 'INTERNAL_ERROR' } };
  }
}
```

### Error Handling
```typescript
import { NotFoundError, ValidationError } from '@/lib/errors';
import { handleApiError } from '@/lib/api-error-handler';

// For API routes
try {
  const result = await operation();
  return NextResponse.json({ success: true, data: result });
} catch (error) {
  return handleApiError(error); // Consistent error format
}

// Custom errors
if (!project) {
  throw new NotFoundError('Project', id);
}
```

### Testing (AAA Pattern)
```typescript
describe('ProjectRepository', () => {
  it('should return project when found', async () => {
    // Arrange
    const repository = new ProjectRepository();

    // Act
    const result = await repository.getById(1);

    // Assert
    expect(result).toEqual(expectedProject);
  });
});
```

---

## Rules

### TypeScript
- No `any` types - use `unknown` + type guards
- Explicit return types on all functions
- Infer from: `table.$inferSelect`, `z.infer<typeof schema>`
- Interface for objects, type alias for unions
- `import type` for type-only imports

### Database
- Always use repositories - never direct `db`
- Wrap with `executeQuery` in all repository methods
- `db.transaction()` for multi-step writes
- Use Drizzle query builder only
- `pnpm db:generate` for schema changes
- Never modify files in `drizzle/`
- Never use raw SQL in migrations

### Components
- Server Components by default
- `"use client"` only for: event handlers, browser APIs, hooks, state
- Never import Server Components into Client Components
- No `useEffect` for data fetching
- Error boundaries at route segments
- `loading.tsx` for route loading states

### UI
**Component tiers (exhaust each):**
1. `@pxlkit/*` packages
2. `pxlkit/ui` or `shadcn/ui` in `@/components/ui/`
3. Custom (last resort)

**Styling:**
- CSS variables only: `var(--brand-primary)`, `var(--destructive)`
- Tailwind utilities
- No hex codes inline
- Named imports for design tokens

### Environment
- Next.js code: `@/lib/env` (has server-only protection)
- Standalone scripts: `@/lib/env-script` (safe for CLI tools)
- Never import from `env-core.ts`
- Never `process.env` directly

### Security
- Rate limit public APIs: `@upstash/ratelimit`
- Project-level RBAC: check `project_members` table
- Sanitize HTML: `DOMPurify.sanitize()` before rendering
- Never log or commit secrets
- Audit log critical state changes

### Hook Protection
Multi-layer defense ensures quality checks run:

1. **Local integrity**: SHA256 checksums in `.husky/hooks-checksum.txt`
2. **Bypass detection**: Git config monitoring
3. **CI/CD guard**: GitHub Actions verification
4. **Audit trail**: All commits/pushes logged

**Commands:**
```bash
node scripts/verify-hooks.js verify    # Check integrity
node scripts/verify-hooks.js generate  # Update checksums
node scripts/audit-hooks.js show       # View audit logs
```

**Never:**
- `--no-verify` flag
- Uninstall/disable husky
- Modify hooks without updating checksums

---

## Common Mistakes (AI + General)

1. `any` types
2. `as Type` assertions (use type guards)
3. Direct `db` imports (use repositories)
4. No `.safeParse()` validation
5. `console.log` (use Pino logger)
6. Forget `await auth()` FIRST
7. No `executeQuery` wrapper
8. Forgetting to `await` dynamic APIs (`params`, `searchParams`, `cookies` in Next.js 16)
9. Throwing from Server Actions (return `{ success: false, error }`)
10. Using `npm` instead of `pnpm`
11. Bypassing hooks (`--no-verify`)
12. Importing Server Components into Client components
13. `useEffect` for data fetching (use Server Components)
14. Editing `next-env.d.ts`
15. Committing secrets or AI artifacts

**AI-Specific Pitfalls:**
- Importing from `env-core.ts` instead of `env.ts`/`env-script.ts`
- Using hex values instead of CSS variables
- Missing `await` on Next.js 16 dynamic APIs
- Using API Routes for UI mutations (use Server Actions)
- Direct DB access bypassing repositories
- Missing error boundaries
- Not using `server-only` imports appropriately

**Never commit:**
- Secrets (`.env`, credentials)
- Modified hooks without checksums
- Infrastructure configs
- Raw SQL scripts
- One-time scripts
- AI artifacts

---

## Gemini-Specific

**Response Format Requirements:**
- Provide complete, runnable code snippets
- Include type annotations for all functions
- Add inline comments explaining why, not what
- Reference file paths: `filename.ts#L42`

**Testing Workflow:**
1. Run `pnpm test` before suggesting changes
2. Include test updates in your responses
3. Aim for high test coverage

**Branch Documentation:**
Before finishing work, create:
- `documentation/branches/{branch-name}/BRANCH_CHANGES.md` - change log
- `documentation/branches/{branch-name}/BRANCH_CODE_REVIEW.md` - review notes

**Task Completion:**
Every completed task must end with:
1. **Executive Summary** (1-3 sentences)
2. **Completion Statement** - "Task ID fully complete"
3. **Checklist** using `[x]` markdown for deliverables

---

## Cross-Reference

- **Agent operations:** `AGENTS.md`
- **Claude Code:** `CLAUDE.md`
- **Human practices:** `documentation/DEVELOPMENT.md`

---

*[Keep under 500 lines]*
