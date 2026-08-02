# AGENTS.md | AI Agent Guide | Canonical Specification

**AI Agent Operations Manual** for Specdrivr - an AI-native orchestration platform.

> **This is the canonical, shared ruleset for all AI coding agents.** `CLAUDE.md` and `GEMINI.md`
> are short, tool-specific supplements — they point back here rather than restating these rules.
> For human contributor guidance, see `documentation/infrastructure/DEVELOPMENT.md`.

## 1. Purpose

Define absolute behavioral anchors, technical constraints, and architectural mandates. Compliance is mandatory; deviations cause system integrity failure.

## 2. Tech Stack Overview

Specdrivr is built on a modern, high-performance stack optimized for AI-native development:

- **Core Framework**: Next.js 16.1.6 (App Router) + React 19.2.4.
- **Language**: TypeScript 5.9.3 with strictly enforced safety rules.
- **Database**: PostgreSQL @16+ with Drizzle ORM 0.45.1.
- **Authentication**: `better-auth` 1.5.5 with Drizzle session management.
- **Styling**: Tailwind CSS 4.2.1 for utility-first layout.
- **UI Architecture**: UI components are standardized on `shadcn/ui`.
- **Safety**: Zod 3.22 for runtime validation; Pino 10.3 for structured logging.

## 3. Key Project Files & Directories

Orientation for agents navigating the codebase:

- **`documentation/`**: Canonical docs.
  - **Product Status**: `PRODUCT_MAP.md` (Check this first).
  - **One-Shot Success**: `documentation/infrastructure/CODING_PATTERNS.md` & `documentation/infrastructure/DIRECTORY_MAP.md`.
  - **Self-Healing**: `documentation/infrastructure/TROUBLESHOOTING.md`.
- **`src/repositories/`**: Single source of truth for all database access.
- **`src/actions/`**: Server Actions for mutations.
- **`src/queries/`**: Shared read-only logic.

## 4. Agentic Tool Strategies

To maximize efficiency and minimize context window usage:

- **Grep-First Research**: Use `grep_search` with `include_pattern` (e.g., `src/repositories/**`) to find implementation examples before reading entire files.
- **Vertical Research**: When working on a feature, read its corresponding `documentation/modules/*.md` file first. It contains the logic, UI, and "Agent Handbook" for that slice.
- **Surgical Modifications**: Always use `replace` for targeted edits. Avoid `write_file` for large existing files to prevent accidental regression.

## 5. Design System Summary

_See `documentation/infrastructure/DESIGN_SYSTEM.md` for full specifications._

- **Visual Aesthetic**: "Linear" style—matte surfaces, subtle borders, high contrast, obsidian-tinted interactive states.
- **Design Tokens**: Defined as CSS variables in `globals.css`. Never use hex codes.
- **Component Selection**:
  1. **shadcn/ui**: Standard interface controls (Button, Input). Prefer standard components.
  2. **Custom**: Only use custom components when absolutely necessary; must inherit from `documentation/infrastructure/DESIGN_SYSTEM.md`.
- **Import Standard**:
  - Components: `import { Button } from '@/components/ui/button'`.
  - Icons: `import { Check } from 'lucide-react'` (or preferred icon set).
- **Token names**: This project does not use the generic shadcn tokens `bg-background`, `text-foreground`, or `bg-destructive`. Use the project's own tokens instead — e.g. `bg-[--bg-base]`, `text-[--text-primary]`, `bg-[--status-red]`.

## 6. Git Hooks & Integrity Protection

The project uses Husky to enforce quality at the local boundary.

- **`.husky/pre-commit`**: Automatically runs `pnpm lint` and `pnpm typecheck`.
- **`.husky/pre-push`**: A thin orchestrator that hands off to `scripts/hooks/prepush.sh`, which runs the modular checks in `scripts/hooks/checks/` (including `pnpm test`) and verifies hook checksums.
- **Hook Integrity**: SHA256 checksums in `.husky/hooks-checksum.txt` prevent tampering.

### Bypass Protocol (Emergency Only)

Bypassing hooks should be rarer than 1 in 100 operations.

1. **Root Cause Analysis (RCA)**: Perform a deep audit to ensure the failure isn't masking a critical bug or architectural regression.
2. **Justification**: If a bypass is necessary (e.g., environment-specific test flake during doc update), document the rationale in `BRANCH_CHANGES.md`.
3. **Execution**: Use `git push --no-verify` ONLY if the RCA confirms safety OR the user provides a direct order.

