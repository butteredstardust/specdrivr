# Engineering Implementation Plan V5 — Audit-Corrected & Deterministic

This document serves as the authoritative, step-by-step execution roadmap for Specdrivr. It incorporates corrections from the Technical Audit (March 2026), specifically mandating Upstash Redis (HTTP), DOMPurify sanitization, and async plan generation via QStash.

## Phase 1 — Infrastructure & Foundation

### 1a. Core Tech Stack (Validated)
- **Framework:** Next.js 16.1.6 (App Router)
- **Runtime:** Node.js 25.6.1 (pnpm)
- **Database:** PostgreSQL 16 (Drizzle ORM)
- **Auth:** BetterAuth 1.5.5
- **Cache/Queue:** Upstash Redis (HTTP-based) — **Strict: No ioredis/TCP**
- **Rate Limiting:** Upstash Ratelimit
- **Sanitization:** Isomorphic DOMPurify (Mandatory)
- **Logging:** Pino (Structured JSON)

---

## Phase 2 — Task Plan (Deterministic Execution)

### Area: Database & Schema

**Step Number:** TASK-001
**Title:** Schema Finalization — Core & Governance
**Objective:** Ensure the baseline schema supports RBAC, projects, and invitations.
**Detailed instructions:**
1. Verify `users` table contains: `avatarUrl`, `timezone`, `locale`, `onboardingStep`.
2. Verify `projects` table contains: `slug` (unique index), `createdBy`, `avatarColor`, `isDemo`.
3. Verify `invites` table exists with `invitedBy`, `resendCount`, `lastResentAt`.
4. Enforce `spec_status` enum to include `stalled`.
**Files involved:** `src/db/schema.ts`
**Expected output:** A generated migration file in `drizzle/` reflecting these fields.
**Verification method:** Run `pnpm db:generate`. Verify no "db:push" was used.

**Step Number:** TASK-002
**Title:** Schema Finalization — Orchestration & Telemetry
**Objective:** Add telemetry, cost tracking, and attempt logging to plans and tasks.
**Detailed instructions:**
1. Update `plans` table: Add `generationDurationMs`, `generationError`, `modelVersion`, `taskCount`, `totalEstimatedMinutes`.
2. Update `tasks` table: Add `estimatedMinutes`, `actualDurationMs`, `gitBranch`, `gitCommitHash`, `expectedFiles`, `agentVersion`, `promptTokensUsed`, `completionTokensUsed`, `totalCostUsd`.
3. Create `task_attempts` table: `id`, `taskId`, `seq`, `status`, `logLines` (JSONB), `durationMs`.
4. Create `file_changes` table: `id`, `taskId`, `attemptId`, `filePath`, `changeType`, `diff` (text).
**Files involved:** `src/db/schema.ts`
**Expected output:** Migration SQL containing `CREATE TABLE task_attempts` and `file_changes`.
**Verification method:** `pnpm db:generate`. Verify SQL types for JSONB are correct for Drizzle.

**Step Number:** TASK-003
**Title:** Schema Finalization — Agent & Usage
**Objective:** Implement session tracking, agent config, and audit logging.
**Detailed instructions:**
1. Create `agent_sessions` table: Track `gitHeadCommit`, `totalCostUsd`, `lastHeartbeatAt`.
2. Create `agent_config` table: Project-level settings (concurrency, timeouts, globs).
3. Create `webhook_deliveries` and `usage_snapshots` (daily aggregates).
4. Create `audit_log` table: `userId`, `action`, `targetId`, `detail` (JSONB).
**Files involved:** `src/db/schema.ts`
**Expected output:** Complete schema coverage for all 17 tables defined in `DATABASE.md`.
**Verification method:** `pnpm db:migrate` successfully applies all migrations to the local PG instance.

**Step Number:** TASK-004
**Title:** Seed Data Generation
**Objective:** Provision a realistic development environment.
**Detailed instructions:**
1. Implement `src/db/seed.ts` using `db.transaction`.
2. Seed 3 users (Admin, Member, Viewer).
3. Seed 2 projects, one with an active `agent_session` and one with a `pending_approval` plan.
4. Mock a `blocked` task with a specific `blockedReason`.
**Files involved:** `src/db/seed.ts`
**Expected output:** Running `pnpm db:seed` populates the database without foreign key violations.
**Verification method:** Query `SELECT count(*) FROM users` and verify 3 records exist.

### Area: Core Infrastructure

