# Engineering Implementation Plan

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

| Spec Section | Feature | Status | Gap Summary |
| --- | --- | --- | --- |
| DATABASE.md §5 | Base schema | PARTIAL | Some tables exist but lack specific fields, missing many tables completely. |
| DATABASE.md §21 | Extended schema | PARTIAL | Most extended fields and new tables from §21 are missing. |
| DATABASE.md §18 | Seed data | MISSING | No seed data script generating proper test states. |
| API.md §6.1 | Auth endpoints | MISSING | No auth endpoints exist. |
| API.md §6.2 | Projects API | PARTIAL | Base CRUD exists in wrong path (/api/projects), missing /:id. |
| API.md §6.3 | Specifications API | MISSING | Not implemented. |
| API.md §6.4 | Plans API | MISSING | Not implemented. |
| API.md §6.5 | Tasks API | PARTIAL | Base CRUD exists in wrong path (/api/tasks), missing /:id methods. |
| API.md §6.6 | Sessions API | MISSING | Not implemented. |
| API.md §6.7 | Team management API | MISSING | Not implemented. |
| API.md §6.8 | Notifications & User API | MISSING | Not implemented. |
| AUTHENTICATION.md §7.1 | Auth system (BetterAuth, Redis sessions, bcrypt) | MISSING | No auth system, Redis, or bcrypt implementation. |
| AUTHENTICATION.md §7.2 | RBAC — all 4 roles, all permissions | MISSING | No RBAC enforcement or role definitions in use. |
| DESIGN_SYSTEM.md §8 | Design tokens, Tailwind theme | PARTIAL | Basic setup exists, missing full token specification. |
| DESIGN_SYSTEM.md §9 | DAEMON mascot — all expressions | MISSING | No DAEMON component. |
| DESIGN_SYSTEM.md §10 | App shell — sidebar, header, nav | MISSING | No app shell. |
| DESIGN_SYSTEM.md §11 | All pages — detailed spec | MISSING | Pages not created. |
| DESIGN_SYSTEM.md §12 | State machines in UI | MISSING | UI state machines missing. |
| DESIGN_SYSTEM.md §15 | Notification system | MISSING | No notification UI/backend. |
| PRODUCT.md §14 | Onboarding flow | MISSING | No onboarding flow. |
| PRODUCT.md §16 | Error states & edge cases | MISSING | Not implemented. |
| PRODUCT.md §20 | Empty states & microcopy | MISSING | Not implemented. |
| INTEGRATIONS.md §13.1 | GitHub integration | MISSING | Not implemented. |
| INTEGRATIONS.md §13.2 | Slack integration | MISSING | Not implemented. |
| INTEGRATIONS.md §13.3 | Generic webhooks | MISSING | Not implemented. |
| INTEGRATIONS.md §13.4 | DAEMON agent protocol | MISSING | Not implemented. |
| INTEGRATIONS.md §26 | Cost & usage tracking | MISSING | Not implemented. |
| OPERATIONS.md §17.1 | Performance targets | MISSING | Needs optimization workstream. |
| OPERATIONS.md §17.2 | Security (rate limiting, CSRF, Zod) | PARTIAL | Zod is used in partial APIs, rate limiting missing. |
| OPERATIONS.md §17.3 | Accessibility (WCAG 2.1 AA) | MISSING | Needs accessibility implementation. |


## Phase 3 — Gap Resolution

- [DECISION-001] Missing UI copy: Write production copy matching the microcopy style in PRODUCT.md §20. Do not use lorem ipsum or "TODO".
- [DECISION-002] Missing error state: Apply the DAEMON + heading + subtext + CTA pattern from PRODUCT.md §20.
- [DECISION-003] Missing empty state: Apply the DAEMON + heading + subtext + CTA pattern from PRODUCT.md §20.
- [DECISION-004] Ambiguous RBAC boundary: Default to the more restrictive role.
- [DECISION-005] Missing loading / optimistic state: Add a skeleton or spinner matching the design system.
- [DECISION-006] Spec says "Admin only" for an action: Show the button/action to all roles but disabled with a tooltip naming the required role — never hide it.
- [DECISION-007] Performance constraint not specified: Use the NFR targets from OPERATIONS.md §17.1 as the ceiling.
- [DECISION-008] Library choice not specified: Use the library already present in package.json. If absent, choose the lightest option consistent with the existing stack (e.g. ioredis for Redis, pino for logging).
- [DECISION-009] File path not specified: Follow the exact directory convention already established in the codebase. If no convention exists, follow Next.js App Router conventions.

