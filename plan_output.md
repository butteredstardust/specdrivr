## TASK-001: Implement Extended Database Schema

**Area:** Database
**Depends on:** none
**Estimated effort:** M=3-8h
**Spec refs:** DATABASE.md §21

### Context
The current `src/db/schema.ts` implements the base schema but is missing the required extended fields detailed in section 21 of the DATABASE specification. These fields are necessary for core product functionality such as cost tracking, agent protocol operation, UI rendering (e.g. avatars and localization), and deep-linking into GitHub.
[SPEC_GAP decision 1]: The specification does not detail standard `updatedAt` update triggers for the new tables. The existing application pattern applies `.defaultNow()` without Postgres triggers; this pattern will be maintained and updated explicitly via application logic or standard Drizzle updates.

### Acceptance criteria
- [ ] Added `avatarUrl`, `timezone`, `locale`, and `onboardingStep` to the `users` table.
- [ ] Added `slug`, `createdBy`, `avatarColor`, and `isDemo` to the `projects` table.
- [ ] Created an `invites` table with `invitedBy`, `resendCount`, and `lastResentAt` alongside core invite fields (token, email, role, etc.).
- [ ] Added `generationDurationMs`, `generationError`, `modelVersion`, `taskCount`, and `totalEstimatedMinutes` to the `plans` table.
- [ ] Added `estimatedMinutes`, `actualDurationMs`, `gitBranch`, `gitCommitHash`, `expectedFiles`, `agentVersion`, `promptTokensUsed`, `completionTokensUsed`, and `totalCostUsd` to the `tasks` table.
- [ ] Created `task_attempts`, `file_changes`, `agent_sessions`, `agent_config`, `webhook_deliveries`, and `usage_snapshots` tables matching the specifications in §21.6 through §21.11.

### Implementation notes
- Update `src/db/schema.ts` to include all new tables and columns.
- Use Drizzle ORM syntax consistently (no raw SQL interpolation).
- Export type definitions using `$inferSelect` and `$inferInsert` for all new tables.
- Generate migrations using `npm run db:generate`.
- Do not apply manual indexing to JSONB fields unless explicitly required by the spec.

### Definition of done
`src/db/schema.ts` completely matches the extended schema requirements and a new migration file exists in the `drizzle/` directory.

---

## TASK-002: Update Database Seed Data

**Area:** Database
**Depends on:** TASK-001
**Estimated effort:** S=1-3h
**Spec refs:** DATABASE.md §18, PRODUCT.md

### Context
The database seed script is missing or incomplete relative to the test environment prerequisites defined in the spec. Proper manual QA and automated E2E testing with Playwright depend on predictable, realistic seed data (e.g. specific project setups, blocked tasks, specific onboarding states) conforming to the new extended schema.

### Acceptance criteria
- [ ] Implemented a single seed script `scripts/seed-demo-drizzle.ts` (or updated the existing one).
- [ ] Seed data populates the `projects` table, including `slug`, `isDemo`, and `avatarColor`.
- [ ] Seed data populates the `users` table, generating required extended fields like `avatarUrl` and `timezone`.
- [ ] Included critical seed constraints: `spec_001` with `approvedAt: null` and `status: 'pending_approval'`.
- [ ] Included a required blocked task `task_105` in `spec_002` with the specified blocked reason.
- [ ] Covered realistic edge cases including a user in various onboarding steps.

### Implementation notes
- Use `db.transaction()` and handle dependent inserts in reverse FK order (clear children before parents).
- Use `@faker-js/faker` for realistic, human-readable names and emails.
- Ensure timestamps are dynamic (`subDays(new Date(), N)`) instead of static ISO strings.

### Definition of done
Running `npm run db:seed` succeeds without errors and populates the database with realistic data adhering to the spec constraints.

---

## TASK-003: Core API Boundary Validation & Envelope Formatting

**Area:** Infrastructure
**Depends on:** none
**Estimated effort:** M=3-8h
**Spec refs:** API.md §6, ARCHITECTURE.md

