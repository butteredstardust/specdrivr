# Spec-Drivr Development Plan v3

**Last Updated:** March 2026
**Current Status:** 80% Complete — Core infrastructure & Agent Control APIs operational
**Estimate Baseline:** Mid-senior full-stack developer, ±50%
**Key additions in v3:** Git webhook system, parallel execution waves, verify conditions per task, project state memory, codebase analysis, pause/resume, model routing, quick tasks, exhaustive mission context

---

## Resolved Design Decisions

| Question                           | Decision                                                                                               | Rationale                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Should tasks have effort points?   | **Yes** — `estimate_hours` (nullable int) on tasks                                                     | Low schema cost, useful for agent workload planning              |
| Do we need task comments?          | **No for MVP** — use agent_logs with `task_id`                                                         | Avoids a new table; revisit post-MVP                             |
| Multiple active specs per project? | **No** — single active spec via `is_active` boolean                                                    | Simplifies mission endpoint; immutable rows handle history       |
| RBAC?                              | **Yes, schema now; UI enforced in Phase A.7** — `role` on users                                        | Agents must be scoped before autonomous project creation ships   |
| Agent auto-assign tasks?           | **No for MVP** — agents pick next unblocked task by priority                                           | Add `assigned_to` post-MVP if needed                             |
| Git integration method?            | **Webhooks** — agent calls `POST /api/webhooks/git` after each task                                    | Decoupled, auditable, works with any git host                    |
| Git branching strategy?            | **Per-project configurable** — `none`, `per-phase`, or `per-milestone` stored in `projects.git_config` | Mirrors GSD approach; default `none` (commits to current branch) |
| Parallel task execution?           | **Yes** — `GET /api/agent/wave` returns all currently unblocked tasks                                  | Single-task polling is a bottleneck; waves enable parallelism    |
| Quick/ad-hoc tasks?                | **Yes** — tasks with `plan_id = NULL` attached directly to project                                     | Phase structure is optional for small fixes                      |
| Pause/resume?                      | **Yes** — `POST /api/agent/pause` writes `resume_context` JSONB to task                                | Prevents orphaned state when agent stops mid-task                |
| Model routing?                     | **Yes** — mission response includes `recommended_model` hint based on task type                        | Cheap tasks don't need Opus                                      |
| Brownfield analysis?               | **Yes** — auto-generated as first task when `base_path` is set                                         | Agent reads codebase conventions before planning                 |
| Auth provider?                     | **NextAuth with credentials-only for MVP** — no OAuth until post-MVP                                   | Minimizes setup; easy to add GitHub/Google OAuth later           |
| Context rot mitigation?            | **Mission endpoint must be exhaustive** — returns full context, not just next task                     | Agent must never need a second call to start work                |

---

## Architecture Decisions

| Decision                                         | Reasoning                                                             | Trade-off                                                       |
| ------------------------------------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------- |
| Next.js 14 App Router                            | Modern React patterns, better DX                                      | Slightly larger bundle                                          |
| Drizzle ORM                                      | Type-safe, lightweight                                                | Less ecosystem than Prisma                                      |
| PostgreSQL 16                                    | State machine reliability, JSONB flexibility                          | More setup than SQLite                                          |
| Tailwind + Shadcn/UI                             | Utility-first, rapid iteration                                        | Opinionated defaults                                            |
| Server Actions + API Routes                      | Server actions for UI, API routes for agents                          | Dual patterns, optimal per caller                               |
| Human-Agent API parity                           | Same POST endpoints for humans and agents                             | Agent endpoints must be robust enough for UI                    |
| Immutable spec versioning                        | New row per save, `is_active` toggle                                  | Audit trail; no destructive updates                             |
| Static `X-Agent-Token` → per-project scoped JWTs | MVP simplicity → Phase B.5 upgrade                                    | Must upgrade before multi-agent                                 |
| Vitest + Playwright                              | Native ESM, fast, integrates with Next.js                             | Playwright E2E adds overhead but catches regressions            |
| Git webhooks (not direct git CLI calls)          | Decoupled; Spec-Drivr doesn't own the agent's filesystem              | Agent calls webhook; Spec-Drivr records commit SHA and metadata |
| Parallel task waves                              | Agents capable of parallelism are bottlenecked by single-task polling | Wave endpoint computes dependency graph server-side             |
| Project state JSONB                              | Cross-session memory for decisions, blockers, context                 | Replaces implicit agent knowledge lost between sessions         |

---

## Complete Database Schema (v3 — apply all before any Phase A work)

### Existing Tables (no changes needed)
- `projects` — metadata, agent state fields
- `specifications` — versioned markdown, `is_active`
- `plans` — JSON architecture decisions, status lifecycle
- `tasks` — implementation units with retry, dependency, notes
- `test_results` — verification logs
- `agent_logs` — execution logs with `project_id`
- `users` — accounts

### All Schema Additions

