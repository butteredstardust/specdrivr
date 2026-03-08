# Engineering Implementation Plan V2

## Phase 1 — Codebase Inventory

### 1a. File Tree
```text
.
├── .dockerignore
├── .env.example
├── .github
│   └── workflows
│       ├── lint-and-typecheck.yml
│       ├── security.yml
│       └── test.yml
├── .gitignore
├── .npmrc
├── .nvmrc
├── AGENTS.md
├── BOOTSTRAP_README.md
├── CLAUDE.md
├── DEVELOPMENT.md
├── Dockerfile.ubuntu
├── LICENSE
├── README.md
├── bootstrap.sh
├── components.json
├── docker-compose.yml
├── documentation
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── AUTHENTICATION.md
│   ├── DATABASE.md
│   ├── DESIGN_SYSTEM.md
│   ├── DEVELOPMENT.md
│   ├── INTEGRATIONS.md
│   ├── JULES_TEMPLATE.md
│   ├── OPERATIONS.md
│   ├── PRODUCT.md
│   ├── PRODUCT_FEATURES.md
│   ├── README.md
│   ├── SCREEN_FLOW_INDEX.md
│   ├── SPECIFICATION_INDEX.md
│   ├── USER_INTERFACE.md
│   └── specification.md
├── drizzle.config.ts
├── eslint.config.js
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── playwright.config.ts
├── postcss.config.mjs
├── public
│   ├── brand
│   │   └── icon.svg
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src
│   ├── app
│   │   ├── api
│   │   │   ├── projects
│   │   │   └── tasks
│   │   ├── error.tsx
│   │   ├── favicon.ico
│   │   ├── global-error.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components
│   │   ├── error-boundary.tsx
│   │   └── ui
│   │       ├── alert-dialog.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── glass-card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── skeleton.tsx
│   │       ├── sonner.tsx
│   │       ├── tabs.tsx
│   │       └── textarea.tsx
│   ├── db
│   │   ├── index.ts
│   │   └── schema.ts
│   ├── lib
│   │   ├── db-helpers.ts
│   │   ├── env.ts
│   │   ├── error-handler.ts
│   │   ├── errors.ts
│   │   ├── schemas.ts
│   │   └── utils.ts
│   └── repositories
│       ├── base-repository.ts
│       ├── index.ts
│       ├── project-repository.ts
│       └── task-repository.ts
├── tests
│   ├── __snapshots__
│   │   └── home.test.tsx.snap
│   ├── e2e
│   │   └── home.spec.ts
│   ├── home.test.tsx
│   └── setup.ts
├── tsconfig.json
└── vitest.config.ts
```

### 1b. Package Inventory
- Next.js: ^16.1.6
- React: ^19.2.4
- Drizzle ORM: ^0.45.1
- Auth Library (next-auth): ^5.0.0-beta.19
- UI Component Library (shadcn): ^4.0.0
- Zod: ^3.22.0
- Redis Client: Missing (needs to be added)
- Pino: Missing (needs to be added)
- Testing Framework (Vitest): ^4.0.18
- Testing Framework (Playwright): ^1.42.0

### 1c. Schema Audit
- `projects`: EXISTS_PARTIAL (Missing columns: slug, createdBy, avatarColor, isDemo)
- `specifications`: EXISTS_COMPLETE
- `plans`: EXISTS_PARTIAL (Missing columns: generationDurationMs, generationError, modelVersion, taskCount, totalEstimatedMinutes)
- `tasks`: EXISTS_PARTIAL (Missing columns: estimatedMinutes, actualDurationMs, gitBranch, gitCommitHash, expectedFiles, agentVersion, promptTokensUsed, completionTokensUsed, totalCostUsd)
- `test_results`: EXISTS_COMPLETE
- `agent_logs`: EXISTS_COMPLETE
- `users`: EXISTS_PARTIAL (Missing columns: avatarUrl, timezone, locale, onboardingStep)
- `git_commits`: EXISTS_COMPLETE
- `agent_tokens`: EXISTS_COMPLETE
- `api_request_logs`: EXISTS_COMPLETE
- `task_attempts`: MISSING (Needs to be created)
- `file_changes`: MISSING (Needs to be created)
- `agent_sessions`: MISSING (Needs to be created)
- `agent_config`: MISSING (Needs to be created)
- `webhook_deliveries`: MISSING (Needs to be created)
- `usage_snapshots`: MISSING (Needs to be created)
- `invites`: MISSING (Needs to be created)

