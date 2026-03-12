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

Specdrivr uses modern, type-safe stack:

| Category | Technology & Version |
|----------|---------------------|
| Framework | Next.js 16.1.6 (App Router) |
| React | 19.2.4 |
| TypeScript | 5.9.3 |
| Styling | Tailwind CSS 4.2.1 |
| UI | shadcn/ui (Radix UI primitives) |
| Database | PostgreSQL |
| ORM | Drizzle ORM 0.45.1 |
| Auth | better-auth 1.5.4 |
| Validation | Zod 3.22.0 |
| Testing | Vitest 4, Playwright 1.42 |
| Drag-drop | @dnd-kit |
| Markdown | @uiw/react-md-editor |
| Security | bcrypt, @upstash/ratelimit, @upstash/redis, RBAC, lock-manager |
| Logging | Pino + pino-pretty |

## Technical Constraints & Behavioral Anchors

### TypeScript & Types

- **Strict Typing:** Never use `any`. Always use explicit types or `unknown` with type guards.
- **Validation over Casting:** Use type guards instead of `as` casts. Example:

  ```typescript
  function isProject(obj: unknown): obj is Project {
    return typeof obj === 'object' && obj !== null && 'id' in obj;
  }
  ```
- **Extended Types:** When passing DB models to UI components, extend via mapped types. Use component props types (e.g., `ProjectCardProps['project']`) for UI-specific fields.
- **No Temporary Fix Scripts:** Never commit temporary fix scripts that modify source files directly. Make changes directly to source files via proper editing and version control workflows.
- **Temporary Work Location:** For one-off scripts, use `/tmp/` directory or execute via `pnpm exec tsx --eval`. Only commit scripts that are part of the reproducible build process.
- **Artifact Prevention:** Never commit output logs (`*_output.txt`, `*_results.txt`), automation scripts (`*.exp`), or one-time migration scripts (`db/migrate-*.ts`). These are covered by .gitignore.

### Database & ORM

- **Drizzle ORM:** Use Drizzle exclusively for database queries. Never raw SQL.
- **Schema Management:** Run `pnpm db:generate` for schema changes. Do not delete migration files in `drizzle/`.
- **Query Optimization:** For complex date/time filtering, fetch timestamp fields directly (as JS Date) and perform date filtering in JavaScript `.filter()` for cross-database compatibility.
- **Security Overrides:** Use pnpm overrides (in `package.json`) to address dependency vulnerabilities promptly.

### UI & Styling

- **Design System:** Strictly use CSS variables from `src/app/globals.css` (e.g., `var(--brand-primary)`). No hardcoded hex values.
- **Linear Patterns:** Follow Linear design system patterns in `src/lib/ios-styles.ts`. Note `taskStatusColors` provides `bg` and `text` only; you may need to add borders manually.
- **CSS Specificity:** Use `!` prefix in Tailwind classes within JSX (e.g., `!text-slate-500`) instead of `!important`.

### Component Architecture

- **Server-First:** Server Components by default. Apply `"use client"` only for interactivity or client-side hooks.
- **Data Fetching:** Do not use `useEffect` for primary data fetching. Rely on Server Components calling repository methods directly.
- **Repository Pattern:** Never direct DB calls in components. Always use repositories from `src/repositories/`.

### API & Validation

- **Strict Boundary Validation:** Never skip Zod validation. Validate all API route inputs with schemas.
- **Error Handling:** Return structured JSON responses: `{ success: false, error: string }` with appropriate HTTP status.
- **Consistent Formatting:** All API routes use repository pattern and handle errors with `handleApiError()`.

### Environment Configuration Architecture

Environment variables must be validated with Zod and protected from client exposure using `server-only`.

**For Next.js code:**
```typescript
import { env } from '@/lib/env';  // server-only protection
```

**For standalone Node.js scripts:**
```typescript
import { env } from '@/lib/env-script';  // safe for scripts
```