## Phase 4 — Task Plan

### Schema and Foundation

---

## TASK-001: Schema Updates — Users, Projects, Invites

**Area:** Database
**Depends on:** none
**Estimated effort:** S
**Spec refs:** DATABASE.md §21.1, §21.2, §21.3

### Context
Extends existing `users` and `projects` tables with missing fields and adds the `invites` table for team management. Critical for avatar display, accurate timezone/locale rendering, and routing (project slug).
Applies [DECISION-009] for file location.

### Acceptance criteria
- [ ] `avatarUrl`, `timezone`, `locale`, and `onboardingStep` exist on the `users` table.
- [ ] `slug`, `createdBy`, `avatarColor`, and `isDemo` exist on the `projects` table with the correct constraints.
- [ ] `invites` table is created with `invitedBy`, `resendCount`, and `lastResentAt` fields.
- [ ] A Drizzle migration can be successfully generated using `npm run db:generate`.

### Implementation notes
- **File:** `src/db/schema.ts` — Add missing columns to `users` and `projects`. Add new `invites` table definition.
- Drizzle `pgTable` constructs must map exactly to the types mentioned in DATABASE.md.

---

## TASK-002: Schema Updates — Plans, Tasks, File Changes

**Area:** Database
**Depends on:** TASK-001
**Estimated effort:** S
**Spec refs:** DATABASE.md §21.4, §21.5, §21.6, §21.7

### Context
Updates orchestration core tables (`plans` and `tasks`) to support telemetry, cost tracking, and precise task mapping. Adds `task_attempts` and `file_changes` tables.

### Acceptance criteria
- [ ] `generationDurationMs`, `generationError`, `modelVersion`, `taskCount`, `totalEstimatedMinutes` added to `plans`.
- [ ] `estimatedMinutes`, `actualDurationMs`, `gitBranch`, `gitCommitHash`, `expectedFiles`, `agentVersion`, token metrics, and `totalCostUsd` added to `tasks`.
- [ ] `task_attempts` table is created with JSONB logs preserving `seq` ordering.
- [ ] `file_changes` table is created to track diffs per attempt.

### Implementation notes
- **File:** `src/db/schema.ts` — Update `plans` and `tasks`. Create `task_attempts` and `file_changes`.
- Use Drizzle parameterised JSONB types carefully for `logLines` on `task_attempts`.

---

## TASK-003: Schema Updates — Sessions, Config, Integrations, Usage

**Area:** Database
**Depends on:** TASK-002
**Estimated effort:** S
**Spec refs:** DATABASE.md §21.8, §21.9, §21.10, §21.11

### Context
Finalizes the data model by creating agent sessions, agent configuration, webhook delivery tracking, and usage snapshots. Essential for observability and billing.

### Acceptance criteria
- [ ] `agent_sessions` table added with metrics tracking (git branch tracking, token aggregates).
- [ ] `agent_config` table added with file glob boundaries.
- [ ] `webhook_deliveries` and `usage_snapshots` tables are created with proper unique constraints.
- [ ] Drizzle migration generated and applied cleanly against local database.

### Implementation notes
- **File:** `src/db/schema.ts` — Add `agent_sessions`, `agent_config`, `webhook_deliveries`, `usage_snapshots`.
- Use `npm run db:generate` to produce the final schema payload.

---

## TASK-004: Seed Data Generation

