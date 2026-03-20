**SPECDRIVR**

Master Product Specification — Environment Variable Registry

[Status: GROUND TRUTH]

---

## 1. Overview

This document lists all environment variables required by Specdrivr. These are validated at runtime via `src/lib/env-core.ts`.

## 2. Core Application

| **Variable** | **Description** | **Source** | **Default** |
|---|---|---|---|
| `DATABASE_URL` | Connection string for PostgreSQL. | Database Provider | - |
| `BETTER_AUTH_SECRET` | 32+ char secret for signing auth tokens. | System Admin | - |
| `BETTER_AUTH_URL` | Base URL for the auth server. | Deployment URL | `http://localhost:3000` |
| `REDIS_URL` | Connection string for ioredis. | Redis Provider | `redis://localhost:6379` |
| `NODE_ENV` | Current environment (`development`, `production`, `test`). | System | `development` |

## 3. AI & Orchestration

| **Variable** | **Description** | **Source** | **Default** |
|---|---|---|---|
| `GEMINI_API_KEY` | API key for Google Gemini plan generation. | Google AI Studio | - |
| `GEMINI_MODEL` | The model ID to use for planning. | Google AI Studio | `gemini-2.0-flash` |
| `AGENT_TOKEN` | Global token used by the agent to authenticate. | System Admin | - |

## 4. Integrations & Notifications

| **Variable** | **Description** | **Source** | **Default** |
|---|---|---|---|
| `RESEND_API_KEY` | API key for transactional emails. | Resend.com | - |
| `RESEND_FROM_EMAIL` | Verified sender email address. | Resend.com | `noreply@specdrivr.dev` |
| `GITHUB_TOKEN` | Personal Access Token for repo access. | GitHub Settings | - |
| `GITHUB_WEBHOOK_SECRET` | Secret for verifying incoming webhooks. | GitHub Repo | - |

## 5. Security Note
- **Server-Only**: Variables must be imported from `@/lib/env` to ensure they are not leaked to the client.
- **Validation**: If any variable is missing or malformed, the application will throw a Zod error and exit during startup.