**Never import directly from `env-core.ts`** - use wrappers above.

**Rationale:** `server-only` package throws when imported outside Next.js; decoupling validation logic from security boundary maintains boundaries while enabling script usage.

### Logging

- **Use Pino via `@/lib/logger.ts`.** Never use `console.log`/`console.error`.
- **Log levels:** `debug`, `info`, `warn`, `error`.
- **Never log PII, passwords, raw request bodies.**
- **Include correlation IDs** when handling requests (generate at entry).
- **Development transport:** `pino-pretty` auto-enabled in non-production.

### Testing & QA

- **Unit tests:** Vitest 4.x. Target >80% coverage for repository/lib logic. Mock external dependencies; do not mock system under test.
- **E2E tests:** Playwright 1.42.x. Use ARIA selectors (`getByRole`). Intercept APIs in `tests/mocks` for deterministic runs.
- **Write tests alongside implementation.** Avoid flaky tests; keep them idempotent and fast.

### Package Management

- **Always use pnpm.** Never `npm` or `yarn`.
- **Frozen lockfile in CI:** `pnpm install --frozen-lockfile`.
- **Security:** Run `pnpm audit` regularly. Fix vulnerabilities via package updates or pnpm overrides (document reasons).
- **Common scripts:** `pnpm dev` (Turbopack), `pnpm build`, `pnpm test`, `pnpm db:*`, `pnpm lint`.

### Performance Requirements

- Bundle size optimization (code splitting, tree-shaking).
- Database query optimization with indexes; avoid N+1.
- Server-side rendering first; minimize client hydration.
- Use React `memo`, `useMemo`, `useCallback` where beneficial.
- Proper caching: HTTP, SWR/Redis, Next.js `revalidatePath`/`revalidateTag`.

## Project Documentation

This project follows professional development standards documented in:

- **documentation/DEVELOPMENT.md** - Developer best practices and coding standards
- **AGENTS.md** - Claude Code agent usage patterns
- **README.md** - Project setup and overview

## Code Quality Standards

### No Emojis in Code or Documentation

All code, scripts, and documentation must be emoji-free. This includes:
- Comments, Markdown files, JSON config, test descriptions, CLI output.

### File Structure

See `documentation/DEVELOPMENT.md` for complete project structure and best practices for:
- Repository pattern implementation
- Error handling patterns
- API route standards
- Testing patterns
- Database practices

### Security Requirements

- **Strict TypeScript:** Enforce strict mode with no `any` types.
- **pnpm Overrides:** Use overrides to address dependency vulnerabilities immediately.
- **Vulnerability Management:** Run `pnpm audit` regularly and address all security warnings.
- **Environment Validation:** Validate all environment variables with Zod schemas.
- **Dependency Updates:** Keep dependencies current to minimize exposure window.
- **Authentication:** Always verify using `await auth()`; enforce project-level RBAC; protect with rate limiting.
- **Audit Logging:** Log critical state changes within DB transaction with actor ID, action, resource info.
- **Secrets:** Never commit secrets; use `.env.local` and validated `env` objects.

### Performance Requirements

- Bundle size optimization.
- Database query optimization with indexes.
- Server-side rendering first.
- Efficient component rendering.

## Refactoring Philosophy

When performing code health improvements or refactoring, prioritize preserving existing functionality over cleanliness to ensure no behavior is inadvertently changed.

## Cross-references

- **Operations Guide:** `AGENTS.md` contains detailed instructions for AI agents on daily tasks, command usage, and PR compliance.
- **Human Developer Guide:** `documentation/DEVELOPMENT.md` provides comprehensive best practices for developers, including testing, git workflow, performance, and review checklists.
- **Alignment:** All three documents must remain consistent. When adding a new library or pattern, update `documentation/DEVELOPMENT.md` and propagate relevant constraints to `CLAUDE.md` and operational details to `AGENTS.md`.

<!-- Keep this file under 500 lines total -->