**Area:** Database
**Depends on:** TASK-003
**Estimated effort:** M
**Spec refs:** DATABASE.md §18

### Context
Implements the definitive database seed script to meet exact product demonstration scenarios, specifically mocking active sessions, a blocked task, and `pending_approval` state.

### Acceptance criteria
- [ ] Running `npm run db:seed` provisions exactly 3 users, 2 projects, 6 specs, 4 plans.
- [ ] `spec_001` has a plan with status `pending_approval`.
- [ ] `task_105` in `spec_002` is seeded with status `blocked` and valid blockedReason.
- [ ] One session is seeded in a running state.

### Implementation notes
- **File:** `src/db/seed.ts` (create if absent or rewrite) — Insert data respecting referential integrity via `db.transaction()`.
- Use parameterized Drizzle queries and exact mock data constraints from DATABASE.md §18.

---

### Core Backend & Infrastructure

---

## TASK-005: Authentication Infrastructure

**Area:** Auth
**Depends on:** TASK-004
**Estimated effort:** M
**Spec refs:** AUTHENTICATION.md §7.1, OPERATIONS.md §17.2

### Context
Setup BetterAuth v5 (next-auth v5), configure bcrypt password hashing, and implement Redis-based session storage. Applies [DECISION-008] using `ioredis`.

### Acceptance criteria
- [ ] `lib/auth.ts` exists and exports standard NextAuth primitives (auth, signIn, signOut).
- [ ] Redis client is correctly initialized and configured as the NextAuth session store.
- [ ] API routes for authentication (e.g., `app/api/auth/[...nextauth]/route.ts`) are mounted.
- [ ] Validated users can login using credentials provider with bcrypt cost 12.

### Implementation notes
- **File:** `src/lib/auth.ts` — Initialize NextAuth with credentials and Redis adapter.
- **File:** `src/lib/redis.ts` — Setup `ioredis` client.
- **File:** `package.json` — Add `ioredis` and `bcryptjs`.
- Ensure NO tokens or passwords are ever logged.

---

## TASK-006: Core Middlewares (Rate Limiting, Logger)

**Area:** Infrastructure
**Depends on:** TASK-005
**Estimated effort:** S
**Spec refs:** OPERATIONS.md §17.2, API.md §6.9

### Context
Sets up global request proxying (formerly `middleware.ts`), structured JSON logging via Pino, and Redis-backed rate limiting. Applies [DECISION-008] and [DECISION-009].

### Acceptance criteria
- [ ] `src/lib/logger.ts` exports a configured Pino logger (info level in prod).
- [ ] `src/proxy.ts` (or `src/middleware.ts` if proxy is invalid pattern) enforces rate limiting on `/api/*`.
- [ ] API requests exceeding rate limits return HTTP 429 with correct headers.

### Implementation notes
- **File:** `src/lib/logger.ts` — Initialize Pino logger.
- **File:** `src/proxy.ts` — Add `@upstash/ratelimit` or equivalent to enforce 100 req/min/user bounds.
- Use `import 'server-only'` in both files.

---

### API Implementation

---

## TASK-007: API — Auth & User Endpoints

**Area:** API
**Depends on:** TASK-006
**Estimated effort:** M
**Spec refs:** API.md §6.1, §6.8

### Context
Implements signup, password reset, token acceptance, and user profile management API endpoints.

### Acceptance criteria
- [ ] `POST /api/auth/signup` creates a user and hashes the password properly.
- [ ] `GET /api/v1/users/me` returns the current user profile (using session).
- [ ] `POST /api/v1/users/me/tokens` generates a masked API token, saving its bcrypt hash to the DB.
- [ ] `POST /api/auth/reset-password` handles token validation correctly.

### Implementation notes
- **File:** `src/app/api/auth/signup/route.ts` — Handle signup.
- **File:** `src/app/api/v1/users/me/route.ts` — Profile fetch.
- **File:** `src/app/api/v1/users/me/tokens/route.ts` — Token generation using bcrypt.
- Validate all input with `src/lib/schemas.ts` Zod schemas.

