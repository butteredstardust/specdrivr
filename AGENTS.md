# AGENTS.md | AI Agent Guide | Canonical Specification

**AI Agent Operations Manual** for Specdrivr - an AI-native orchestration platform.

> **Cross-reference:** For AI-specific adapters, see `CLAUDE.md` and `GEMINI.md`. For human guidance, see `documentation/DEVELOPMENT.md`.

## 1. Purpose

Define absolute behavioral anchors, technical constraints, and architectural mandates. Compliance is mandatory; deviations cause system integrity failure.

## 2. Tech Stack Overview

Specdrivr is built on a modern, high-performance stack optimized for AI-native development:

- **Core Framework**: Next.js 16.1.6 (App Router) + React 19.2.4.
- **Language**: TypeScript 5.9.3 with strictly enforced safety rules.
- **Database**: PostgreSQL @16+ with Drizzle ORM 0.45.1.
- **Authentication**: `better-auth` 1.5.4 with Drizzle session management.
- **Styling**: Tailwind CSS 4.2.1 for utility-first layout.
- **UI Architecture**: UI components are standardized on `shadcn/ui`.
- **Safety**: Zod 3.22 for runtime validation; Pino 10.3 for structured logging.

## 3. Key Project Files & Directories

Orientation for agents navigating the codebase:

- **`documentation/`**: Canonical docs.
  - **Product Status**: `PRODUCT_MAP.md` (Check this first).
  - **One-Shot Success**: `infrastructure/CODING_PATTERNS.md` & `infrastructure/DIRECTORY_MAP.md`.
  - **Self-Healing**: `infrastructure/TROUBLESHOOTING.md`.
- **`src/repositories/`**: Single source of truth for all database access.
- **`src/actions/`**: Server Actions for mutations.
- **`src/queries/`**: Shared read-only logic.

## 4. Agentic Tool Strategies

To maximize efficiency and minimize context window usage:

- **Grep-First Research**: Use `grep_search` with `include_pattern` (e.g., `src/repositories/**`) to find implementation examples before reading entire files.
- **Vertical Research**: When working on a feature, read its corresponding `documentation/modules/*.md` file first. It contains the logic, UI, and "Agent Handbook" for that slice.
- **Surgical Modifications**: Always use `replace` for targeted edits. Avoid `write_file` for large existing files to prevent accidental regression.

## 5. Closing Rituals (Task Completion)

Every task must end with these steps:

1.  **Verification**: Run `pnpm test` and `pnpm lint`.
2.  **Branch Documentation**:
    - Update/Create `documentation/branches/{branch}/BRANCH_CHANGES.md`.
    - Update/Create `documentation/branches/{branch}/BRANCH_CODE_REVIEW.md`.
3.  **Final Summary**: Provide an Executive Summary, Completion Statement, and a checklist of deliverables.

## 6. Design System Summary

_See `DESIGN_SYSTEM.md` for full specifications._

- **Visual Aesthetic**: "Linear" style—matte surfaces, subtle borders, high contrast, obsidian-tinted interactive states.
- **Design Tokens**: Defined as CSS variables in `globals.css`. Never use hex codes.
- **Component Selection**:
  1. **shadcn/ui**: Standard interface controls (Button, Input). Prefer standard components.
  2. **Custom**: Only use custom components when absolutely necessary; must inherit from `DESIGN_SYSTEM.md`.
- **Import Standard**:
  - Components: `import { Button } from '@/components/ui/button'`.
  - Icons: `import { Check } from 'lucide-react'` (or preferred icon set).

## 5. Git Hooks & Integrity Protection

The project uses Husky to enforce quality at the local boundary.

- **`.husky/pre-commit`**: Automatically runs `pnpm lint` and `pnpm typecheck`.
- **`.husky/pre-push`**: Automatically runs `pnpm test` and verifies hook checksums.
- **Hook Integrity**: SHA256 checksums in `.husky/hooks-checksum.txt` prevent tampering.

### Bypass Protocol (Emergency Only)

Bypassing hooks should be rarer than 1 in 100 operations.

1. **Root Cause Analysis (RCA)**: Perform a deep audit to ensure the failure isn't masking a critical bug or architectural regression.
2. **Justification**: If a bypass is necessary (e.g., environment-specific test flake during doc update), document the rationale in `BRANCH_CHANGES.md`.
3. **Execution**: Use `git push --no-verify` ONLY if the RCA confirms safety OR the user provides a direct order.