```sql
-- ============================================================
-- PROJECTS: extended agent tracking, git config, project state
-- ============================================================

ALTER TABLE projects ADD COLUMN agent_last_heartbeat_at TIMESTAMP WITH TIME ZONE;

-- Cross-session memory: decisions, blockers, current position
ALTER TABLE projects ADD COLUMN state JSONB DEFAULT '{
  "decisions": [],
  "blockers": [],
  "last_position": null,
  "context_summary": null
}'::jsonb;

-- Git integration configuration per project
ALTER TABLE projects ADD COLUMN git_config JSONB DEFAULT '{
  "enabled": false,
  "provider": "github",
  "repo_url": null,
  "default_branch": "main",
  "branching_strategy": "none",
  "phase_branch_template": "specdriver/phase-{phase_id}-{slug}",
  "milestone_branch_template": "specdriver/{milestone}-{slug}",
  "webhook_secret": null,
  "commit_message_template": "{type}({plan_id}-{task_id}): {description}"
}'::jsonb;

-- Attribution
ALTER TABLE projects ADD COLUMN created_by_user_id INTEGER REFERENCES users(id);

-- ============================================================
-- SPECIFICATIONS: optimistic locking, attribution
-- ============================================================

ALTER TABLE specifications ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE specifications ADD COLUMN created_by_user_id INTEGER REFERENCES users(id);

-- ============================================================
-- PLANS: attribution, phase intent capture (discuss-phase equivalent)
-- ============================================================

ALTER TABLE plans ADD COLUMN created_by_user_id INTEGER REFERENCES users(id);

-- Human-authored intent captured before agent starts planning
-- Free text: "I want card layout, infinite scroll, no modals, keep it minimal"
ALTER TABLE plans ADD COLUMN intent TEXT;

-- Phase label for multi-milestone projects (e.g. "Phase 1", "Auth Milestone")
ALTER TABLE plans ADD COLUMN phase_label VARCHAR(100);

-- ============================================================
-- TASKS: verification conditions, effort, model hint, pause state, quick mode
-- ============================================================

ALTER TABLE tasks ADD COLUMN created_by_user_id INTEGER REFERENCES users(id);
ALTER TABLE tasks ADD COLUMN estimate_hours INTEGER;

-- Machine-checkable acceptance condition (shell command or curl call)
-- e.g. "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health | grep 200"
ALTER TABLE tasks ADD COLUMN verify_command TEXT;

-- Human-readable success definition
-- e.g. "Valid credentials return 200 + Set-Cookie header; invalid return 401"
ALTER TABLE tasks ADD COLUMN done_criteria TEXT;

-- Pause/resume: written by POST /api/agent/pause, read by GET /api/agent/mission
ALTER TABLE tasks ADD COLUMN resume_context JSONB;

-- Status extension: add 'paused' to workflow
-- Valid statuses: todo | in_progress | paused | blocked | done | skipped
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('todo', 'in_progress', 'paused', 'blocked', 'done', 'skipped'));

-- Model routing hint: 'haiku' | 'sonnet' | 'opus'
-- Set by planner based on task complexity; returned in mission/wave response
ALTER TABLE tasks ADD COLUMN recommended_model VARCHAR(20) DEFAULT 'sonnet'
  CHECK (recommended_model IN ('haiku', 'sonnet', 'opus'));

-- Quick mode: plan_id = NULL means task is ad-hoc, attached directly to project
-- project_id is already on tasks; make plan_id nullable if not already
ALTER TABLE tasks ALTER COLUMN plan_id DROP NOT NULL;

-- ============================================================
-- AGENT LOGS: distinguish human-entered from agent-generated
-- ============================================================

ALTER TABLE agent_logs ADD COLUMN is_internal BOOLEAN DEFAULT false;

-- ============================================================
-- USERS: roles for RBAC
-- ============================================================

ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'developer'
  CHECK (role IN ('admin', 'developer', 'viewer'));

-- ============================================================
-- NEW TABLE: git_commits — audit trail for all agent git activity
-- ============================================================

CREATE TABLE git_commits (
  id          SERIAL PRIMARY KEY,
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id     INTEGER REFERENCES tasks(id),
  plan_id     INTEGER REFERENCES plans(id),
  commit_sha  VARCHAR(40) NOT NULL,
  branch      VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  author      VARCHAR(255),        -- agent token name or username
  committed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata    JSONB                -- files changed, lines added/removed, etc.
);

-- ============================================================
-- NEW TABLE: agent_tokens — per-project scoped tokens (Phase B.5)
-- ============================================================

CREATE TABLE agent_tokens (
  id           SERIAL PRIMARY KEY,
  project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name         VARCHAR(100) NOT NULL,   -- e.g. "claude-code-agent-1"
  token_hash   VARCHAR(255) NOT NULL UNIQUE,
  created_by   INTEGER REFERENCES users(id),
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  revoked_at   TIMESTAMP WITH TIME ZONE,
  preferred_model VARCHAR(20) DEFAULT 'sonnet'
    CHECK (preferred_model IN ('haiku', 'sonnet', 'opus'))
);

-- ============================================================
-- NEW TABLE: api_request_logs — agent API observability
-- ============================================================

CREATE TABLE api_request_logs (
  id          SERIAL PRIMARY KEY,
  token_id    INTEGER REFERENCES agent_tokens(id),
  endpoint    VARCHAR(255) NOT NULL,
  method      VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  project_id  INTEGER REFERENCES projects(id),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX idx_tasks_project_status    ON tasks (project_id, status);
CREATE INDEX idx_tasks_plan_status       ON tasks (plan_id, status);
CREATE INDEX idx_tasks_dependency        ON tasks (dependency_task_id);
CREATE INDEX idx_agent_logs_project      ON agent_logs (project_id);
CREATE INDEX idx_agent_logs_task         ON agent_logs (task_id);
CREATE INDEX idx_specifications_project  ON specifications (project_id);
CREATE INDEX idx_test_results_task       ON test_results (task_id);
CREATE INDEX idx_git_commits_project     ON git_commits (project_id);
CREATE INDEX idx_git_commits_task        ON git_commits (task_id);
CREATE INDEX idx_api_request_logs_token  ON api_request_logs (token_id);
CREATE INDEX idx_agent_tokens_project    ON agent_tokens (project_id);
```

> All additions are nullable or have defaults. No existing rows break. Run via:
> `npm run db:generate && npm run db:push`

---

## What Is Complete ✅

- Next.js 14, App Router, TypeScript strict mode, PostgreSQL 16, Drizzle ORM, Tailwind + Shadcn/UI
- `GET /api/agent/mission`, `POST /api/agent/plans`, `PATCH /api/agent/tasks/:id`, `POST /api/agent/verify`, `POST /api/agent/logs`
- `X-Agent-Token` middleware + Zod validation on all endpoints
- Project-level agent controls: start, pause, stop, retry, status
- Task-level controls: retry, skip
- Drag-and-drop Kanban, project sidebar, project detail pages, spec viewer, create project dialog
- Test results panel (placeholder), agent logs panel (placeholder)
- `seed-simple.sql`, `seed-demo.sql`, `seed-onboarding.sql`

---

## What Is Incomplete ❌

- Human feature parity (task creation, plan editor, spec editor, test logging, auth) → Phase A
- Exhaustive mission endpoint, parallel wave endpoint → Phase A.1 audit + Phase B
- Git webhook system → Phase G
- Project state memory, pause/resume, model routing, brownfield analysis → Phase B
- Agent self-bootstrapping APIs → Phase B
- Per-project scoped tokens → Phase B.5
- Quick mode (ad-hoc tasks) → Phase A.2
- Testing infrastructure → Phase T (runs alongside all phases)
- Quality hardening → Phase D

---

## Phase A: Human Feature Parity (~16 hours)

### A.1 Schema Migration + Mission Endpoint Audit

**Schema:**
- Run all SQL from the schema section above
- `npm run db:generate && npm run db:push`
- Effort: 1 hour | Priority: P0 | Blocks: everything

**Mission endpoint audit:**
`GET /api/agent/mission?project_id=X` must return a single self-contained response. Agent must be able to start work immediately with zero follow-up calls. Audit and update the response shape to include:

```typescript
// src/app/api/agent/mission/route.ts — required response shape
{
  project: {
    id, name, mission, description, tech_stack, base_path, instructions,
    state: { decisions, blockers, last_position, context_summary }
  },
  specification: {
    id, content, version, updated_at
  },
  active_plan: {
    id, phase_label, intent, architecture_decisions, status
  },
  next_task: {
    id, description, priority, files_involved, estimate_hours,
    verify_command, done_criteria, recommended_model,
    dependency_task_id, retry_count, resume_context,
    test_results: [ { success, logs, created_at } ],  // last 3 results for this task
    related_logs: [ { level, message, created_at } ]  // last 5 agent logs for this task
  },
  // Wave-aware: all currently unblocked tasks (for parallel agents)
  unblocked_tasks: [ { id, description, priority, recommended_model, estimate_hours } ]
}
```

If no active plan, no active spec, or no unblocked tasks, return explicit `null` for each field with a `reason` string. Never return a 200 with ambiguous empty data.

- Effort: 1.5 hours | Priority: P0

### A.2 Task Creation UI (including Quick Mode)

- [ ] `src/components/create-task-dialog.tsx`
  - Fields: description (required), priority 1–5 (required), files_involved (tag input, comma-separated), estimate_hours (optional int), dependency_task_id (searchable dropdown of tasks in same plan), verify_command (optional text), done_criteria (optional text), recommended_model (select: haiku/sonnet/opus, default sonnet)
  - Toggle: "Quick task" — when enabled, plan_id is set to NULL and task is attached directly to project_id
  - Zod validation with inline error display (not just toast)
  - Submit to `actions.createTask()` server action
- [ ] "Create Task" button in Kanban board header (always visible)
- [ ] "Quick Task" shortcut button in project sidebar (sets quick mode toggle by default)
- [ ] Quick tasks appear in their own Kanban column: "Ad Hoc"
- [ ] `src/lib/actions.ts` — `createTask()` server action; validates plan_id OR project_id is set
- [ ] Success toast + optimistic Kanban refresh (add card immediately, revert on error)
- Effort: 3 hours | Priority: P0 | Dependencies: A.1

### A.3 Plan Editor UI (including Intent Capture)

- [ ] `src/components/create-plan-dialog.tsx`
  - Step 1 — Intent: free-text textarea "Describe how you want this phase built" → saves to `plans.intent`
  - Step 2 — Architecture: structured JSON editor for `architecture_decisions` with schema validation and formatted preview
  - Step 3 — Review: shows intent + decisions side by side before submit
  - `phase_label` field: text input, e.g. "Phase 1 — Auth"
  - Calls `POST /api/agent/plans`
- [ ] "Create Plan" button on project detail page
- [ ] Active plan card on project detail: shows `phase_label`, `intent`, summarised `architecture_decisions`, status badge
- Effort: 3 hours | Priority: P0 | Dependencies: A.1

### A.4 Specification Editor

- [ ] `src/components/spec-editor.tsx`
  - Markdown editor: use `@uiw/react-md-editor` (MIT licensed, no SSR issues with `dynamic` import)
  - Live split-pane preview
  - Save behaviour: creates new `specifications` row (`is_active = true`), marks previous row `is_active = false` — never mutates existing rows
  - Optimistic lock: on save, send `{ content, expected_updated_at }` to server action; server compares `updated_at` from DB; if mismatch, return `409 Conflict` with diff of conflicting changes surfaced in UI
  - Version history panel: chronological list of all spec versions, each showing `created_at`, word count delta, and "View" button (read-only modal)
- [ ] Integrate into `specification-viewer` — toggle between view mode and edit mode
- Effort: 4 hours | Priority: P0 | Dependencies: A.1

### A.5 Test Results Logging UI

- [ ] "Log Test Result" button on every task card (visible in Kanban and task detail modal)
- [ ] `src/components/log-test-result-dialog.tsx`
  - Fields: success (toggle: Pass/Fail), logs (textarea), task_id (pre-filled from context)
  - If task has `verify_command`: show it read-only; add "Copy command" button for convenience
  - Calls `POST /api/agent/verify`
- [ ] `test-results-panel.tsx`: query `test_results` table; display chronological list per task with pass/fail badge, timestamp, log preview (expandable)
- [ ] Task cards show latest test result badge: green check, red X, or grey dash (no results yet)
- Effort: 2.5 hours | Priority: P0 | Dependencies: A.2

### A.6 Manual Agent Log Entry UI

- [ ] "Add Log Entry" button in agent-logs panel header
- [ ] `src/components/add-log-dialog.tsx`
  - Fields: level (select: info/warn/error/debug), message (required textarea), task_id (optional searchable select), context (optional JSON textarea with validation)
  - Sets `is_internal = true`
  - Calls `POST /api/agent/logs`
- [ ] `agent-logs.tsx` filter bar: "All" | "Agent" | "Internal" toggle, plus level filter checkboxes
- [ ] Pagination: 50 logs per page, load-more button (not infinite scroll — avoids scroll position jumps)
- Effort: 2 hours | Priority: P1 | Dependencies: A.1

### A.7 Authentication + RBAC

- [ ] Install `next-auth@^5` (Auth.js) with credentials provider
- [ ] `src/app/auth/login/page.tsx` — login form: username + password, Zod validation, error states inline
- [ ] NextAuth config: `src/lib/auth.ts` — credentials provider validates against `users.password_hash` (bcrypt)
- [ ] Middleware `src/middleware.ts` — protect all `/projects/*` routes; redirect to `/auth/login` if no session
- [ ] Session context: `src/components/user-header.tsx` — show avatar, username, role badge, logout button
- [ ] All server actions and API route handlers read session and write `created_by_user_id`
- [ ] Role enforcement in middleware:
  - `viewer`: GET requests only; all mutations return 403
  - `developer`: full CRUD on projects/specs/plans/tasks they didn't create + their own; cannot manage users
  - `admin`: full access + user management page
- [ ] `src/app/admin/users/page.tsx` — list users, change role, deactivate account (admin only)
- [ ] UI differentiation in Kanban and logs: label actions as avatar + name vs robot icon + "Agent"
- Effort: 5 hours | Priority: P1 | Dependencies: A.1

---

## Phase G: Git Webhook System (~7 hours)

This is a standalone phase because git integration touches the schema, a new API surface, and UI. It can run in parallel with Phase B.

### G.1 Git Webhook Inbound Endpoint

Agents call this endpoint immediately after committing. Spec-Drivr does not make git calls itself — it is the receiver, not the initiator.