---

## TASK-008: API — Projects & Team Management

**Area:** API
**Depends on:** TASK-007
**Estimated effort:** M
**Spec refs:** API.md §6.2, §6.7

### Context
Restructures the existing project stubs into `/api/v1/projects` and adds sub-routes for membership and invites. Enforces RBAC permissions. Applies [DECISION-004] for ambiguous bounds.

### Acceptance criteria
- [ ] `GET /api/v1/projects/:id` returns project details and member counts.
- [ ] `POST /api/v1/projects/:id/invites` generates an invite token. Requires Admin.
- [ ] `PATCH /api/v1/projects/:id` correctly updates project configurations.
- [ ] Existing `src/app/api/projects` endpoints are migrated to `v1` paths.

### Implementation notes
- **File:** `src/app/api/v1/projects/[id]/route.ts` — Implement GET, PATCH, DELETE.
- **File:** `src/app/api/v1/projects/[id]/invites/route.ts` — Implement invite generation.
- **File:** `src/lib/auth-helpers.ts` (new) — Implement RBAC checks for these routes.
- All writes to `audit_log` must occur in the same Drizzle transaction as the action.

---

## TASK-009: API — Specifications & Plans

**Area:** API
**Depends on:** TASK-008
**Estimated effort:** L
**Spec refs:** API.md §6.3, §6.4

### Context
Implements the core orchestration routes: creating specifications, generating plans, and approving/rejecting plans. This is the heart of the product's state machine.

### Acceptance criteria
- [ ] `POST /api/v1/specs` creates a new specification and default version.
- [ ] `POST /api/v1/specs/:id/plan/generate` triggers the async plan engine.
- [ ] `POST /api/v1/plans/:id/approve` sets plan status to `executing` and creates an `agent_session`.
- [ ] `POST /api/v1/plans/:id/reject` sets status to `rejected`. Requires Admin/Owner.

### Implementation notes
- **File:** `src/app/api/v1/specs/route.ts`, `src/app/api/v1/specs/[id]/route.ts`.
- **File:** `src/app/api/v1/plans/[id]/approve/route.ts`.
- **File:** `src/app/api/v1/plans/[id]/reject/route.ts`.
- Must validate plan state transitions (e.g., cannot approve an already rejected plan).

---

## TASK-010: API — Tasks & Sessions

**Area:** API
**Depends on:** TASK-009
**Estimated effort:** M
**Spec refs:** API.md §6.5, §6.6

### Context
Restructures tasks API to `/api/v1/tasks` and implements session management for pausing, resuming, and tracking DAEMON activity.

### Acceptance criteria
- [ ] `GET /api/v1/tasks/:id/attempts` returns logs ordered sequentially.
- [ ] `POST /api/v1/sessions/:id/pause` marks session to pause.
- [ ] `POST /api/v1/sessions/:id/heartbeat` allows DAEMON to check in.
- [ ] Existing `src/app/api/tasks` stubs are properly migrated to `v1`.

### Implementation notes
- **File:** `src/app/api/v1/tasks/[id]/attempts/route.ts`.
- **File:** `src/app/api/v1/sessions/[id]/pause/route.ts`.
- Use Drizzle relational queries where possible.

---

### UI Components & Design System

---

## TASK-011: Design System & DAEMON Mascot

**Area:** UI — Design System
**Depends on:** none
**Estimated effort:** M
**Spec refs:** DESIGN_SYSTEM.md §8, §9

### Context
Implements the core visual language, Tailwind configuration, and the DAEMON mascot component which displays varying expressions depending on system state.

### Acceptance criteria
- [ ] Custom CSS variables mapped to shadcn/ui base correctly in `globals.css`.
- [ ] `DaemonMascot` component built, accepting `state` prop (`idle`, `thinking`, `error`, `success`, `working`).
- [ ] Font imports and Tailwind v4 arbitrary variants correctly configured.

