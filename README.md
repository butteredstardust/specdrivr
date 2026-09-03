<div align="center">

<img src="./public/brand/icon.svg" alt="Specdrivr icon" width="112" height="112">

# Specdrivr

**Spec-driven development for AI-augmented teams. Write the spec, the platform makes the tasks, your agent ships them.**

[![CI](https://img.shields.io/github/actions/workflow/status/butteredstardust/specdrivr/ci.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=CI)](https://github.com/butteredstardust/specdrivr/actions/workflows/ci.yml)
[![Security](https://img.shields.io/github/actions/workflow/status/butteredstardust/specdrivr/security.yml?branch=main&style=for-the-badge&logo=github&label=security)](https://github.com/butteredstardust/specdrivr/actions/workflows/security.yml)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)

<br>

![Mission Control](./public/screenshots/dashboard-2026-09-03.png)

</div>

---

## Why

AI agents don't know your codebase, your architecture, or your constraints — so they scatter data access, skip auth checks, and solve the same problem three different ways.

Specdrivr is the single source of truth for *how* your system gets built. You write a spec. The platform decomposes it into tasks. An agent executes against strict architectural rules. Your team reviews logic, not formatting.

## How it works

1. **Write a spec** — plain language: *"Add OAuth2 for Google and GitHub. Support account linking. Store refresh tokens securely."*
2. **Tasks are generated** — the plan worker decomposes the spec into atomic, ordered work items.
3. **An agent executes** — it reads `AGENTS.md` / `CLAUDE.md` / `GEMINI.md`, claims tasks, and commits behind pre-commit hooks.
4. **You review and merge** — every session leaves a full audit trail: what changed, why, what was tested.

---

## Quick start

> [!NOTE]
> Prerequisites: [Node.js](https://nodejs.org) as pinned in [`.nvmrc`](.nvmrc), [pnpm](https://pnpm.io), and Docker (for Postgres + Redis).

```bash
git clone https://github.com/butteredstardust/specdrivr
cd specdrivr
pnpm install

cp .env.example .env.local        # set DATABASE_URL, BETTER_AUTH_SECRET, GEMINI_API_KEY
docker compose -f infra/compose/docker-compose.yml up -d postgres redis

pnpm setup                        # db:migrate + db:seed
pnpm dev                          # http://localhost:3000
```

### Running the autonomous pipeline

The web app alone lets you write specs. To take a spec all the way through plan → execute, run the two workers alongside it:

```bash
pnpm worker                       # plan generation + task decomposition (Gemini)

export AGENT_TOKEN="your_project_agent_token"   # Project Settings
export SESSION_ID="active_session_id"           # Mission Control URL
export AGENT_BACKEND="claude"                   # or "gemini"
pnpm agent                        # claims and executes tasks
```

---

## Screenshots

| Projects | Specifications | Tasks |
|:---:|:---:|:---:|
| ![Projects](./public/screenshots/projects-2026-09-03.png) | ![Specification View](./public/screenshots/spec-view-2026-09-03.png) | ![Tasks](./public/screenshots/spec-tasks-2026-09-03.png) |
| *Multiple AI-augmented codebases.* | *Version-controlled Markdown specs.* | *Atomic tasks decomposed from the plan.* |

| Sessions | Session Detail | Audit Log |
|:---:|:---:|:---:|
| ![Sessions](./public/screenshots/sessions-2026-09-03.png) | ![Session Detail](./public/screenshots/session-detail-2026-09-03.png) | ![Activity](./public/screenshots/activity-2026-09-03.png) |
| *Execution history and agent tracking.* | *Real-time terminal logs and reasoning.* | *Full transparency into all actions.* |

---

## Architecture

Strict constraints are what make agent output predictable. Specdrivr enforces them on itself and on the projects built inside it:

- **Repository pattern** — all data access goes through repositories. One place to read and write.
- **Server Actions** — every mutation is a Server Action, and `await auth()` comes first. No exceptions.
- **Server Components by default** — `"use client"` only where interactivity requires it.
- **Migrations as code** — `db:generate` + `db:migrate`. Never `db:push`.
- **Pre-commit hooks** — 15 checks before anything lands. Skipping them requires an RCA.

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) | Server-first, type-safe, AI-legible |
| Language | TypeScript 5.9 | Catches agent mistakes at compile time |
| Database | PostgreSQL + Drizzle | Migrations as code, typed queries |
| Auth | better-auth | Session-based, production-grade |
| UI | shadcn/ui + Tailwind 4 | One consistent design system |
| Validation | Zod | Every boundary checked |
| Logging | Pino | Structured audit trail |
| Testing | Vitest + Playwright | Fast units, real E2E |

---

## Commands

```bash
pnpm dev              # start the platform
pnpm lint             # eslint
pnpm typecheck        # tsc --noEmit
pnpm test             # unit + e2e
pnpm test:unit        # vitest
pnpm test:e2e         # playwright

pnpm db:generate      # generate migrations from schema
pnpm db:migrate       # apply pending migrations
pnpm db:studio        # drizzle studio
```

---

## Docs

| File | What's in it |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | The architectural mandate — every rule an agent must follow. Read first. |
| [`CLAUDE.md`](CLAUDE.md) | Claude-specific workflows and gotchas. |
| [`GEMINI.md`](GEMINI.md) | Gemini-specific patterns and integrations. |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | How to contribute. |
| [`SECURITY.md`](SECURITY.md) | Reporting vulnerabilities. |

Bug or feature request? [Open an issue](https://github.com/butteredstardust/specdrivr/issues) and say what you were trying to do.

---

## Roadmap

- Real-time Mission Control for active sessions
- Spec history and version diffing
- Built-in review and approval workflows
- Custom per-project rulesets
- Swappable agent backends

---

MIT licensed. Build with it, ship it, let the AI do the boring parts.