```typescript
// POST /api/webhooks/git
// Called by: the agent (Claude Code, OpenCode, etc.) after every atomic task commit
// Auth: X-Agent-Token (same as other agent endpoints)

// Request body:
{
  project_id: number,
  task_id: number | null,        // null for non-task commits (e.g. chore: update deps)
  plan_id: number | null,
  commit_sha: string,            // 40-char SHA
  branch: string,                // e.g. "main" or "specdriver/phase-2-auth"
  message: string,               // full commit message
  author: string,                // agent token name
  committed_at: string,          // ISO 8601
  metadata: {
    files_changed: string[],
    lines_added: number,
    lines_removed: number,
    repo_url: string             // e.g. "https://github.com/org/repo"
  }
}

// Response:
{ ok: true, commit_id: number }
```

- [ ] `src/app/api/webhooks/git/route.ts` — validate body with Zod; insert into `git_commits` table; update `tasks.notes` with commit SHA if `task_id` provided
- [ ] Rate limit: 60 req/min per token (commits should not exceed this in normal use)
- [ ] Idempotent: if `commit_sha` already exists for the project, return `200` without reinserting
- Effort: 2 hours | Priority: P0

### G.2 Commit Message Enforcement

The agent is responsible for generating commit messages, but Spec-Drivr provides the template:

- `git_config.commit_message_template` default: `"{type}({plan_id}-{task_id}): {description}"`
- Template variables: `{type}` (feat/fix/chore/docs/test), `{plan_id}`, `{task_id}`, `{description}` (first 72 chars of task.description), `{phase_label}`
- `GET /api/agent/mission` response includes resolved `commit_message_template` with plan_id and task_id pre-filled — agent only needs to choose `{type}` and can use `{description}` verbatim
- Effort: 0.5 hours | Priority: P0 | Dependencies: G.1

### G.3 Branching Strategy Enforcement

Branching strategy is stored in `projects.git_config.branching_strategy`. Mission endpoint returns the current branch the agent should be on:

```typescript
// Added to GET /api/agent/mission response:
git: {
  current_branch: string,         // computed from strategy + current plan/phase
  commit_message_template: string, // pre-filled with plan_id, task_id
  webhook_url: string,            // absolute URL to POST /api/webhooks/git
  strategy: 'none' | 'per-phase' | 'per-milestone'
}
```

Strategy behaviour:
- `none` — agent commits to default branch; `current_branch` = `git_config.default_branch`
- `per-phase` — branch named from `phase_branch_template`; agent creates it if missing; merged at phase completion via `POST /api/agent/phase-complete`
- `per-milestone` — single branch per milestone; merged at milestone completion

- [ ] Add `POST /api/agent/phase-complete` endpoint: marks all tasks in plan as done, triggers merge instruction in response (merge commit SHA expected via webhook within 5 min, or warning logged)
- Effort: 2 hours | Priority: P1 | Dependencies: G.1

### G.4 Git Commit UI in Spec-Drivr

- [ ] New tab on project detail page: "Commits" — lists `git_commits` rows in reverse chronological order
  - Each row: commit SHA (first 7 chars, links to `metadata.repo_url/commit/{sha}` if set), branch, message, author (agent name or user), timestamp, task link
  - Filter by: branch, plan, date range
- [ ] Task detail modal: "Commits" section — lists all commits for that task_id
- [ ] Kanban task card: small git icon + commit count badge if task has commits
- Effort: 2.5 hours | Priority: P1 | Dependencies: G.1

### G.5 Git Config UI

- [ ] `src/components/git-config-panel.tsx` on project settings page
  - Toggle: Enable Git Integration
  - Fields: provider (GitHub/GitLab/Bitbucket/Other), repo URL, default branch, branching strategy (radio: none/per-phase/per-milestone), commit message template (editable with variable hints), webhook secret (generated, copyable)
  - Shows: webhook URL to configure in their git provider's settings
- Effort: 1 hour | Priority: P2 | Dependencies: G.1

---

## Phase B: Agent Autonomy + Intelligence (~12 hours)

All endpoints in this phase use Drizzle transactions. Partial failure rolls back completely.

### B.1 Agent Project Creation API

```typescript
// POST /api/agent/projects
// Auth: X-Agent-Token (global token; per-project tokens created after project exists)

// Request:
{
  name: string,
  mission: string,           // 1-2 sentence purpose statement
  description: string,
  tech_stack: string[],      // e.g. ["Next.js 14", "PostgreSQL", "TypeScript"]
  instructions: string,      // agent-specific guidance (code style, patterns to follow)
  base_path: string,         // absolute path to codebase root on agent's filesystem
  git_config?: {             // optional; can be set later via PATCH
    enabled: boolean,
    repo_url: string,
    default_branch: string,
    branching_strategy: 'none' | 'per-phase' | 'per-milestone'
  }
}

// Response:
{
  project_id: number,
  specification_id: number,
  plan_id: number,
  webhook_url: string,       // pre-computed URL for git webhook
  mission_url: string        // URL agent should poll: GET /api/agent/mission?project_id=X
}
```

- [ ] Transaction: create project → create empty specification (content = mission as markdown) → create empty plan (status = 'draft')
- [ ] If `base_path` is set: automatically create first task: `{ description: "Analyse codebase at {base_path}: extract stack, conventions, patterns, and concerns. Write findings into specification.content under heading '## Codebase Analysis'.", priority: 1, recommended_model: 'sonnet', verify_command: "curl -s http://localhost:3000/api/projects/{project_id} | jq '.specification.content | contains(\"Codebase Analysis\")'", done_criteria: "Specification contains a Codebase Analysis section with stack, conventions, and at least 3 identified patterns" }`
- [ ] Rate limit: 10 project creations per hour per token
- Effort: 2.5 hours | Priority: P0 | Dependencies: schema

### B.2 Agent Project Configuration API

```typescript
// PATCH /api/agent/projects/:id
{
  mission?: string,
  description?: string,
  tech_stack?: string[],
  instructions?: string,
  specification_content?: string,  // if provided: creates new spec version, marks previous inactive
  state?: Partial<ProjectState>    // merge-patches existing state JSONB (not replace)
}
```

- `state` patch uses PostgreSQL `jsonb_set` to merge — agent can update `decisions` array without knowing the full state object
- Updating `specification_content` follows the same optimistic lock as the UI editor: request must include `expected_spec_updated_at`; 409 on mismatch
- Effort: 1.5 hours | Priority: P0 | Dependencies: B.1

### B.3 Agent Task Creation API (Bulk)

