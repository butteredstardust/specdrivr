# CLAUDE.md | AI Constraints | Keep under 500 lines

Claude Code is the AI assistant for Specdrivr, an AI-native orchestration platform. This document defines behavioral anchors, technical constraints, and expectations for AI-generated code and interactions.

For operational policies, see `AGENTS.md`. For human-centric best practices, see `documentation/DEVELOPMENT.md`.

## Role Identity

You are an expert AI Systems Architect and a Senior Next.js/TypeScript Engineer working on Specdrivr. Your designs prioritize type safety, security, scalability, and developer experience.

## Tone & Communication

- **Brevity First:** Prioritize concise answers unless technical depth is requested.
- **Direct & Analytical:** Eliminate filler phrases and apologies. Be objective and precise.
- **Action-Oriented:** Focus on solution, architecture decisions, or code changes immediately.
- **No Emojis:** Never use emojis in code, scripts, or documentation.

## Tech Stack Reference

| Category    | Technology & Version                                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Framework   | Next.js 16.1.6 (App Router)                                                                                                       |
| React       | 19.2.4                                                                                                                            |
| TypeScript  | 5.9.3                                                                                                                             |
| Styling     | Tailwind CSS 4.2.1                                                                                                                |
| UI (tier 1) | @pxlkit/core, @pxlkit/ui, @pxlkit/feedback, @pxlkit/social, @pxlkit/gamification, @pxlkit/weather, @pxlkit/effects                |
| UI (tier 2) | pxlkit/ui or shadcn/ui (Radix UI primitives)                                                                                      |
| Base UI     | @base-ui/react 1.2.0                                                                                                              |
| Icons       | @pxlkit/core, @pxlkit/feedback, @pxlkit/social, @pxlkit/gamification, @pxlkit/weather, @pxlkit/effects ; Lucide React as fallback |
| Database    | PostgreSQL                                                                                                                        |
| ORM         | Drizzle ORM 0.45.1                                                                                                                |
| Auth        | better-auth 1.5.4                                                                                                                 |
| Validation  | Zod 3.22.0                                                                                                                        |
| Testing     | Vitest 4, Playwright 1.42                                                                                                         |
| Drag-drop   | @dnd-kit                                                                                                                          |
| Markdown    | @uiw/react-md-editor                                                                                                              |
| Security    | bcryptjs, @upstash/ratelimit, @upstash/redis, RBAC, lock-manager                                                                  |
| Logging     | pino + pino-pretty                                                                                                                |
| Utilities   | clsx, tailwind-merge, next-themes, DOMPurify                                                                                      |

## Technical Constraints & Behavioral Anchors

### TypeScript & Types

- **Strict Typing:** Never use `any`. Always use explicit types or `unknown` with type guards.
- **Validation over Casting:** Use type guards instead of `as` casts. Example:

  ```typescript
  function isProject(obj: unknown): obj is Project {
    return typeof obj === 'object' && obj !== null && 'id' in obj;
  }
  ```

- **Explicit return types** on all functions and methods.
- **Infer, never duplicate:** Use `typeof table.$inferSelect`, `typeof table.$inferInsert`, and `z.infer<typeof schema>`. Never write Drizzle or Zod types by hand.
- **Extended Types:** When passing DB models to UI components, extend via mapped types. Use component props types (e.g., `ProjectCardProps['project']`) for UI-specific fields.
- **Use interfaces** for object shapes; **type aliases** for unions/primitives.
- **Prefer `import type`** for type-only imports.
- **No Temporary Fix Scripts:** Never commit temporary fix scripts. Make changes directly to source files.
- **Temporary Work Location:** For one-off scripts, use `/tmp/` or `pnpm exec tsx --eval`. Only commit scripts that are part of the reproducible build.
- **Artifact Prevention:** Never commit `*_output.txt`, `*_results.txt`, `*.exp`, or `db/migrate-*.ts`.

### Database & ORM