### 1d. API Route Audit
- `src/app/api/projects/route.ts` (GET, POST, PATCH, DELETE) -> STUB (Implements part of API.md §6.2, but missing nested routes, /api/v1 prefix)
- `src/app/api/tasks/route.ts` (GET, POST, PATCH) -> STUB (Implements part of API.md §6.5, missing /api/v1 prefix)
- Auth endpoints: MISSING
- Projects API (/api/v1/projects/:id): MISSING
- Specifications API: MISSING
- Plans API: MISSING
- Tasks API (/api/v1/tasks/:id/*): MISSING
- Sessions API: MISSING
- Team management API: MISSING
- Notifications & User API: MISSING

### 1e. Page and Component Audit
- Mission Control (`/`): STUB (Simple static page, missing actual dashboard UI, task integration)
- Login Page (`/login`): MISSING
- Forgot Password (`/forgot-password`): MISSING
- Reset Password (`/reset-password`): MISSING
- Projects (`/projects`): MISSING
- Specifications (`/specs`): MISSING
- Spec Editor (`/specs/new`, `/specs/[id]/edit`): MISSING
- Spec Detail (`/specs/[id]`): MISSING
- Sessions (`/sessions`): MISSING
- Settings (`/settings`): MISSING
- App Shell (Sidebar, Header): MISSING
- DAEMON Mascot Component: MISSING
- Task Drawer / Overlays / Dialogs: MISSING

### 1f. Configuration Audit
- `middleware.ts` / `proxy.ts`: MISSING
- `lib/auth.ts`: MISSING
- `lib/db/index.ts`: EXISTS
- `lib/env.ts`: EXISTS
- `lib/logger.ts`: MISSING
- Redis client setup: MISSING
- Rate limiting setup: MISSING

## Phase 2 — Feature Coverage Matrix

| Spec Section | Feature | Status | V2 Task IDs |
| --- | --- | --- | --- |
| DATABASE.md §5 | Base schema | PARTIAL | TASK-001, TASK-002, TASK-003 |
| DATABASE.md §21 | Extended schema | PARTIAL | TASK-001, TASK-002, TASK-003 |
| DATABASE.md §18 | Seed data | MISSING | TASK-004 |
| API.md §6.1 | Auth endpoints | MISSING | TASK-007 |
| API.md §6.2 | Projects API | PARTIAL | TASK-008 |
| API.md §6.3 | Specifications API | MISSING | TASK-009 |
| API.md §6.4 | Plans API | MISSING | TASK-010 |
| API.md §6.5 | Tasks API | PARTIAL | TASK-011 |
| API.md §6.6 | Sessions API | MISSING | TASK-012 |
| API.md §6.7 | Team management API | MISSING | TASK-013 |
| API.md §6.8 | Notifications & User API | MISSING | TASK-007, TASK-014 |
| AUTHENTICATION.md §7.1 | Auth system (BetterAuth, Redis sessions, bcrypt) | MISSING | TASK-005 |
| AUTHENTICATION.md §7.2 | RBAC — all 4 roles, all permissions | MISSING | TASK-008, TASK-013, TASK-038, TASK-046, TASK-054 |
| DESIGN_SYSTEM.md §8 | Design tokens, Tailwind theme | PARTIAL | TASK-017 |
| DESIGN_SYSTEM.md §9 | DAEMON mascot — all expressions | MISSING | TASK-017 |
| DESIGN_SYSTEM.md §10 | App shell — sidebar, header, nav | MISSING | TASK-018 |
| DESIGN_SYSTEM.md §11 | All pages — detailed spec | MISSING | TASK-022 to TASK-055 |
| DESIGN_SYSTEM.md §12 | State machines in UI | MISSING | TASK-034 |
| DESIGN_SYSTEM.md §15 | Notification system | MISSING | TASK-049 |
| PRODUCT.md §14 | Onboarding flow | MISSING | TASK-025 |
| PRODUCT.md §16 | Error states & edge cases | MISSING | TASK-017, TASK-021, TASK-023, TASK-031, TASK-033, TASK-034, TASK-039, TASK-044, TASK-046 |
| PRODUCT.md §20 | Empty states & microcopy | MISSING | TASK-026, TASK-028, TASK-030, TASK-034, TASK-035, TASK-036, TASK-037, TASK-041, TASK-044, TASK-049, TASK-052, TASK-055 |
| INTEGRATIONS.md §13.1 | GitHub integration | MISSING | TASK-053 |
| INTEGRATIONS.md §13.2 | Slack integration | MISSING | TASK-053 |
| INTEGRATIONS.md §13.3 | Generic webhooks | MISSING | TASK-016, TASK-053 |
| INTEGRATIONS.md §13.4 | DAEMON agent protocol | MISSING | TASK-015 |
| INTEGRATIONS.md §26 | Cost & usage tracking | MISSING | TASK-054 |
| OPERATIONS.md §17.1 | Performance targets | MISSING | TASK-006, TASK-056 |
| OPERATIONS.md §17.2 | Security (rate limiting, CSRF, Zod) | PARTIAL | TASK-005, TASK-006 |
| OPERATIONS.md §17.3 | Accessibility (WCAG 2.1 AA) | MISSING | TASK-017, TASK-018 |


## Phase 4 — Task Plan

### Schema and Foundation

---

## TASK-001: Schema Updates — Users, Projects, Invites

**Area:** Database
**Depends on:** none
**Estimated effort:** S

### Context
Extends existing `users` and `projects` tables with missing fields and adds the `invites` table for team management. Critical for avatar display, accurate timezone/locale rendering, and routing (project slug).
### Acceptance criteria
- [ ] `avatarUrl`, `timezone`, `locale`, and `onboardingStep` exist on the `users` table.
- [ ] `slug`, `createdBy`, `avatarColor`, and `isDemo` exist on the `projects` table with the correct constraints.
- [ ] `invites` table is created with `invitedBy`, `resendCount`, and `lastResentAt` fields.
- [ ] A Drizzle migration can be successfully generated using `npm run db:generate`.
### Implementation notes
- **File:** `src/db/schema.ts` — Add missing columns to `users` and `projects`. Add new `invites` table definition.
- **Database query pattern:** Add missing columns and tables. No transaction required.
- **Index:** Create an index on `projects.slug`.

---

## TASK-002: Schema Updates — Plans, Tasks, File Changes

**Area:** Database
**Depends on:** TASK-001
**Estimated effort:** S

### Context
Updates orchestration core tables (`plans` and `tasks`) to support telemetry, cost tracking, and precise task mapping. Adds `task_attempts` and `file_changes` tables.
### Acceptance criteria
- [ ] `generationDurationMs`, `generationError`, `modelVersion`, `taskCount`, `totalEstimatedMinutes` added to `plans`.
- [ ] `estimatedMinutes`, `actualDurationMs`, `gitBranch`, `gitCommitHash`, `expectedFiles`, `agentVersion`, token metrics, and `totalCostUsd` added to `tasks`.
- [ ] `task_attempts` table is created with JSONB logs preserving `seq` ordering.
- [ ] `file_changes` table is created to track diffs per attempt.
### Implementation notes
- **File:** `src/db/schema.ts` — Update `plans` and `tasks`. Create `task_attempts` and `file_changes`.
- **Database query pattern:** Define new schema fields.
- Use Drizzle parameterised JSONB types carefully for `logLines` on `task_attempts`.

---

## TASK-003: Schema Updates — Sessions, Config, Integrations, Usage

**Area:** Database
**Depends on:** TASK-002
**Estimated effort:** S

### Context
Finalizes the data model by creating agent sessions, agent configuration, webhook delivery tracking, usage snapshots, and audit log.
### Acceptance criteria
- [ ] `agent_sessions` table added with metrics tracking (git branch tracking, token aggregates).
- [ ] `agent_config` table added with file glob boundaries.
- [ ] `webhook_deliveries` and `usage_snapshots` tables are created with proper unique constraints.
- [ ] `audit_log` table added.
- [ ] Drizzle migration generated and applied cleanly against local database.
### Implementation notes
- **File:** `src/db/schema.ts` — Add `agent_sessions`, `agent_config`, `webhook_deliveries`, `usage_snapshots`, `audit_log`.
- **Database query pattern:** Create tables.

---

## TASK-004: Seed Data Generation

**Area:** Database
**Depends on:** TASK-003
**Estimated effort:** M

### Context
Implements the definitive database seed script to meet exact product demonstration scenarios, specifically mocking active sessions, a blocked task, and `pending_approval` state.
### Acceptance criteria
- [ ] Running `npm run db:seed` provisions exactly 3 users, 2 projects, 6 specs, 4 plans.
- [ ] `spec_001` has a plan with status `pending_approval`.
- [ ] `task_105` in `spec_002` is seeded with status `blocked` and valid blockedReason.
- [ ] One session is seeded in a running state.
### Implementation notes
- **File:** `src/db/seed.ts`
- **Database query pattern:** Insert data respecting referential integrity via `db.transaction()`. Use `onConflictDoNothing()`.

---

### Core Backend & Infrastructure

---

## TASK-005: Authentication Infrastructure

**Area:** Auth
**Depends on:** TASK-004
**Estimated effort:** M

### Context
Setup BetterAuth v5 (next-auth v5), configure bcrypt password hashing, and implement Redis-based session storage. Applies [DECISION-008] using `ioredis`.
### Acceptance criteria
- [ ] `src/lib/auth.ts` exists and exports standard NextAuth primitives (auth, signIn, signOut).
- [ ] Redis client is correctly initialized and configured as the NextAuth session store.
- [ ] API routes for authentication are mounted.
- [ ] Validated users can login using credentials provider with bcrypt cost 12.
### Implementation notes
- **File:** `src/lib/auth.ts`, `src/lib/redis.ts`, `src/app/api/auth/[...nextauth]/route.ts`
- **Endpoint:** `POST /api/auth/[...nextauth]`
- **Zod schema:** `CredentialsSchema = z.object({ email: z.string().email(), password: z.string().min(8) })`
- **Database query pattern:** `db.select().from(users).where(eq(users.email, email))`

---

## TASK-006: Core Middlewares (Rate Limiting, Logger)

**Area:** Infrastructure
**Depends on:** TASK-005
**Estimated effort:** S

### Context
Sets up global request proxying, structured JSON logging via Pino, and Redis-backed rate limiting. Enforces `server-only`.
### Acceptance criteria
- [ ] `src/lib/logger.ts` exports a configured Pino logger (info level in prod).
- [ ] `src/proxy.ts` enforces rate limiting on `/api/*`.
- [ ] API requests exceeding rate limits return HTTP 429.
- [ ] `import 'server-only'` enforcement verified on `src/lib/db/index.ts`, `src/lib/env.ts`, `src/lib/logger.ts`.
- [ ] `/api/health` endpoint returning `{ status, db, redis }`.
### Implementation notes
- **File:** `src/lib/logger.ts`, `src/proxy.ts`, `src/app/api/health/route.ts`
- **Endpoint:** `GET /api/health`
- **Success response:** HTTP 200 `{ data: { status: 'ok', db: 'ok', redis: 'ok' } }`

---

### API Implementation

---

## TASK-007: API — Auth Endpoints

**Area:** API
**Depends on:** TASK-006
**Estimated effort:** M

### Context
Implements signup and password reset.
### Acceptance criteria
- [ ] `POST /api/v1/auth/signup` creates a user and hashes the password properly.
- [ ] `POST /api/v1/auth/reset-password` handles token validation correctly.
### Implementation notes
- **File:** `src/app/api/v1/auth/signup/route.ts`, `src/app/api/v1/auth/reset-password/route.ts`
- **Endpoint:** `POST /api/v1/auth/signup`
- **Request body:** `{ email: string, password: string }`
- **Success response:** HTTP 201 `{ data: { id: string, email: string } }`
- **Error cases:** HTTP 400 VALIDATION_ERROR, HTTP 409 CONFLICT if email exists.
- **Zod schema:** `SignupSchema = z.object({ email: z.string().email(), password: z.string().min(8) })`
- **Database query pattern:** `db.insert(users)`

---

## TASK-008: API — Projects CRUD

**Area:** API
**Depends on:** TASK-007
**Estimated effort:** M

### Context
Restructures the existing project stubs into `/api/v1/projects`. Enforces RBAC permissions.
### Acceptance criteria
- [ ] `GET /api/v1/projects` returns projects.
- [ ] `GET /api/v1/projects/:id` returns project details and member counts.
- [ ] `POST /api/v1/projects` creates project.
- [ ] `PATCH /api/v1/projects/:id` correctly updates project configurations.
- [ ] `DELETE /api/v1/projects/:id` deletes project.
### Implementation notes
- **File:** `src/app/api/v1/projects/route.ts`, `src/app/api/v1/projects/[id]/route.ts`
- **Endpoint:** `POST /api/v1/projects`
- **Request body:** `{ name: string, description: string, slug: string }`
- **Success response:** HTTP 201 `{ data: { id: string } }`
- **Error cases:** HTTP 401 UNAUTHORIZED, HTTP 403 FORBIDDEN (DELETE non-owner), HTTP 400 VALIDATION_ERROR.
- **Zod schema:** `ProjectCreateSchema = z.object({ name: z.string().min(1), description: z.string().optional(), slug: z.string() })`
- **Database query pattern:** `db.insert(projects)`
- **RBAC rule:** Action: DELETE. Enabled for: Owner.

---

## TASK-009: API — Specifications CRUD

**Area:** API
**Depends on:** TASK-008
**Estimated effort:** M

### Context
Create and manage specifications.
### Acceptance criteria
- [ ] `GET /api/v1/projects/:projectId/specs` lists specs.
- [ ] `POST /api/v1/projects/:projectId/specs` creates a new specification and default version.
- [ ] Returns HTTP 409 CONFLICT on duplicate name.
- [ ] `GET /api/v1/specs/:id/versions` lists history metadata.
### Implementation notes
- **File:** `src/app/api/v1/projects/[projectId]/specs/route.ts`, `src/app/api/v1/specs/[id]/versions/route.ts`
- **Endpoint:** `POST /api/v1/projects/:projectId/specs`
- **Request body:** `{ name: string, content: string }`
- **Success response:** HTTP 201 `{ data: { id: string } }`
- **Error cases:** HTTP 409 CONFLICT if duplicate name.
- **Zod schema:** `CreateSpecSchema = z.object({ name: z.string().min(1).max(255), content: z.string() })`
- **Database query pattern:** Select where name equals. If exists return 409. Insert into `specifications`.

---

## TASK-010: API — Plans

**Area:** API
**Depends on:** TASK-009
**Estimated effort:** M

### Context
Generate and manage plans.
### Acceptance criteria
- [ ] `POST /api/v1/specs/:id/plan/generate` triggers the async plan engine.
- [ ] `GET /api/v1/specs/:id/plan` returns plan status for polling.
- [ ] `POST /api/v1/plans/:id/approve` sets plan status to `executing` and creates an `agent_session`.
- [ ] `POST /api/v1/plans/:id/reject` sets status to `rejected`. Requires Admin/Owner. Required notes.
- [ ] `POST /api/v1/plans/:id/request-changes` flow with required notes.
### Implementation notes
- **File:** `src/app/api/v1/specs/[id]/plan/generate/route.ts`, `src/app/api/v1/specs/[id]/plan/route.ts`, `src/app/api/v1/plans/[id]/approve/route.ts`, `src/app/api/v1/plans/[id]/reject/route.ts`, `src/app/api/v1/plans/[id]/request-changes/route.ts`
- **Endpoint:** `POST /api/v1/plans/:id/reject`
- **Request body:** `{ notes: string }`
- **Success response:** HTTP 200 `{ data: { status: 'rejected' } }`
- **Error cases:** HTTP 400 VALIDATION_ERROR, HTTP 403 FORBIDDEN.
- **Zod schema:** `RejectPlanSchema = z.object({ notes: z.string().min(1) })`
- **Database query pattern:** `db.update(plans).set({ status: 'rejected' })`

---

## TASK-011: API — Tasks CRUD

**Area:** API
**Depends on:** TASK-010
**Estimated effort:** M

### Context
Fetch task logs, unblock tasks, manual overrides.
### Acceptance criteria
- [ ] `GET /api/v1/tasks/:id/attempts` returns logs ordered sequentially.
- [ ] `POST /api/v1/tasks/:id/retry` resets task attempt.
- [ ] `POST /api/v1/tasks/:id/unblock` accepts `humanContext` and sets status to todo.
- [ ] `POST /api/v1/tasks/:id/override` marks done or blocked. Admin/Owner only.
- [ ] Return HTTP 422 if manual mark done violates dependency (force flag support).
### Implementation notes
- **File:** `src/app/api/v1/tasks/[id]/attempts/route.ts`, `src/app/api/v1/tasks/[id]/retry/route.ts`, `src/app/api/v1/tasks/[id]/unblock/route.ts`, `src/app/api/v1/tasks/[id]/override/route.ts`
- **Endpoint:** `POST /api/v1/tasks/:id/override`
- **Request body:** `{ status: 'done' | 'blocked', force?: boolean }`
- **Success response:** HTTP 200 `{ data: { status: newStatus } }`
- **Error cases:** HTTP 422 PRECONDITION_FAILED, HTTP 403 FORBIDDEN.
- **Zod schema:** `TaskOverrideSchema = z.object({ status: z.enum(['done', 'blocked']), force: z.boolean().optional() })`
- **Database query pattern:** `db.update(tasks).set({status})` inside a transaction if checking dependencies.

---

## TASK-012: API — Sessions

**Area:** API
**Depends on:** TASK-011
**Estimated effort:** S

### Context
List and control sessions.
### Acceptance criteria
- [ ] `GET /api/v1/projects/:id/sessions` lists sessions.
- [ ] `GET /api/v1/sessions/:id` details.
- [ ] `POST /api/v1/sessions/:id/pause` marks session to pause.
- [ ] `POST /api/v1/sessions/:id/resume`
- [ ] `POST /api/v1/sessions/:id/cancel`
### Implementation notes
- **File:** `src/app/api/v1/projects/[id]/sessions/route.ts`, `src/app/api/v1/sessions/[id]/route.ts`, `src/app/api/v1/sessions/[id]/pause/route.ts`, etc.
- **Endpoint:** `POST /api/v1/sessions/:id/pause`
- **Request body:** none
- **Success response:** HTTP 200 `{ data: { status: 'paused' } }`
- **Error cases:** HTTP 404 NOT_FOUND

---

## TASK-013: API — Team Management

**Area:** API
**Depends on:** TASK-008
**Estimated effort:** M

### Context
Invites and roles.
### Acceptance criteria
- [ ] `GET /api/v1/projects/:id/members` returns team.
- [ ] `POST /api/v1/projects/:id/invites` generates an invite token. Requires Admin.
- [ ] `PATCH /api/v1/projects/:id/members/:userId/role` changes role. Requires Admin.
- [ ] `DELETE /api/v1/projects/:id/members/:userId` removes member. Requires Admin.
### Implementation notes
- **File:** `src/app/api/v1/projects/[id]/members/route.ts`, `src/app/api/v1/projects/[id]/invites/route.ts`, `src/app/api/v1/projects/[id]/members/[userId]/role/route.ts`, `src/app/api/v1/projects/[id]/members/[userId]/route.ts`
- **Endpoint:** `POST /api/v1/projects/:id/invites`
- **Request body:** `{ email: string, role: string }`
- **Success response:** HTTP 201 `{ data: { inviteId: string } }`
- **Error cases:** HTTP 403 FORBIDDEN.
- **Zod schema:** `InviteSchema = z.object({ email: z.string().email(), role: z.enum(['admin', 'developer', 'viewer']) })`

---

## TASK-014: API — Users & Tokens

**Area:** API
**Depends on:** TASK-007
**Estimated effort:** S

### Context
User profile and API tokens.
### Acceptance criteria
- [ ] `GET /api/v1/users/me` returns current user.
- [ ] `PATCH /api/v1/users/me` updates user profile (name only).
- [ ] `POST /api/v1/users/me/tokens` generates API token, returns once.
- [ ] `DELETE /api/v1/users/me/tokens/:id` revokes token.
### Implementation notes
- **File:** `src/app/api/v1/users/me/route.ts`, `src/app/api/v1/users/me/tokens/route.ts`, `src/app/api/v1/users/me/tokens/[id]/route.ts`
- **Endpoint:** `PATCH /api/v1/users/me`
- **Request body:** `{ username: string }`
- **Success response:** HTTP 200 `{ data: { user } }`
- **Error cases:** HTTP 400 VALIDATION_ERROR.
- **Zod schema:** `UpdateProfileSchema = z.object({ username: z.string().min(2) })`

---

## TASK-015: API — Agent Protocol Endpoints

**Area:** API / Integration
**Depends on:** TASK-011
**Estimated effort:** M

### Context
Creates the specific API surface used by the external DAEMON CLI process.
### Acceptance criteria
- [ ] `POST /api/v1/agent/heartbeat` processes token validation and updates project state.
- [ ] `GET /api/v1/agent/tasks/next` dequeues highest priority task for the session.
- [ ] `POST /api/v1/agent/tasks/:id/complete` accepts file diffs and token usage metrics.
- [ ] Requests using invalid `sdk_...` tokens return 401.
### Implementation notes
- **File:** `src/app/api/v1/agent/heartbeat/route.ts`, `src/app/api/v1/agent/tasks/next/route.ts`, `src/app/api/v1/agent/tasks/[id]/complete/route.ts`
- **Endpoint:** `POST /api/v1/agent/tasks/:id/complete`
- **Request body:** `{ diff: string, promptTokens: number, completionTokens: number }`
- **Success response:** HTTP 200 `{ data: { success: true } }`
- **Error cases:** HTTP 401 UNAUTHORIZED, HTTP 400 VALIDATION_ERROR.
- **Zod schema:** `TaskCompleteSchema = z.object({ diff: z.string(), promptTokens: z.number(), completionTokens: z.number() })`

---

## TASK-016: API — Notifications & Webhooks

**Area:** API
**Depends on:** TASK-008
**Estimated effort:** M

### Context
Manage notifications and webhooks.
### Acceptance criteria
- [ ] `GET /api/v1/notifications` returns list of user notifications.
- [ ] `POST /api/v1/notifications/:id/read` marks notification read.
- [ ] `POST /api/v1/notifications/read-all` marks all read.
- [ ] `GET /api/v1/projects/:id/webhooks` lists webhooks.
- [ ] `POST /api/v1/projects/:id/webhooks` adds a webhook.
- [ ] `DELETE /api/v1/projects/:id/webhooks/:webhookId` deletes.
- [ ] `GET /api/v1/projects/:id/webhooks/:webhookId/deliveries` returns delivery log.
### Implementation notes
- **File:** `src/app/api/v1/notifications/route.ts`, `src/app/api/v1/notifications/[id]/read/route.ts`, `src/app/api/v1/notifications/read-all/route.ts`, `src/app/api/v1/projects/[id]/webhooks/route.ts`, `src/app/api/v1/projects/[id]/webhooks/[webhookId]/route.ts`, `src/app/api/v1/projects/[id]/webhooks/[webhookId]/deliveries/route.ts`
- **Endpoint:** `POST /api/v1/projects/:id/webhooks`
- **Request body:** `{ url: string, events: string[] }`
- **Success response:** HTTP 201 `{ data: { id: string } }`
- **Error cases:** HTTP 400 VALIDATION_ERROR.
- **Zod schema:** `WebhookCreateSchema = z.object({ url: z.string().url(), events: z.array(z.string()) })`

---

### UI Component Foundation

---

## TASK-017: Design System, Mascot & Base States

**Area:** UI — Design System
**Depends on:** none
**Estimated effort:** M

### Context
Implements the core visual language, Tailwind configuration, and the DAEMON mascot component which displays varying expressions depending on system state.
### Acceptance criteria
- [ ] Custom CSS variables mapped to shadcn/ui base correctly in `globals.css`.
- [ ] `DaemonMascot` component built, accepting `state` prop (`idle`, `thinking`, `error`, `success`, `working`) and sizes.
- [ ] Font imports and Tailwind v4 arbitrary variants correctly configured.
- [ ] Every empty state in the app uses the correct DAEMON expression from PRODUCT.md §20.
- [ ] Every loading state uses a skeleton or spinner.
### Implementation notes
- **File:** `src/app/globals.css`, `src/components/ui/daemon-mascot.tsx`
- **State:** [empty] -> DAEMON expression: [idle] + copy: "No data" / "Add some" / CTA: "Create"

---

## TASK-018: App Shell & Navigation

**Area:** UI — App Shell
**Depends on:** TASK-017
**Estimated effort:** M

### Context
Build the primary application layout, including sidebar navigation, top header (project switcher), and responsive layout constraints.
### Acceptance criteria
- [ ] Layout contains a collapsible sidebar with active-state navigation items.
- [ ] Header includes project selector dropdown and global search placeholder.
- [ ] Notification bell in header — unread badge count.
- [ ] The global DAEMON state is displayed in the sidebar footer.
- [ ] Keyboard shortcuts implemented. Help modal opens on `?`. Dev mode on `Ctrl+\``.
### Implementation notes
- **File:** `src/app/layout.tsx`, `src/components/layout/sidebar.tsx`, `src/components/layout/header.tsx`
- **Keyboard shortcut:** `?` — Help modal, `Ctrl+\`` — Dev Mode toggle.

---

## TASK-019: Shared UI Components (Terminal, Diff, Log Row)

**Area:** UI — Components
**Depends on:** TASK-017
**Estimated effort:** M

### Context
Build complex reusable UI components: xterm.js wrapper, Shiki diff viewer, and generic event log rows used across multiple pages.
### Acceptance criteria
- [ ] `TerminalLog` component renders ansi-colored text safely.
- [ ] `DiffViewer` component renders a syntax-highlighted code difference.
- [ ] `TaskRow` component is collapsible and shows status indicators.
### Implementation notes
- **File:** `src/components/ui/terminal-log.tsx`, `src/components/ui/diff-viewer.tsx`, `src/components/ui/task-row.tsx`

---

## TASK-020: Shared Infrastructure — Polling Hook

**Area:** UI — Infrastructure
**Depends on:** TASK-017
**Estimated effort:** S

### Context
3-second polling infrastructure.
### Acceptance criteria
- [ ] `usePolling` hook created which polls an endpoint every 3 seconds.
- [ ] Stops polling conditionally based on response.
### Implementation notes
- **File:** `src/hooks/use-polling.ts`
- **Poll interval:** 3 seconds.

---

## TASK-021: Error Pages (404, 500)

**Area:** UI
**Depends on:** TASK-017
**Estimated effort:** S

### Context
Not found and global error pages.
### Acceptance criteria
- [ ] 404 page shows DAEMON error expression + "404 - Not found" + "This page doesn't exist or you don't have access." + [Go to Mission Control] CTA.
### Implementation notes
- **File:** `src/app/not-found.tsx`, `src/app/error.tsx`
- **State:** [404] -> DAEMON expression: error + copy: "404 - Not found." / "This page doesn't exist or you don't have access." / CTA: "Go to Mission Control"

---

### Application Pages

---

## TASK-022: Auth UI — Login Page

**Area:** UI — Auth
**Depends on:** TASK-007, TASK-017
**Estimated effort:** S

### Context
Login page.
### Acceptance criteria
- [ ] `/login` accepts credentials, validates, and uses NextAuth `signIn`.
- [ ] Shows error states properly.
### Implementation notes
- **File:** `src/app/login/page.tsx`
- **Keyboard shortcut:** `Enter` — Submit.

---

## TASK-023: Auth UI — Forgot & Reset Password

**Area:** UI — Auth
**Depends on:** TASK-007, TASK-017
**Estimated effort:** S

### Context
Password recovery pages.
### Acceptance criteria
- [ ] `/forgot-password` UI.
- [ ] `/reset-password` UI with token validation and expiry error state.
### Implementation notes
- **File:** `src/app/forgot-password/page.tsx`, `src/app/reset-password/page.tsx`

---

## TASK-024: Auth UI — Accept Invite Page

**Area:** UI — Auth
**Depends on:** TASK-013, TASK-017
**Estimated effort:** S

### Context
Invite acceptance page.
### Acceptance criteria
- [ ] UI to accept invite, creates account if new, auto-signs in.
### Implementation notes
- **File:** `src/app/invite/[token]/page.tsx`

---

## TASK-025: Onboarding Wizard

**Area:** UI
**Depends on:** TASK-010, TASK-017
**Estimated effort:** M

### Context
Full 3-step onboarding modal.
### Acceptance criteria
- [ ] Backdrop blur, no skip.
- [ ] Step 1: Welcome (DAEMON idle 64px) + "Welcome to Specdrivr...".
- [ ] Step 2: Flow diagram.
- [ ] Step 3: Inline project creation form.
- [ ] Sets `onboardingDone` flag on completion.
### Implementation notes
- **File:** `src/components/onboarding-wizard.tsx`
- **State:** [Step 1] -> DAEMON expression: idle + copy: "Welcome to Specdrivr, {Name}." / "I'm DAEMON. I'll execute your specifications as code..." / CTA: "Get Started ->"

---

## TASK-026: Mission Control Dashboard

**Area:** UI — Mission Control
**Depends on:** TASK-018, TASK-020
**Estimated effort:** M

### Context
Main dashboard view.
### Acceptance criteria
- [ ] Active sessions panel.
- [ ] Needs-attention panel (blocked tasks).
- [ ] Recent specs list.
- [ ] Mission Control empty state.
### Implementation notes
- **File:** `src/app/page.tsx`
- **Polling:** Active sessions update every 3s using `usePolling`.
- **State:** [Empty Dashboard] -> DAEMON expression: idle + copy: "SYSTEM READY" / "No active session. Open a spec to begin." / CTA: "View Specs"

---

## TASK-027: Projects Listing Page

**Area:** UI
**Depends on:** TASK-010, TASK-018
**Estimated effort:** S

### Context
List projects.
### Acceptance criteria
- [ ] `/projects` lists projects.
- [ ] Shows empty state when no projects.
### Implementation notes
- **File:** `src/app/projects/page.tsx`
- **State:** [No projects] -> DAEMON expression: idle + copy: "No projects yet." / "Point me at a repository and I'll get to work." / CTA: "Initialize First Project"

---

## TASK-028: Project Creation UI

**Area:** UI
**Depends on:** TASK-010, TASK-017
**Estimated effort:** S

### Context
Standalone project creation.
### Acceptance criteria
- [ ] Project creation form (inside onboarding step 3 AND standalone).
### Implementation notes
- **File:** `src/components/projects/create-project-form.tsx`

---

## TASK-029: Specs Listing Page

**Area:** UI
**Depends on:** TASK-009, TASK-018
**Estimated effort:** M

### Context
Specifications list with search, status filter, pagination.
### Acceptance criteria
- [ ] `/specs` page lists specs.
- [ ] Search, status filter, pagination.
- [ ] Empty state.
### Implementation notes
- **File:** `src/app/specs/page.tsx`
- **State:** [No specs] -> DAEMON expression: idle + copy: "No specifications." / "Write what you want to build. I'll figure out the how." / CTA: "Write First Spec"

---

## TASK-030: Spec Editor — New Spec

**Area:** UI
**Depends on:** TASK-009, TASK-018
**Estimated effort:** M

### Context
Markdown editor for new specs.
### Acceptance criteria
- [ ] `/specs/new` presents markdown editor.
### Implementation notes
- **File:** `src/app/specs/new/page.tsx`
- **Keyboard shortcut:** `Ctrl+Enter` — Save spec.

---

## TASK-031: Spec Editor — Edit Existing

**Area:** UI
**Depends on:** TASK-009, TASK-018
**Estimated effort:** M

### Context
Editor for existing specs with edge case handling.
### Acceptance criteria
- [ ] `/specs/[id]/edit` UI.
- [ ] Spec name collision error: inline error + generated suggestion chip that fills name field.
- [ ] Concurrent edit warning banner (amber banner if someone else editing).
### Implementation notes
- **File:** `src/app/specs/[id]/edit/page.tsx`
- **Keyboard shortcut:** `Ctrl+Enter` — Save spec.
- Handles 409 CONFLICT from API and displays suggestion chip.

---

## TASK-032: Spec Detail — Overview Tab & Header

**Area:** UI
**Depends on:** TASK-009, TASK-018
**Estimated effort:** M

### Context
Spec detail header and main overview tab.
### Acceptance criteria
- [ ] `/specs/[id]` header with buttons toggled conditionally based on status.
- [ ] Overview tab renders markdown.
### Implementation notes
- **File:** `src/app/specs/[id]/page.tsx`, `src/components/specs/spec-header.tsx`

---

## TASK-033: Spec Detail — Plan Review Tab

**Area:** UI
**Depends on:** TASK-010, TASK-020
**Estimated effort:** M

### Context
Plan generation, review, and approval flow.
### Acceptance criteria
- [ ] Plan generation POST trigger + immediate pending state.
- [ ] Polling loop (every 3s) until non-pending status.
- [ ] Plan generation timeout UX (>30s "Still working...", >2min error).
- [ ] Plan review UI: architecture decisions list, task list with dependencies.
- [ ] Approve plan flow: confirmation, notes field, success state.
- [ ] Reject plan flow: required notes field, confirmation.
- [ ] Request changes flow: required notes, confirmation.
- [ ] Rejected empty state.
### Implementation notes
- **File:** `src/components/specs/plan-tab.tsx`
- **Polling:** 3-second interval on `/api/v1/specs/:id/plan`.
- **State:** [No plan] -> DAEMON expression: idle + copy: "No plan generated." / "Run me on this spec and I'll produce an architecture and execution plan." / CTA: "Generate Plan"
- **State:** [Rejected] -> DAEMON expression: error + copy: "Plan rejected." / "{Reviewer} rejected this plan. Edit the spec or generate a new one." / CTA: "Generate New Plan"

---

## TASK-034: Spec Detail — Approve & Execute Action

**Area:** UI
**Depends on:** TASK-033
**Estimated effort:** S

### Context
Approve action with RBAC.
### Acceptance criteria
- [ ] "Approve & Execute" action available only to Admin/Owner in `pending_approval` state.
- [ ] Disabled for viewers with tooltip.
### Implementation notes
- **File:** `src/components/specs/plan-tab.tsx`
- **Action:** "Approve & Execute"
- **Visible to:** all roles
- **Enabled for:** Admin, Owner
- **Disabled state:** show with Tooltip — "Requires Admin role"
- **Hidden from:** nobody

---

## TASK-035: Spec Detail — Tasks Tab

**Area:** UI
**Depends on:** TASK-011, TASK-018
**Estimated effort:** M

### Context
Task list tab within spec detail.
### Acceptance criteria
- [ ] Tasks tab correctly displays readonly vs interactive mode based on state.
- [ ] Empty state: DAEMON idle, "No tasks yet."
### Implementation notes
- **File:** `src/components/specs/tasks-tab.tsx`
- **State:** [No tasks] -> DAEMON expression: idle + copy: "No tasks yet." / "Tasks are created when a plan is approved." / CTA: "Go to Plan ->"

---

## TASK-036: Spec Detail — Changes Tab

**Area:** UI
**Depends on:** TASK-011, TASK-019
**Estimated effort:** S

### Context
Changes tab rendering diffs.
### Acceptance criteria
- [ ] Changes tab renders `DiffViewer`.
- [ ] Empty state: DAEMON idle, "No file changes."
### Implementation notes
- **File:** `src/components/specs/changes-tab.tsx`
- **State:** [No changes] -> DAEMON expression: idle + copy: "No file changes." / "Changes will appear here once DAEMON starts executing tasks." / CTA: "View Tasks ->"

---

## TASK-037: Spec Detail — Version History

**Area:** UI
**Depends on:** TASK-009, TASK-018
**Estimated effort:** S

### Context
Spec version history list and viewer.
### Acceptance criteria
- [ ] Spec version history list (versions tab, no content — metadata only).
- [ ] Spec version content viewer (click a version to read its markdownContent).
### Implementation notes
- **File:** `src/components/specs/versions-tab.tsx`

---

## TASK-038: Task Drawer — Layout & Overview

**Area:** UI — Overlays
**Depends on:** TASK-011, TASK-018
**Estimated effort:** M

### Context
Global sheet component for task details.
### Acceptance criteria
- [ ] Drawer opens displaying Task context.
- [ ] All tabs: Overview, Attempts, Changes.
### Implementation notes
- **File:** `src/components/tasks/task-drawer.tsx`

---

## TASK-039: Task Drawer — Attempts & Logs

**Area:** UI — Overlays
**Depends on:** TASK-011, TASK-019, TASK-020
**Estimated effort:** M

### Context
Logs rendering inside drawer.
### Acceptance criteria
- [ ] Attempts (log lines) using `TerminalLog`.
- [ ] Polling for live logs if task is running.
### Implementation notes
- **File:** `src/components/tasks/task-drawer-attempts.tsx`
- **Polling:** 3-second interval for attempts.

---

## TASK-040: Task Drawer — Changes (Diffs) Tab

**Area:** UI — Overlays
**Depends on:** TASK-011, TASK-019
**Estimated effort:** S

### Context
Diffs tab in drawer.
### Acceptance criteria
- [ ] Changes (diffs) tab.
- [ ] Empty state: DAEMON idle, "No changes yet."
### Implementation notes
- **File:** `src/components/tasks/task-drawer-changes.tsx`
- **State:** [No changes] -> DAEMON expression: idle + copy: "No changes yet." / "DAEMON hasn't modified any files for this task." / CTA: none

---

## TASK-041: Task Drawer — Blocked State & Unblock Form

**Area:** UI — Overlays
**Depends on:** TASK-011
**Estimated effort:** M

### Context
Handling blocked tasks.
### Acceptance criteria
- [ ] Blocked state: unblock form, `humanContext` field, Resume button.
### Implementation notes
- **File:** `src/components/tasks/task-drawer-blocked.tsx`

---

## TASK-042: Task Drawer — Cost Panel & Overrides

**Area:** UI — Overlays
**Depends on:** TASK-011
**Estimated effort:** M

### Context
Overrides and dev mode metrics.
### Acceptance criteria
- [ ] Cost panel in Dev Mode (prompt tokens, completion tokens, total USD, model name).
- [ ] Retry task action (POST /api/v1/tasks/:id/retry).
- [ ] Manual task override — mark done, mark blocked (Admin/Owner only).
- [ ] Task dependency violation AlertDialog (Force Mark Done option).
- [ ] Session limit warning when re-running blocked task (inline note).
### Implementation notes
- **File:** `src/components/tasks/task-drawer-overrides.tsx`
- **Action:** "Mark Done / Mark Blocked"
- **Visible to:** all roles
- **Enabled for:** Admin, Owner
- **Disabled state:** show with Tooltip — "Requires Admin role"
- **Hidden from:** nobody

---

## TASK-043: Sessions Listing Page

**Area:** UI
**Depends on:** TASK-012, TASK-018
**Estimated effort:** M

### Context
List sessions.
### Acceptance criteria
- [ ] Sessions listing page `/sessions` with filters (`?projectId`, `?status`, `?from`, `?to`).
- [ ] Empty state: DAEMON idle, "No sessions recorded."
### Implementation notes
- **File:** `src/app/sessions/page.tsx`
- **State:** [No sessions] -> DAEMON expression: idle + copy: "No sessions recorded." / "Sessions appear here once execution begins." / CTA: none

---

## TASK-044: Session Detail View

**Area:** UI
**Depends on:** TASK-012, TASK-018
**Estimated effort:** M

### Context
Session detail.
### Acceptance criteria
- [ ] Session detail — task counts, status, events list.
- [ ] Session pause/resume/cancel actions.
- [ ] Session lost connection banner (yellow banner at >60s, auto-fail at >5min).
### Implementation notes
- **File:** `src/app/sessions/[id]/page.tsx`

---

## TASK-045: Notifications UI

**Area:** UI
**Depends on:** TASK-016, TASK-018
**Estimated effort:** M

### Context
Notification dropdown and page.
### Acceptance criteria
- [ ] Notification dropdown/popover — list, mark read, mark all read.
- [ ] Notifications listing page `/notifications`.
- [ ] Notifications empty state ("All caught up. Nothing to report.")
### Implementation notes
- **File:** `src/components/layout/notification-dropdown.tsx`, `src/app/notifications/page.tsx`
- **State:** [Empty] -> DAEMON expression: idle + copy: "All caught up." / "Nothing to report." / CTA: none

---

## TASK-046: Settings Layout & General Tab

**Area:** UI — Settings
**Depends on:** TASK-010, TASK-018
**Estimated effort:** S

### Context
Settings page layout.
### Acceptance criteria
- [ ] Settings layout — sidebar tabs.
- [ ] Project settings page `/settings/general`.
- [ ] "Restart Onboarding" link in Settings > General.
### Implementation notes
- **File:** `src/app/settings/layout.tsx`, `src/app/settings/general/page.tsx`

---

## TASK-047: Settings — Profile

**Area:** UI — Settings
**Depends on:** TASK-014
**Estimated effort:** S

### Context
Profile settings.
### Acceptance criteria
- [ ] User profile update (name only — email locked per spec).
- [ ] Password change form (Settings > Profile).
### Implementation notes
- **File:** `src/app/settings/profile/page.tsx`

---

## TASK-048: Settings — API Tokens

**Area:** UI — Settings
**Depends on:** TASK-014
**Estimated effort:** S

### Context
API token generation.
### Acceptance criteria
- [ ] API token generation UI — generate, display once, copy button, revoke.
### Implementation notes
- **File:** `src/app/settings/profile/tokens-tab.tsx`

---

## TASK-049: Settings — Team Management

**Area:** UI — Settings
**Depends on:** TASK-013
**Estimated effort:** M

### Context
Team management tab.
### Acceptance criteria
- [ ] Settings > Team — member list, invite form, role change, remove member.
- [ ] Empty state: DAEMON idle, "Just you."
### Implementation notes
- **File:** `src/app/settings/team/page.tsx`
- **State:** [Empty] -> DAEMON expression: idle + copy: "Just you." / "Invite your team to collaborate on specs and review plans." / CTA: "Invite Someone"

---

## TASK-050: Settings — Agent

**Area:** UI — Settings
**Depends on:** TASK-010
**Estimated effort:** S

### Context
Agent settings.
### Acceptance criteria
- [ ] Settings > Agent — file glob restrictions, max concurrent tasks, CLI command display.
### Implementation notes
- **File:** `src/app/settings/agent/page.tsx`

---

## TASK-051: Settings — Integrations

**Area:** UI — Settings
**Depends on:** TASK-016
**Estimated effort:** M

### Context
Integrations settings.
### Acceptance criteria
- [ ] GitHub OAuth connect flow -> callback -> store encrypted token -> reveal webhook URL.
- [ ] Slack OAuth connect flow -> callback -> store bot token + channel.
- [ ] Generic webhook CRUD — add, edit, delete, test delivery, retry failed.
### Implementation notes
- **File:** `src/app/settings/integrations/page.tsx`

---

## TASK-052: Settings — Usage

**Area:** UI — Settings
**Depends on:** TASK-017
**Estimated effort:** S

### Context
Usage statistics.
### Acceptance criteria
- [ ] Settings > Usage — cost chart, summary cards, breakdown table, CSV export.
### Implementation notes
- **File:** `src/app/settings/usage/page.tsx`

---

## TASK-053: Settings — Danger Zone

**Area:** UI — Settings
**Depends on:** TASK-010
**Estimated effort:** S

### Context
Project deletion.
### Acceptance criteria
- [ ] Settings > Danger Zone — delete project (requires confirmation token, Owner only).
### Implementation notes
- **File:** `src/app/settings/danger-zone/page.tsx`
- **Action:** "Delete Project"
- **Visible to:** all roles
- **Enabled for:** Owner
- **Disabled state:** show with Tooltip — "Requires Owner role"
- **Hidden from:** nobody

---

## TASK-054: Settings — Webhook Delivery Log

**Area:** UI — Settings
**Depends on:** TASK-016
**Estimated effort:** S

### Context
Webhook logs.
### Acceptance criteria
- [ ] Webhook delivery log — status, response code, retry count.
### Implementation notes
- **File:** `src/app/settings/integrations/webhook-logs.tsx`

---

## TASK-055: Audit Log Viewer

**Area:** UI — Settings
**Depends on:** TASK-017
**Estimated effort:** S

### Context
Audit log page.
### Acceptance criteria
- [ ] Audit log viewer UI — Admin/Owner only, paginated, filterable by action type.
- [ ] Empty state: DAEMON idle, "No audit entries."
### Implementation notes
- **File:** `src/app/settings/audit-logs/page.tsx`
- **State:** [Empty] -> DAEMON expression: idle + copy: "No audit entries." / "Administrative actions will be logged here." / CTA: none

---

## TASK-056: Webhooks Event Dispatcher

**Area:** Integration
**Depends on:** TASK-016
**Estimated effort:** M

### Context
Backend webhook dispatcher.
### Acceptance criteria
- [ ] State transitions in the backend fire async webhook dispatch jobs.
- [ ] `webhook_deliveries` log is populated correctly.
### Implementation notes
- **File:** `src/lib/webhooks.ts`
- Uses `fetch` wrapped with retry logic.

---

## Phase 5 — Plan Summary

### 5a. Task count by area
| Area | Task Count | Estimated Hours |
| --- | --- | --- |
| Database | 4 | 12h (3S, 1M) |
| Infrastructure | 3 | 8h (2S, 1M) |
| Auth | 4 | 12h (4S) |
| API | 10 | 40h (5S, 5M) |
| UI | 34 | 120h (19S, 15M) |
| Integration | 1 | 4h (1M) |
| **Total** | **56** | **196h** |

### 5b. Critical path
TASK-001 → TASK-002 → TASK-003 → TASK-004 → TASK-005 → TASK-008 → TASK-010 → TASK-012 → TASK-013 → TASK-036.

### 5c. Parallel workstreams
- **Workstream A — Data layer**: TASK-001 to TASK-004.
- **Workstream B — Auth & API**: TASK-005 to TASK-016.
- **Workstream C — UI Components & Settings**: TASK-017 to TASK-055.
- **Workstream D — Integrations**: TASK-056.

### 5d. Assumptions log
- [DECISION-001] Missing UI copy: Write production copy matching the microcopy style in PRODUCT.md §20. Do not use lorem ipsum or "TODO".
- [DECISION-002] Missing error state: Apply the DAEMON + heading + subtext + CTA pattern from PRODUCT.md §20.
- [DECISION-003] Missing empty state: Apply the DAEMON + heading + subtext + CTA pattern from PRODUCT.md §20.
- [DECISION-004] Ambiguous RBAC boundary: Default to the more restrictive role.
- [DECISION-005] Missing loading / optimistic state: Add a skeleton or spinner matching the design system.
- [DECISION-006] Spec says "Admin only" for an action: Show the button/action to all roles but disabled with a tooltip naming the required role — never hide it.
- [DECISION-007] Performance constraint not specified: Use the NFR targets from OPERATIONS.md §17.1 as the ceiling.
- [DECISION-008] Library choice not specified: Use the library already present in package.json. If absent, choose the lightest option consistent with the existing stack (e.g. ioredis for Redis, pino for logging).
- [DECISION-009] File path not specified: Follow the exact directory convention already established in the codebase. If no convention exists, follow Next.js App Router conventions.
- [DECISION-010] Keyboard shortcuts: Fallback to logical mappings (e.g. Ctrl+Enter to save) if not specified.
- [DECISION-011] API schemas: Inline the Zod schemas in API endpoints to keep validation rigid and documented.
