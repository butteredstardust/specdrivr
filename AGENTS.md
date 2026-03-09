# SpecDrivr - AGENTS.md

This file serves as the strict operational manual and development guardrails for all AI agents and engineers working on this repository.

## 1. Environment & Workflow
- **Package Manager:** Strictly use `pnpm` (no `npm` or `yarn`).
- **Commands:**
  - Install: `pnpm install --frozen-lockfile`
  - Dev: `pnpm dev`
  - Build: `pnpm build`
  - Test: `pnpm test` (runs both unit and E2E)
- **Off Limits:** `infrastructure/`, CI/CD YAML files, `.env` (never commit secrets, use `.env.example`).
- **PRs:** Use conventional commits (`[scope]: description`).
- **CI Fix Procedures:** Make changes directly to source files. Do not create or commit temporary fix scripts (`fix.mjs`). Always verify fixes in the actual source files.

## 2. Strict Code Standards
- **Next.js & React:**
  - Default to **Server Components**.
  - **Breaking Next.js 16 Changes:** All dynamic APIs must be awaited (`await params`, `await searchParams`, `await cookies()`, `await headers()`). Sync access is strictly forbidden.
  - Route Handlers must be placed in `app/api/**/route.ts` (Pages Router patterns like `getServerSideProps` or `pages/api` are banned).
  - Use Server Actions for all Client Component mutations. Ensure they are co-located with the feature, validate input with Zod, are wrapped in a `try/catch`, return typed result objects (never throw to the client), and revalidate cache (`updateTag()` or `revalidatePath()`).
  - No `useEffect` for data fetching. Data should be passed from Server Components as props or fetched in custom hooks via dedicated data fetching libraries.
- **Type Safety & Validation:**
  - TypeScript must run in `strict: true` mode.
  - Never use `any` or type assertions (`as`) to bypass type checking.
  - **Zod is the single source of truth** for both API input validation and TS types (via `z.infer<typeof Schema>`). Do not duplicate type definitions.

## 3. Database Safety & Architecture
- **PostgreSQL & Drizzle ORM:**
  - A single shared Drizzle instance must be exported from `lib/db.ts`. Do not instantiate Drizzle inside components or routes.
  - **Migrations:** Use `pnpm db:generate` to generate migrations. Use `pnpm db:push` for local development, and `drizzle-kit migrate` for production/CI.
  - **Never manually alter or delete migration files** in the `drizzle/` directory.
  - **Multi-step Writes:** Must be wrapped in a database transaction (`db.transaction(async (tx) => { ... })`). Dependent writes outside a transaction are strictly prohibited.
  - Use Drizzle's relational API (`db.query.*` and `relations()`) instead of manual joins when appropriate.
  - No raw SQL string interpolation. Use Drizzle's query builder or the `sql` tagged template.
  - Infer types directly from the schema (`typeof table.$inferSelect`, `typeof table.$inferInsert`). Do not manually redeclare Drizzle types.

## 4. Security Requirements
- **Authentication & Authorization (NextAuth v5 / BetterAuth):**
  - **Always verify auth** before any DB call in Route Handlers and Server Actions (`const session = await auth()`). Never assume the caller is authenticated. Return 401 if unauthorized.
  - Project-level RBAC must check the `project_members` table, not just a global user role.
  - All admin actions must log to the `audit_log` within the same database transaction.
  - Passwords and tokens must be hashed (bcrypt cost 12), never stored in plain-text, and never logged.
  - Do not expose raw DB errors or stack traces to the client.
- **Environment Variables:**
  - Never use `process.env` directly across the codebase.
  - All env vars must be validated at startup in `lib/env.ts` using Zod. Import the validated object from `lib/env.ts` everywhere else.
  - `NEXTAUTH_SECRET` should be used to map to the auth `secret` to prevent errors.

## 5. Quality, Testing, and Logging
- **Testing:**
  - **Vitest** for Unit Tests (`pnpm test:unit`). Unit test pure functions and service logic. Mock the Drizzle db instance.
  - **Playwright** for E2E Tests (`pnpm test:e2e`). Test critical user flows (auth, CRUD, cache invalidation). Use ARIA-first locators (`getByRole`). Rely on `tests/mocks` to intercept APIs (no live DB for E2E UI runs unless specified).
- **Logging:**
  - Strictly use `Pino` (`lib/logger.ts`).
  - `console.log` and `console.error` are banned in production code paths.
  - Log errors with correlation IDs. Never log raw request bodies, passwords, or PII.

## 6. Prohibited Patterns (Hallucinations to Avoid)
- **NO** using `any` to bypass Drizzle joins or strict typing.
- **NO** forgetting to `await` Next.js request APIs (`params`, `cookies`, etc.).
- **NO** implicit types or duplicating schema types outside of Zod/Drizzle infer.
- **NO** `useEffect` for data fetching.
- **NO** `pages/api` or `getServerSideProps` (Pages Router legacy).
- **NO** manual mutation of `drizzle/` migration files.
- **NO** accessing `process.env` directly outside of `lib/env.ts`.
- **NO** Route Handlers used solely for button clicks (use Server Actions instead).
- **NO** throwing errors directly from Server Actions to the client (return `{ error: { code, message } }`).
- **NO** use of `npm` or `yarn`. Always use `pnpm`.