### Context
Current API routes (e.g., `/api/projects/route.ts`) have inconsistent error formatting and do not entirely adhere to the specified success/error envelope. The API specification requires all responses to use `{ data: <payload>, meta?: { page, total } }` on success and `{ error: { code: "SNAKE_CASE", message: string } }` on error. We need a unified API response middleware/wrapper and Zod validation utilities.
[SPEC_GAP decision 2]: Next.js 14 App Router does not support traditional Express-like middleware wrapping per-route natively. We will implement higher-order functions in `src/lib/api-wrapper.ts` to standardize response formatting.

### Acceptance criteria
- [ ] Created `src/lib/api-response.ts` exposing `successResponse()` and `errorResponse()` helpers.
- [ ] Refactored existing route handlers in `app/api/` to use the standardized response formatting.
- [ ] Implemented a standardized Zod error formatter that extracts path and message and returns `HTTP 422 VALIDATION_ERROR`.
- [ ] Ensured all 500 errors are caught, logged via Pino, and converted to a generic `INTERNAL_ERROR` without leaking stack traces.

### Implementation notes
- Do not use custom error classes exclusively if standard structured JSON suffices.
- Use the `pino` logger instantiated in `src/lib/logger.ts`.
- Responses must always use `NextResponse.json(...)` with the correct HTTP status code.

### Definition of done
All existing API routes return standard JSON envelopes on success and failure.

---

## TASK-004: Implement Authentication & Session Middleware

**Area:** Auth
**Depends on:** TASK-001
**Estimated effort:** L=8-16h
**Spec refs:** AUTHENTICATION.md §7, PRODUCT_FEATURES.md

### Context
Authentication using `next-auth@^5.0.0-beta.19` is required to protect application routes and APIs. The RBAC model specifies Owner, Admin, Member, and Viewer roles. We need to implement session handling, protect routes, and implement rate limiting at the edge using a lightweight store.

### Acceptance criteria
- [ ] Integrated `next-auth` with the database adapter (Drizzle).
- [ ] Configured GitHub OAuth and Email/Password providers.
- [ ] Implemented role injection into the session object (`session.user.role`).
- [ ] Created `src/middleware.ts` (or `proxy.ts`) implementing route protection for `/api/v1/*` and private pages.
- [ ] Implemented Upstash Redis rate limiting in the middleware (Auth: 10/min, API: 100/min).

### Implementation notes
- `next-auth` requires `AUTH_SECRET` (mapped from `NEXTAUTH_SECRET`).
- Passwords must be hashed using bcrypt (cost 12) on signup/password change.
- Never store plain-text passwords or log them.
- All protected API routes must call `await auth()` as their first action.

### Definition of done
Unauthenticated requests to protected API endpoints return 401, and sessions correctly expose the user's role.

---

## TASK-005: Integrate Pino Logger & Audit Logging

**Area:** Infrastructure
**Depends on:** TASK-004, TASK-001
**Estimated effort:** M=3-8h
**Spec refs:** OPERATIONS.md §17, ARCHITECTURE.md

### Context
The application lacks a centralized, structured logging mechanism. Operations specs demand Pino JSON logging and strict audit logging for administrative actions. This task establishes the logging foundation.

### Acceptance criteria
- [ ] Implemented `src/lib/logger.ts` using `pino`.
- [ ] Configured the logger to use `debug` in dev and `info` in production.
- [ ] Applied `import 'server-only'` to `logger.ts`.
- [ ] Implemented an `auditLog` utility function that writes to an `audit_log` table (must be created) inside the same DB transaction as the admin action.

### Implementation notes
- Ensure no PII, tokens, or passwords are inadvertently logged.
- The `audit_log` table should contain `userId`, `action`, `resourceType`, `resourceId`, `changes` (JSONB), and `timestamp`.
- Add `audit_log` table to `schema.ts`.

### Definition of done
The logger is globally available and a utility exists to record administrative actions to the database transactionally.

---

## TASK-006: Build Project Management API

**Area:** API
**Depends on:** TASK-003, TASK-004
**Estimated effort:** M=3-8h
**Spec refs:** API.md §6

### Context
The core capability of the platform is managing projects. We need a fully spec-compliant RESTful API for CRUD operations on Projects.