**Step Number:** TASK-005
**Title:** [REFACTORED] Authentication & Redis Setup
**Objective:** Configure BetterAuth with Upstash Redis (HTTP) for edge-compatible sessions.
**Detailed instructions:**
1. Install `@upstash/redis` and `@better-auth/core`. **UNINSTALL `ioredis` if present.**
2. Create `src/lib/redis.ts`: Export Upstash Redis singleton using `REDIS_URL`.
3. Create `src/lib/auth.ts`: Configure BetterAuth with the Drizzle adapter and the Upstash Redis session storage.
4. Implement `bcrypt` (cost: 12).
5. Mount catch-all route at `src/app/api/auth/[...all]/route.ts`.
**Files involved:** `src/lib/redis.ts`, `src/lib/auth.ts`, `src/app/api/auth/[...all]/route.ts`
**Expected output:** Functional auth system that does not use TCP sockets.
**Verification method:** Attempt login via `/api/auth/sign-in`. Verify session persists in Upstash console.

**Step Number:** TASK-006
**Title:** [REFACTORED] Edge Middleware & Logging
**Objective:** Implement rate limiting (Upstash) and structured logging (Pino).
**Detailed instructions:**
1. Create `src/lib/logger.ts`: Configure Pino with JSON output and sensitive field redaction.
2. Update `src/proxy.ts`: Implement `@upstash/ratelimit`. Set 100 req/min for API, 10 req/min for Auth.
3. Implement `GET /api/health`: Return `{ data: { status: 'ok', db: 'ok', redis: 'ok' } }`.
4. Add `import 'server-only'` to `src/lib/db/index.ts`, `src/lib/env.ts`, `src/lib/logger.ts`.
**Files involved:** `src/proxy.ts`, `src/lib/logger.ts`, `src/app/api/health/route.ts`
**Expected output:** Global rate limiting at the edge.
**Verification method:** Blast `/api/health` with 110 requests; verify HTTP 429 on the last 10.

### Area: API Implementation (v1)

**Step Number:** TASK-008
**Title:** Projects API & RBAC
**Objective:** CRUD for projects with strict Owner/Admin isolation.
**Detailed instructions:**
1. `GET /api/v1/projects`: Return `{ data: Project[], meta: { total: number } }`.
2. `POST /api/v1/projects`: Transactional insert of project + user as `owner` in `project_members`.
3. `PATCH /api/v1/projects/[id]`: Restricted to `admin` or `owner`.
4. `DELETE /api/v1/projects/[id]`: Restricted to `owner`. Require `confirmationToken` (slug) in body.
**Files involved:** `src/app/api/v1/projects/route.ts`, `src/repositories/project-repository.ts`
**Expected output:** Projects API following the `{ data }` envelope standard.
**Verification method:** Call `PATCH` with a `member` session; verify HTTP 403.

**Step Number:** TASK-009
**Title:** Specifications API & Versioning
**Objective:** Manage spec versions and immutable content.
**Detailed instructions:**
1. `POST /api/v1/projects/[id]/specs`: Create spec + Version 1.
2. `POST /api/v1/specs/[id]/versions`: Create new version, increment `versionNumber`, set current plan to `abandoned`.
3. `GET /api/v1/specs/[id]/versions/[vId]`: Return markdown content.
**Files involved:** `src/app/api/v1/specs/[id]/versions/route.ts`
**Expected output:** A versioned specification system with automatic plan invalidation.
**Verification method:** Create a version and verify the existing plan's status transitions to `abandoned`.

**Step Number:** TASK-010
**Title:** [REFACTORED] Async Plan Generation
**Objective:** Trigger plan generation via Upstash QStash to avoid timeouts.
**Detailed instructions:**
1. `POST /api/v1/specs/[id]/plan/generate`: Update status to `pending_plan`, dispatch HTTP POST to QStash.
2. QStash calls back `/api/internal/plan-generate` (internal-only route).
3. `POST /api/v1/plans/[id]/approve`: Create `agent_session`, set status `executing`.
4. `POST /api/v1/plans/[id]/reject`: Require `notes` body.
**Files involved:** `src/app/api/v1/specs/[id]/plan/generate/route.ts`
**Expected output:** Generation endpoint returns `202 Accepted` immediately.
**Verification method:** Verify background job begins processing after the API response.

**Step Number:** TASK-011
**Title:** Tasks & Attempts API
**Objective:** Fetch logs and manage task lifecycle.
**Detailed instructions:**
1. `GET /api/v1/tasks/:id/attempts`: Return logs ordered by `seq` desc.
2. `POST /api/v1/tasks/:id/unblock`: Accept `humanContext` and set status to `todo`.
3. `POST /api/v1/tasks/:id/override`: Admin-only override of status.
**Files involved:** `src/app/api/v1/tasks/[id]/route.ts`
**Expected output:** Telemetry-rich task API.
**Verification method:** Assert `attempts` returns the correct JSONB log lines.

