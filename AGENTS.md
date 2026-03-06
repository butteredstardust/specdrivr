# Specdrivr: System Architecture & Agent Workflows

## Architecture & Core Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL (Central State Machine + Persistent Memory)
- **ORM:** Drizzle ORM
- **Validation:** Zod
- **Styling:** Tailwind CSS (Linear-inspired token system)
- **Auth:** NextAuth.js v5

## Repository Structure

- `src/app/` - Next.js App Router (UI pages and API routes).
- `src/components/` - Reusable UI components.
- `src/db/` - Database layer (`schema.ts` and Drizzle configuration).
- `src/lib/` - Shared utilities (`agent-memory.ts`, `actions.ts`, `schemas.ts`, `ios-styles.ts`).
- `src/hooks/` - React client hooks.
- `drizzle/` - Generated migrations. [DO NOT EDIT MANUALLY].
- `public/` - Static assets.
- `scripts/` - Database seeding (e.g., `seed-demo-drizzle.js`).
- `tests/` - Test suite (`run-tests.sh` orchestrates Vitest and Playwright).

## Database Schema & State Machine

PostgreSQL governs the state machine transition of features from intent to verified code.

### Core Entities

- **projects:** Agent workspace (`agent_status`: `idle`, `running`, `paused`, `stopped`, `error`).
- **specifications:** Markdown-based technical requirements (`isActive`: boolean).
- **plans:** High-level execution strategies (`status`: `draft`, `active`, `completed`, `archived`).
- **tasks:** Atomic work units (`status`: `todo`, `in_progress`, `done`, `blocked`, `paused`, `skipped`).
- **agent_logs:** Event stream (`level`: `debug`, `info`, `warn`, `error`).
- **test_results:** Verification outcomes (`success`: boolean).
- **agent_tokens:** Authentication (`token_hash`).
- **users:** Contains `passwordHash` column for credentials.

### State Transitions (`src/lib/agent-memory.ts`)

- **Project:** `idle` -> `running` -> `paused`/`stopped` -> `idle`.
- **Task:** `todo` -> `in_progress` -> `done` (success) OR `blocked` (failure).
- **Dependency Flow:** A `dependency_task_id` must reach `done` before a dependent task enters `todo` scope.

## API Reference

All requests must be authenticated and validated via Zod.

- **[GET] `/api/agent/mission`**
  - **Auth:** `X-Agent-Token`
  - **Query:** `project_id`
  - **Returns:** `{ success: true, data: { project, specification, active_plan, next_task, unblocked_tasks } }`

- **[POST] `/api/agent/tasks`**
  - **Auth:** `X-Agent-Token`
  - **Body:** `TaskSchema` or `{ tasks: TaskSchema[] }`

- **[GET] `/api/projects/:id/agent/status`**
  - **Auth:** Session (NextAuth)

## Agent Lifecycle

1. **Started:** `/api/projects/[id]/agent/start` sets project status to `running`.
2. **Context Sync:** Agent fetches mission (Spec, Plan, State).
3. **Execution:** Agent processes `todo` tasks, writing changes to the codebase.
4. **Verification:** Test results dictate SQL updates triggering task completion or failure.

## Commands

- **Development:** `npm run dev`
- **Seeding:** `npm run dev:seed` (Wipes DB, seeds test data, starts dev server on :3000)
- **Database:** `npm run db:generate`, `npm run db:migrate`, `npm run db:studio`
- **Testing:**
  - Unit: `npm run test` (Vitest)
  - E2E: `npm run test:e2e` (Playwright on port 3001)
  - All: `npm run test:all`

## Local Setup & Configuration

- Requires `.env.local` configured with `DATABASE_URL`, `AUTH_SECRET`, and `AGENT_TOKEN`.
- Default local DB connection: `postgresql://specdrivr:specdrivr_password@localhost:5432/specdrivr`.
- Default Agent Token: `dev-agent-token-12345`.
- Demo Credentials: User `Admin` (or John, Amy, Brett), Password `demo`.

### Known Environment Constraints

- **npm rebuild:** Does not restore missing executables in `.bin` if `npm install` fails due to network timeout (`ETIMEDOUT`).
- **ESLint:** Uses legacy `.eslintrc.json`, which may fail on environments with ESLint v9+.