### Acceptance criteria
- [ ] Implemented `POST /api/v1/projects` with input validation (slug generation handled if missing).
- [ ] Implemented `GET /api/v1/projects` with pagination and optional status filtering.
- [ ] Implemented `GET /api/v1/projects/:id`.
- [ ] Implemented `PATCH /api/v1/projects/:id` supporting updates to basic fields.
- [ ] Implemented `DELETE /api/v1/projects/:id` (archive instead of hard delete based on spec).

### Implementation notes
- Protect endpoints with `await auth()`.
- Use Drizzle relational queries where necessary.
- Return 404 if project is not found or user lacks access.
- Validate request bodies using centralized schemas in `src/lib/schemas.ts`.

### Definition of done
The Projects API is fully functional, secure, and validated against the Zod schema.

---

## TASK-007: Implement Base UI Shell & Design System Tokens

**Area:** UI - App Shell
**Depends on:** none
**Estimated effort:** M=3-8h
**Spec refs:** DESIGN_SYSTEM.md §8, §10

### Context
The UI must be built strictly using shadcn/ui and a token-based Design System in Tailwind v4. The application shell (sidebar navigation, header, notification area) must be established before page development.

### Acceptance criteria
- [ ] Verified `src/app/globals.css` contains the correct Tailwind `@theme` configuration matching the spec tokens.
- [ ] Implemented the main `AppShell` layout component (`src/app/layout.tsx` or inner layout).
- [ ] Built the responsive sidebar navigation using shadcn components.
- [ ] Included a user profile dropdown and global search placeholder.

### Implementation notes
- Do not use arbitrary hex values in components; strictly use `--primary`, `--background`, etc.
- Adhere to the 4px spacing scale.
- Include DAEMON mascot placeholder assets where required.
- Ensure the layout is accessible (ARIA labels, keyboard navigation).

### Definition of done
The application shell renders correctly, respecting the design tokens, and supports responsive collapse/expand behavior for the sidebar.

---

## TASK-008: Implement Project Listing UI

**Area:** UI - Projects Page
**Depends on:** TASK-006, TASK-007
**Estimated effort:** L=8-16h
**Spec refs:** USER_INTERFACE.md

### Context
Users need to view their projects. The UI must fetch data via Server Components and support optimistic updates for state changes (e.g., archiving).

### Acceptance criteria
- [ ] Built `src/app/projects/page.tsx` as a Server Component.
- [ ] Implemented a grid/list toggle for project cards.
- [ ] Project cards display the project avatar (color or image), name, status, and task completion metrics.
- [ ] Added a "Create Project" button that opens a dialog or navigates to a creation flow.
- [ ] Used `use cache` directive or appropriate Next.js 15 caching strategies.

### Implementation notes
- Data fetching must happen in the Server Component or via Server Actions (do not use `useEffect`).
- Component types should be extended from the schema (e.g., `ProjectCardProps['project']`).
- Use shadcn `Card`, `Button`, `Avatar` components.

### Definition of done
The Projects listing page displays data fetched from the API and allows users to initiate the project creation flow.

---

## TASK-009: Implement Spec & Plan View UI (The Workbench)

**Area:** UI - Workbench
**Depends on:** TASK-008
**Estimated effort:** XL=16h+
**Spec refs:** USER_INTERFACE.md, DESIGN_SYSTEM.md

### Context
The core "Spec-Driven" interface where users author specifications and review generated plans. This is a complex view containing the Markdown editor, plan review UI, and DAEMON state visualizer.

### Acceptance criteria
- [ ] Implemented the Workbench layout with a resizable split pane (Spec on left, Plan/Tasks on right).
- [ ] Integrated a Markdown editor component for the specification.
- [ ] Built the "Generate Plan" action button with optimistic UI (DAEMON "thinking" state).
- [ ] Implemented the Plan Review tab showing pending approval, stalled, or active plans.
- [ ] Implemented the "Approve Plan" and "Reject Plan" flows with validation.