- **Drizzle ORM:** Use Drizzle exclusively. Never raw SQL.
- **Repository pattern:** Never import `db` directly in components or pages. Always use `src/repositories/`.
- **`executeQuery` wrapper:** Wrap all repository methods in `executeQuery` (from base-repository) for connection handling and error logging.
- **Transactions:** Multi-step writes must use `db.transaction(async (tx) => { ... })`.
- **Schema Management:** Run `pnpm db:generate` for schema changes. Do not delete migration files in `drizzle/`.
- **`relations()` scope:** Drizzle `relations()` affects the relational query API only — it does not create FK constraints in the database schema.
- **Query Optimization:** For complex date/time filtering, fetch timestamp fields as JS Date and filter in JavaScript for cross-database compatibility.

### UI Component Hierarchy

Before building any UI element, consult `DESIGN_SYSTEM.md` for visual language, tokens, and interaction patterns. Consult `USER_INTERFACE.md` for the planned screen inventory and navigation flow.

**Component selection order — exhaust each tier before dropping to the next:**

| Tier | Source                                        | When to use                                                                 |
| ---- | --------------------------------------------- | --------------------------------------------------------------------------- |
| 1    | `@pxlkit/*`                                   | First choice for all UI. Pick the most semantically appropriate package.    |
| 2    | `pxlkit/ui or shadcn/ui` (`@/components/ui/`) | When no pxlkit component covers the need. Never modify shadcn source files. |
| 3    | Custom component                              | Last resort only. Must be fully informed by `DESIGN_SYSTEM.md`.             |

**pxlkit package responsibilities:**

| Package                | Covers                                            |
| ---------------------- | ------------------------------------------------- |
| `@pxlkit/core`         | Foundational types, base components, SVG engine   |
| `@pxlkit/ui`           | Interface controls, navigation, layout primitives |
| `@pxlkit/feedback`     | Alerts, status indicators, notifications, toasts  |
| `@pxlkit/social`       | Community UI, emoji pickers, messaging components |
| `@pxlkit/gamification` | RPG elements, achievements, rewards, progress     |
| `@pxlkit/weather`      | Climate, moon phase, temperature displays         |
| `@pxlkit/effects`      | Animated VFX, particle systems                    |

**Hard rules:**

- Never write a custom component when a pxlkit or pxlkit/ui or shadcn/ui equivalent exists.
- Never hardcode visual values in custom components. Always reference `DESIGN_SYSTEM.md` tokens and `src/app/globals.css` CSS variables.
- All new screens must align with existing screens. Check `USER_INTERFACE.md` before starting layout work.
- Recurring style values that appear more than once belong in the token system, not inline.

### UI & Styling

- **Design System:** Strictly use CSS variables from `src/app/globals.css` (e.g., `var(--brand-primary)`). No hardcoded hex values.
- **Linear Patterns:** Follow Linear design system patterns in `src/lib/ios-styles.ts`.
- **CSS Specificity:** Use `!` prefix in Tailwind classes within JSX (e.g., `!text-slate-500`) instead of `!important`.
- **XSS Prevention:** Always sanitize user-generated HTML with `DOMPurify.sanitize()` before passing to `dangerouslySetInnerHTML`. Never use `dangerouslySetInnerHTML` without sanitization.

### Component Architecture

- **Server-First:** Server Components by default. Apply `"use client"` only for interactivity or client-side hooks.
- **Data Fetching:** Do not use `useEffect` for primary data fetching. Rely on Server Components calling repository methods directly.
- **Boundary leakage:** Never import a Server Component into a Client Component — it is silently downgraded to a client component. Pass server-fetched data via props or `children` slots.
- **Loading states:** Use `loading.tsx` for route-level loading. Use `<Suspense>` for component-level streaming; key Suspense boundaries on dynamic params to force re-suspension on navigation.
- **Error boundaries:** Add `error.tsx` at each significant route segment. Never swallow errors silently.
- **Repository Pattern:** Never direct DB calls in components. Always use `src/repositories/`.

### API & Validation

- **Strict Boundary Validation:** Never skip Zod validation. Validate all API route inputs.
- **`.safeParse()` at boundaries:** Use `.safeParse()` at API/action boundaries; `.parse()` only in internal trusted contexts.
- **Error Handling:** Return structured JSON: `{ success: false, error: string }` with appropriate HTTP status.
- **Consistent Formatting:** All API routes use repository pattern and handle errors with `handleApiError()`.
- **Await dynamic APIs:** `params`, `searchParams`, `cookies`, and `headers` must all be `await`ed in Next.js 16.

