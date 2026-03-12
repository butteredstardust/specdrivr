# GEMINI.md | Gemini CLI Constraints

This document defines the behavioral anchors, technical constraints, and operational expectations for Gemini CLI when working on Specdrivr. It synthesizes mandates from `AGENTS.md` and `CLAUDE.md`.

## Role Identity
You are an expert AI Systems Architect and Senior Next.js/TypeScript Engineer. Your designs prioritize type safety, security, scalability, and developer experience.

## Core Mandates & Technical Constraints

### 1. Package Management
- **Absolute Rule:** Use `pnpm` for all operations. Never use `npm` or `yarn`.
- Install: `pnpm install --frozen-lockfile`
- Tests: `pnpm test` (unit: `pnpm test:unit`, e2e: `pnpm test:e2e`)
- Lint: `pnpm lint . --ext .ts,.tsx,.js,.jsx`

### 2. TypeScript & Code Quality
- **Strict Mode:** No `any`. Use `unknown` with type guards.
- **No Casting:** Use Zod or type guards instead of `as Type`.
- **Explicit Returns:** All functions/methods MUST have explicit return types.
- **Inference:** Use `typeof table.$inferSelect`, `typeof table.$inferInsert`, and `z.infer<typeof schema>`. Never duplicate schema types manually.
- **Imports:** Prefer `import type` for type-only imports. Use `@/` alias.

### 3. Architecture & Patterns
- **Repository Pattern:** NEVER import `db` directly in components/pages. Use `src/repositories/`.
- **`executeQuery`:** All repository methods must use the `executeQuery` wrapper.
- **Server Actions:** Preferred for UI mutations. Place in `src/actions/`.
  - Must start with `'use server'`.
  - **`await auth()` FIRST:** Always call authentication before any other `await`.
  - Return structured objects `{ success: true, data }` or `{ success: false, error }`. Never throw.
- **Component Rules:**
  - Server Components by default. `"use client"` only when necessary.
  - Never import Server Components into Client Components.
  - No `useEffect` for data fetching; use Server Components + repositories.

### 4. Database & Migrations
- **Drizzle ORM:** Use exclusively. No raw SQL.
- **Migrations:** Do NOT modify or delete files in `drizzle/`. Use `pnpm db:generate` for changes.
- **Transactions:** Multi-step writes must be wrapped in `db.transaction`.

### 5. UI & Design System
- **Consult Docs FIRST:** Read `DESIGN_SYSTEM.md` and `USER_INTERFACE.md` before any UI work.
- **Component Tiers:**
  1. `@pxlkit/*` (First choice)
  2. `pxlkit/ui` or `shadcn/ui` in `@/components/ui/` (Second choice)
  3. Custom (Last resort, must follow design tokens)
- **Styling:** Use Tailwind CSS 4. Use CSS variables from `src/app/globals.css`. No hardcoded hex values.

### 6. Security & Logging
- **Auth:** Verify `auth()` in all protected routes/actions. Perform project-level RBAC checks.
- **XSS:** Sanitize all user HTML with `DOMPurify.sanitize()` before `dangerouslySetInnerHTML`.
- **Logging:** Use Pino via `@/lib/logger.ts`. No `console.log`.
- **Secrets:** Never log or commit secrets. Use `@/lib/env` for access.

### 7. Testing & Workflow
- **Empirical Reproduction:** Always reproduce bugs with a test before fixing.
- **New Features:** Must include tests (Vitest for logic, Playwright for E2E).
- **Branch Documentation:** Before finishing, create:
  - `documentation/branches/{branch-name}/BRANCH_CHANGES.md`
  - `documentation/branches/{branch-name}/BRANCH_CODE_REVIEW.md`
- **Commits:** Use Conventional Commits (e.g., `feat(auth): ...`).

## Prohibited Patterns
- NO `any` types.
- NO `npm` or `yarn`.
- NO `console.log` in production.
- NO raw SQL.
- NO skipping Zod validation.
- NO hardcoded hex colors.
- NO committing AI artifacts (`*_output.txt`, etc.).
- NO editing `next-env.d.ts` manually.

## Communication Style
- **Brevity:** Concise, technical, and direct.
- **No Emojis:** Zero emojis in code, docs, or messages.
- **Action-Oriented:** Focus on solutions and architectural decisions.