```typescript
// POST /api/agent/tasks
{
  plan_id: number | null,  // null for quick/ad-hoc tasks
  project_id: number,
  tasks: [{
    description: string,
    priority: number,          // 1–5
    files_involved: string[],
    dependency_task_id?: number,
    estimate_hours?: number,
    verify_command?: string,
    done_criteria?: string,
    recommended_model?: 'haiku' | 'sonnet' | 'opus'
  }]
}

// Response:
{ task_ids: number[], tasks: Task[] }
```

- Validates: plan exists and belongs to the agent's project; all `dependency_task_id` values belong to the same plan
- Inserts as a single transaction — either all tasks are created or none
- Effort: 1.5 hours | Priority: P0

### B.4 Parallel Wave Endpoint

Single-task polling bottlenecks agents capable of parallelism. This endpoint computes which tasks can run simultaneously.

```typescript
// GET /api/agent/wave?project_id=X&plan_id=Y
// Returns all tasks where:
//   status = 'todo'
//   AND (dependency_task_id IS NULL OR dependency.status = 'done')
// Ordered by priority ASC

{
  wave_id: string,           // hash of returned task IDs — use to detect wave changes
  tasks: [{
    id, description, priority, files_involved,
    verify_command, done_criteria,
    recommended_model, estimate_hours,
    resume_context              // non-null if previously paused
  }],
  wave_complete: boolean,    // true if all tasks in plan are done
  plan_complete: boolean
}
```

- Agent claims a task before starting via `PATCH /api/agent/tasks/:id` (`status: 'in_progress'`) — this is the existing endpoint, no change needed
- If two agents try to claim the same task simultaneously, the second `PATCH` gets a `409 Conflict` (add `WHERE status = 'todo'` check in the update query)
- Effort: 2 hours | Priority: P1 | Dependencies: schema

### B.5 Agent Heartbeat + Stale Detection

```typescript
// POST /api/agent/heartbeat
{ project_id: number, task_id?: number }

// Response:
{ ok: true, project_status: string }
```

- Updates `projects.agent_last_heartbeat_at = NOW()`
- Agent sends this every 30 seconds while running
- `GET /api/projects/:id/agent/status` response includes:
  ```typescript
  {
    status: string,
    is_stale: boolean,          // true if last_heartbeat_at > 2 minutes ago
    stale_since?: string,       // ISO timestamp
    uptime_seconds: number
  }
  ```
- UI: project header shows "Agent unresponsive — last seen X min ago" warning badge when `is_stale = true`
- Effort: 1 hour | Priority: P1

### B.6 Pause/Resume

```typescript
// POST /api/agent/pause
{
  project_id: number,
  task_id: number,
  resume_context: {
    completed_steps: string[],   // what was done before pause
    remaining_steps: string[],   // what still needs doing
    files_modified: string[],    // files already changed
    notes: string                // anything the next agent instance needs to know
  }
}
```

- Sets `tasks.status = 'paused'`, writes `resume_context` JSONB
- `GET /api/agent/mission` and `GET /api/agent/wave` return paused tasks with `resume_context` populated — agent reads this before continuing
- `POST /api/agent/resume` (body: `{ task_id }`) sets status back to `in_progress`, clears `resume_context` once agent confirms it has read it
- UI: paused tasks show a "Paused" badge in Kanban with resume_context preview on hover
- Effort: 1.5 hours | Priority: P1

### B.7 Per-Project Scoped Agent Tokens

- [ ] `agent_tokens` table already created in schema above
- [ ] `POST /api/projects/:id/tokens` — generate new scoped token (admin or developer only)
  - Body: `{ name: string, preferred_model?: string }`
  - Response: `{ token: string, id: number }` — raw token shown once only; store `bcrypt(token)` in DB
- [ ] `DELETE /api/projects/:id/tokens/:token_id` — revoke token (sets `revoked_at`)
- [ ] Auth middleware updated: check `agent_tokens` table first; if match, scope request to `token.project_id`; reject if token tries to access a different project
- [ ] Global `X-Agent-Token` env var still works for bootstrapping (creating new projects), but cannot access existing project data once scoped tokens exist for that project
- [ ] UI: token management panel in project settings — list tokens (name, last_used_at, created_by, preferred_model), generate button, revoke button
- Effort: 2 hours | Priority: P1 | Dependencies: A.7

### B.8 Model Routing

- `GET /api/agent/mission` and `GET /api/agent/wave` already include `recommended_model` per task (from `tasks.recommended_model`)
- Agent token's `preferred_model` field acts as a floor: if token is configured for `haiku`, it will not be sent `opus` tasks; those tasks are returned without a model override (agent uses its own default)
- `POST /api/agent/projects` and `POST /api/agent/tasks` auto-set `recommended_model` based on heuristics:
  - Task description contains "analyse", "design", "architect", "research" → `opus`
  - Task description contains "test", "verify", "check", "lint" → `haiku`
  - All others → `sonnet`
- These are hints only — agent may ignore them
- Effort: 0.5 hours | Priority: P2 | Dependencies: B.3

---

## Phase T: Testing (parallel with all phases — write tests as features land)

### T.1 Setup

```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event
npm install -D @playwright/test
npm install -D @faker-js/faker  # for test data generation
```

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: { lines: 80, functions: 80, branches: 75 }
    }
  }
})
```

**Test database:**
```bash
# .env.test
TEST_DATABASE_URL=postgresql://localhost:5432/specdriver_test
```

`src/__tests__/setup.ts` — before each integration test, wrap in a transaction and rollback after:
```typescript
import { db } from '@/lib/db'
import { beforeEach, afterEach } from 'vitest'

let tx: any
beforeEach(async () => { tx = await db.transaction() })
afterEach(async () => { await tx.rollback() })
```

**Scripts in package.json:**
```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:all": "npm run test && npm run test:e2e"
}
```

**Directory structure:**
```
src/__tests__/
  setup.ts
  unit/
    state-machine.test.ts
    zod-schemas.test.ts
    model-routing.test.ts
    commit-message.test.ts
  integration/
    agent-mission.test.ts
    agent-tasks.test.ts
    agent-projects.test.ts
    agent-wave.test.ts
    git-webhook.test.ts
    spec-versioning.test.ts
    auth.test.ts
  components/
    kanban-board.test.tsx
    create-task-dialog.test.tsx
    spec-editor.test.tsx
    agent-logs-panel.test.tsx
e2e/
  flows/
    project-lifecycle.spec.ts
    agent-collaboration.spec.ts
    auth-rbac.spec.ts
    spec-versioning.spec.ts
    git-commits.spec.ts
  fixtures/
    auth.setup.ts       # Playwright auth setup reused across tests
