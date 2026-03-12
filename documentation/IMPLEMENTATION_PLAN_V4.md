<!-- IMPLEMENTATION_PLAN_V4 — targeted UI amendments from mockup gap analysis -->
<!-- IMPLEMENTATION_PLAN_V3 — generated from V2 + UI mockup ground truth pass -->
# Engineering Implementation Plan V3

## Phase 1 — Codebase Inventory

### 1a. File Tree
```text
src
├── app
│   ├── api
│   │   ├── auth
│   │   │   └── [...all]
│   │   │       └── route.ts
│   │   ├── health
│   │   │   └── route.ts
│   │   ├── v1
│   │   │   ├── agent
│   │   │   │   └── tasks
│   │   │   │       └── next
│   │   │   │           └── route.ts
│   │   │   ├── auth
│   │   │   │   ├── accept-invite
│   │   │   │   │   └── route.ts
│   │   │   │   └── signup
│   │   │   │       └── route.ts
│   │   │   ├── notifications
│   │   │   │   ├── [id]
│   │   │   │   │   └── read
│   │   │   │   │       └── route.ts
│   │   │   │   ├── preferences
│   │   │   │   │   └── route.ts
│   │   │   │   ├── read-all
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── plans
│   │   │   │   └── [id]
│   │   │   │       ├── abandon
│   │   │   │       │   └── route.ts
│   │   │   │       ├── approve
│   │   │   │       │   └── route.ts
│   │   │   │       ├── reject
│   │   │   │       │   └── route.ts
│   │   │   │       └── request-changes
│   │   │   │           └── route.ts
│   │   │   ├── projects
│   │   │   │   ├── [id]
│   │   │   │   │   ├── members
│   │   │   │   │   │   ├── [userId]
│   │   │   │   │   │   │   └── route.ts
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── route.ts
│   │   │   │   │   ├── specs
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── webhooks
│   │   │   │   │       ├── [webhookId]
│   │   │   │   │       │   ├── deliveries
│   │   │   │   │       │   │   └── route.ts
│   │   │   │   │       │   └── route.ts
│   │   │   │   │       └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── sessions
│   │   │   │   ├── [id]
│   │   │   │   │   ├── cancel
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── complete
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── heartbeat
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── resume
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── specs
│   │   │   │   └── [id]
│   │   │   │       ├── plan
│   │   │   │       │   ├── generate
│   │   │   │       │   │   └── route.ts
│   │   │   │       │   └── route.ts
│   │   │   │       └── versions
│   │   │   │           ├── [vId]
│   │   │   │           │   └── route.ts
│   │   │   │           └── route.ts
│   │   │   ├── tasks
│   │   │   │   ├── [id]
│   │   │   │   │   ├── attempts
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── changes
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   └── users
│   │   │       └── me
│   │   │           ├── password
│   │   │           │   └── route.ts
│   │   │           ├── route.ts
│   │   │           └── tokens
│   │   │               └── route.ts
│   │   └── webhooks
│   │       └── github
│   │           └── [projectId]
│   │               └── route.ts
│   ├── dashboard
│   │   └── page.tsx
│   ├── error.tsx
│   ├── favicon.ico
│   ├── global-error.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── login
│   │   └── page.tsx
│   └── page.tsx
├── components
│   ├── error-boundary.tsx
│   └── ui
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── daemon-mascot.tsx
│       ├── progress.tsx
│       ├── separator.tsx
│       ├── skeleton.tsx
│       └── table.tsx
├── db
│   ├── index.ts
│   └── schema.ts
├── lib
│   ├── api-response.ts
│   ├── auth-client.ts
│   ├── auth.ts
│   ├── db-helpers.ts
│   ├── env-core.ts
│   ├── env-script.ts
│   ├── env.ts
│   ├── error-handler.ts
│   ├── errors.ts
│   ├── lock-manager.ts
│   ├── logger.ts
│   ├── pricing.ts
│   ├── rate-limiter.ts
│   ├── rbac.ts
│   ├── redis.ts
│   ├── schemas.ts
│   └── utils.ts
├── proxy.ts
└── repositories
    ├── agent-session-repository.ts
    ├── base-repository.ts
    ├── index.ts
    ├── plan-repository.ts
    ├── project-repository.ts
    ├── specification-repository.ts
    ├── task-repository.ts
    └── user-repository.ts
tests
├── __snapshots__
│   └── home.test.tsx.snap
├── e2e
│   └── home.spec.ts
├── home.test.tsx
└── setup.ts

65 directories, 88 files

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
- `projects`: EXISTS_COMPLETE
- `specifications`: EXISTS_COMPLETE
- `plans`: EXISTS_COMPLETE
- `tasks`: EXISTS_COMPLETE
- `test_results`: EXISTS_COMPLETE
- `agent_logs`: EXISTS_COMPLETE
- `users`: EXISTS_COMPLETE
- `git_commits`: EXISTS_COMPLETE
- `agent_tokens`: EXISTS_COMPLETE
- `api_request_logs`: EXISTS_COMPLETE
- `task_attempts`: EXISTS_COMPLETE
- `file_changes`: EXISTS_COMPLETE
- `agent_sessions`: EXISTS_COMPLETE
- `agent_config`: EXISTS_COMPLETE
- `webhook_deliveries`: EXISTS_COMPLETE
- `usage_snapshots`: EXISTS_COMPLETE
- `invites`: EXISTS_COMPLETE

### 1d. API Route Audit
- `src/app/api/v1/projects/*`: EXISTS (Implemented)
- `src/app/api/v1/tasks/*`: EXISTS (Implemented)
- Auth endpoints: EXISTS (Implemented `src/app/api/auth/[...all]`)
- Projects API (`/api/v1/projects/:id`): EXISTS
- Specifications API: EXISTS (`/api/v1/specs/*`)
- Plans API: EXISTS (`/api/v1/plans/*`)
- Tasks API (`/api/v1/tasks/:id/*`): EXISTS
- Sessions API: EXISTS (`/api/v1/sessions/*`)
- Team management API: EXISTS (`/api/v1/projects/[id]/members/*`)
- Notifications & User API: EXISTS (`/api/v1/notifications/*`, `/api/v1/users/me/*`)

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
- `proxy.ts`: EXISTS
- `lib/auth.ts`: EXISTS
- `lib/db/index.ts`: EXISTS
- `lib/env.ts`: EXISTS
- `lib/logger.ts`: EXISTS
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

## TASK-001: Schema Updates — Users, Projects, Invites [COMPLETED]

**Area:** Database
**Depends on:** none
**Estimated effort:** S

### Context
Extends existing `users` and `projects` tables with missing fields and adds the `invites` table for team management. Critical for avatar display, accurate timezone/locale rendering, and routing (project slug).
### Acceptance criteria
- [x] `avatarUrl`, `timezone`, `locale`, and `onboardingStep` exist on the `users` table.
- [x] `slug`, `createdBy`, `avatarColor`, and `isDemo` exist on the `projects` table with the correct constraints.
- [x] `invites` table is created with `invitedBy`, `resendCount`, and `lastResentAt` fields.
- [x] A Drizzle migration can be successfully generated using `pnpm db:generate`.
### Implementation notes
- **File:** `src/db/schema.ts` — Added missing columns to `users` and `projects`. Added new `invites` table definition.
- **Database query pattern:** Add missing columns and tables. No transaction required.
- **Index:** Create an index on `projects.slug`.
- **Note:** The `specifications` table must support `stalled` as a valid enum status. This maps to a spec whose last session ended in paused or failed without resolution.


---

## TASK-002: Schema Updates — Plans, Tasks, File Changes [COMPLETED]

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

## TASK-003: Schema Updates — Sessions, Config, Integrations, Usage [COMPLETED]

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

## TASK-004: Seed Data Generation [PENDING]

**Area:** Database
**Depends on:** TASK-003
**Estimated effort:** M

### Context
Implements the definitive database seed script to meet exact product demonstration scenarios, specifically mocking active sessions, a blocked task, and `pending_approval` state.
### Acceptance criteria
- [ ] Running `pnpm db:seed` provisions exactly 3 users, 2 projects, 6 specs, 4 plans.
- [ ] `spec_001` has a plan with status `pending_approval`.
- [ ] `task_105` in `spec_002` is seeded with status `blocked` and valid blockedReason.
- [ ] One session is seeded in a running state.
### Implementation notes
- **File:** `src/db/seed.ts`
- **Database query pattern:** Insert data respecting referential integrity via `db.transaction()`. Use `onConflictDoNothing()`.

---

### Core Backend & Infrastructure

---

## TASK-005: Authentication Infrastructure [COMPLETED]

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

## TASK-006: Core Middlewares (Rate Limiting, Logger) [COMPLETED]

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

## TASK-007: API — Auth Endpoints [IN_PROGRESS]

**Area:** API
**Depends on:** TASK-006
**Estimated effort:** M

### Context
Implements signup and password reset.
### Acceptance criteria
- [ ] `POST /api/v1/auth/signup` creates a user and hashes the password properly.
- [ ] `POST /api/v1/auth/reset-password` handles token validation correctly.
### Implementation notes
- **File:** `src/app/api/v1/auth/signup/route.ts`, `src/app/api/v1/auth/reset-password/route.ts`, `src/app/api/auth/[...nextauth]/route.ts`

**Endpoint: POST /api/auth/signin**
Request body: `{ email: string, password: string }`
Success response: HTTP 200 `{ data: { user: { id: string, email: string, name: string } } }`
Error cases:
  - HTTP 401 UNAUTHORIZED — when invalid credentials
Zod schema: `SignInSchema = z.object({ email: z.string().email(), password: z.string() })`
DB query: `db.select().from(users).where(eq(users.email, email))` (No transaction required)

**Endpoint: POST /api/auth/signout**
Request body: none
Success response: HTTP 200 `{ data: { success: true } }`
Error cases: none
Zod schema: none
DB query: none (Clears session cookie)

**Endpoint: POST /api/auth/forgot-password**
Request body: `{ email: string }`
Success response: HTTP 200 `{ data: { success: true } }` (always returns 200 to prevent email enumeration)
Error cases:
  - HTTP 400 VALIDATION_ERROR — when invalid email format
Zod schema: `ForgotPasswordSchema = z.object({ email: z.string().email() })`
DB query: `db.select().from(users).where(eq(users.email, email))` (No transaction required)

**Endpoint: POST /api/auth/reset-password**
Request body: `{ token: string, password: string }`
Success response: HTTP 200 `{ data: { success: true } }`
Error cases:
  - HTTP 400 VALIDATION_ERROR — when token is invalid or expired
Zod schema: `ResetPasswordSchema = z.object({ token: z.string(), password: z.string().min(8) })`
DB query: `db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId))` (No transaction required)

**Endpoint: POST /api/auth/accept-invite**
Request body: `{ token: string, password?: string, name?: string }`
Success response: HTTP 200 `{ data: { user: { id: string, email: string } } }`
Error cases:
  - HTTP 400 VALIDATION_ERROR — when invite token is invalid or expired
Zod schema: `AcceptInviteSchema = z.object({ token: z.string(), password: z.string().min(8).optional(), name: z.string().min(2).optional() })`
DB query: `db.transaction(async (tx) => { ... })` (Insert/Update user, Delete invite, assign role in project)

---

## TASK-008: API — Projects CRUD [COMPLETED]

**Area:** API
**Depends on:** TASK-001, TASK-005
**Estimated effort:** M

### Context
Build the core API for managing projects, ensuring correct RBAC checks. Note: Partial implementation currently returning raw arrays instead of strict envelopes.
### Acceptance criteria
- [x] GET `/api/v1/projects` lists accessible projects (paginated).
- [x] POST `/api/v1/projects` creates a new project and sets the creator as owner.
- [x] GET `/api/v1/projects/[id]` retrieves single project details.
- [x] PATCH `/api/v1/projects/[id]` updates project settings (admin only).
- [x] DELETE `/api/v1/projects/[id]` soft-deletes a project (owner only).
### Implementation notes
- **File:** `src/app/api/v1/projects/route.ts` and `src/app/api/v1/projects/[id]/route.ts`

**Endpoint: GET /api/v1/projects**
Request body: none
Success response: HTTP 200 `{ data: [ { id: string, name: string, slug: string, memberCount: number, lastSessionSummary: object } ] }`
Error cases:
  - HTTP 401 UNAUTHORIZED — when user is not authenticated
Zod schema: none
DB query: `db.select().from(projects).innerJoin(members)...` (No transaction required)

**Endpoint: GET /api/v1/projects/:id**
Request body: none
Success response: HTTP 200 `{ data: { id: string, name: string, slug: string, ... } }`
Error cases:
  - HTTP 404 NOT_FOUND — when project does not exist or user is not a member
Zod schema: none
DB query: `db.select().from(projects).where(eq(projects.id, id))` (No transaction required)

**Endpoint: PATCH /api/v1/projects/:id**
Request body: `{ name?: string, description?: string, slug?: string }`
Success response: HTTP 200 `{ data: { id: string, name: string } }`
Error cases:
  - HTTP 403 FORBIDDEN — when user is Member or Viewer (requires Admin or Owner)
  - HTTP 400 VALIDATION_ERROR — when invalid inputs
  - HTTP 404 NOT_FOUND — when project not found
Zod schema: `ProjectUpdateSchema = z.object({ name: z.string().min(1).optional(), description: z.string().optional(), slug: z.string().optional() })`
DB query: `db.update(projects).set(updates).where(eq(projects.id, id))` (No transaction required)

**Endpoint: DELETE /api/v1/projects/:id**
Request body: `{ confirmationToken: string }`
Success response: HTTP 200 `{ data: { success: true } }`
Error cases:
  - HTTP 403 FORBIDDEN — when user is not Owner
  - HTTP 409 CONFLICT — when confirmationToken does not match project slug
Zod schema: `ProjectDeleteSchema = z.object({ confirmationToken: z.string() })`
DB query: `db.delete(projects).where(eq(projects.id, id))` (No transaction required)

---

## TASK-009: API — Specifications CRUD [IN_PROGRESS]

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
- [ ] `PATCH /api/v1/specs/:id` updates spec name or status only.
- [ ] `POST /api/v1/specs/:id/versions` creates a new version with markdownContent, increments versionNumber, abandons any current non-complete plan.
- [ ] `GET /api/v1/specs/:id/versions/:vId` returns a specific version's full markdownContent.
### Implementation notes
- **File:** `src/app/api/v1/projects/[projectId]/specs/route.ts`, `src/app/api/v1/specs/[id]/route.ts`, `src/app/api/v1/specs/[id]/versions/route.ts`, `src/app/api/v1/specs/[id]/versions/[vId]/route.ts`

**Endpoint: GET /api/v1/specs/:id**
Request body: none
Success response: HTTP 200 `{ data: { id: string, name: string, status: string, currentVersion: object, planSummary: { status: string, taskCount: number }, taskCounts: { done: number, in_progress: number, blocked: number, todo: number, failed: number } } }`
Error cases:
  - HTTP 404 NOT_FOUND — when spec does not exist
Zod schema: none
DB query: `db.select().from(specifications)...` (No transaction required)

**Endpoint: PATCH /api/v1/specs/:id** (Added to Specifications CRUD task because it updates spec attributes)
Request body: `{ name?: string, status?: string }`
Success response: HTTP 200 `{ data: { id: string, name: string, status: string } }`
Error cases:
  - HTTP 404 NOT_FOUND — when spec not found
  - HTTP 400 VALIDATION_ERROR — when invalid inputs
Zod schema: `SpecUpdateSchema = z.object({ name: z.string().min(1).optional(), status: z.string().optional() })`
DB query: `db.update(specifications).set(updates).where(eq(specifications.id, id))` (No transaction required)

**Endpoint: GET /api/v1/specs/:id/versions**
Request body: none
Success response: HTTP 200 `{ data: [ { id: string, versionNumber: number, createdAt: string } ] }` (metadata only, no markdownContent)
Error cases:
  - HTTP 404 NOT_FOUND — when spec not found
Zod schema: none
DB query: `db.select({ id, versionNumber, createdAt }).from(spec_versions).where(eq(specId, id)).orderBy(desc(versionNumber))` (No transaction required)

**Endpoint: POST /api/v1/specs/:id/versions** (Added to Specifications CRUD task because versions belong to specs)
Request body: `{ markdownContent: string }`
Success response: HTTP 201 `{ data: { id: string, versionNumber: number } }`
Error cases:
  - HTTP 400 VALIDATION_ERROR — when content is empty
  - HTTP 404 NOT_FOUND — when spec not found
Zod schema: `CreateSpecVersionSchema = z.object({ markdownContent: z.string().min(1) })`
DB query: `db.transaction(async (tx) => { ... })` (Insert new version, increment versionNumber, abandon any current non-complete plan)

**Endpoint: GET /api/v1/specs/:id/versions/:vId** (Added to Specifications CRUD task because fetching a version is a read operation on spec content)
Request body: none
Success response: HTTP 200 `{ data: { id: string, versionNumber: number, markdownContent: string, createdAt: string } }`
Error cases:
  - HTTP 404 NOT_FOUND — when spec or version not found
Zod schema: none
DB query: `db.select().from(spec_versions).where(and(eq(specId, id), eq(id, vId)))` (No transaction required)

---

## TASK-010: API — Plans [IN_PROGRESS]

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
- [ ] `POST /api/v1/plans/:id/abandon` sets plan status to abandoned.
### Implementation notes
- **File:** `src/app/api/v1/specs/[id]/plan/generate/route.ts`, `src/app/api/v1/specs/[id]/plan/route.ts`, `src/app/api/v1/plans/[id]/approve/route.ts`, `src/app/api/v1/plans/[id]/reject/route.ts`, `src/app/api/v1/plans/[id]/request-changes/route.ts`, `src/app/api/v1/plans/[id]/abandon/route.ts`

**Endpoint: POST /api/v1/specs/:id/plan/generate**
Request body: none
Success response: HTTP 202 `{ data: { status: 'pending_plan' } }` (returns immediately)
Error cases:
  - HTTP 409 CONFLICT — when a plan is already generating
  - HTTP 404 NOT_FOUND — when spec not found
Zod schema: none
DB query: `db.insert(plans).values({ status: 'pending_plan' })` (No transaction required)

**Endpoint: GET /api/v1/specs/:id/plan**
Request body: none
Success response: HTTP 200 `{ data: { id: string, status: string, ... } }`
  (status enum: `null`, `pending_plan`, `pending_approval`, `changes_requested`, `rejected`, `executing`, `completed`, `abandoned`)
Error cases:
  - HTTP 404 NOT_FOUND — when plan not found
Zod schema: none
DB query: `db.select().from(plans).where(eq(specId, id))` (No transaction required)

**Endpoint: POST /api/v1/plans/:id/approve**
Request body: `{ notes?: string }`
Success response: HTTP 200 `{ data: { sessionId: string, status: 'executing' } }`
Error cases:
  - HTTP 403 FORBIDDEN — when user is not Admin or Owner
  - HTTP 422 PRECONDITION_FAILED — when plan already approved, rejected, or not in pending_approval state
Zod schema: `ApprovePlanSchema = z.object({ notes: z.string().optional() })`
DB query: `db.transaction(async (tx) => { ... })` (Update plan status to executing, create agent_sessions record)

**Endpoint: POST /api/v1/plans/:id/reject**
Request body: `{ notes: string }`
Success response: HTTP 200 `{ data: { status: 'rejected' } }`
Error cases:
  - HTTP 403 FORBIDDEN — when user is not Admin or Owner
  - HTTP 400 VALIDATION_ERROR — when notes are empty
Zod schema: `RejectPlanSchema = z.object({ notes: z.string().min(1) })`
DB query: `db.update(plans).set({ status: 'rejected', reviewerNotes: notes }).where(eq(id, planId))` (No transaction required)

**Endpoint: POST /api/v1/plans/:id/request-changes**
Request body: `{ notes: string }`
Success response: HTTP 200 `{ data: { status: 'changes_requested' } }`
Error cases:
  - HTTP 403 FORBIDDEN — when user is not Admin or Owner
  - HTTP 400 VALIDATION_ERROR — when notes are empty
Zod schema: `RequestChangesPlanSchema = z.object({ notes: z.string().min(1) })`
DB query: `db.update(plans).set({ status: 'changes_requested', reviewerNotes: notes }).where(eq(id, planId))` (No transaction required)

**Endpoint: POST /api/v1/plans/:id/abandon** (Added to Plans API task because abandoning is a plan state transition)
Request body: none
Success response: HTTP 200 `{ data: { status: 'abandoned' } }`
Error cases:
  - HTTP 404 NOT_FOUND — when plan not found
Zod schema: none
DB query: `db.update(plans).set({ status: 'abandoned' }).where(eq(id, planId))` (No transaction required)

---

## TASK-011: API — Tasks CRUD [IN_PROGRESS]

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
- **File:** `src/app/api/v1/tasks/[id]/route.ts`, `src/app/api/v1/tasks/[id]/attempts/route.ts`, `src/app/api/v1/tasks/[id]/changes/route.ts`, `src/app/api/v1/tasks/[id]/unblock/route.ts`, `src/app/api/v1/tasks/[id]/override/route.ts`

**Endpoint: GET /api/v1/tasks/:id**
Request body: none
Success response: HTTP 200 `{ data: { id: string, name: string, status: string, humanContext: string, blockedReason: string, currentAttempt: object, ... } }`
Error cases:
  - HTTP 404 NOT_FOUND — when task not found
Zod schema: none
DB query: `db.select().from(tasks)...` (No transaction required)

**Endpoint: PATCH /api/v1/tasks/:id**
Request body: `{ humanContext?: string, status?: string, blockedReason?: string }`
Success response: HTTP 200 `{ data: { id: string, status: string, ... } }`
Error cases:
  - HTTP 403 FORBIDDEN — when manually overriding status without Member+ permissions
  - HTTP 404 NOT_FOUND — when task not found
Zod schema: `TaskUpdateSchema = z.object({ humanContext: z.string().optional(), status: z.string().optional(), blockedReason: z.string().optional() })`
DB query: `db.update(tasks).set(updates).where(eq(id, taskId))` (No transaction required)

**Endpoint: GET /api/v1/tasks/:id/attempts**
Request body: none
Success response: HTTP 200 `{ data: [ { id: string, seq: number, logLines: array, durationMs: number, createdAt: string } ] }` (newest-first)
Error cases:
  - HTTP 404 NOT_FOUND — when task not found
Zod schema: none
DB query: `db.select().from(task_attempts).where(eq(taskId, id)).orderBy(desc(seq))` (No transaction required)

**Endpoint: GET /api/v1/tasks/:id/changes**
Request body: none
Success response: HTTP 200 `{ data: [ { id: string, attemptId: string, filePath: string, diff: string, changeType: string } ] }`
Error cases:
  - HTTP 404 NOT_FOUND — when task not found
Zod schema: none
DB query: `db.select().from(file_changes).innerJoin(task_attempts)...` (No transaction required)

---

## TASK-012: API — Sessions [IN_PROGRESS]

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
- [ ] `GET /api/v1/sessions/:id/events` returns agent events for a session, newest-first.
- [ ] `POST /api/v1/sessions/:id/complete` agent-only endpoint marking session complete, receiving tokens and computing cost.
- [ ] `POST /api/v1/sessions/:id/heartbeat` agent-only endpoint to update lastHeartbeatAt.
### Implementation notes
- **File:** `src/app/api/v1/sessions/route.ts`, `src/app/api/v1/sessions/[id]/route.ts`, `src/app/api/v1/sessions/[id]/resume/route.ts`, `src/app/api/v1/sessions/[id]/cancel/route.ts`, `src/app/api/v1/sessions/[id]/events/route.ts`

**Endpoint: GET /api/v1/sessions**
Request body: none (supports `?projectId=`, `?specId=`, `?status=`, `?from=`, `?to=`)
Success response: HTTP 200 `{ data: [ { id: string, specId: string, status: string, ... } ] }`
Error cases: none
Zod schema: `SessionQuerySchema` for query params
DB query: `db.select().from(agent_sessions)...` (with dynamic where conditions)

**Endpoint: GET /api/v1/sessions/:id**
Request body: none
Success response: HTTP 200 `{ data: { id: string, status: string, taskCounts: { done: number, in_progress: number, blocked: number, failed: number }, ... } }`
Error cases:
  - HTTP 404 NOT_FOUND — when session not found
Zod schema: none
DB query: `db.select().from(agent_sessions)...`

**Endpoint: POST /api/v1/sessions/:id/resume**
Request body: none
Success response: HTTP 200 `{ data: { status: 'running' } }`
Error cases:
  - HTTP 422 PRECONDITION_FAILED — when session is not in paused state
  - HTTP 404 NOT_FOUND — when session not found
Zod schema: none
DB query: `db.update(agent_sessions).set({ status: 'running' }).where(eq(id, sessionId))`

**Endpoint: POST /api/v1/sessions/:id/cancel**
Request body: none
Success response: HTTP 200 `{ data: { status: 'cancelled' } }`
Error cases:
  - HTTP 404 NOT_FOUND — when session not found
Zod schema: none
DB query: `db.transaction(async (tx) => { ... })` (Mark session cancelled, mark in-progress tasks as failed, write audit_log)

**Endpoint: POST /api/v1/sessions/:id/heartbeat**
Request body: none
Success response: HTTP 200 `{ data: { shouldStop: boolean } }`
Error cases:
  - HTTP 401 UNAUTHORIZED — agent-only endpoint, invalid token
  - HTTP 404 NOT_FOUND — when session not found
Zod schema: none
DB query: `db.update(agent_sessions).set({ lastHeartbeatAt: new Date() }).where(eq(id, sessionId))`

**Endpoint: GET /api/v1/sessions/:id/events** (Added to Sessions API task because events are session-scoped data)
Request body: none
Success response: HTTP 200 `{ data: [ { id: string, type: string, description: string, createdAt: string, ... } ] }` (newest-first)
Error cases:
  - HTTP 404 NOT_FOUND — when session not found
Zod schema: none
DB query: `db.select().from(agent_logs).where(eq(sessionId, id)).orderBy(desc(createdAt))`

---

## TASK-013: API — Team Management [IN_PROGRESS]

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
- [ ] `POST /api/v1/projects/:id/invites/:inviteId/resend` resends invite email, resets token expiry to +7 days.
### Implementation notes
- **File:** `src/app/api/v1/projects/[id]/members/route.ts`, `src/app/api/v1/projects/[id]/members/[userId]/route.ts`, `src/app/api/v1/projects/[id]/invites/[inviteId]/resend/route.ts`

**Endpoint: GET /api/v1/projects/:id/members**
Request body: none
Success response: HTTP 200 `{ data: [ { id: string, userId: string, email: string, role: string, status: 'active' | 'invited' } ] }`
Error cases:
  - HTTP 404 NOT_FOUND — when project not found
Zod schema: none
DB query: `db.select().from(project_members)...` (No transaction required)

**Endpoint: PATCH /api/v1/projects/:id/members/:userId**
Request body: `{ role: string }`
Success response: HTTP 200 `{ data: { success: true } }`
Error cases:
  - HTTP 403 FORBIDDEN — when requester cannot escalate target beyond their own role, or attempts to demote Owner
  - HTTP 404 NOT_FOUND — when member not found
Zod schema: `UpdateMemberRoleSchema = z.object({ role: z.enum(['admin', 'developer', 'viewer']) })`
DB query: `db.update(project_members).set({ role }).where(...)` (No transaction required)

**Endpoint: DELETE /api/v1/projects/:id/members/:userId**
Request body: none
Success response: HTTP 200 `{ data: { success: true } }`
Error cases:
  - HTTP 400 VALIDATION_ERROR — when attempting to remove self
  - HTTP 403 FORBIDDEN — when attempting to remove Owner
  - HTTP 404 NOT_FOUND — when member not found
Zod schema: none
DB query: `db.delete(project_members).where(...)` (No transaction required)

**Endpoint: POST /api/v1/projects/:id/invites/:inviteId/resend** (Added to Team Management API task because invites are a core part of project membership)
Request body: none
Success response: HTTP 200 `{ data: { success: true } }`
Error cases:
  - HTTP 404 NOT_FOUND — when invite not found
Zod schema: none
DB query: `db.update(invites).set({ expiresAt: new Date(Date.now() + 7*24*60*60*1000), resendCount: sql\`resendCount + 1\`, lastResentAt: new Date() }).where(...)`

---

## TASK-014: API — Users & Tokens [IN_PROGRESS]

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
- **File:** `src/app/api/v1/users/me/tokens/route.ts`, `src/app/api/v1/users/me/password/route.ts`

**Endpoint: GET /api/v1/users/me/tokens**
Request body: none
Success response: HTTP 200 `{ data: [ { id: string, name: string, prefix: string, lastUsedAt: string, expiresAt: string } ] }` (masked token list, never full token)
Error cases: none
Zod schema: none
DB query: `db.select({ id, name, prefix, lastUsedAt, expiresAt }).from(agent_tokens).where(eq(userId, me.id))`

**Endpoint: POST /api/v1/users/me/tokens**
Request body: `{ name: string, projectId: string }`
Success response: HTTP 201 `{ data: { id: string, name: string, token: string } }` (Returns full raw token `sdk_{projectSlug}_{48 hex}` once)
Error cases:
  - HTTP 400 VALIDATION_ERROR — invalid input
Zod schema: `CreateTokenSchema = z.object({ name: z.string().min(1), projectId: z.string() })`
DB query: `db.insert(agent_tokens).values({ hash: bcrypt(token), prefix: token.slice(0, 10), ... })`

**Endpoint: POST /api/v1/users/me/password**
Request body: `{ currentPassword: string, newPassword: string }`
Success response: HTTP 200 `{ data: { success: true } }`
Error cases:
  - HTTP 400 VALIDATION_ERROR — when currentPassword verification fails (bcrypt mismatch)
Zod schema: `UpdatePasswordSchema = z.object({ currentPassword: z.string(), newPassword: z.string().min(8) })`
DB query: `db.update(users).set({ password: bcrypt(newPassword) }).where(eq(id, me.id))`

---

## TASK-015: API — Agent Protocol Endpoints [IN_PROGRESS]

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
- **File:** `src/app/api/v1/agent/tasks/next/route.ts`, `src/app/api/v1/sessions/[id]/heartbeat/route.ts`, `src/app/api/v1/sessions/[id]/complete/route.ts`

**Endpoint: POST /api/v1/sessions/:id/heartbeat**
Request body: none
Success response: HTTP 200 `{ data: { shouldStop: boolean } }`
Error cases:
  - HTTP 401 UNAUTHORIZED — when invalid `sdk_...` token in Authorization header
  - HTTP 404 NOT_FOUND — when session not found
Zod schema: none
DB query: `db.update(agent_sessions).set({ lastHeartbeatAt: new Date() }).where(eq(id, sessionId))`

**Endpoint: GET /api/v1/agent/tasks/next**
Request body: none
Success response: HTTP 200 `{ data: { task: { id: string, name: string, ... } } }` (or `{ data: null }` if none ready)
Error cases:
  - HTTP 401 UNAUTHORIZED — when invalid `sdk_...` token
Zod schema: none
DB query: `db.transaction(async (tx) => { ... })` (Find highest priority todo task respecting dependencies, mark in_progress)

**Endpoint: POST /api/v1/sessions/:id/complete** (Added to Agent Protocol API task because it is an agent-only webhook)
Request body: `{ totalPromptTokens: number, totalCompletionTokens: number }`
Success response: HTTP 200 `{ data: { success: true } }`
Error cases:
  - HTTP 401 UNAUTHORIZED — agent-only endpoint, invalid token
  - HTTP 400 VALIDATION_ERROR — invalid inputs
Zod schema: `SessionCompleteSchema = z.object({ totalPromptTokens: z.number(), totalCompletionTokens: z.number() })`
DB query: `db.update(agent_sessions).set({ status: 'completed', totalPromptTokens, totalCompletionTokens, totalCostUsd: computeCost(...) }).where(...)`

---

## TASK-016: API — Notifications & Webhooks [IN_PROGRESS]

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
- **File:** `src/app/api/v1/notifications/route.ts`, `src/app/api/webhooks/github/[projectId]/route.ts`

**Endpoint: POST /api/webhooks/github/:projectId**
Request body: GitHub event payload (dynamic)
Success response: HTTP 200 `{ success: true }`
Error cases:
  - HTTP 401 UNAUTHORIZED — when HMAC-SHA256 (X-Hub-Signature-256) validation fails
Zod schema: none (dynamic webhook body)
DB query: `db.insert(agent_logs)` / `db.insert(notifications)` based on event. Not under `/api/v1`.

---

## TASK-017: Design System, Mascot & Base States [COMPLETED]

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

## TASK-018: App Shell & Navigation [PENDING]

**Area:** UI — App Shell
**Depends on:** TASK-017
**Estimated effort:** M

### Context
Build the primary application layout, including sidebar navigation, top header (project switcher), and responsive layout constraints.
### Acceptance criteria
- [ ] Layout contains a collapsible sidebar with active-state navigation items.
- [ ] Header includes project selector dropdown (`~/butteredstardust/spe... ∨`) which:
  - Shows list of all projects the user is a member of.
  - Highlights current project with a checkmark.
  - Includes `Manage projects →` at the bottom.
  - On switch: reloads app state and navigates to Mission Control of new project.
- [ ] Notification bell in header — unread badge count.
- [ ] The global DAEMON state is displayed in the sidebar footer.
- [ ] Keyboard shortcuts implemented. Help modal opens on `?`. Dev mode on `Ctrl+\`.

---

## TASK-019: Shared UI Components (Terminal, Diff, Log Row) [PENDING]

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

## TASK-020: Shared Infrastructure — Polling Hook [PENDING]

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

## TASK-021: Error Pages (404, 500) [COMPLETED]

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

## TASK-022: Auth UI — Login Page [PENDING]

**Area:** UI — Auth
**Depends on:** TASK-007, TASK-017
**Estimated effort:** S

### Context
Login page.
### Acceptance criteria
- [ ] `/login` accepts credentials, validates, and uses NextAuth `signIn`.
- [ ] Shows error states properly.
- [ ] Demo access panel below card (dashed border) displaying preset users (Alex Rivera, Sam Okafor, Jordan Chen) to quick-login by POSTing credentials without typing.
- [ ] Status bar shows `DEMO MODE` when env flag is set.

---

## TASK-023: Auth UI — Forgot & Reset Password [PENDING]

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

## TASK-024: Auth UI — Accept Invite Page [PENDING]

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

## TASK-025: Onboarding Wizard [PENDING]

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

## TASK-026: Mission Control Dashboard [PENDING]

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
- **File:** `src/app/page.tsx`, `src/components/dashboard/session-widget.tsx`, `src/components/dashboard/event-log.tsx`
- **Polling:** Active session data polls every 3s using `usePolling`.

**Layout:** Two-column, full content area height.
- Left column (~40% width): Session widget OR empty state
- Right column (~60% width): Event log (always visible, even in empty state)

**Session widget — active session subcomponents (top to bottom):**
1. `SES-XXX` chip (amber, monospace) + blue dot + `RUNNING` badge + elapsed timer `HH:MM:SS` (right-aligned, large monospace)
2. Spec name (muted, below session ID)
3. Progress: `N/N tasks` (left) + progress bar + `NN%` (right)
4. Current task chip: `▶ [T-XXX]  Task name`
5. Terminal pane (dark bg, green monospace text): live agent CLI output, scrollable
6. Bottom buttons: `[‖ Pause]` and `[× Cancel]`

**Needs Attention banner** — renders ABOVE the session widget when any task is blocked:
```
[DAEMON icon]  NEEDS ATTENTION  "I need your help with N task(s)"
⚠ [T-XXX]  Task name    ← one chip per blocked task
```
Amber/orange background. Clicking a task chip navigates to that spec's Tasks tab.

**Empty state (no active session):** Replaces the session widget only. Event log still shows on right.
- DAEMON mascot: idle expression, large (~120px)
- Heading: `SYSTEM READY` (letter-spaced, muted uppercase)
- Body: `No active session. Get started by creating a specification and letting DAEMON generate an execution plan.`
- CTA button: `Create First Spec →` (purple, primary)
- Secondary link below button: `or browse existing specs` (monospace, muted)

**Event log rows:** `HH:MM:SS  [EVENT_TYPE]  T-XXX?  Description text`
- Event type is a coloured badge (not plain text)
- Task ID is a chip (amber bg, monospace) when present, otherwise absent
- Footer: `View all →` link — navigates to `/sessions`
- Badge colours: `[BLOCKED]` amber | `[TASK_START]` blue | `[TASK_DONE]` green | `[SESSION_START]` dark grey | `[PLAN_APPROVED]` green | `[PLAN_GENERATED]` purple | `[SESSION_CANCELLED]` red/orange

---

## TASK-027: Projects Listing Page [PENDING]

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

## TASK-028: Project Creation UI [PENDING]

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

## TASK-029: Specs Listing Page [PENDING]

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
- Note: The filter tabs must show live counts (`DRAFTING 1`, `PENDING 2`, etc.). These counts are derived from the same API response as the list (`GET /api/v1/specs` returning counts per status group in a `meta.counts` field).

---

## TASK-030: Spec Editor — New Spec [PENDING]

**Area:** UI
**Depends on:** TASK-009, TASK-018
**Estimated effort:** M

### Context
Markdown editor for new specs.
### Acceptance criteria
- [ ] `/specs/new` presents markdown editor.
- [ ] Editor renders full-screen: no sidebar, no global footer bar. Only the editor header is shown.
- [ ] Header (left to right): `←` back arrow | inline-editable spec title (placeholder `Untitled Spec`) | `Save Draft` (grey, secondary) | `Save & Generate Plan` (purple, primary)
- [ ] Body: split pane. Left = monospace markdown editor, placeholder text `Write your spec in markdown...`. Right = `PREVIEW` label + live-rendered HTML.
- [ ] Preview empty state (before user types): DAEMON idle mascot + `"Start writing to see a preview"` (italic, muted)
### Implementation notes
- **File:** `src/app/specs/new/page.tsx`
- **Keyboard shortcut:** `Ctrl+Enter` — Save spec.
- **Layout:** `src/app/specs/new/page.tsx` and `src/app/specs/[id]/edit/page.tsx` must NOT render inside the root app layout. Use a separate layout file or `export const dynamic` flag to suppress sidebar and footer.
- The back arrow navigates to `/specs` (new) or `/specs/[id]` (edit). Trigger `beforeunload` guard if dirty.
- Title field: `<input>` styled as a heading, auto-selects on focus, persists to spec `name` field on save.
- `Save Draft` → `POST /api/v1/projects/:id/specs` (new) or `POST /api/v1/specs/:id/versions` (edit). Does NOT trigger plan generation.
- `Save & Generate Plan` → same save call, then immediately `POST /api/v1/specs/:id/plan/generate`. Navigates to spec detail Plan tab on success.

---

## TASK-031: Spec Editor — Edit Existing [PENDING]

**Area:** UI
**Depends on:** TASK-009, TASK-018
**Estimated effort:** M

### Context
Editor for existing specs with edge case handling.
### Acceptance criteria
- [ ] `/specs/[id]/edit` UI.
- [ ] Spec name collision error: inline error + generated suggestion chip that fills name field.
- [ ] Concurrent edit warning banner (amber banner if someone else editing).
- [ ] Back navigation guard: If the user has unsaved changes and clicks back or navigates away, a browser beforeunload guard must fire.
- [ ] Editor renders full-screen: no sidebar, no global footer bar. Only the editor header is shown.
- [ ] Header (left to right): `←` back arrow | inline-editable spec title (placeholder `Untitled Spec`) | `Save Draft` (grey, secondary) | `Save & Generate Plan` (purple, primary)
- [ ] Body: split pane. Left = monospace markdown editor, placeholder text `Write your spec in markdown...`. Right = `PREVIEW` label + live-rendered HTML.
- [ ] Preview empty state (before user types): DAEMON idle mascot + `"Start writing to see a preview"` (italic, muted)
- [ ] Amber warning banner renders below editor header when the spec has an active plan: `⚠ This spec has an active plan (v1). Saving will create v2 and abandon the current plan.`
- [ ] `beforeunload` guard fires when user has unsaved changes and attempts to navigate away or close the tab.
### Implementation notes
- **File:** `src/app/specs/[id]/edit/page.tsx`
- **Layout:** `src/app/specs/new/page.tsx` and `src/app/specs/[id]/edit/page.tsx` must NOT render inside the root app layout. Use a separate layout file or `export const dynamic` flag to suppress sidebar and footer.
- The back arrow navigates to `/specs` (new) or `/specs/[id]` (edit). Trigger `beforeunload` guard if dirty.
- Title field: `<input>` styled as a heading, auto-selects on focus, persists to spec `name` field on save.
- `Save Draft` → `POST /api/v1/projects/:id/specs` (new) or `POST /api/v1/specs/:id/versions` (edit). Does NOT trigger plan generation.
- `Save & Generate Plan` → same save call, then immediately `POST /api/v1/specs/:id/plan/generate`. Navigates to spec detail Plan tab on success.

---

## TASK-032: Spec Detail — Overview Tab & Header [PENDING]

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

**State Machine Rendering Rules:**
| spec.status | plan.status | Buttons (exact labels) | Permission required |
| --- | --- | --- | --- |
| draft | null | Edit · Generate Plan → | Member+ for both |
| draft | pending_plan | Edit · Generate Plan → (disabled/loading) | — |
| review | pending_approval | Edit · Approve · Request Changes | Admin+ for Approve/RC |
| running | executing | Edit · ▶ SES-XXX (link) · Pause | Member+ for Pause |
| stalled | (paused) | Edit · Resume Execution → | Member+ |
| done | completed | Edit · Re-run · Edit | Member+ for Re-run |
| archived | any | Edit · Unarchive | Admin+ for Unarchive |

- Breadcrumb segment (rightmost part) must match the currently active tab name, not the spec status (e.g., `SPECIFICATIONS > SPEC NAME IN CAPS > TAB NAME IN CAPS`).

---

## TASK-033: Spec Detail — Plan Review Tab [PENDING]

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

**State Machine Rendering Rules:**
| plan.status | What renders |
| --- | --- |
| null | DAEMON idle (happy expression). Heading: No plan generated. Quote: "Run me on this spec and I'll produce an architecture and execution plan." Button: [ Generate Plan ] |
| pending_plan | DAEMON thinking expression. Heading: Generating plan... or similar. Polling indicator. No approve/reject buttons. |
| pending_approval | Green banner [DAEMON icon] PENDING APPROVAL. Below: Execution Plan — [Spec Name] heading. Sections: Approach, Architecture (numbered list), Key Decisions (bold Decision: reason format). Below plan: [ Approve ] [ Request Changes ] buttons. |
| changes_requested | Show reviewer notes. Show [ Regenerate Plan ] or equivalent. |
| rejected | Show reviewer notes. Show [ Generate New Plan ]. |
| executing | Green banner [DAEMON icon] APPROVED   Xh ago. Plan content read-only. No action buttons. |
| completed | Green banner [DAEMON icon] EXECUTION COMPLETE. Plan content read-only. |
| abandoned | Grey banner indicating abandonment. Link to newer version if applicable. |

---

## TASK-034: Spec Detail — Approve & Execute Action [PENDING]

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

## TASK-035: Spec Detail — Tasks Tab [PENDING]

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

**State Machine Rendering Rules:**
| task.status | Left icon | Row style | Right content |
| --- | --- | --- | --- |
| done | ✓ (green) | Muted | Duration: Nm NNs |
| in_progress | ▶ (blue/purple) | Highlighted background | deps: T-XXX if applicable |
| blocked | ⚠ (amber) | Red left border | Truncated blockedReason text |
| todo | ○ (hollow) | Normal | deps: T-XXX if applicable |
| failed | ✗ (red) | Red-tinted | deps: T-XXX |
| skipped | — (dash, grey) | Muted | Reason if available |

- Summary line above rows must match: `N done  N running  N blocked  N todo` (only show non-zero counts, or show all four).
- **State:** [No tasks] -> DAEMON expression: idle + copy: "No tasks yet." / "Tasks are created when a plan is approved." / CTA: "Go to Plan ->"

---

## TASK-036: Spec Detail — Changes Tab [PENDING]

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

## TASK-037: Spec Detail — Version History [PENDING]

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

## TASK-038: Task Drawer — Layout & Overview [PENDING]

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

## TASK-039: Task Drawer — Attempts & Logs [PENDING]

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

## TASK-040: Task Drawer — Changes (Diffs) Tab [PENDING]

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

## TASK-041: Task Drawer — Blocked State & Unblock Form [PENDING]

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

## TASK-042: Task Drawer — Cost Panel & Overrides [PENDING]

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

## TASK-043: Sessions Listing Page [PENDING]

**Area:** UI
**Depends on:** TASK-012, TASK-018
**Estimated effort:** M

### Context
List sessions.
### Acceptance criteria
- [ ] Sessions listing page `/sessions` with filters (`?projectId`, `?status`, `?from`, `?to`).
- [ ] Empty state: DAEMON idle, "No sessions recorded."
- [ ] Session list — inline expansion: When a session row (failed or completed) is clicked, it expands inline showing a terminal log pane (client-side only state, no navigation). A second click collapses it.

---

## TASK-044: Session Detail View [PENDING]

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

**State Machine Rendering Rules:**
| session.status | Action buttons | Content |
| --- | --- | --- |
| running | [ Pause ] + [ Cancel ] | Live timer, live task progress dots, live terminal log |
| paused | [ Resume ] + [ Cancel ] | Last task state frozen |
| completed | none | Total duration, task counts, cost if available |
| failed | [ View Spec ] (always) | Error summary, which tasks failed |
| cancelled | none | Which tasks were cancelled mid-flight |

- **Lost Connection Banner:** (appears when `now - lastHeartbeatAt > 60s`):
  - Yellow/amber background banner below stats row.
  - Text: `⚠ Session SES-XXXX may have lost connection. Last heartbeat N minutes ago.`
  - Buttons: `[ Check Status ]` `[ Abandon Session ]`
- **Stats row** (4 cards, exact labels): `⏰ STARTED` | `⏱ DURATION` | `✓ SUCCEEDED` | `✗ FAILED`
- **Task timeline dots** (left panel, `TASK EXECUTION TIMELINE` heading):
  - 🟢 filled green = done
  - ○ hollow grey = todo
  - 🟡 yellow = in_progress or blocked
  - ✗ red = failed
- **Session log** (right panel, `SESSION LOG` heading):
  - Green monospace terminal text, dark background.
  - Start: `$ specdrivr agent start --session SES-XXX`
  - Then `>` prefixed log lines.
  - Error lines prefixed `✗` in red.

---

## TASK-045: Notifications UI [PENDING]

**Area:** UI
**Depends on:** TASK-016, TASK-018
**Estimated effort:** M

### Context
Notification dropdown and page.
### Acceptance criteria
- [ ] Notification popover (bell icon): rendered inline via dropdown, truncated to ~5 recent items, no filter tabs, includes "View all notifications →".
- [ ] Notifications full listing page `/notifications` with filter tabs (`ALL`, `UNREAD`, `MENTIONS`), full list, and `Mark all read` button.
- [ ] Notifications empty state ("All caught up. Nothing to report.")

---

## TASK-046: Settings Layout & General Tab [PENDING]

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

## TASK-047: Settings — Profile [PENDING]

**Area:** UI — Settings
**Depends on:** TASK-014
**Estimated effort:** S

### Context
Profile settings.
### Acceptance criteria
- [ ] Avatar display: purple circle showing user initials. Below: copy `"Avatar is generated from your name. Custom avatars are not supported."` (read-only, muted).
- [ ] Display Name field: editable text input.
- [ ] Email field: read-only input. Below: `"To change your email, contact your administrator."` (muted).
- [ ] Theme toggle group: `☀ Light` | `🌙 Dark` | `🖥 System` — three-option button group, one active at a time. Persists to `localStorage` and `users.theme` column.
- [ ] `Save Profile` button.
- [ ] **Password change is NOT on this page.** It lives in TASK-047b (Security) below. Remove any password change form from this task.
### Implementation notes
- **File:** `src/app/settings/profile/page.tsx`

---
## TASK-047b: Settings — Security

**Area:** UI — Settings
**Depends on:** TASK-014, TASK-047
**Estimated effort:** S

### Context
Security settings sub-page at `/settings/security`. Contains password management,
active browser session management, and API token management (complementing TASK-048).

### Acceptance criteria
- [ ] Page renders at `/settings/security` within the settings layout sidebar.
- [ ] Section `CHANGE PASSWORD`: three fields (Current Password, New Password, Confirm
      New Password) + `Update Password` button. Calls `POST /api/v1/users/me/password`.
      Shows inline error if current password is wrong (400 response).
- [ ] Section `ACTIVE SESSIONS`: list of browser sessions. Each row shows:
      browser name + OS (e.g. `Chrome · macOS`) | location + relative time | `(this session)`
      label on current | `[Revoke]` button. Below list: `Revoke all other sessions` link (red).
      Calls `DELETE /api/v1/users/me/sessions/:sessionId` per row.
- [ ] Section `API TOKENS`: masked token list (`sdk_...a3f2` format) with columns:
      name | masked value | created date | last used | expires | `[Revoke]` button.
      `+ Generate Token` button opens a modal: name input → submit → displays full raw
      token ONCE with copy button → close. After close, token is masked forever.
      Calls `GET /api/v1/users/me/tokens` and `POST /api/v1/users/me/tokens`.

### Implementation notes
- **File:** `src/app/settings/security/page.tsx`
- Active sessions data: requires a new `GET /api/v1/users/me/sessions` endpoint returning
  `{ id, userAgent, ipAddress, location, lastActiveAt, isCurrent }[]`.
  Add this endpoint to TASK-014 if not already present.
- Revoke all: `DELETE /api/v1/users/me/sessions` (bulk, excludes current session).
- Token generation modal must show the raw token only in the success state, never again
  after the modal is closed. Use a controlled dialog with explicit "I've copied it" close.

---

## TASK-047c: Settings — Notifications Preferences

**Area:** UI — Settings
**Depends on:** TASK-016, TASK-047
**Estimated effort:** S

### Context
Notification preferences sub-page at `/settings/notifications`.
TASK-016 covers the API. This task covers only the UI.

### Acceptance criteria
- [ ] Page renders at `/settings/notifications` within the settings layout.
- [ ] Intro copy: `"Choose when DAEMON notifies you."`
- [ ] Table with columns: `Event` | `Email` | `In-app`. Each cell in Email and In-app
      is a toggle switch (on/off). Initial state loaded from `GET /api/v1/users/me/notifications`.
- [ ] Exactly 9 event rows (in this order):
      1. Plan generated for my spec
      2. Plan approved
      3. Plan rejected
      4. Changes requested on my spec
      5. Session complete
      6. Task blocked (specs I own)
      7. Session failed
      8. Team invitation sent
      9. Role changed
- [ ] `Save Preferences` button. Calls `PATCH /api/v1/users/me/notifications` with the
      full preferences payload. Shows success toast on save.

### Implementation notes
- **File:** `src/app/settings/notifications/page.tsx`
- Toggles are controlled components. Dirty state tracked — show unsaved indicator if user
  changes a toggle without saving.
- On load failure: show inline error, not a full-page error boundary.

---

## TASK-048: Settings — API Tokens [PENDING]

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

## TASK-049: Settings — Team Management [PENDING]

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

## TASK-050: Settings — Agent [PENDING]

**Area:** UI — Settings
**Depends on:** TASK-010
**Estimated effort:** S

### Context
Agent settings.
### Acceptance criteria
- [ ] Section `EXECUTION` contains exactly 4 controls:
  - **Max concurrent tasks**: range slider, current value displayed as `N tasks`. Helper: `"Higher values speed up execution but increase the chance of merge conflicts."`
  - **Task execution timeout**: number input (seconds). Helper: `"Tasks will be killed after N minutes."` (computed from value ÷ 60).
  - **Max retries per task**: range slider, value `0–5`. Helper: `"DAEMON will retry failed tasks before marking them blocked."`
  - **Task retry delay**: `<select>` dropdown. Options: `15 seconds`, `30 seconds`, `1 minute`, `5 minutes`.
- [ ] Section `PLANNING` contains exactly 3 controls:
  - **Require plan approval**: toggle switch, default ON. Label: `"Require manual approval before execution"`.
  - **Auto-generate plan on save**: toggle switch, default OFF. Label: `"Automatically triggers plan generation when you save a spec"`.
  - **Plan expiry**: `<select>` dropdown. Options: `Never`, `24 hours`, `7 days`, `30 days`.
- [ ] Section `AGENT TOKEN` contains:
  - Masked token display: `sdk_...xxxx` (monospace, non-editable).
  - Helper copy: `"This token is set via environment variable. Rotate it in your infrastructure, then update AGENT_TOKEN."`
  - Link: `How to rotate the agent token →` (opens docs or modal).
  - No "generate" button here — token rotation is infrastructure-level only.
- [ ] `Save Agent Settings` button (full-width or right-aligned). Calls `PATCH /api/v1/projects/:id/agent-config`.
- [ ] Admin/Owner only. Viewer/Member see the page but all inputs are disabled with a banner: `"Agent settings can only be changed by Admins and Owners."`
### Implementation notes
- **File:** `src/app/settings/agent/page.tsx`
- Load existing config from `GET /api/v1/projects/:id/agent-config`.
- All four EXECUTION controls and all three PLANNING controls are saved in a single `PATCH` call — not individually.
- Slider components: use shadcn `Slider`. Number input: use shadcn `Input` with `type="number"`. Selects: use shadcn `Select`.

---

## TASK-051: Settings — Integrations [PENDING]

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

## TASK-052: Settings — Usage [PENDING]

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

## TASK-053: Settings — Danger Zone [PENDING]

**Area:** UI — Settings
**Depends on:** TASK-010
**Estimated effort:** S

### Context
Project deletion.
### Acceptance criteria
- [ ] Four action cards rendered in this order, each with a title, description, and button:

  **Card 1 — Abandon All Running Sessions**
  - Description: `"Immediately stop all running sessions. In-progress tasks will be marked failed."`
  - Button: `Abandon All Sessions` — amber outlined style
  - Permission: Admin+. Disabled with tooltip for Member/Viewer.
  - Confirmation: inline `AlertDialog` — `"This will cancel N running sessions and mark their in-progress tasks as failed. This cannot be undone."`
  - API call: `POST /api/v1/projects/:id/sessions/abandon-all`

  **Card 2 — Reset All Agent Settings**
  - Description: `"Resets timeouts, retries, concurrency, and approval settings to factory defaults."`
  - Button: `Reset Agent Settings` — amber outlined style
  - Permission: Admin+.
  - Confirmation: `AlertDialog` — `"Agent settings will be reset to defaults. Your integrations and tokens will not be affected."`
  - API call: `POST /api/v1/projects/:id/agent-config/reset`

  **Card 3 — Delete All Specs & Plans**
  - Description: `"Permanently deletes all specifications, plans, tasks, and session history."`
  - Button: `Delete All Specs & Plans` — red outlined style
  - Permission: Owner only.
  - Confirmation: `AlertDialog` with project name typed to confirm.
  - API call: `DELETE /api/v1/projects/:id/specs`

  **Card 4 — Delete Project**
  - Description: `"Permanently delete this project and everything in it."`
  - Button: `Delete Project` — red solid filled style
  - Permission: Owner only.
  - Confirmation: `AlertDialog` requiring the user to type the project slug.
  - API call: `DELETE /api/v1/projects/:id` (with `{ confirmationToken }` body per TASK-008)
  - On success: clear session project context, redirect to `/projects`.
### Implementation notes
- **File:** `src/app/settings/danger-zone/page.tsx`
- Section heading `DANGER ZONE` in red. Brief intro copy: `"These actions are irreversible. Proceed carefully."`
- All four cards use a consistent card component with a left-aligned text block and right-aligned button.
- Disabled state (insufficient role): button shows but is disabled + `Tooltip` naming required role. Never hide the button.
- The two amber buttons and two red buttons must be visually distinct — do not use the same variant for all four.
- Add the two missing API endpoints (`POST /api/v1/projects/:id/sessions/abandon-all` and `POST /api/v1/projects/:id/agent-config/reset`) to TASK-012 and TASK-015 respectively, or create a brief addendum task if cleaner.

---

## TASK-054: Settings — Webhook Delivery Log [PENDING]

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

## TASK-055: Audit Log Viewer [PENDING]

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

## TASK-056: Webhooks Event Dispatcher [PENDING]

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

---

## TASK-057: Usage Aggregation Cron Job [PENDING]

**Area:** Integration
**Depends on:** TASK-012
**Estimated effort:** S

### Context
Nightly job that reads completed sessions and writes daily aggregates to `usage_snapshots`.
### Acceptance criteria
- [ ] Cron job correctly computes aggregates and writes to `usage_snapshots`.
- [ ] Uses parameterized Drizzle queries.
### Implementation notes
- **File:** `src/lib/jobs/aggregate-usage.ts`
- **Trigger mechanism:** Cron expression (`0 0 * * *`) or manual invocation.
- **DB query pattern:** `db.insert(usage_snapshots).values(...)` using aggregations over `agent_sessions`. Columns written: `projectId`, `date`, `totalPromptTokens`, `totalCompletionTokens`, `totalCostUsd`, `sessionCount`.

---

## TASK-058: GitHub Integration Backend [PENDING]

**Area:** Integration
**Depends on:** TASK-016
**Estimated effort:** M

### Context
DAEMON agent needs a `GITHUB_TOKEN` to clone, branch, commit, and push.
### Acceptance criteria
- [ ] App securely stores `GITHUB_TOKEN` (PAT or App token) separately from OAuth token in `agent_config`.
- [ ] Agent correctly reads token and performs git workflow per task.
### Implementation notes
- **File:** `src/lib/github.ts`
- **Git workflow:** `git checkout -b daemon/spec-{specId}/task-{taskId}`, `git commit`, `git push`. Agent never pushes to `main` directly.
- **Token access:** Retrieved securely from `agent_config` per project.

---

## TASK-059: Slack Notification Dispatcher [PENDING]

**Area:** Integration
**Depends on:** TASK-016
**Estimated effort:** S

### Context
Posts to Slack channels when specific DAEMON events occur.
### Acceptance criteria
- [ ] When events fire (`session_started`, `session_completed`, `session_failed`, `task_blocked`), POST to configured Slack channel using Block Kit.
### Implementation notes
- **File:** `src/lib/slack.ts`
- **Message format:** Block Kit messages tailored per event type.
- **Token access:** Bot token is retrieved from the project's integration config in `agent_config`.

---

## TASK-060: Dev Mode State Management [PENDING]

**Area:** UI
**Depends on:** TASK-018
**Estimated effort:** S

### Context
`Ctrl+\` toggles Dev Mode, exposing extra debug UI across the app.
### Acceptance criteria
- [ ] `DevModeContext` manages and exposes global dev mode state.
- [ ] Toggles visibility of raw IDs, JSON inspector panel, and cost panels in Task Drawer.
### Implementation notes
- **File:** `src/contexts/dev-mode-context.tsx`

---

## TASK-061: Keyboard Shortcuts Modal [PENDING]

**Area:** UI
**Depends on:** TASK-018
**Estimated effort:** S

### Context
`?` key opens modal listing all shortcuts.
### Acceptance criteria
- [ ] Global shortcut `?` opens help modal.
- [ ] Lists every shortcut defined across the app.
- [ ] Referenced in avatar dropdown as "Keyboard Shortcuts".
### Implementation notes
- **File:** `src/components/ui/keyboard-shortcuts-modal.tsx`

---

## TASK-062: SYSTEMS Bar Health Indicators [PENDING]

**Area:** UI
**Depends on:** TASK-018
**Estimated effort:** S

### Context
4 pixel-art icons (GIT, API, AGT, PG) in the sidebar footer reflect live system health.
### Acceptance criteria
- [ ] Polls `GET /api/v1/health` and maps result to per-system statuses.
- [ ] Colour state reflects: GitHub connection, API reachability, agent heartbeat recency, database connectivity.
### Implementation notes
- **File:** `src/components/layout/systems-bar.tsx`
## Phase 5 — Plan Summary

### 5a. Task count by area
| Area | Task Count | Estimated Hours |
| --- | --- | --- |
| Database | 4 | 12h (3S, 1M) |
| Infrastructure | 3 | 8h (2S, 1M) |
| Auth | 4 | 12h (4S) |
| API | 10 | 40h (5S, 5M) |
| UI | 37 | 128h (22S, 15M) |
| Integration | 4 | 12h (2S, 2M) |
| **Total** | **64** | **212h (excluding 2 new S tasks)** |

### 5b. Critical path
TASK-001 → TASK-002 → TASK-003 → TASK-004 → TASK-005 → TASK-008 → TASK-010 → TASK-012 → TASK-013 → TASK-036 → TASK-058 → TASK-062.

### 5c. Parallel workstreams
- **Workstream A — Data layer**: TASK-001 to TASK-004.
- **Workstream B — Auth & API**: TASK-005 to TASK-016.
- **Workstream C — UI Components & Settings**: TASK-017 to TASK-055, TASK-060 to TASK-062.
- **Workstream D — Integrations**: TASK-056 to TASK-059.

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
- [DECISION-012] Settings Security page: active session management UI assumes a GET /api/v1/users/me/sessions endpoint. If absent from TASK-014, add it there.
- [DECISION-013] Danger Zone: two new API endpoints (abandon-all sessions, reset agent config) are implied by the UI. Assign to closest existing API task.

## Phase 6 — Gap & Debt Analysis (Audit Log)

### 6a. Architectural Drift
- **Authentication:** Original spec (API.md §6.1) dictated custom `/api/auth/sign-in/email` and `/api/auth/sign-out` endpoints interacting manually with Redis/Bcrypt. Implementation uses the native `better-auth` library via `src/app/api/auth/[...all]/route.ts`. The custom signup endpoint at `src/app/api/v1/auth/signup/route.ts` remains as a bridge but deviates from strict spec. This impacts TASK-005, TASK-007, and TASK-022.
- **Data Fetching:** The spec assumes `{ data, meta }` envelopes across all `/api/v1` routes. The current implementation (e.g., in `src/app/api/v1/projects/route.ts` and `src/app/api/v1/projects/[id]/specs/route.ts`) frequently returns flat arrays or raw JSON objects instead.
- **File Hierarchy:** API routes were originally planned as monolithic handlers (e.g., `src/app/api/projects/route.ts`), but have been correctly nested in the As-Built code (`src/app/api/v1/projects/[id]/route.ts`, `src/app/api/v1/projects/[id]/members/[userId]/route.ts`).

### 6b. Missing Acceptance Criteria & Stubbed Features
- **TASK-018 (App Shell & Navigation):** `src/app/layout.tsx` is present but the sidebar, DAEMON integration, and active navigation states defined in DESIGN_SYSTEM.md §10 are MISSING.
- **TASK-004 (Seed Data Generation):** A `src/db/seed.ts` script exists but is empty/unimplemented. Local development currently lacks programmatic seed data, forcing manual DB entry.
- **TASK-026 to TASK-037 (UI Pages):** Critical frontend screens (`dashboard/page.tsx`, `projects`, `specs`) are essentially empty stubs. Base `shadcn/ui` components are present in `src/components/ui/` but are not composed into the views required by USER_INTERFACE.md.
- **TASK-058 & TASK-059 (Integrations):** While webhooks logic is scaffolded (`src/app/api/v1/webhooks/github/[projectId]/route.ts`), the actual Slack notification dispatcher and deeper GitHub integrations are not yet fully implemented.

### 6c. Technical Debt
- **Frontend State Management:** The lack of implemented global state (Context/Zustand) means that DAEMON Mascot expressions (TASK-017) cannot yet react to active session states or background polling.
- **Error Boundaries:** Although `src/components/error-boundary.tsx` exists, comprehensive error states and 404/500 routing pages required by OPERATIONS.md are incomplete.
- **Pagination & Rate Limiting Enforcement:** While `src/proxy.ts` implements Upstash, actual granular rate limiting logic inside individual route handlers hasn't been strictly validated against the tier structures defined in API.md.