### Implementation notes
- **File:** `src/app/globals.css` — Update variables.
- **File:** `src/components/ui/daemon-mascot.tsx` — Create component returning correct SVG or animation.

---

## TASK-012: App Shell & Navigation

**Area:** UI — App Shell
**Depends on:** TASK-011
**Estimated effort:** M
**Spec refs:** DESIGN_SYSTEM.md §10

### Context
Build the primary application layout, including sidebar navigation, top header (project switcher), and responsive layout constraints.

### Acceptance criteria
- [ ] Layout contains a collapsible sidebar with active-state navigation items.
- [ ] Header includes project selector dropdown and global search placeholder.
- [ ] The global DAEMON state is displayed in the sidebar footer.
- [ ] Layout uses Next.js server component fetching for initial user context.

### Implementation notes
- **File:** `src/app/layout.tsx`, `src/components/layout/sidebar.tsx`, `src/components/layout/header.tsx`.
- Use `nav` and `aside` semantic HTML. Use standard `lucide-react` icons.

---

## TASK-013: Shared UI Components (Terminal, Diff, Log Row)

**Area:** UI — Components
**Depends on:** TASK-011
**Estimated effort:** M
**Spec refs:** SCREEN_FLOW_INDEX.md

### Context
Build complex reusable UI components: xterm.js wrapper, Shiki diff viewer, and generic event log rows used across multiple pages. Applies [DECISION-005] for loading states.

### Acceptance criteria
- [ ] `TerminalLog` component renders ansi-colored text safely.
- [ ] `DiffViewer` component renders a syntax-highlighted code difference.
- [ ] `TaskRow` component is collapsible and shows status indicators.

### Implementation notes
- **File:** `src/components/ui/terminal-log.tsx` — Wrap basic ansi rendering.
- **File:** `src/components/ui/diff-viewer.tsx` — Basic text comparison implementation.
- **File:** `src/components/ui/task-row.tsx`.

---

### Application Pages

---

## TASK-014: Auth Pages & Onboarding

**Area:** UI — Auth
**Depends on:** TASK-007, TASK-011
**Estimated effort:** S
**Spec refs:** PRODUCT.md §14, DESIGN_SYSTEM.md §11

### Context
Builds Login, Forgot Password, Reset Password, and the 4-step user onboarding flow.

### Acceptance criteria
- [ ] `/login` accepts credentials and uses NextAuth `signIn`.
- [ ] Password reset flow fully functional.
- [ ] Onboarding wizard collects locale, timezone, and avatar preferences.

### Implementation notes
- **File:** `src/app/login/page.tsx`, `src/app/forgot-password/page.tsx`, `src/components/onboarding-wizard.tsx`.
- Use `react-hook-form` and `@hookform/resolvers/zod`.

---

## TASK-015: Mission Control Dashboard

**Area:** UI — Mission Control
**Depends on:** TASK-012, TASK-013
**Estimated effort:** M
**Spec refs:** DESIGN_SYSTEM.md §11

### Context
Replaces the stub `page.tsx` with the real Mission Control dashboard, surfacing active sessions, blocked tasks ("Needs Attention" banner), and recent specifications.

### Acceptance criteria
- [ ] "Needs Attention" banner rendered correctly when a task is blocked.
- [ ] Active agent sessions are listed with live status.
- [ ] UI polls or subscribes to updates.
- [ ] Empty state rendered beautifully with DAEMON mascot per [DECISION-003].

### Implementation notes
- **File:** `src/app/page.tsx` — Rewrite completely to fetch and render dashboard panels.
- Data fetching must use `await` natively in the Server Component.

---

## TASK-016: Specifications List & Editor

**Area:** UI — Specs
**Depends on:** TASK-009, TASK-012
**Estimated effort:** M
**Spec refs:** DESIGN_SYSTEM.md §11

### Context
Builds the `/specs` index page and the `/specs/new` (or `[id]/edit`) markdown editor experience.