```

- Effort: 2 hours | Priority: P0

### T.2 State Machine Unit Tests

Every valid and invalid transition tested — this is core correctness:

```typescript
// src/__tests__/unit/state-machine.test.ts
describe('Task status state machine', () => {
  const VALID_TRANSITIONS = [
    ['todo',        'in_progress'],
    ['in_progress', 'done'],
    ['in_progress', 'blocked'],
    ['in_progress', 'paused'],
    ['blocked',     'in_progress'],
    ['paused',      'in_progress'],
    ['done',        'todo'],         // retry
    ['todo',        'skipped'],
    ['blocked',     'skipped'],
  ]
  const INVALID_TRANSITIONS = [
    ['todo',        'done'],
    ['todo',        'blocked'],
    ['todo',        'paused'],
    ['done',        'in_progress'],
    ['done',        'blocked'],
    ['done',        'paused'],
    ['skipped',     'in_progress'],
    ['paused',      'done'],
    ['blocked',     'done'],
    ['blocked',     'paused'],
  ]

  VALID_TRANSITIONS.forEach(([from, to]) => {
    it(`allows ${from} → ${to}`, async () => {
      const result = await validateStatusTransition(from, to)
      expect(result.valid).toBe(true)
    })
  })
  INVALID_TRANSITIONS.forEach(([from, to]) => {
    it(`rejects ${from} → ${to}`, async () => {
      const result = await validateStatusTransition(from, to)
      expect(result.valid).toBe(false)
    })
  })
})
```

### T.3 API Integration Tests

```typescript
// src/__tests__/integration/agent-mission.test.ts
describe('GET /api/agent/mission', () => {
  it('returns exhaustive context: project state, spec, plan intent, next task with verify_command, unblocked_tasks, git config')
  it('returns null next_task with reason when all tasks are done')
  it('returns null next_task with reason when all tasks are blocked')
  it('excludes tasks where dependency status != done')
  it('returns paused task with resume_context populated')
  it('returns tasks ordered by priority ASC, then created_at ASC')
  it('returns git.current_branch = default_branch when strategy = none')
  it('returns git.current_branch = phase branch when strategy = per-phase')
  it('rejects requests with invalid X-Agent-Token — 401')
  it('rejects requests for project_id not owned by token — 403')
  it('returns 404 when project does not exist')
})

describe('GET /api/agent/wave', () => {
  it('returns all unblocked tasks across a plan')
  it('excludes in_progress tasks (already claimed)')
  it('excludes tasks where dependency is not done')
  it('includes paused tasks with resume_context')
  it('returns wave_complete=true when all tasks are done or skipped')
  it('returns consistent wave_id for same set of tasks')
  it('returns different wave_id when task set changes')
})

describe('PATCH /api/agent/tasks/:id — status transitions', () => {
  it('transitions todo → in_progress successfully')
  it('transitions in_progress → done successfully')
  it('transitions in_progress → paused and writes resume_context')
  it('returns 409 when trying to claim an in_progress task (concurrent claim)')
  it('returns 422 for invalid status transition with descriptive error')
  it('increments retry_count when transitioning done → todo')
  it('sets completed_at when transitioning to done')
  it('returns 403 when task belongs to a different project than token')
})

describe('POST /api/agent/projects', () => {
  it('creates project + specification + plan atomically')
  it('auto-creates codebase analysis task when base_path is provided')
  it('rolls back all on DB failure — no orphaned rows')
  it('returns webhook_url and mission_url in response')
  it('returns 429 when rate limit exceeded (>10/hr)')
  it('rejects missing required fields with 400 + field-level errors')
})

describe('POST /api/webhooks/git', () => {
  it('inserts commit record into git_commits table')
  it('is idempotent — second call with same SHA returns 200 without duplicate insert')
  it('links commit to task when task_id provided')
  it('updates task.notes with commit SHA when task_id provided')
  it('rejects invalid X-Agent-Token — 401')
  it('returns 429 when rate limit exceeded')
})

describe('POST /api/agent/pause', () => {
  it('sets task status to paused and writes resume_context')
  it('returns 422 if task is not in_progress')
})

describe('POST /api/agent/heartbeat', () => {
  it('updates agent_last_heartbeat_at on the project')
  it('returns is_stale=false immediately after heartbeat')
})

describe('Specification versioning', () => {
  it('creates new spec row on save, marks previous is_active=false')
  it('returns 409 when expected_updated_at does not match DB updated_at')
  it('PATCH /api/agent/projects/:id with specification_content follows same lock')
})

describe('Auth + RBAC', () => {
  it('unauthenticated request to /projects returns 302 to /auth/login')
  it('viewer role POST to /api/agent/tasks returns 403')
  it('developer role can create tasks')
  it('admin role can access /admin/users')
  it('agent token cannot access /admin/* routes')
})
```

### T.4 Component Tests (Testing Library)

```typescript
// KanbanBoard
describe('KanbanBoard', () => {
  it('renders task cards grouped by status column: todo, in_progress, paused, blocked, done, skipped, ad-hoc')
  it('calls updateTaskStatus server action after drag-and-drop')
  it('shows empty state message when column has no tasks')
  it('shows pass/fail badge from latest test_result on task card')
  it('shows commit count badge when task has git_commits')
  it('shows Paused badge on paused tasks')
})

describe('CreateTaskDialog', () => {
  it('disables submit when description is empty')
  it('shows inline validation error for priority outside 1–5')
  it('switches to quick mode when toggle enabled — plan_id field disappears')
  it('closes and triggers Kanban refresh on successful submit')
  it('shows error state (not just toast) when server action throws')
})

describe('SpecEditor', () => {
  it('renders current spec content in editor on mount')
  it('enables Save button only after content changes')
  it('shows 409 conflict warning with diff when optimistic lock fails')
  it('creates new spec version on save — version count increments in history panel')
  it('version history list is read-only — no edit button on historical versions')
})

describe('AgentLogsPanel', () => {
  it('renders logs in reverse chronological order')
  it('shows is_internal logs only when Internal filter is active')
  it('filters by level when level checkboxes toggled')
  it('loads next page on "Load more" click')
})

