SPECDRIVR

Master Product Specification — Automation & Scripts Reference

> Use this as the canonical reference for `package.json` scripts and the `scripts/` directory.
> `scripts/README.md` points to this file. Update both files when a script changes.

---

## 1. Overview

Use these scripts to manage databases, set up environments, validate CI, and run agents. Most scripts are in `scripts/`. `package.json` wraps common commands.

## 2. package.json Scripts (ground truth)

| **Script**         | **Command**                              | **Description**                                                  |
| -------------------- | ------------------------------------------ | -------------------------------------------------------------------- |
| `dev`               | `next dev --turbopack`                   | Start the Next.js development server.                              |
| `build`             | `next build`                             | Build for production.                                              |
| `start`             | `next start`                             | Start the production server after `build`.                         |
| `lint`              | `eslint .`                               | Check with ESLint.                                                 |
| `format`            | `prettier --write .`                     | Format the codebase.                                               |
| `typecheck`         | `tsc --noEmit`                           | Check TypeScript strict mode.                                      |
| `db:generate`       | `drizzle-kit generate`                   | Create a Drizzle migration from schema changes.                    |
| `db:push`           | `drizzle-kit push`                       | Push the schema directly to the DB. **Prohibited** by `AGENTS.md` §9 — use `db:generate` + `db:migrate` instead. |
| `db:migrate`        | `drizzle-kit migrate`                    | Apply migrations that are pending.                                 |
| `db:studio`         | `drizzle-kit studio`                     | Open Drizzle Studio, the interactive DB explorer.                  |
| `db:seed`           | `tsx db/seed.ts`                         | Add demo and development data to the database.                     |
| `db:aggregate`      | `tsx src/lib/jobs/aggregate-usage.ts`    | Run usage aggregation. A cron route also triggers this job.        |
| `setup`             | `pnpm db:migrate && pnpm db:seed`        | Set up locally: migrate, then seed.                                |
| `test:unit`         | `vitest run --no-file-parallelism`       | Run unit tests with Vitest.                                        |
| `test:unit:watch`   | `vitest`                                 | Run Vitest watch mode.                                             |
| `test:e2e`          | `playwright test`                        | Run end-to-end tests with Playwright.                              |
| `test:e2e:ui`       | `playwright test --ui`                   | Run Playwright UI mode.                                            |
| `test`              | `pnpm test:unit && pnpm test:e2e`        | Run the full test suite. `.husky/pre-push` uses this command.      |
| `prepare`           | `husky`                                  | Install Husky Git hooks. This runs automatically on `pnpm install`.|
| `agent`             | `tsx scripts/agent.ts`                   | Run the autonomous agent against a claimed session.                |
| `worker`            | `tsx scripts/plan-worker.ts`             | Run the plan generation and task decomposition worker.             |
| `ghost-buster`      | `tsx scripts/ghost-buster.ts`            | Recover stale agent sessions in a running "ghost" state.           |

## 3. Scripts Directory (`scripts/`)

### Database Utilities

| **Script**     | **Invocation**                  | **Description**                                              |
| -------------- | -------------------------------- | -------------------------------------------------------------- |
| `nuke-db.ts`   | `pnpm tsx scripts/nuke-db.ts`   | **DANGER: Destructive.** Remove all tables and enums.         |
| `db-verify.ts` | `pnpm tsx scripts/db-verify.ts` | Check the database connection and schema.                      |

Use `pnpm db:seed` to seed the database with `db/seed.ts`. This file is outside `scripts/`. Use `tsx` directly for the alternate extended dataset in `db/seed-enhanced.ts`.

### Environment & Setup

| **Script**            | **Invocation**                  | **Description**                                                |
| ---------------------- | --------------------------------- | ------------------------------------------------------------------ |
| `bootstrap.sh`        | `./scripts/bootstrap.sh`        | Set up NVM and the `.nvmrc` Node.js version on a clean Ubuntu environment. |
| `snapshot.sh`         | `./scripts/snapshot.sh`         | Install dependencies and apply migrations. Use as a Docker entrypoint or postStart hook. |
| `start-dev-server.sh` | `./scripts/start-dev-server.sh` | Build and start Docker Compose services: Postgres, Redis, and the app. Run health checks. |

### Agent & Worker Processes

| **Script**       | **Invocation**              | **Description**                                                            |
| ----------------- | ------------------------------ | -------------------------------------------------------------------------------- |
| `agent.ts`       | `pnpm agent`                 | Claim and execute tasks. Requires `AGENT_TOKEN` and `SESSION_ID`. |
| `plan-worker.ts` | `pnpm worker`                | Generate plans. Decompose specifications into tasks through Gemini and repositories. |
| `ghost-buster.ts`| `pnpm ghost-buster`          | Recover agent sessions that stall without a clean exit. Read `GHOST_THRESHOLD_MINUTES` (default `5`). |

### CI & Verification

| **Script**             | **Invocation**                     | **Description**                                                           |
| ------------------------ | ------------------------------------- | ------------------------------------------------------------------------------- |
| `ci-verify-hooks.sh`    | `./scripts/ci-verify-hooks.sh`      | Check Husky hook configuration in CI.                                        |
| `codebase-audit.sh`     | `./scripts/codebase-audit.sh`       | Audit the codebase. Check lint, XSS, and patterns.                           |
| `simulate-ci.sh`        | `./scripts/simulate-ci.sh`          | Simulate the CI test suite locally on macOS or Linux.                         |
| `simulate-ci.ps1`       | `./scripts/simulate-ci.ps1`         | Use the Windows PowerShell version of `simulate-ci.sh`.                       |
| `verify-hooks.js`       | `node scripts/verify-hooks.js`      | Check Husky hook installation and checksum synchronization.                   |
| `audit-hooks.js`        | Invoked by the hooks themselves     | Log hook execution, bypass attempts, and configuration changes. Detect tampering. Do not run this alone. |
| `health-check.js`       | `node scripts/health-check.js`      | Run checks. Write a dated report to `documentation/HEALTH_CHECK_REPORT_<date>.md`. |
| `hooks/`                | Sourced by `.husky/pre-push`        | Orchestrate modular pre-push checks: `prepush.sh`, `precommit.sh`, `utils.sh`, and checks in `hooks/checks/`. |

---

## 4. Usage for Agents

- Before you push changes, run `./scripts/codebase-audit.sh`. This command checks standard policy violations.
- If the database state is inconsistent, run `pnpm tsx scripts/db-verify.ts`.
- Use `ghost-buster` and `db:aggregate` locally or manually. Scheduled API routes also provide them at (`/api/v1/system/ghost-buster`, `/api/v1/admin/aggregate-usage`) and require `CRON_SECRET`.
