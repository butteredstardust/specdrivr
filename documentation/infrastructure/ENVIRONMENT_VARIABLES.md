SPECDRIVR

Master Product Specification — Environment Variable Registry

---

## 1. Overview

Use this document with `.env.example` to configure Specdrivr environment variables. `src/lib/env-core.ts` validates most variables at runtime. The listed exceptions read `process.env` at their call sites.

## 2. Core Application

| **Variable**          | **Description**                                                                                                                                                                        | **Source**       | **Default**              |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------------------- |
| `NODE_ENV`             | Set the current environment: `development`, `production`, or `test`.                                                                                                                  | System            | `development`             |
| `APP_URL`              | Set the server-side base URL. **Not Zod-validated.** Call sites in `scripts/agent.ts`, `db/seed.ts`, and two repositories read `process.env.APP_URL`. Code does not fully document its intended use relative to `NEXT_PUBLIC_APP_URL`. | Deployment URL    | -                          |
| `NEXT_PUBLIC_APP_URL`  | Set the public client-exposed base URL. It falls back to `BETTER_AUTH_URL` when unset.                                                                                                | Deployment URL    | `http://localhost:3000`   |
| `DATABASE_URL`         | Set the PostgreSQL connection string. For local development, match `infra/compose/docker-compose.yml` `postgres` service credentials: `specdrivr` / `specdrivr_password` / db `specdrivr`. | Database Provider | -                          |
| `BETTER_AUTH_SECRET`   | Set a 32+ character secret that signs auth tokens.                                                                                                                                    | System Admin      | -                          |
| `BETTER_AUTH_URL`      | Set the auth server base URL.                                                                                                                                                          | Deployment URL    | `http://localhost:3000`   |
| `REDIS_URL`            | Set the ioredis connection string.                                                                                                                                                     | Redis Provider    | `redis://localhost:6379`  |

## 3. AI & Orchestration

| **Variable**    | **Description**                                                                                                        | **Source**        | **Default**         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------- |
| `GEMINI_API_KEY` | Set the API key for Google Gemini plan generation.                                                                     | Google AI Studio    | -                     |
| `GEMINI_MODEL`   | Set the model ID for planning.                                                                                          | Google AI Studio    | `gemini-2.0-flash`   |
| `AGENT_BACKEND`  | Set the LLM backend for the agent worker (`scripts/agent.ts`): `gemini` or `claude`. Any other value throws at startup. | System Admin        | `gemini`              |
| `AGENT_TOKEN`    | Set the global token that authenticates the agent process with the app API.                                            | System Admin        | -                     |

## 4. Security & Cron

| **Variable**  | **Description**                                                                                       | **Source**   | **Default** |
| -------------- | ---------------------------------------------------------------------------------------------------------- | -------------- | ------------- |
| `CRON_SECRET` | Set the 32+ character secret for scheduled and cron-triggered routes, such as usage aggregation and ghost-buster cleanup. | System Admin | -           |

## 5. Integrations & Notifications

| **Variable**            | **Description**                         | **Source**      | **Default**             |
| ------------------------ | ----------------------------------------- | ------------------ | -------------------------- |
| `RESEND_API_KEY`        | Set the API key for transactional email. | Resend.com      | -                       |
| `RESEND_FROM_EMAIL`     | Set the verified sender email address.   | Resend.com      | `noreply@specdrivr.dev` |
| `GITHUB_TOKEN`          | Set the Personal Access Token for repository access. | GitHub Settings | -                       |
| `GITHUB_WEBHOOK_SECRET` | Set the secret that validates incoming webhooks. | GitHub Repo     | -                       |

## 6. Security Note

- **Server-Only**: Import variables from `@/lib/env` so they do not reach the client. `NEXT_PUBLIC_APP_URL` is intentionally public.
- **Validation**: A missing or malformed Zod-validated variable causes a Zod error at startup. The application then exits. `APP_URL` and `AGENT_BACKEND` read directly from `process.env` and are outside this validation.
