# Branch Code Review — feature/ui_start

## Self-Review Checklist

### 1. Database & Migrations
- [x] `db:push` was avoided for final state; `db:migrate` is confirmed working in CI.
- [x] `0000_jazzy_ink.sql` contains the correct `plan_status` values (`executing`, `completed`).
- [x] `usage_snapshots` uses `double precision` for cost to match `schema.ts`.

### 2. Security
- [x] HMAC validation in `src/app/api/webhooks/github/[projectId]/route.ts` uses `crypto.timingSafeEqual`.
- [x] Slack bot tokens and GitHub PATs are never logged.
- [x] `githubConfig` is gated by agent-token authentication in the `tasks/next` route.

### 3. Logic & Integration
- [x] Webhook retry delays follow the spec: `[1000, 5000, 30000, 300000]`.
- [x] Slack Block Kit JSON verified for `task_blocked` event.
- [x] Usage aggregation job is idempotent and handles UTC midnight normalization correctly.

### 4. Code Quality
- [x] `pnpm typecheck` passes with 0 errors.
- [x] `pnpm test:unit` passes with 35/35 tests successful.
- [x] Mandatory `import 'server-only'` present in all library and API files.

## Reviewer Notes
The migration history was reset to a single ground-truth file (`0000_jazzy_ink.sql`) to resolve conflicting local states caused by earlier `db:push` usage. All future changes MUST follow the `db:generate` + `db:migrate` protocol as mandated in `GEMINI.md`.