### Acceptance criteria
- [ ] `/specs` lists specifications with pagination and status badges.
- [ ] `/specs/new` presents a markdown editor and saves via server action.
- [ ] Auto-saving logic or prompt on exit implemented.

### Implementation notes
- **File:** `src/app/specs/page.tsx`
- **File:** `src/app/specs/new/page.tsx`, `src/app/specs/[id]/edit/page.tsx`
- Use `@uiw/react-md-editor` (already in package.json).

---

## TASK-017: Specification Detail View

**Area:** UI — Specs
**Depends on:** TASK-016, TASK-009
**Estimated effort:** L
**Spec refs:** DESIGN_SYSTEM.md §11, DESIGN_SYSTEM.md §12

### Context
The most complex page in the app. Houses the 5-tab interface (Overview, Plan, Tasks, Changes, Activity) and relies heavily on state machine conditional rendering.

### Acceptance criteria
- [ ] Header buttons toggle conditionally based on `spec.status` and `plan.status`.
- [ ] "Approve & Execute" action available only to Admin/Owner in `pending_approval` state (applies [DECISION-006] for viewers).
- [ ] Tasks tab correctly displays readonly vs interactive mode based on state.
- [ ] Changes tab renders `DiffViewer`.

### Implementation notes
- **File:** `src/app/specs/[id]/page.tsx`
- **File:** `src/components/specs/spec-header.tsx`, `src/components/specs/plan-tab.tsx`, `src/components/specs/tasks-tab.tsx`.
- Strict adherence to conditional rendering tables in `state-machine-prompt.md`.

---

## TASK-018: Task Drawer Overlay

**Area:** UI — Overlays
**Depends on:** TASK-017
**Estimated effort:** M
**Spec refs:** DESIGN_SYSTEM.md §11

### Context
A global sheet component that slides out to show task details, execution logs, and allows users to unblock or manually override tasks.

### Acceptance criteria
- [ ] Drawer opens displaying Task context, Terminal logs, and Diff summary.
- [ ] Users with permission can provide context to a `blocked` task and hit "Resume".
- [ ] Overrides (mark as done, mark as blocked) function via Server Actions.

### Implementation notes
- **File:** `src/components/tasks/task-drawer.tsx` (using shadcn `Sheet`).
- **File:** `src/app/actions/task-actions.ts` — Define server actions for mutations.

---

## TASK-019: Project Settings & Team Management

**Area:** UI — Settings
**Depends on:** TASK-008
**Estimated effort:** M
**Spec refs:** DESIGN_SYSTEM.md §11

### Context
Settings pages for project configuration, Agent restrictions, integrations, and Team member roles.

### Acceptance criteria
- [ ] `/settings/general` allows project name and slug changes.
- [ ] `/settings/team` displays members and allows Admins to invite/change roles.
- [ ] `/settings/agent` exposes file glob restrictions and CLI commands.
- [ ] Modifying global settings writes to the audit log.

### Implementation notes
- **File:** `src/app/settings/layout.tsx`, `src/app/settings/team/page.tsx`, `src/app/settings/agent/page.tsx`.

---

### Integrations & Operational Features

---

## TASK-020: Webhooks & Notifications System

**Area:** Integration
**Depends on:** TASK-003, TASK-010
**Estimated effort:** M
**Spec refs:** INTEGRATIONS.md §13.3, DESIGN_SYSTEM.md §15

### Context
Builds the event dispatcher that triggers generic webhooks upon task completion or plan generation. Also builds the internal UI notification dropdown.

### Acceptance criteria
- [ ] State transitions in the backend (e.g., `plan_generated`, `task_blocked`) fire async webhook dispatch jobs.
- [ ] `webhook_deliveries` log is populated correctly.
- [ ] The app shell header Notification bell shows an unread count.
- [ ] Clicking the bell reveals a popover list of actionable notifications.

### Implementation notes
- **File:** `src/lib/webhooks.ts` — Webhook firing logic (fetch wrapped with retry).
- **File:** `src/components/layout/notification-dropdown.tsx`.

---

