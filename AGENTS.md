# Spec-Drivr: AI Agent Development Platform

Spec-Drivr is an AI-native orchestration platform designed to operationalize the Spec-Driven Development (SDD) cycle. It transforms static technical specifications into executable agent workflows by using PostgreSQL not just as a database, but as a central state machine that governs the transition of features from "intent" to "verified code." The distinctive architecture relies on "persistent memory," where the entire project context—including specifications, architecture decisions, and task history—is stored in a structured relational format, allowing AI agents to maintain high-fidelity context across discontinuous execution sessions. Agents in this system are autonomous entities that fetch "missions" via a REST API, execute tasks against a codebase, and report results back to the state machine, enabling a closed-loop development cycle.

## Architecture

| Layer        | Technology              | Purpose in this project          |
|-------------|-------------------------|----------------------------------|
| Framework   | Next.js 14 (App Router) | Full-stack framework for UI and API routes |
| Language    | TypeScript (strict)     | Type-safe development across client and server |
| Database    | PostgreSQL              | State machine + persistent stores for project context |
| ORM         | Drizzle ORM             | Type-safe SQL client and schema management |
| Validation  | Zod                     | Schema validation for API inputs and internal data |
| Styling     | Tailwind CSS            | Utility-first CSS for premium, responsive UI |
| Auth        | NextAuth.js v5          | Session management and credential-based authentication |

```text
DATA FLOW DIAGRAM
+-----------------+      +-----------------+      +-------------------+
|  UI (Next.js)   |----->|  API Boundary   |----->|  PostgreSQL /    |
| (Client/Server) |<-----| (Zod Validated) |<-----|  Drizzle ORM     |
+-----------------+      +--------+--------+      +---------+---------+
                                  ^                         |
                                  |                         |
                                  |         Mission/Task    |
                                  +-------------------------+
                                  |         Updates/Logs    |
                                  v                         |
                         +-----------------+                |
                         |    AI Agent     | <--------------+
                         | (External/Runner)|
                         +-----------------+
```

## Repository Structure

- `src/app/` - Next.js App Router: Includes UI pages and API routes (`/api`).
- `src/components/` - Reusable UI components: Styled with Tailwind and follow Linear-inspired design.
- `src/db/` - Database layer: Contains `schema.ts` and Drizzle configuration.
- `src/lib/` - Shared utilities: Core logic like `agent-memory.ts`, `actions.ts`, and Zod `schemas.ts`.
- `src/hooks/` - React hooks: Client-side state and data fetching logic.
- `drizzle/` - Generated migrations: [DO NOT EDIT] Managed via `npm run db:generate`.
- `public/` - Static assets: Images, icons, and fonts.
- `tests/` - Test suite: Divided into `unit` and `api` tests using Vitest and Playwright.

## Database Schema

PostgreSQL serves as the source of truth for all agent states and project context.

### Core Tables

- **projects**: Defines the agent workspace.
  - `agent_status`: Enum (`idle`, `running`, `paused`, `stopped`, `error`). Drives agent loop.
  - `state`: JSONB field for transient context (decisions, blockers).
  - `git_config`: JSONB for repository integration details.
- **specifications**: Markdown-based technical requirements.
  - `isActive`: Boolean flag to determine the current "live" spec for the agent.
- **plans**: High-level execution strategies derived from specifications.
  - `status`: Enum (`draft`, `active`, `completed`, `archived`).
  - `architecture_decisions`: JSONB storing key technical choices.
- **tasks**: Atomic units of work within a plan.
  - `status`: Enum (`todo`, `in_progress`, `done`, `blocked`, `paused`, `skipped`).
  - `dependency_task_id`: Self-referencing FK for task sequencing.
  - `files_involved`: JSONB array of file paths.
- **agent_logs**: Real-time event stream from agents.
  - `level`: Enum (`debug`, `info`, `warn`, `error`).
  - `taskId`: FK to tasks for contextual logging.
- **test_results**: Outcome of agent-executed verifications.
  - `success`: Boolean result flag.
- **agent_tokens**: Scoped API keys for agent authentication.
  - `token_hash`: Secure storage of `X-Agent-Token`.

### State Machine

- **Project State**: `idle` -> `running` (triggered by Start API) -> `paused`/`stopped` -> `idle`.
- **Task State**: `todo` -> `in_progress` (assigned to agent) -> `done` (on test success) or `blocked` (on failure).
- **Transitions**: Controlled via `src/lib/agent-memory.ts`. Logic ensures `dependency_task_id` is `done` before a task enters `todo` scope for the agent.

## Commands

| Command              | What it does                          |
|---------------------|---------------------------------------|
| `npm run dev`       | Starts the Next.js development server |
| `npm run build`     | Compiles the application for production |
| `npm run db:generate`| Scans schema and creates Drizzle migrations |
| `npm run db:migrate` | Applies migrations to the database |
| `npm run db:push`    | Pushes schema changes directly (dev only) |
| `npm run db:studio`  | Opens the Drizzle GUI for database browsing |
| `npm run db:seed`    | Seeds database with comprehensive test data |
| `npm run test`      | Runs Vitest unit tests |
| `npm run test:e2e`  | Runs Playwright end-to-end tests |
| `npm run test:all`  | Runs both unit and e2e tests |