**Step Number:** TASK-012
**Title:** Sessions & Events API
**Objective:** Real-time monitoring of agent sessions.
**Detailed instructions:**
1. `GET /api/v1/sessions/:id`: Return status and task counts.
2. `GET /api/v1/sessions/:id/events`: Return structured `agent_events`.
3. `POST /api/v1/sessions/:id/cancel`: Transactional cancellation and task failure.
**Files involved:** `src/app/api/v1/sessions/[id]/route.ts`
**Expected output:** Monitoring API for Mission Control.
**Verification method:** Cancel a session and verify all `in_progress` tasks transition to `failed`.

**Step Number:** TASK-015
**Title:** [REFACTORED] Agent Protocol API
**Objective:** High-throughput endpoints for task acquisition.
**Detailed instructions:**
1. Implement hash-based `sdk_...` token validation in middleware.
2. `GET /api/v1/agent/tasks/next`: Transactional lock-and-fetch for the next available `todo` task.
3. `POST /api/v1/agent/tasks/[id]/complete`: Receive file diffs and token metrics. Remove from Redis active set.
4. `POST /api/v1/sessions/[id]/heartbeat`: Update `last_heartbeat_at` in DB.
**Files involved:** `src/app/api/v1/agent/tasks/next/route.ts`
**Expected output:** Concurrent-safe task queue.
**Verification method:** Simulate 2 agents calling `tasks/next` simultaneously; verify they get unique IDs.

### Area: UI & Design System

**Step Number:** TASK-017
**Title:** Design System & DAEMON Mascot
**Objective:** Implement core visual language and stateful mascot.
**Detailed instructions:**
1. Setup Tailwind v4 with CSS variables in `globals.css`.
2. Create `DaemonMascot` component: Support `idle`, `thinking`, `error`, `success`, `working`.
3. Implement `shadcn/ui` base theme.
**Files involved:** `src/app/globals.css`, `src/components/ui/daemon-mascot.tsx`
**Expected output:** Functional mascot component reacting to state.
**Verification method:** Render the mascot in a storybook or test page and verify all 5 expressions.

**Step Number:** TASK-018
**Title:** App Shell & Navigation
**Objective:** Persistent sidebar and header with project switcher.
**Detailed instructions:**
1. Implement Sidebar with active-nav highlighting.
2. Implement Header with Project Switcher (popover).
3. Implement Notification Bell in header.
**Files involved:** `src/components/shell/sidebar.tsx`, `src/components/shell/header.tsx`
**Expected output:** Navigable application framework.
**Verification method:** Click between Projects and verify the active state updates correctly.

**Step Number:** TASK-030
**Title:** [REFACTORED] Secure Spec Editor
**Objective:** Markdown editor with mandatory XSS sanitization.
**Detailed instructions:**
1. Build split-pane editor using `@uiw/react-codemirror`.
2. Use `isomorphic-dompurify` to sanitize the preview pane before rendering.
3. Implement `beforeunload` if `isDirty` is true.
**Files involved:** `src/components/specs/spec-editor.tsx`
**Expected output:** A preview pane that strips `<script>` and `onerror` attributes.
**Verification method:** Input `<img src=x onerror=alert(1)>` and verify no alert fires.

**Step Number:** TASK-033
**Title:** Plan Review Tab
**Objective:** Interactive approval workflow.
**Detailed instructions:**
1. Render architecture decisions and task dependencies.
2. Poll `/api/v1/specs/[id]/plan` every 3s during `pending_plan`.
3. Implement `Approve`, `Reject`, and `Request Changes` modals.
**Files involved:** `src/components/specs/plan-tab.tsx`
**Expected output:** Live-updating plan generation UI.
**Verification method:** Verify the status bar transitions from "Generating" to "Review Required" automatically.

**Step Number:** TASK-044
**Title:** Session Detail & Heartbeat Monitoring
**Objective:** Real-time session tracking with connectivity guards.
**Detailed instructions:**
1. Show live timer and terminal log (ansi-to-html).
2. Display a yellow banner if `last_heartbeat_at` is >60s old.
3. Auto-transition UI to "Failed" if heartbeat is >5min old.
**Files involved:** `src/app/sessions/[id]/page.tsx`
**Expected output:** Visual confirmation of agent health.
**Verification method:** Stop the agent heartbeat and verify the yellow banner appears in the UI after 60s.

### Area: Settings & Management