## TASK-021: Agent Protocol API Endpoints

**Area:** API / Integration
**Depends on:** TASK-010
**Estimated effort:** M
**Spec refs:** INTEGRATIONS.md §13.4

### Context
Creates the specific API surface used by the external DAEMON CLI process to pull tasks, submit file changes, and report logs back to Specdrivr.

### Acceptance criteria
- [ ] `POST /api/v1/agent/heartbeat` processes token validation and updates project state.
- [ ] `GET /api/v1/agent/tasks/next` dequeues highest priority task for the session.
- [ ] `POST /api/v1/agent/tasks/:id/complete` accepts file diffs and token usage metrics.
- [ ] Requests using invalid `sdk_...` tokens return 401.

### Implementation notes
- **File:** `src/app/api/v1/agent/heartbeat/route.ts`
- **File:** `src/app/api/v1/agent/tasks/next/route.ts`
- **File:** `src/app/api/v1/agent/tasks/[id]/complete/route.ts`
- Must rigorously validate token hashes.

---

## TASK-022: Usage Tracking & Billing Aggregation

**Area:** Infrastructure
**Depends on:** TASK-003, TASK-021
**Estimated effort:** S
**Spec refs:** INTEGRATIONS.md §26

### Context
A nightly aggregation job (or simple on-demand rollup query) that calculates USD cost based on token consumption stored in `agent_sessions` and `task_attempts`.

### Acceptance criteria
- [ ] Function calculates total prompt/completion tokens per project per day.
- [ ] Data writes correctly into `usage_snapshots`.
- [ ] Settings > Usage UI renders a basic cost table or chart.

### Implementation notes
- **File:** `src/lib/jobs/aggregate-usage.ts`.
- **File:** `src/app/settings/usage/page.tsx`.


## Phase 5 — Plan Summary

### 5a. Task count by area
| Area | Task Count | Estimated Hours |
| --- | --- | --- |
| Database | 4 | 14h (3S, 1M) |
| Infrastructure | 2 | 4h (2S) |
| Auth | 1 | 5h (1M) |
| API | 5 | 27h (4M, 1L) |
| UI | 8 | 42h (2S, 5M, 1L) |
| Integration | 2 | 10h (2M) |
| **Total** | **22** | **102h** |

### 5b. Full feature coverage check
| Spec Section | Feature | Status | Task IDs |
| --- | --- | --- | --- |
| DATABASE.md §5 | Base schema | PARTIAL | TASK-001, TASK-002, TASK-003 |
| DATABASE.md §21 | Extended schema | PARTIAL | TASK-001, TASK-002, TASK-003 |
| DATABASE.md §18 | Seed data | MISSING | TASK-004 |
| API.md §6.1 | Auth endpoints | MISSING | TASK-007 |
| API.md §6.2 | Projects API | PARTIAL | TASK-008 |
| API.md §6.3 | Specifications API | MISSING | TASK-009 |
| API.md §6.4 | Plans API | MISSING | TASK-009 |
| API.md §6.5 | Tasks API | PARTIAL | TASK-010 |
| API.md §6.6 | Sessions API | MISSING | TASK-010 |
| API.md §6.7 | Team management API | MISSING | TASK-008 |
| API.md §6.8 | Notifications & User API | MISSING | TASK-007, TASK-020 |
| AUTHENTICATION.md §7.1 | Auth system (BetterAuth, Redis sessions, bcrypt) | MISSING | TASK-005 |
| AUTHENTICATION.md §7.2 | RBAC — all 4 roles, all permissions | MISSING | TASK-008, TASK-017, TASK-019 |
| DESIGN_SYSTEM.md §8 | Design tokens, Tailwind theme | PARTIAL | TASK-011 |
| DESIGN_SYSTEM.md §9 | DAEMON mascot — all expressions | MISSING | TASK-011 |
| DESIGN_SYSTEM.md §10 | App shell — sidebar, header, nav | MISSING | TASK-012 |
| DESIGN_SYSTEM.md §11 | All pages — detailed spec | MISSING | TASK-014, TASK-015, TASK-016, TASK-017, TASK-018, TASK-019 |
| DESIGN_SYSTEM.md §12 | State machines in UI | MISSING | TASK-017 |
| DESIGN_SYSTEM.md §15 | Notification system | MISSING | TASK-020 |
| PRODUCT.md §14 | Onboarding flow | MISSING | TASK-014 |
| PRODUCT.md §16 | Error states & edge cases | MISSING | TASK-011, TASK-013, TASK-015 |
| PRODUCT.md §20 | Empty states & microcopy | MISSING | TASK-015 |
| INTEGRATIONS.md §13.1 | GitHub integration | MISSING | TASK-020 |
| INTEGRATIONS.md §13.2 | Slack integration | MISSING | TASK-020 |
| INTEGRATIONS.md §13.3 | Generic webhooks | MISSING | TASK-020 |
| INTEGRATIONS.md §13.4 | DAEMON agent protocol | MISSING | TASK-021 |
| INTEGRATIONS.md §26 | Cost & usage tracking | MISSING | TASK-022 |
| OPERATIONS.md §17.1 | Performance targets | MISSING | TASK-006, TASK-022 |
| OPERATIONS.md §17.2 | Security (rate limiting, CSRF, Zod) | PARTIAL | TASK-005, TASK-006 |
| OPERATIONS.md §17.3 | Accessibility (WCAG 2.1 AA) | MISSING | TASK-011, TASK-012 |