## 6. Core Engineering Rules

- **Package Manager**: Use `pnpm` exclusively. Never use `npm` or `yarn`.
- **Workflow**: One logical change per PR on feature/bugfix branches.
- **TypeScript**: Strict mode. No `any`. Explicit return types. Infer from Zod/Drizzle.

## 7. Architecture & Component Rules

- **RSC Patterns**: Server Components by default. `"use client"` only for interactivity/state.
- **Boundary Preservation**: Never import Server Components into Client Components.
- **Repositories**: Never import `db` in components. Use repository methods wrapped in `executeQuery`.

## 8. Database Access Rules

- **Migrations**: Generate via `pnpm db:generate`; apply via `pnpm db:migrate`. NEVER `db:push`.
- **Transactions**: Multi-step writes must wrap in `db.transaction(async (tx) => { ... })`.

## 9. API & Server Action Patterns

- **Auth First**: Call `await auth()` as the first line in all protected actions.
- **Validation**: Zod is the single source of truth. Always use `.safeParse()` at boundaries.

## 10. Security Requirements

- **RBAC**: Use `src/lib/rbac.ts` for project-level permission checks.
- **XSS**: Sanitize all user HTML via `DOMPurify.sanitize()`.
- **Secrets**: Import from `@/lib/env`. Never access process[dot]env directly.

## 11. Logging & Observability

- **Pino Standard**: Use `logger` (server) or `clientLogger` (client). Include Correlation IDs.

## 12. Testing Requirements

- **Coverage**: Target >=80% on business logic/repositories.
- **Integrity**: Never use `.only`/`.skip` in committed tests.

## 13. Common Agent Mistakes

- Missing `await auth()` first.
- Direct `db` imports in components.
- Hex codes in CSS/Tailwind (use design tokens).
- Duplicating types instead of using `typeof`.
- **Custom UI**: Writing a custom component when a `shadcn/ui` equivalent exists.

## 14. Prohibited Patterns

- NO `any` usage.
- NO unawaited Next.js dynamic APIs (`params`, `searchParams`, etc.).
- NO `useEffect` for data fetching.
- NO writing custom components when a `shadcn/ui` equivalent exists.
- NO visual decisions without consulting `DESIGN_SYSTEM.md`.

## 15. Standard Commands Reference

| Scope   | Command                          |
| ------- | -------------------------------- |
| Install | `pnpm install --frozen-lockfile` |
| Dev     | `pnpm dev`                       |
| DB Gen  | `pnpm db:generate`               |
| DB Mig  | `pnpm db:migrate`                |
| Test    | `pnpm test`                      |
| Lint    | `pnpm lint`                      |

`, `cookies`, `headers` in Next.js 16. 30. Using Route Handlers for simple button clicks (use Server Actions instead).

**Server Actions** 31. Throwing from Server Action; should return `{ success, error }`. 32. Forgetting `'use server'` directive. 33. Not calling `revalidatePath` or `revalidateTag` after mutations.

**Middleware** 34. Adding middleware inside `app/` directory instead of `src/middleware.ts`. 35. Missing `matcher` config — middleware runs on static assets. 36. Importing repositories or Drizzle into middleware. 37. Manually editing `next-env.d.ts`.

**UI Components & Styling** 38. Writing a custom component when a `shadcn/ui` equivalent exists. 39. Hardcoded hex colors; use design tokens from `src/app/globals.css`. 40. Adding custom CSS instead of Tailwind utility classes. 41. Creating new CSS files for minor tweaks; extend existing tokens. 42. Modifying `shadcn/ui` source files in `@/components/ui/`; customize via CSS variables only. 43. Building a new screen without checking the **Modular Specifications** for planned flow and layout. 44. Making visual decisions without consulting `DESIGN_SYSTEM.md`. 45. Using one-off inline styles for values that appear more than once — promote to a design token.

**Component Architecture** 47. Importing a Server Component into a Client Component (silent downgrade). 48. Using `useEffect` for data fetching instead of Server Components.

**CI & Testing** 43. Forgetting to bypass static assets in `proxy.ts` (middleware); causes MIME mismatch/redirect loops. Always check for dots (`.includes('.')`) in paths. 44. Using `localhost` in CI database URLs; causes `ECONNREFUSED`. Always use `127.0.0.1` and `NODE_OPTIONS="--dns-result-order=ipv4first"`. 45. Mismatching DB enums between code and migrations (e.g., `completed` vs `complete`). The migration is the single source of truth. 46. Skipping environment validation in tests; causes `undefined` errors. Provide 32-char defaults for secrets in `env-core.ts` during Vitest. 47. Inconsistent service configurations between `test.yml` and `code-quality.yml`.

**General** 48. Adding `console.log`/`console.error`; use Pino. 49. Duplicating logic instead of reusing repositories/helpers. 50. Skipping tests for new features. 51. Leaving `// TODO` or `// FIXME` without creating follow-up issue. 52. Committing dead/commented-out code. 53. Large PRs (>300 lines) without discussion. 54. Creating fix scripts (`fix.mjs`) instead of editing sources directly. 55. Not checking for outdated dependencies regularly. 56. Ignoring pnpm audit security warnings. 57. Committing AI artifact files (`*.exp`, `*_output.txt`, `*_results.txt`, `migrate-*.ts`).

