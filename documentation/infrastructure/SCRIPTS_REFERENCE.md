**SPECDRIVR**

Master Product Specification — Automation & Scripts Reference

[Status: GROUND TRUTH]

> This is the canonical reference for `package.json` scripts and the `scripts/` directory.
> `scripts/README.md` is a short pointer back to this file — update both consistently if a script changes.

---

## 1. Overview

Specdrivr includes a suite of utility scripts to automate database management, environment setup, CI verification, and the agent/worker processes. Most live in the `scripts/` directory; `package.json` `scripts` wraps the common ones.

## 2. package.json Scripts (ground truth)

| **Script**         | **Command**                              | **Description**                                                  |
| -------------------- | ------------------------------------------ | -------------------------------------------------------------------- |
| `dev`               | `next dev --turbopack`                   | Start the Next.js dev server.                                      |
| `build`             | `next build`                             | Production build.                                                  |
| `start`             | `next start`                             | Start the production server (after `build`).                       |
| `lint`              | `eslint .`                               | Run ESLint.                                                        |
| `format`            | `prettier --write .`                     | Auto-format the codebase.                                          |
| `typecheck`         | `tsc --noEmit`                           | TypeScript strict-mode check.                                      |
| `db:generate`       | `drizzle-kit generate`                   | Generate a Drizzle migration from schema changes.                  |
| `db:push`           | `drizzle-kit push`                       | Push schema directly to the DB. **Prohibited** by `AGENTS.md` §9 — use `db:generate` + `db:migrate` instead. |
| `db:migrate`        | `drizzle-kit migrate`                    | Apply pending migrations.                                          |
| `db:studio`         | `drizzle-kit studio`                     | Launch Drizzle Studio (interactive DB explorer).                   |
| `db:seed`           | `tsx db/seed.ts`                         | Populate the database with demo/dev data.                          |
| `db:aggregate`      | `tsx src/lib/jobs/aggregate-usage.ts`    | Run the usage-aggregation job (also triggered via cron route).     |
| `setup`             | `pnpm db:migrate && pnpm db:seed`        | One-shot local setup: migrate then seed.                           |
| `test:unit`         | `vitest run --no-file-parallelism`       | Run Vitest unit tests.                                              |
| `test:unit:watch`   | `vitest`                                 | Run Vitest in watch mode.                                          |
| `test:e2e`          | `playwright test`                        | Run Playwright E2E tests.                                          |
| `test:e2e:ui`       | `playwright test --ui`                   | Run Playwright in UI mode.                                          |
| `test`              | `pnpm test:unit && pnpm test:e2e`        | Full test suite (used by `.husky/pre-push`).                       |
| `prepare`           | `husky`                                  | Install Husky git hooks (runs automatically on `pnpm install`).    |
| `agent`             | `tsx scripts/agent.ts`                   | Run the autonomous agent process against a claimed session.        |
| `worker`            | `tsx scripts/plan-worker.ts`             | Run the plan-generation / task-decomposition worker.                |
| `ghost-buster`      | `tsx scripts/ghost-buster.ts`            | Recover agent sessions stuck in a stale/"ghost" running state.     |

## 3. Scripts Directory (`scripts/`)

### Database Utilities

| **Script**     | **Invocation**                  | **Description**                                              |
| -------------- | -------------------------------- | -------------------------------------------------------------- |
| `nuke-db.ts`   | `pnpm tsx scripts/nuke-db.ts`   | Drops all tables and enums. **DANGER: Destructive.**          |
| `db-verify.ts` | `pnpm tsx scripts/db-verify.ts` | Verifies the database connection and schema are valid.        |

Database seeding itself is wrapped by `pnpm db:seed` (`db/seed.ts`, not under `scripts/`); `db/seed-enhanced.ts` is an alternate/extended seed dataset invoked directly with `tsx` when needed.

### Environment & Setup

| **Script**            | **Invocation**                  | **Description**                                                |
| ---------------------- | --------------------------------- | ------------------------------------------------------------------ |
| `bootstrap.sh`        | `./scripts/bootstrap.sh`        | Sets up NVM and the Node.js version from `.nvmrc` on a clean Ubuntu environment. |
| `snapshot.sh`         | `./scripts/snapshot.sh`         | Ensures dependencies are installed and migrations are applied; usable as a Docker entrypoint/postStart hook. |
| `start-dev-server.sh` | `./scripts/start-dev-server.sh` | Builds and starts Docker Compose services (Postgres, Redis, app) with health checks. |

### Agent & Worker Processes

| **Script**       | **Invocation**              | **Description**                                                            |
| ----------------- | ------------------------------ | -------------------------------------------------------------------------------- |
| `agent.ts`       | `pnpm agent`                 | The agent process that claims and executes tasks. Requires `AGENT_TOKEN` and `SESSION_ID`. |
| `plan-worker.ts` | `pnpm worker`                | Generates plans and decomposes specs into tasks via Gemini/repositories.        |
| `ghost-buster.ts`| `pnpm ghost-buster`          | Recovers agent sessions that stalled without a clean exit. Reads `GHOST_THRESHOLD_MINUTES` (default `5`). |

### CI & Verification

| **Script**             | **Invocation**                     | **Description**                                                           |
| ------------------------ | ------------------------------------- | ------------------------------------------------------------------------------- |
| `ci-verify-hooks.sh`    | `./scripts/ci-verify-hooks.sh`      | Verifies Husky hooks are correctly configured in CI.                          |
| `codebase-audit.sh`     | `./scripts/codebase-audit.sh`       | Comprehensive codebase audit (lint, XSS/pattern checks).                      |
| `simulate-ci.sh`        | `./scripts/simulate-ci.sh`          | Simulates the CI test suite locally (macOS/Linux).                            |
| `simulate-ci.ps1`       | `./scripts/simulate-ci.ps1`         | PowerShell equivalent of `simulate-ci.sh` for Windows.                        |
| `verify-hooks.js`       | `node scripts/verify-hooks.js`      | Checks Husky hooks are correctly installed and checksums are in sync.         |
| `audit-hooks.js`        | Invoked by the hooks themselves     | Logs hook execution, bypass attempts, and config changes to detect tampering. Not meant to be run standalone. |
| `health-check.js`       | `node scripts/health-check.js`      | Runs a battery of checks and writes a dated report to `documentation/HEALTH_CHECK_REPORT_<date>.md`. |
| `hooks/`                | Sourced by `.husky/pre-push`        | Modular pre-push check orchestrator: `prepush.sh`, `precommit.sh`, `utils.sh`, and individual checks under `hooks/checks/`. |

---

## 4. Usage for Agents

- Before pushing changes, run `./scripts/codebase-audit.sh` to catch standard policy violations.
- If the database is in an inconsistent state, run `pnpm tsx scripts/db-verify.ts`.
- `ghost-buster` and `db:aggregate` are also exposed as scheduled API routes (`/api/v1/system/ghost-buster`, `/api/v1/admin/aggregate-usage`) guarded by `CRON_SECRET` — the `pnpm` scripts are the local/manual equivalents.