### 5c. Critical path
TASK-001 → TASK-002 → TASK-003 → TASK-004 → TASK-005 → TASK-007 → TASK-008 → TASK-009 → TASK-017 → TASK-018.
Estimated sequential time: 54h (approx 1.5 engineering weeks).

### 5d. Parallel workstreams
- **Workstream A — Data layer**: TASK-001, TASK-002, TASK-003, TASK-004.
- **Workstream B — Auth & API**: TASK-005, TASK-006, TASK-007, TASK-008, TASK-009, TASK-010.
- **Workstream C — UI Components**: TASK-011, TASK-012, TASK-013.
- **Workstream D — Features & Integrations**: TASK-020, TASK-021, TASK-022.
*(Workstreams B, C, and D can begin in parallel once Workstream A is merged).*

### 5e. Assumptions log
- [DECISION-001] Missing UI copy: Write production copy matching the microcopy style in PRODUCT.md §20. Reason: "TODO" text degrades the onboarding/demo experience.
- [DECISION-002] Missing error state: Apply the DAEMON + heading + subtext + CTA pattern from PRODUCT.md §20. Reason: Keeps the UI consistent and friendly even when failing.
- [DECISION-003] Missing empty state: Apply the DAEMON + heading + subtext + CTA pattern from PRODUCT.md §20. Reason: Avoids dead-ends.
- [DECISION-004] Ambiguous RBAC boundary: Default to the more restrictive role. Reason: Secure by default; prevents unintentional permission escalation.
- [DECISION-005] Missing loading / optimistic state: Add a skeleton or spinner matching the design system. Reason: Next.js server components delay render; visual feedback is required.
- [DECISION-006] Spec says "Admin only" for an action: Show the button/action to all roles but disabled with a tooltip naming the required role — never hide it. Reason: Improves discoverability of premium features or admin workflows.
- [DECISION-007] Performance constraint not specified: Use the NFR targets from OPERATIONS.md §17.1 as the ceiling. Reason: Enforces baseline UX standards.
- [DECISION-008] Library choice not specified: Use the library already present in package.json (`ioredis`, `pino`). Reason: Minimizes bundle size and ecosystem fragmentation.
- [DECISION-009] File path not specified: Follow Next.js App Router conventions. Reason: Keeps the architecture predictable.

### 5f. Escalation items
- None identified. (All gaps could be resolved using the provided decision matrix, and all required infrastructure tools are either in `package.json` or align with the existing stack.)
