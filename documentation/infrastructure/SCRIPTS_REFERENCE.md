**SPECDRIVR**

Master Product Specification — Automation & Scripts Reference

[Status: GROUND TRUTH]

---

## 1. Overview

Specdrivr includes a suite of utility scripts to automate database management, environmental setup, and CI verification. These are located in the `scripts/` directory.

## 2. Database Utilities

| **Script**     | **Command**                     | **Description**                                             |
| -------------- | ------------------------------- | ----------------------------------------------------------- |
| `nuke-db.ts`   | `pnpm tsx scripts/nuke-db.ts`   | Drops all tables and enums. **DANGER: Destructive.**        |
| `db-verify.ts` | `pnpm tsx scripts/db-verify.ts` | Verifies that the database connection and schema are valid. |
| `seed.ts`      | `pnpm db:seed`                  | Populates the database with basic development data.         |

## 3. Environment & Setup

| **Script**            | **Command**                     | **Description**                                                |
| --------------------- | ------------------------------- | -------------------------------------------------------------- |
| `bootstrap.sh`        | `./scripts/bootstrap.sh`        | Sets up NVM and Node.js on a clean Ubuntu environment.         |
| `snapshot.sh`         | `./scripts/snapshot.sh`         | Ensures dependencies are installed and migrations are applied. |
| `start-dev-server.sh` | `./scripts/start-dev-server.sh` | Starts Docker Compose services (Postgres, Redis) and the app.  |

## 4. Audit & Verification

| **Script**          | **Command**                    | **Description**                                                   |
| ------------------- | ------------------------------ | ----------------------------------------------------------------- |
| `codebase-audit.sh` | `./scripts/codebase-audit.sh`  | Runs a comprehensive audit of the codebase (Linting, XSS checks). |
| `verify-hooks.js`   | `node scripts/verify-hooks.js` | Checks if Husky hooks are correctly installed and synced.         |
| `simulate-ci.sh`    | `./scripts/simulate-ci.sh`     | Runs the full CI test suite (Vitest + Playwright) locally.        |

## 5. Agent Utilities

| **Script** | **Command**                 | **Description**                                                           |
| ---------- | --------------------------- | ------------------------------------------------------------------------- |
| `agent.ts` | `pnpm tsx scripts/agent.ts` | The actual DAEMON agent process. Requires `AGENT_TOKEN` and `SESSION_ID`. |

---

### **Usage for Agents**

- Before pushing changes, run `./scripts/codebase-audit.sh` to catch standard policy violations.
- If the database is in an inconsistent state, run `pnpm tsx scripts/db-verify.ts`.