**Step Number:** TASK-049
**Title:** Team Management UI
**Objective:** Manage project members and invitations.
**Detailed instructions:**
1. Build member table with status badges (`active`, `invited`, `suspended`).
2. Implement Role Dropdown (restricted by requester's role).
3. Implement Invite Form (email + role).
**Files involved:** `src/app/settings/team/page.tsx`
**Expected output:** Project governance UI.
**Verification method:** Invite a user and verify the "Invited" row appears in the table.

**Step Number:** TASK-053
**Title:** Danger Zone
**Objective:** Destructive actions with confirmation guards.
**Detailed instructions:**
1. Implement "Abandon All Sessions", "Reset Agent Config", "Delete Project".
2. Use `AlertDialog` with slug-typing confirmation for Project Deletion.
**Files involved:** `src/app/settings/danger-zone/page.tsx`
**Expected output:** Secure destruction controls.
**Verification method:** Attempt Project Deletion; verify the button remains disabled until the exact slug is typed.

**Step Number:** TASK-062
**Title:** SYSTEMS Bar Health
**Objective:** Sidebar footer icons reflecting system availability.
**Detailed instructions:**
1. Poll `/api/health` every 10s.
2. Map statuses to 4 icons: `GIT` (GitHub), `API` (Next.js), `AGT` (Agent Heartbeat), `PG` (Database).
3. Green = OK, Red = Error, Amber = Late heartbeat.
**Files involved:** `src/components/layout/systems-bar.tsx`
**Expected output:** Real-time system health dashboard in the sidebar.
**Verification method:** Disconnect the local database and verify the `PG` icon turns red within 10s.

**Step Number:** TASK-026
**Title:** Mission Control Dashboard
**Objective:** Live dashboard for active sessions and blocked tasks.
**Detailed instructions:**
1. Implement "Active Session" widget with progress bar and live terminal pane.
2. Implement "Needs Attention" banner for blocked tasks.
3. Poll `/api/v1/sessions` and `/api/v1/tasks?status=blocked` every 3s.
**Files involved:** `src/app/page.tsx`, `src/components/dashboard/session-widget.tsx`
**Expected output:** A "Mission Control" center for the human operator.
**Verification method:** Start a session and verify it appears on the dashboard with a live timer.

**Step Number:** TASK-045
**Title:** Notifications System
**Objective:** In-app and email notifications for critical events.
**Detailed instructions:**
1. Implement the notification popover (bell icon) with recent events.
2. Build the `/notifications` page with `Mark all read` functionality.
3. Ensure "Plan Generated" and "Task Blocked" trigger both in-app and email (Resend).
**Files involved:** `src/components/shell/header.tsx`, `src/app/notifications/page.tsx`
**Expected output:** Integrated notification loop.
**Verification method:** Manually trigger a "Task Blocked" event and verify the bell icon badge increments.

**Step Number:** TASK-051
**Title:** Integrations UI (GitHub & Slack)
**Objective:** Connect project to external collaboration tools.
**Detailed instructions:**
1. Implement GitHub OAuth connection flow.
2. Implement Slack channel selector and event toggles.
3. Reveal the GitHub Webhook URL for the user to copy into their repository settings.
**Files involved:** `src/app/settings/integrations/page.tsx`
**Expected output:** Self-serve integration management.
**Verification method:** Successfully connect a GitHub account and verify the Webhook URL is displayed.

**Step Number:** TASK-058
**Title:** GitHub Integration Backend
**Objective:** Enable the agent to perform git operations securely.
**Detailed instructions:**
1. Create `src/lib/github.ts` to wrap Octokit for branch creation and PR opening.
2. Retrieve `GITHUB_TOKEN` from `agent_config` securely.
3. Implement `PR Auto-create` logic upon session completion.
**Files involved:** `src/lib/github.ts`
**Expected output:** Autonomous git workflow.
**Verification method:** Verify the agent can successfully create a branch `daemon/spec-x` on the target repository.

---

## Phase 3 — Testing & Quality Gates

### 3a. Mandatory CI Checks
- `pnpm drizzle-kit check`: Verify no schema drift without migrations.
- `pnpm lint`: Enforce no `process.env` access (must use `@/lib/env`).
- `pnpm test`: Execute Vitest suite (35+ tests).
- `pnpm playwright test`: Execute E2E flow (Login -> Create Spec -> Approve Plan).

### 3b. Final Verification
1. Full end-to-end flow execution.
2. RBAC boundary testing (Viewer cannot Approve).
3. Sanitization audit (No XSS in Spec Preview or Task Logs).
4. Performance audit (All GET endpoints <300ms p95).