## 7. Core Engineering Rules

- **Package Manager**: Use `pnpm` exclusively. Never use `npm` or `yarn`.
- **Workflow**: One logical change per PR on feature/bugfix branches.
- **TypeScript**: Strict mode. No `any`. Explicit return types. Infer from Zod/Drizzle.

## 8. Architecture & Component Rules

- **RSC Patterns**: Server Components by default. `"use client"` only for interactivity/state.
- **Boundary Preservation**: Never import Server Components into Client Components (this silently downgrades them to Client Components).
- **Repositories**: Never import `db` in components. Use repository methods wrapped in `executeQuery`.
- **Data fetching**: Never use `useEffect` for data fetching — use Server Components instead.

## 9. Database Access Rules

- **Migrations**: Generate via `pnpm db:generate`; apply via `pnpm db:migrate`. NEVER `db:push`.
- **Transactions**: Multi-step writes must wrap in `db.transaction(async (tx) => { ... })`.
- **Enums**: The migration is the single source of truth for enum values — keep application code enums in sync with what's actually in `drizzle/` (e.g. `completed` vs `complete`).

## 10. API & Server Action Patterns

- **Auth First**: Call `await auth()` as the first line in all protected actions — before any other `await`.
- **Validation**: Zod is the single source of truth. Always use `.safeParse()` at boundaries.
- **Never throw**: Server Actions must return `{ success, error }` shaped objects, never throw.
- **Directive**: Every Server Action file needs `'use server'` at the very top.
- **Cache invalidation**: Call `revalidatePath` or `revalidateTag` after mutations. Never call `revalidatePath('/')` globally.
- **Route Handlers vs. Server Actions**: Don't use a Route Handler for a simple UI-driven mutation (e.g. a button click) — use a Server Action instead. Route Handlers are for webhooks, external API consumers, and non-form use cases.

**Example — `src/actions/create-project.ts`:**