describe('GitCommitsTab', () => {
  it('lists commits in reverse chronological order')
  it('links commit SHA to repo_url/commit/sha when repo_url is set')
  it('filters to task commits when task_id filter applied')
})
```

### T.5 E2E Tests (Playwright)

```typescript
// e2e/flows/project-lifecycle.spec.ts
test('Full project lifecycle: create → spec → plan with intent → tasks → execute → verify → commit visible', async ({ page }) => {
  // 1. Login as developer
  // 2. Create project (with base_path set)
  // 3. Verify codebase analysis task auto-created
  // 4. Edit spec, save, confirm version 2 exists in history
  // 5. Create plan, fill in intent textarea, add architecture decisions
  // 6. Create task with verify_command and done_criteria
  // 7. Use API to move task to done
  // 8. POST to /api/webhooks/git — verify commit appears in Commits tab
  // 9. Log test result — verify badge appears on task card
})

// e2e/flows/agent-collaboration.spec.ts
test('Agent creates task via API; human sees it in Kanban within 15s poll cycle', async ({ page, request }) => {})
test('Human pauses task in UI; agent sees resume_context in next mission call', async ({ page, request }) => {})
test('Agent posts heartbeat; status page shows as active. Heartbeat stops; status shows unresponsive after 2min')

// e2e/flows/auth-rbac.spec.ts
test('Unauthenticated user redirected to login')
test('Viewer cannot drag-and-drop Kanban card — status update returns 403')
test('Developer can create and update tasks')
test('Admin can change user role on /admin/users')
test('Agent token with project scope cannot access different project — 403')

// e2e/flows/spec-versioning.spec.ts
test('Edit spec, save, previous version visible in history')
test('Two tabs edit same spec simultaneously; second save shows conflict warning with diff')