### Implementation notes
- Will likely require splitting into smaller sub-tasks (e.g., Editor, Plan Viewer, State Machine UI).
- Use Sonner for non-blocking feedback during generation.
- Human approval is non-negotiable; ensure the UI clearly blocks execution until the plan is approved.
- Use the DAEMON mascot expressions corresponding to state (idle, thinking, error, success).

### Definition of done
The Workbench UI accurately reflects the Spec, Plan, and Task state machines and supports authoring and reviewing plans.

---

## TASK-010: Agent Task Execution API & Webhooks

**Area:** Integration
**Depends on:** TASK-001, TASK-003
**Estimated effort:** L=8-16h
**Spec refs:** INTEGRATIONS.md, API.md

### Context
The platform must support integrating with the external DAEMON agent protocol. We need endpoints for the agent to report status, update task states, and upload diffs/file changes.

### Acceptance criteria
- [ ] Implemented `POST /api/v1/agent/heartbeat`.
- [ ] Implemented `POST /api/v1/agent/tasks/:id/status` for the agent to update task states (in_progress, done, blocked, failed).
- [ ] Implemented `POST /api/v1/agent/tasks/:id/diff` for capturing `file_changes`.
- [ ] Implemented the logic to halt execution and pause the session if a task fails or modifies forbidden file globs.

### Implementation notes
- Authenticate the agent using the `api_tokens` (hashed) approach. Rate limit: 1000 req/min/token.
- Validate all incoming payloads against Zod schemas.
- If forbidden globs are touched, the task is marked failed immediately.

### Definition of done
The backend API exposes stable, authenticated endpoints that allow the DAEMON agent to progress through a plan and report changes.

---

## TASK-011: Playwright End-to-End Test Suite

**Area:** Testing
**Depends on:** TASK-008, TASK-009
**Estimated effort:** M=3-8h
**Spec refs:** CLAUDE.md

### Context
We must ensure critical user flows are protected against regression. A Playwright E2E suite covering authentication, core CRUD (project creation), and plan approval must be written, utilizing the mock infrastructure.

### Acceptance criteria
- [ ] Created mock data files in `tests/mocks/` syncing with the updated schema.
- [ ] Wrote `tests/e2e/auth.spec.ts` testing login/logout flows.
- [ ] Wrote `tests/e2e/projects.spec.ts` testing project creation and listing.
- [ ] Wrote `tests/e2e/workbench.spec.ts` testing the plan approval flow using intercepted API responses.

### Implementation notes
- Use ARIA-first locators (`getByRole`, `getByLabel`).
- Persist authenticated session via `storageState` to speed up tests.
- Run tests against mock responses using `page.route()`, not a live database.

### Definition of done
Running `npm run test:e2e` successfully executes all critical paths with 100% pass rate.

---

## Plan Summary

### Task count by area
| Area | Count |
|---|---|
| Database | 2 |
| Infrastructure | 2 |
| Auth | 1 |
| API | 1 |
| UI | 3 |
| Integration | 1 |
| Testing | 1 |
| **Total** | **11** |

### Critical path
TASK-001 -> TASK-004 -> TASK-006 -> TASK-008 -> TASK-009

### Assumptions log
1. **[SPEC_GAP] `updatedAt` updates:** The spec does not dictate DB-level triggers for `updatedAt` on extended schema fields. Assumed standard application-level or default schema mechanisms (`.defaultNow()` on insert, explicit set on update).
2. **[SPEC_GAP] Express Middleware vs Next.js App Router:** The spec implies route middleware for response formatting. Assumed Next.js higher-order functions for route handlers (`src/lib/api-response.ts`) to achieve the required `{ data, error }` envelopes without relying on unsupported Express patterns in App Router.

### Escalation items
- None. All identified gaps could be resolved using existing patterns or industry standards.

### Suggested parallelisation
- **Agent A:** TASK-001 (Database Schema) -> TASK-002 (Seed Data)
- **Agent B:** TASK-003 (API Formatting) -> TASK-004 (Auth Middleware) -> TASK-005 (Logging)
- **Agent C:** (Once TASK-001 is done) TASK-007 (UI Shell) -> TASK-008 (Projects UI)