```typescript
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

## 11. Middleware Rules

- Middleware lives only at `src/middleware.ts` — never add middleware files inside `app/`.
- Always configure a `matcher`; without one, middleware runs on every request including static assets.
- Never import repositories or Drizzle into middleware (it runs on the Edge runtime).
- Never manually edit `next-env.d.ts` — it is auto-generated by Next.js.

## 12. UI Components & Styling Rules

- Never write a custom component when a `shadcn/ui` equivalent exists.
- No hardcoded hex colors — use design tokens from `src/app/globals.css`.
- No custom CSS files for minor tweaks — extend existing tokens, use Tailwind utility classes.
- Never modify `shadcn/ui` source files under `@/components/ui/`; customize via CSS variables only.
- Before building a new screen, check the **Modular Specifications** (`documentation/modules/*.md`) for the planned flow and layout.
- No visual decisions (color, spacing, typography, layout) without consulting `documentation/infrastructure/DESIGN_SYSTEM.md`.
- Promote one-off inline style values that appear more than once to a design token.
- All client-side `fetch` calls to authenticated routes must include `{ credentials: 'include' }`.

## 13. Security Requirements

- **RBAC**: Use `src/lib/rbac.ts` for project-level permission checks.
- **XSS**: Sanitize all user HTML via `DOMPurify.sanitize()` before using `dangerouslySetInnerHTML`.
- **Secrets**: Import from `@/lib/env`. Never access `process.env` directly outside `@/lib/env` or `@/lib/env-script`.

## 14. Logging & Observability

- **Pino Standard**: Use `logger` (server) or `clientLogger` (client). Include Correlation IDs.
- Never use `console.log`/`console.error`/`console.warn` in feature code.

## 15. Testing Requirements

- **Coverage**: Target >=80% on business logic/repositories.
- **Integrity**: Never use `.only`/`.skip` in committed tests.
- **CI database URLs**: Use `127.0.0.1`, not `localhost`, in CI — `localhost` can resolve to IPv6 first and cause `ECONNREFUSED`. Pair with `NODE_OPTIONS="--dns-result-order=ipv4first"`.
- **Static assets in middleware**: Bypass static asset paths (check for a `.` in the path) in `proxy.ts`/middleware, or you'll get MIME-type mismatches and redirect loops.
- **Env validation in tests**: Vitest must provide 32-char defaults for secrets in `env-core.ts`, or environment validation will throw `undefined` errors.
- **CI workflow parity**: Keep service configuration consistent between `test.yml` and `code-quality.yml` workflows.

## 16. Common Agent Mistakes

- Missing `await auth()` first.
- Direct `db` imports in components.
- Hex codes in CSS/Tailwind (use design tokens).
- Duplicating types instead of using `typeof`.
- Writing a custom component when a `shadcn/ui` equivalent exists.
- Building a new screen without checking the **Modular Specifications** first.
- Adding `console.log`/`console.error` instead of using Pino.
- Duplicating logic instead of reusing repositories/helpers.
- Skipping tests for new features.
- Leaving `// TODO` or `// FIXME` without creating a follow-up issue.
- Committing dead/commented-out code.
- Large PRs (>300 lines) without discussion.
- Creating one-off fix scripts (`fix.mjs`) instead of editing sources directly.
- Not checking for outdated dependencies regularly, or ignoring `pnpm audit` warnings.
- Committing AI artifact files (`*.exp`, `*_output.txt`, `*_results.txt`, `migrate-*.ts`).

## 17. Prohibited Patterns

**These patterns are strictly forbidden:**

- NO using `any` to bypass type checking.
- NO forgetting to `await` Next.js dynamic APIs (`params`, `cookies`, `headers`, `searchParams`).
- NO implicit types or duplicating schema types; always infer.
- NO `useEffect` for data fetching.
- NO Pages Router (`pages/api`, `getServerSideProps`, `getStaticProps`).
- NO manual mutation of `drizzle/` migration files.
- NO editing `next-env.d.ts` — it is auto-generated.
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
- NO `dangerouslySetInnerHTML` without `DOMPurify.sanitize()`.
- NO middleware files outside `src/middleware.ts`.
- NO importing Server Components into Client Components.
- NO custom component when a `shadcn/ui` equivalent exists.
- NO visual decisions (color, spacing, typography, layout) without consulting `documentation/infrastructure/DESIGN_SYSTEM.md`.
- NO new screens built without referencing the **Modular Specifications** for flow and layout context.
- NO hardcoded visual values in custom components; always use CSS variable design tokens.

## 18. Closing Rituals (Task Completion)

Every task must end with these steps:

1. **Verification**: Run `pnpm test` and `pnpm lint`.
2. **Branch Documentation**: Before submitting any Pull Request:
   - Create directory `documentation/branches/{branch-name}`.
   - Create `BRANCH_CHANGES.md` with a markdown table:
     `File Name | Summary of Changes | Summary Reason for Change | Expected Impact | Best Practice Evaluation Score (e.g., 8/10 because ...) | Reason for Deletion` (or 'not deleted').
   - At the end of `BRANCH_CHANGES.md`, include a summary of any changes to CI config or test files and why.
   - Create `BRANCH_CODE_REVIEW.md`: a thoughtful senior review of the changes, listing problems and improvements with reasoning.
   - Commit these documentation files as part of the final pre-commit steps.
3. **Final Summary**: Provide an Executive Summary, Completion Statement, and a checklist of deliverables.

## 19. Standard Commands Reference

| Scope     | Command                          |
| --------- | --------------------------------- |
| Install   | `pnpm install --frozen-lockfile` |
| Dev       | `pnpm dev`                       |
| Build     | `pnpm build`                     |
| Lint      | `pnpm lint`                      |
| Format    | `pnpm format`                    |
| Typecheck | `pnpm typecheck`                 |
| DB Gen    | `pnpm db:generate`               |
| DB Mig    | `pnpm db:migrate`                |
| DB Seed   | `pnpm db:seed`                   |
| Test      | `pnpm test`                      |
| Unit Test | `pnpm test:unit`                 |
| E2E Test  | `pnpm test:e2e`                  |

## Summary

Specdrivr enforces strict type safety, security, and performance standards. Always use repositories, validate inputs with Zod, log with Pino, and avoid prohibited patterns. When in doubt, consult `documentation/infrastructure/DEVELOPMENT.md` for implementations, `CLAUDE.md` for Claude-specific constraints, and `GEMINI.md` for Gemini-specific constraints. Cross-reference all three docs to maintain consistency.

Remember: your changes will be reviewed by humans and automated systems. Follow these guidelines precisely.

<!-- Keep this file under 500 lines total -->
