**SPECDRIVR**

Master Product Specification — Environment Variable Registry

[Status: GROUND TRUTH]

---

## 1. Overview

This document lists all environment variables used by Specdrivr, per `.env.example`. Most are validated at runtime via `src/lib/env-core.ts`; a couple are read directly from `process.env` at their call sites and are not Zod-validated (noted below).

## 2. Core Application

| **Variable**          | **Description**                                                                                                                                                                        | **Source**       | **Default**              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------- |
| `NODE_ENV`             | Current environment (`development`, `production`, `test`).                                                                                                                            | System            | `development`             |
| `APP_URL`              | Server-side base URL. **Not Zod-validated** — read directly via `process.env.APP_URL` in `scripts/agent.ts`, `db/seed.ts`, and a couple of repositories. Exact intended usage vs. `NEXT_PUBLIC_APP_URL` is not fully documented in code. | Deployment URL    | -                          |
| `NEXT_PUBLIC_APP_URL`  | Public (client-exposed) base URL. Falls back to `BETTER_AUTH_URL` if unset.                                                                                                            | Deployment URL    | `http://localhost:3000`   |
| `DATABASE_URL`         | Connection string for PostgreSQL. For local development this must match the `postgres` service credentials in `infra/compose/docker-compose.yml` (`specdrivr` / `specdrivr_password` / db `specdrivr`). | Database Provider | -                          |
| `BETTER_AUTH_SECRET`   | 32+ char secret for signing auth tokens.                                                                                                                                                | System Admin      | -                          |
| `BETTER_AUTH_URL`      | Base URL for the auth server.                                                                                                                                                          | Deployment URL    | `http://localhost:3000`   |
| `REDIS_URL`            | Connection string for ioredis.                                                                                                                                                          | Redis Provider    | `redis://localhost:6379`  |

## 3. AI & Orchestration

| **Variable**    | **Description**                                                                                                        | **Source**        | **Default**         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------- |
| `GEMINI_API_KEY` | API key for Google Gemini plan generation.                                                                             | Google AI Studio    | -                     |
| `GEMINI_MODEL`   | The model ID to use for planning.                                                                                      | Google AI Studio    | `gemini-2.0-flash`   |
| `AGENT_BACKEND`  | Which LLM backend the agent worker (`scripts/agent.ts`) uses: `gemini` or `claude`. Any other value throws at startup. | System Admin        | `gemini`              |
| `AGENT_TOKEN`    | Global token used by the agent process to authenticate against the app's API.                                          | System Admin        | -                     |

## 4. Security & Cron

| **Variable**  | **Description**                                                                                       | **Source**   | **Default** |
| -------------- | ---------------------------------------------------------------------------------------------------------- | -------------- | ------------- |
| `CRON_SECRET` | 32+ char secret required by scheduled/cron-triggered routes (e.g. usage aggregation, ghost-buster cleanup). | System Admin | -           |

## 5. Integrations & Notifications

| **Variable**            | **Description**                         | **Source**      | **Default**             |
| ------------------------ | ----------------------------------------- | ------------------ | -------------------------- |
| `RESEND_API_KEY`        | API key for transactional emails.       | Resend.com      | -                       |
| `RESEND_FROM_EMAIL`     | Verified sender email address.          | Resend.com      | `noreply@specdrivr.dev` |
| `GITHUB_TOKEN`          | Personal Access Token for repo access.  | GitHub Settings | -                       |
| `GITHUB_WEBHOOK_SECRET` | Secret for verifying incoming webhooks. | GitHub Repo     | -                       |

## 6. Security Note

- **Server-Only**: Variables must be imported from `@/lib/env` to ensure they are not leaked to the client (except `NEXT_PUBLIC_APP_URL`, which is intentionally public).
- **Validation**: If any Zod-validated variable is missing or malformed, the application will throw a Zod error and exit during startup. `APP_URL` and `AGENT_BACKEND` are read directly from `process.env` and are not covered by this validation.