// e2e/flows/git-commits.spec.ts
test('POST to /api/webhooks/git appears in Commits tab and on task card badge')
test('Commit SHA links to correct GitHub URL when repo_url is configured')
test('Idempotent: same SHA posted twice — only one record appears')
```

### T.6 CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, 'specdriver/**']
  pull_request:
    branches: [main]

jobs:
  unit-and-integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: specdriver_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
        options: --health-cmd pg_isready --health-interval 5s --health-timeout 5s --health-retries 5

    env:
      TEST_DATABASE_URL: postgresql://postgres:test@localhost:5432/specdriver_test
      NEXTAUTH_SECRET: test-secret-for-ci
      AGENT_TOKEN: test-agent-token

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run db:push  # apply full schema to test DB
      - run: npm run test -- --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  e2e:
    runs-on: ubuntu-latest
    needs: unit-and-integration
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: specdriver_e2e
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npm run db:push
      - run: npm run db:seed  # seed-simple.sql
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

**Coverage gates** (enforced via Vitest threshold config — build fails if below):
- Lines: 80%
- Functions: 80%
- Branches: 75%
- Agent API routes: 100% of routes must have at least one integration test

---

## Phase D: Quality & Hardening (~8 hours)

### D.1 Error Handling

- [ ] `src/app/error.tsx` — catches unhandled Next.js errors; shows error message + "Reload" + "Report issue" (links to GitHub issues with pre-filled title)
- [ ] `src/app/not-found.tsx` — 404 with link back to project list
- [ ] Standardise all API responses to:
  ```typescript
  // Success:   { data: T }
  // Error:     { error: { code: string, message: string, fields?: Record<string, string> } }
  ```
  HTTP codes: 200/201 success, 400 bad request, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 422 invalid state transition, 429 rate limited, 500 server error
- [ ] All forms surface `fields` errors inline below each input (not toast-only)
- [ ] Offline detection: `navigator.onLine` event listener → sticky banner "You're offline — changes won't save"
- [ ] Server action failures: retry up to 3× with exponential backoff (100ms, 500ms, 2000ms) before showing error
- Effort: 3 hours | Priority: P1

### D.2 Loading States

- [ ] `src/components/skeleton.tsx` — base skeleton with shimmer animation (Tailwind `animate-pulse`)
- [ ] `loading.tsx` for: `/projects/[id]`, `/projects/[id]/commits`, `/admin/users`
- [ ] Skeleton variants: `TaskCardSkeleton`, `LogRowSkeleton`, `CommitRowSkeleton`
- [ ] All buttons that trigger async actions: show spinner icon + disabled state while pending
- Effort: 1.5 hours | Priority: P1

### D.3 Real-Time Updates (Polling)

- [ ] `src/hooks/usePolling.ts` — generic hook: `usePolling(fetchFn, intervalMs, enabled)`
- [ ] Kanban board: poll `getProjectTasks()` every 15 seconds; update only if task set has changed (compare hash of task IDs + statuses)
- [ ] Agent logs panel: poll every 10 seconds
- [ ] Git commits tab: poll every 20 seconds
- [ ] Agent status badge in project header: poll every 30 seconds (uses heartbeat staleness)
- [ ] All polling panels show: "Last synced: Xs ago" and a manual "Refresh" button
- [ ] Polling pauses when tab is hidden (`document.visibilityState === 'hidden'`) to avoid unnecessary DB load
- Effort: 2 hours | Priority: P1

### D.4 Rate Limiting

- [ ] `src/middleware/rateLimiter.ts` — in-memory sliding window using `Map<tokenId, timestamp[]>`
- [ ] Applied to all `/api/agent/*` routes via Next.js middleware
- [ ] Limits per token:
  - Mutations (POST, PATCH, DELETE): 20 req/min
  - Reads (GET): 60 req/min
  - Git webhook: 60 req/min
  - Project creation: 10 req/hour (separate counter)
- [ ] Response on limit exceeded: `429` with header `Retry-After: {seconds}`
- [ ] For production: replace in-memory map with Redis (or `@upstash/ratelimit` if using Vercel)
- Effort: 1.5 hours | Priority: P1

### D.5 API Request Logging

- [ ] Middleware logs all `/api/agent/*` requests to `api_request_logs` table: `token_id`, `endpoint`, `method`, `status_code`, `duration_ms`, `project_id`
- [ ] UI: project settings page → "API Usage" tab — table of recent requests with status codes and latencies; grouped by endpoint
- Effort: 1 hour | Priority: P2

### D.6 Environment Validation

- [ ] `src/lib/env.ts` — use `zod` to parse `process.env` at startup
- [ ] Required: `DATABASE_URL`, `NEXTAUTH_SECRET`, `AGENT_TOKEN` (global bootstrap token)
- [ ] Optional with warnings: `TEST_DATABASE_URL`, `REDIS_URL`
- [ ] App throws on startup (not at request time) if required vars are missing — surfaces immediately in Docker/CI logs
- Effort: 0.5 hours | Priority: P0

---

## Consolidated Technical Debt

| #   | Issue                     | Resolution                                                                          | Priority |
| --- | ------------------------- | ----------------------------------------------------------------------------------- | -------- |
| 1   | No env validation         | D.6 — Zod env schema, fail at startup                                               | P0       |
| 2   | `project_id=1` hardcoded  | Replace all with dynamic project context from session/token                         | P0       |
| 3   | No transaction safety     | Drizzle transactions on all B.* endpoints                                           | P0       |
| 4   | Type safety gaps          | Zod output schemas on all API routes; infer TS types from them                      | P1       |
| 5   | Global static agent token | B.7 — per-project scoped tokens                                                     | P1       |
| 6   | No backup/restore         | Add `npm run db:backup` (wraps `pg_dump`) + restore docs                            | P2       |
| 7   | No WebSocket              | D.3 polling for MVP; replace with Socket.io post-MVP if poll latency is problematic | P3       |

---

## Implementation Order

| Step      | Phase | Description                         | Effort        | Dependency       |
| --------- | ----- | ----------------------------------- | ------------- | ---------------- |
| 1         | A.1   | Schema migration + mission audit    | 2.5 hr        | —                |
| 2         | T.1   | Test stack setup + CI skeleton      | 2 hr          | A.1              |
| 3         | D.6   | Environment validation              | 0.5 hr        | A.1              |
| 4         | A.2   | Task creation UI + quick mode       | 3 hr          | A.1, T.1         |
| 5         | A.3   | Plan editor + intent capture        | 3 hr          | A.1, T.1         |
| 6         | A.4   | Spec editor + versioning            | 4 hr          | A.1              |
| 7         | T.2   | State machine unit tests            | 1 hr          | T.1              |
| 8         | A.5   | Test results logging UI             | 2.5 hr        | A.2              |
| 9         | A.6   | Manual log entry UI                 | 2 hr          | A.1              |
| 10        | A.7   | Auth + RBAC                         | 5 hr          | A.1              |
| 11        | T.3   | API integration tests (A phase)     | 3 hr          | A.1–A.7          |
| 12        | G.1   | Git webhook endpoint                | 2 hr          | A.1              |
| 13        | G.2   | Commit message template             | 0.5 hr        | G.1              |
| 14        | G.3   | Branching strategy + phase-complete | 2 hr          | G.1              |
| 15        | G.4   | Commits UI tab                      | 2.5 hr        | G.1              |
| 16        | G.5   | Git config UI panel                 | 1 hr          | G.1              |
| 17        | B.1   | Agent project creation API          | 2.5 hr        | A.1              |
| 18        | B.2   | Agent project config API            | 1.5 hr        | B.1              |
| 19        | B.3   | Agent task creation API (bulk)      | 1.5 hr        | A.1              |
| 20        | B.4   | Parallel wave endpoint              | 2 hr          | A.1              |
| 21        | B.5   | Agent heartbeat                     | 1 hr          | A.1              |
| 22        | B.6   | Pause/resume                        | 1.5 hr        | A.1              |
| 23        | B.7   | Per-project scoped tokens           | 2 hr          | A.7              |
| 24        | B.8   | Model routing hints                 | 0.5 hr        | B.3              |
| 25        | T.3   | API integration tests (B + G phase) | 4 hr          | B.1–B.8, G.1–G.3 |
| 26        | T.4   | Component tests                     | 3 hr          | A.2–A.6, G.4     |
| 27        | T.5   | E2E tests                           | 5 hr          | All above        |
| 28        | D.1   | Error handling                      | 3 hr          | All above        |
| 29        | D.2   | Loading states                      | 1.5 hr        | All above        |
| 30        | D.3   | Polling / real-time                 | 2 hr          | All above        |
| 31        | D.4   | Rate limiting                       | 1.5 hr        | B.1              |
| 32        | D.5   | API request logging                 | 1 hr          | B.7              |
| **Total** |       |                                     | **~73 hours** |                  |

---

## Success Criteria

### Phase A — Human-Agent Parity
- [ ] Human can create, read, update projects, specs, plans, tasks entirely via UI
- [ ] Plan editor captures intent before agent starts; intent is returned in mission response
- [ ] Spec saves are immutable (new row); conflicts surface a diff; version history is browsable
- [ ] Quick tasks (no plan) visible in Ad Hoc Kanban column
- [ ] All actions attributed to creator (user or agent)
- [ ] Viewers read-only; developers full CRUD; admins manage users

### Phase G — Git Integration
- [ ] Agent calls `POST /api/webhooks/git` after every task commit; commit appears in UI within one poll cycle
- [ ] Commit message follows configured template
- [ ] Per-phase branching creates branch, commits to it, merges on phase-complete
- [ ] Idempotent: duplicate SHA post is a no-op
- [ ] Git config panel lets human configure repo URL, branch, strategy, template

### Phase B — Agent Autonomy
- [ ] Agent self-bootstraps from one `POST /api/agent/projects` call; receives webhook URL and mission URL in response
- [ ] `GET /api/agent/wave` returns all unblocked tasks; concurrent task claim returns 409
- [ ] Heartbeat updates every 30s; UI shows unresponsive warning after 2min silence
- [ ] Paused task `resume_context` returned in next mission/wave call
- [ ] Per-project tokens scope agent to exactly one project; cross-project access returns 403
- [ ] All B endpoints are fully transactional (rollback on partial failure)

### Phase T — Test Coverage
- [ ] `npm run test:all` passes on every PR in CI
- [ ] All state machine transitions (valid and invalid) have explicit unit tests
- [ ] All agent API routes have integration tests running against a real test DB
- [ ] All critical E2E flows covered: project lifecycle, auth/RBAC, git webhooks, spec conflict
- [ ] Coverage thresholds enforced: 80% lines/functions, 75% branches
- [ ] Build fails if coverage drops below threshold

### MVP Complete
- [ ] Full spec-driven workflow operational end-to-end
- [ ] Human + Agent collaborate on same project; neither blocks the other
- [ ] Git history reflects every completed task as an atomic commit
- [ ] All data persisted in PostgreSQL; type-safe throughout
- [ ] Zero-downtime schema migrations (all additions nullable or defaulted)
- [ ] 80%+ test coverage on critical paths; CI green on every merge

---

## Immediate Next Actions

1. **A.1** — Run schema migration (1 hour; unblocks everything)
2. **T.1 + D.6** — Set up Vitest, Playwright, CI skeleton, env validation (2.5 hours; do before writing any new feature)
3. **A.2 + T.2** — Task creation UI with quick mode + state machine tests (write tests alongside the feature)
4. **G.1** — Git webhook endpoint (can run in parallel; highest external-facing value)
5. **B.1** — Agent project creation API (can run in parallel with UI work)