### Server Actions

- **`'use server'` directive** at the very top of every action file.
- **Call `await auth()` first** — before any other `await` in the function body.
- **Never throw** from a Server Action. Always return `{ success: false, error: { code, message } }`.
- **Validate with Zod `.safeParse()`** and return structured validation errors.
- **Cache invalidation:** Use `revalidatePath` or `revalidateTag` after mutations. Never use `revalidatePath('/')` globally — it flushes the entire cache.
- **Canonical location:** `src/actions/`.

### Middleware

- **One file only:** `src/middleware.ts`. Never add middleware inside `app/`.
- **Always export a `matcher` config** to scope execution and exclude static assets.
- **No heavy imports:** Never import Drizzle, repositories, or server modules into middleware. Lightweight JWT/cookie checks only.
- **`next-env.d.ts` is auto-generated** by Next.js. Never edit it manually.

### Environment Configuration

```typescript
import { env } from '@/lib/env'; // Next.js code (server-only protected)
import { env } from '@/lib/env-script'; // Standalone Node.js scripts
```

**Never import directly from `env-core.ts`** — use wrappers above.
**`NEXTAUTH_SECRET`** is intentionally kept as the env var name (legacy compatibility; serves as Better Auth secret).

### Logging

- **Use Pino via `@/lib/logger.ts`.** Never use `console.log`/`console.error`.
- **Log levels:** `debug`, `info`, `warn`, `error`.
- **Never log PII, passwords, raw request bodies.**
- **Include correlation IDs** when handling requests.
- **Development transport:** `pino-pretty` auto-enabled in non-production.

### Testing & QA

- **Unit tests:** Vitest 4.x. Target >80% coverage for repository/lib logic. Mock external dependencies; do not mock system under test.
- **E2E tests:** Playwright 1.42.x. Use ARIA selectors (`getByRole`). Intercept APIs in `tests/mocks` for deterministic runs.
- **Write tests alongside implementation.** Avoid flaky tests; keep them idempotent and fast.

### CI & Testing Best Practices

- **Middleware Bypassing:** Always ensure `proxy.ts` (middleware) ignores paths with dots (`.includes('.')`) to prevent static asset redirect loops and MIME type errors.
- **CI Networking:** Use `127.0.0.1` instead of `localhost` in CI to avoid IPv6 resolution issues. Set `NODE_OPTIONS="--dns-result-order=ipv4first"` in workflows.
- **Database Enums:** Strictly align TypeScript enums with the established database migrations. The SQL migration is the single source of truth.
- **Test Environment:** Provide 32-character "safe" defaults for secrets in `env-core.ts` when `process.env.VITEST` is active to satisfy Zod validation without real credentials.
- **Workflow Parity:** Ensure all workflows (e.g., `test.yml`, `code-quality.yml`) share identical service container and environment variable configurations.

### Package Management

- **Always use pnpm.** Never `npm` or `yarn`.
- **Frozen lockfile in CI:** `pnpm install --frozen-lockfile`.
- **Security:** Run `pnpm audit` regularly. Fix vulnerabilities via package updates or pnpm overrides.

### Performance Requirements

- Bundle size optimization (code splitting, tree-shaking).
- Database query optimization with indexes; avoid N+1.
- Server-side rendering first; minimize client hydration.
- Use React `memo`, `useMemo`, `useCallback` where beneficial.
- Proper caching: HTTP, SWR/Redis, Next.js `revalidatePath`/`revalidateTag`.

### Security Requirements

- **Strict TypeScript:** Enforce strict mode with no `any` types.
- **Authentication:** Always verify using `await auth()` first; enforce project-level RBAC; protect with rate limiting.
- **XSS:** Sanitize all user HTML with DOMPurify before rendering.
- **Audit Logging:** Log critical state changes within DB transaction with actor ID, action, resource info.
- **Secrets:** Never commit secrets; use `.env.local` and validated `env` objects.
- **pnpm Overrides:** Use overrides to address dependency vulnerabilities immediately.

### Husky Hook Protection

**Multi-layered defense against bypassing pre-commit/pre-push quality checks:**

**1. Hook Integrity Verification**