## Prohibited Patterns

**These patterns are strictly forbidden:**

- NO using `any` to bypass type checking.
- NO forgetting to `await` Next.js dynamic APIs (`params`, `cookies`, `headers`, `searchParams`).
- NO implicit types or duplicating schema types; always infer.
- NO `useEffect` for data fetching.
- NO Pages Router (`pages/api`, `getServerSideProps`, `getStaticProps`).
- NO manual mutation of `drizzle/` migration files.
- NO editing `next-env.d.ts` — it is auto-generated.
- NO process[dot]env access outside `@/lib/env` or `@/lib/env-script`.
- NO Route Handlers for UI button clicks (use Server Actions).
- NO throwing errors from Server Actions; return `{ success: false, error }`.
- NO `npm` or `yarn`; always `pnpm`.
- NO `console.log`/`console.error` in production code; use Pino.
- NO direct DB calls in components; use repositories.
- NO hardcoded colors/sizes; always use design tokens.
- NO committing temporary fix scripts (`*.mjs`).
- NO committing unused files (dead code, backups).
- NO committing AI artifact files (`*.exp`, `*_output.txt`, `*_results.txt`, `migrate-*.ts`).
- NO `dangerouslySetInnerHTML` without `DOMPurify.sanitize()`.
- NO middleware files outside `src/middleware.ts`.
- NO importing Server Components into Client Components.
- NO custom component when a `shadcn/ui` equivalent exists.
- NO visual decisions (color, spacing, typography, layout) without consulting `DESIGN_SYSTEM.md`.
- NO new screens built without referencing the **Modular Specifications** for flow and layout context.
- NO hardcoded visual values in custom components; always use CSS variable design tokens.

## Server Actions Pattern

**Recommended** for UI-driven mutations. Place actions in `src/actions/`.

```typescript
// src/actions/create-project.ts
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
  const session = await auth(); // always first
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
    revalidatePath('/dashboard'); // use revalidateTag for tag-based invalidation
    return { success: true, data: project };
  } catch (error) {
    logger.error('Failed to create project', { error, userId: session.user.id });
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create project' },
    };
  }
}
```

**Key rules:**

- `'use server'` at the very top.
- Call `await auth()` first — before any other `await`.
- Validate with Zod `.safeParse()`; return validation errors in `{ success: false, error: { code, details } }`.
- Never throw; always return structured objects.
- Use `revalidatePath` or `revalidateTag` for cache invalidation. Never `revalidatePath('/')` globally.
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

- **Wrong component library:** Writing custom components when standard `shadcn/ui` components exist. Always use `shadcn/ui` first.
- **Wrong design system tokens:** Using bg-background, text-foreground, bg-destructive — these shadcn tokens don't exist in this project. Use bg-[--bg-base], text-[--text-primary], bg-[--status-red] etc.
- **Missing credentials on fetch:** All client fetches to authenticated routes require `{ credentials: 'include' }`.
- **Direct console calls:** Never use console.log/error/warn in feature code. Use clientLogger (client) or logger (server).