## Environment Variables

| Variable            | Required | Purpose                    | Example value       |
|--------------------|----------|----------------------------|---------------------|
| `DATABASE_URL`      | Yes      | PostgreSQL connection URL   | `postgres://user:pass@host:5432/db` |
| `AUTH_SECRET`       | Yes      | NextAuth encryption secret | `random-string`     |
| `AGENT_TOKEN`       | Yes      | Global token for agent auth | `specdriver-dev-token`|
| `NEXT_PUBLIC_APP_URL`| No      | Base URL for the app       | `http://localhost:3000` |

## Coding Conventions

### Naming
- **Files**: Kebab-case (e.g., `agent-memory.ts`).
- **Components**: PascalCase (e.g., `AgentStatusPanel.tsx`).
- **API routes**: Folder-based routing with `route.ts`.
- **DB schema**: camelCase in TypeScript, snake_case in SQL (handled by Drizzle mappings).
- **Zod schemas**: Suffix with `Schema` (e.g., `CreateTaskSchema`).

### TypeScript
- Strict mode is ON (see `tsconfig.json`).
- Types are primarily co-located in `src/db/schema.ts` for entities and `src/lib/schemas.ts` for API/Validation.
- Drizzle inferred types used via `InferSelectModel` and `InferInsertModel`.

### Validation
- All API inputs validated with Zod at the route boundary using schemas in `src/lib/schemas.ts`.
- Validation errors return a structured JSON response with `success: false`.

### Error Handling
- Server: `try/catch` blocks returning `{ success: false, error: string }`.
- API: Standard HTTP status codes (401, 400, 404, 500) paired with JSON error bodies.
- Agents: Errors are logged to `agent_logs` and task status is set to `blocked` or `error`.

### Component Patterns
- Server Components by default. Use `"use client"` only for interactivity or hooks.
- Data fetching: Prefer Server Components calling `src/lib/actions.ts` directly.

## API Reference

### [GET] /api/agent/mission
- **Purpose**: Fetches the active project context and the next available task.
- **Auth**: Required (`X-Agent-Token`).
- **Request**: Query `project_id`.
- **Response**: `{ success: true, data: { project, specification, active_plan, next_task, unblocked_tasks } }`.

### [POST] /api/agent/tasks
- **Purpose**: Creates new tasks or bulk tasks under a plan.
- **Auth**: Required (`X-Agent-Token`).
- **Request**: `TaskSchema` or `{ tasks: TaskSchema[] }`.

### [GET] /api/projects/:id/agent/status
- **Purpose**: Retrieves real-time status of a project's agent.
- **Auth**: Standard session.

## Agent System

An **Agent** is an external worker that interacts with Spec-Drivr to fulfill specifications. Its behavior is dictated by the database state:
1. **Lifecycle**: Started via `/api/projects/[id]/agent/start` (updates `agent_status` to `running`).
2. **Context**: Agents read their "mission" (Spec + Plan + State) from `/api/agent/mission`.
3. **Execution**: Agents iterate through `todo` tasks. Completion requires a SQL update through the API which triggers a status change based on test results.
4. **SDD Cycle**: Spec Input -> AI Plans (Architecture Decisions) -> Task Generation -> Agent Execution -> Test Verification -> Result Persistence.

## Hard Rules for Claude

### NEVER:
- Change the DB schema without running `npm run db:generate`.
- Write raw SQL — use **Drizzle ORM** exclusively.
- Skip Zod validation on any API route input.
- Use `any` type in TypeScript.
- Delete a migration file in `drizzle/`.
- Bypass the state machine logic in `src/lib/agent-memory.ts`.
- Use `useEffect` for primary data fetching — use Server Components or Actions.

### ALWAYS:
- Run `npm run db:migrate` after creating new migrations.
- Validate with Zod at the API route boundary.
- Keep `CLAUDE.md` updated when architecture decisions change.
- Follow the Linear design system patterns (see `src/lib/ios-styles.ts` for reference).

## Testing

- **Framework**: Vitest (Unit) and Playwright (E2E).
- **Coverage**: All `agent-memory.ts` transitions and API route logic must be tested.
- **Run**: `npm run test` for unit, `npm run test:e2e` for browser tests.
- **Mocks**: DB interactions in unit tests are typically against a local test postgres instance or mocked via Drizzle service overrides.

## Known Issues & Architecture Decisions

- **PostgreSQL as State Machine**: Chosen over Redis for strict ACID compliance and relational complex queries required for task dependency resolution.
- **Beta State**: Git webhook integration is currently in experimental phase (`src/app/api/webhooks/git`).