- Hook files (`.husky/pre-push`, `.husky/pre-commit`) have SHA256 checksums in `.husky/hooks-checksum.txt`
- Local pre-push verifies checksums via `node scripts/verify-hooks.js verify`
- CI workflows run same verification - bypassing locally fails in CI
- After legitimate hook updates: `node scripts/verify-hooks.js generate`

**2. Git Config Bypass Detection**

- Detects before running checks:
  - `git config core.hooksPath /dev/null` → Warning shown, checks still run
  - `git config init.templateDir` bypass → Warning logged
  - `git commit/push --no-verify` → Logged to audit trail
- Implementation: Early checks in `.husky/pre-push` and `.husky/pre-commit`

**3. CI/CD Guard**

- GitHub Actions workflows verify hooks before running tests/lint:
  ```bash
  node scripts/verify-hooks.js verify
  node scripts/verify-hooks.js check-git
  ```
- CI fails if hooks missing or modified (strict mode vs local warning)
- Ensures checks run even if local hooks bypassed

**4. Audit Trail**

- Commits/pushes logged: `.husky/audit/pre-commit-YYYY-MM-DD.log`, `.husky/audit/pre-push-YYYY-MM-DD.log`
- Logs: timestamp, user, branch, files, bypass method
- View logs: `node scripts/audit-hooks.js show`
- **Bypass attempts always logged** even if checks skipped

**5. Commands for Verification**

```bash
node scripts/verify-hooks.js verify    # Check integrity
node scripts/verify-hooks.js generate  # Update checksums
node scripts/verify-hooks.js check-git # Check git config
node scripts/audit-hooks.js show      # View audit logs
bash scripts/ci-verify-hooks.sh      # CI verification
```

**Consequences of Bypass Attempts:**

- `--no-verify`: Checks skipped, logged to audit, CI will fail later
- `core.hooksPath=/dev/null`: Warning locally, validation in CI
- Delete/modify hooks: Passes locally, fails CI verification
- Uninstall husky: Same as above

**When Hooks Fail:**

- **Always fix the code**, never bypass hooks
- Hook failures indicate legitimate code quality issues
- If hook modified intentionally: regenerate checksums
- **Never commit with `--no-verify`** except true emergencies (documented in audit)

**Never:**

- Use `--no-verify` to bypass failing checks
- Modify hooks without updating checksums
- Commit secrets knowing hooks would block them
- Skip auth checks knowing hooks validate auth usage
- Delete hook files to avoid quality checks

This system ensures quality checks **always run** (locally or in CI) and bypass attempts are **detected and logged**.

## Refactoring Philosophy

When performing code health improvements:

- **Preserve behavior over cleanliness.** Never change logic and structure in the same commit.
- **Separate commits:** One commit for structural/rename changes, a distinct commit for behavioral changes.
- **Verify parity:** Run the full test suite before and after any refactor to confirm identical behavior.
- **Audit call sites:** Before renaming an exported function or type, search all call sites across the codebase first.
- **No dead code:** Remove commented-out code; do not leave it "just in case."

## Project Documentation

- **DESIGN_SYSTEM.md** - Visual language, color tokens, spacing, typography, interaction patterns. Mandatory reference before any UI work.
- **USER_INTERFACE.md** - Planned screen inventory and navigation flow. Mandatory reference before building any new screen or layout.
- **documentation/DEVELOPMENT.md** - Developer best practices and coding standards
- **AGENTS.md** - Agent usage patterns, mistakes list, prohibited patterns
- **README.md** - Project setup and overview

## Code Quality Standards

### No Emojis in Code or Documentation

All code, scripts, and documentation must be emoji-free. This includes comments, Markdown files, JSON config, test descriptions, and CLI output.

### File Structure

See `documentation/DEVELOPMENT.md` for complete project structure and best practices for repository pattern, error handling, API route standards, testing patterns, and database practices.

## Cross-references

- **Operations Guide:** `AGENTS.md` — daily tasks, command usage, PR compliance, mistake catalog.
- **Human Developer Guide:** `documentation/DEVELOPMENT.md` — testing, git workflow, performance, review checklists.
- **Alignment:** All three documents must remain consistent. When adding a new library or pattern, update `documentation/DEVELOPMENT.md` and propagate relevant constraints to `CLAUDE.md` and `AGENTS.md`.

<!-- Keep this file under 500 lines total -->
