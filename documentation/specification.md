**SPECDRIVR**

Master Product Specification

Version 1.0 · Confidential

_Spec-driven autonomous code execution for engineering teams_

# **1\. Executive Summary**

Specdrivr is a spec-driven autonomous coding platform that enables engineering teams to write plain-English specifications in Markdown and have an AI agent - DAEMON - translate those specs into a structured execution plan, receive human approval, then autonomously execute and commit code changes against a target repository.

The core value proposition is accountability and control: DAEMON never executes code without explicit human approval of the generated plan. Every architectural decision is surfaced and reviewable. Every file change is diffed and attributed to the task that produced it. Humans remain the final authority; DAEMON is a force multiplier.

Specdrivr is a production-grade, multi-user, multi-project SaaS application targeting professional software engineering teams. It is not a prototype or internal tool. Every design, data, and API decision in this document reflects production requirements.

| **Metric**       | **Target**                                                |
| ---------------- | --------------------------------------------------------- |
| Target users     | Software engineers, technical leads, engineering managers |
| Team size        | 2-50 engineers per organisation                           |
| Concurrency      | Up to 10 simultaneous agent tasks per project             |
| Availability     | 99.9% uptime (three-nines SLA)                            |
| Data retention   | 90 days of session and event logs (configurable)          |
| Deployment model | Cloud SaaS; self-hosted Docker option on roadmap          |

# **2\. Product Vision & Goals**

## **2.1 Vision Statement**

Software specifications should be executable. The gap between "what we want to build" and "working code in the repository" should be occupied by a tireless, auditable, human-supervised agent - not by weeks of translation overhead between requirements documents and pull requests.

## **2.2 Core Principles**

- **Human approval is non-negotiable. DAEMON never executes against a repository without a human reviewing and approving the generated plan. This is a hard constraint, not a toggleable preference.**
- **Every action is observable. Every task attempt, log line, file change, and architectural decision is stored, attributed, and accessible. Nothing happens in a black box.**
- **Complexity is progressive. Default views are clean and simple. Power-user depth - raw IDs, JSON inspection, timing data - is one keystroke away, not buried in settings.**
- **Trust through precision. The application speaks plainly and precisely. No marketing copy in the UI. Status indicators use exact counts and identifiers, not vague "processing…" states.**
- **Keyboard-first. Every primary action has a keyboard shortcut. Mouse interaction is never required for any core workflow.**

## **2.3 What Specdrivr Is Not**

- Not a code review tool. Specdrivr generates and executes. Code review happens in your existing Git workflow after DAEMON creates branches and commits.
- Not a CI/CD pipeline. It does not run tests, deploy, or monitor production. It writes code; your pipeline takes over.
- Not a requirements management system. Specifications are Markdown files, not tickets. There is no backlog, no sprint, no velocity.
- Not an autonomous system. DAEMON operates with exactly the permissions a human grants it, in exactly the scope defined by an approved plan, nothing more.

# **3\. User Personas**

## **3.1 Alex - Technical Lead (Primary Persona)**

| **Attribute**   | **Detail**                                                                                                                                |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Role            | Engineering Manager / Technical Lead                                                                                                      |
| Goals           | Accelerate delivery of well-scoped features; maintain architectural standards; free the team from boilerplate work                        |
| Pain points     | Repetitive implementation tasks consume senior engineer time; spec-to-code translation is error-prone; hard to audit what changed and why |
| Specdrivr usage | Writes specifications; reviews and approves plans; monitors sessions; unblocks stalled tasks; reviews file changes before merging         |
| RBAC role       | Admin or Owner                                                                                                                            |
| Technical level | High - comfortable with terminals, diffs, monorepos, and Drizzle schema files                                                             |
| Key flows used  | Write spec → Generate plan → Approve → Monitor → Unblock → Review changes                                                                 |

## **3.2 Sam - Senior Engineer (Contributor Persona)**

| **Attribute**   | **Detail**                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Role            | Senior Software Engineer                                                                                                 |
| Goals           | Offload boilerplate implementation to DAEMON; focus on architecture and review; stay unblocked                           |
| Pain points     | Waiting for approval gates; context-switching to unblock DAEMON mid-task; unclear why DAEMON chose a particular approach |
| Specdrivr usage | Creates specifications; views plans; monitors task execution; provides blocking context; reviews output                  |
| RBAC role       | Member                                                                                                                   |
| Technical level | High - reads diffs fluently; understands dependency graphs                                                               |
| Key flows used  | Write spec → view plan (cannot approve) → request approval → monitor → unblock tasks                                     |

## **3.3 Jordan - Engineering Manager (Observer Persona)**

| **Attribute**   | **Detail**                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Role            | Engineering Manager (non-coding)                                                                                           |
| Goals           | Visibility into what the team is building and how fast; understanding of DAEMON's contribution; audit trail for compliance |
| Pain points     | No visibility into autonomous agent output; unclear attribution; cannot tell what is "DAEMON's work" vs engineer's work    |
| Specdrivr usage | Views specs, sessions, and activity logs; reads but does not create; tracks team output                                    |
| RBAC role       | Viewer                                                                                                                     |
| Technical level | Low - reads summaries; does not review diffs                                                                               |
| Key flows used  | Dashboard / Mission Control → Sessions → Spec Activity                                                                     |

# **4\. System Architecture**

## **4.1 Technology Stack**

| **Layer**          | **Technology / Library**                          | **Rationale**                                                             |
| ------------------ | ------------------------------------------------- | ------------------------------------------------------------------------- |
| Framework          | Next.js 16 (App Router)                           | Server Components, Server Actions, built-in caching layer                 |
| Language           | TypeScript 5.x (strict mode)                      | Type safety across all layers; Drizzle types flow end-to-end              |
| Database           | PostgreSQL 16                                     | ACID transactions; JSONB for log lines and metadata                       |
| ORM                | Drizzle ORM + drizzle-kit                         | Type-safe queries; schema-first migrations; no code generation            |
| Auth               | NextAuth.js v5 (Auth.js)                          | Credentials + OAuth; session in httpOnly cookie; CSRF protection built-in |
| Cache / Queues     | Redis (Upstash)                                   | Session store; rate limiting; agent task queue; pub/sub for live events   |
| File storage       | S3-compatible (AWS or self-hosted MinIO)          | Spec attachments; diff snapshots for long sessions                        |
| Email              | Resend                                            | Transactional email for invites, notifications, password reset            |
| UI components      | shadcn/ui (Radix + Tailwind)                      | Accessible, unstyled primitives; customisable without overrides           |
| Animation          | Motion (Framer Motion v11)                        | DAEMON expressions; page transitions; boot sequence                       |
| Drawer             | Vaul                                              | Task detail drawer; same author as shadcn; superior snap-point UX         |
| Syntax highlight   | Shiki                                             | Server-side diff rendering; vesper theme; zero client JS weight           |
| Markdown editor    | @uiw/react-codemirror + @codemirror/lang-markdown | CodeMirror 6 in React; live preview; line numbers                         |
| Terminal           | @xterm/xterm + @xterm/addon-fit                   | Real ANSI terminal rendering; auto-scroll; same engine as VS Code         |
| Keyboard shortcuts | react-hotkeys-hook                                | Declarative shortcut binding; respects focus traps                        |
| Toasts             | Sonner                                            | shadcn-native toast library; DAEMON sprite support                        |
| Validation         | Zod                                               | Single source of truth for input schemas; shared client/server            |
| Logging            | Pino                                              | Structured JSON logs; correlation IDs; never logs PII                     |
| Testing (unit)     | Vitest                                            | Fast; native ESM; mocks Drizzle without Postgres in CI                    |
| Testing (e2e)      | Playwright                                        | ARIA-first locators; auth state reuse; shard-parallel CI                  |

## **4.2 Deployment Architecture**

- Next.js application deployed on Vercel or a Node.js container (Docker image provided)
- PostgreSQL on managed provider (Supabase, Neon, RDS, or self-hosted)
- Redis on Upstash (serverless-compatible) or self-hosted Redis 7+
- DAEMON agent runtime: a separate long-running Node.js process that polls the task queue from Redis and executes against the repository via git + language-specific tooling
- The DAEMON agent authenticates to the Specdrivr API using an API token (AGENT_TOKEN environment variable). It never connects directly to the database.
- S3 bucket or MinIO instance for spec attachments and large diff storage

## **4.3 Security Boundaries**

- The web application (Next.js) never exposes database credentials to the client. All DB access goes through Server Actions or Route Handlers on the server only.
- lib/db.ts, lib/env.ts, and lib/logger.ts all carry import 'server-only' - any accidental client import is a compile-time error.
- The DAEMON agent communicates via the public API only. No direct DB access from the agent process.
- User sessions are stored in Redis with a 30-day TTL. Revoking a session deletes the Redis key immediately.
- API tokens are stored as bcrypt hashes. The raw token is shown exactly once (on creation) and cannot be recovered.

# **5\. Data Model**

All entities use string IDs with a typed prefix (e.g. proj_, spec_, plan_, task_). All timestamps are stored as timestamptz in UTC. Soft deletes are not used - deleted records are permanently removed after cascade.

## **5.1 Users & Authentication**

\-- users

id TEXT PRIMARY KEY -- user_abc123

name TEXT NOT NULL

email TEXT UNIQUE NOT NULL

passwordHash TEXT NOT NULL -- bcrypt, cost 12

onboardingDone BOOLEAN DEFAULT FALSE

createdAt TIMESTAMPTZ DEFAULT NOW()

lastActiveAt TIMESTAMPTZ

\-- sessions (NextAuth managed)

id TEXT PRIMARY KEY

userId TEXT REFERENCES users(id) ON DELETE CASCADE

sessionToken TEXT UNIQUE NOT NULL

expires TIMESTAMPTZ NOT NULL

userAgent TEXT

ipAddress INET

\-- invites

id TEXT PRIMARY KEY

projectId TEXT REFERENCES projects(id) ON DELETE CASCADE

email TEXT NOT NULL

role TEXT NOT NULL -- admin | member | viewer

token TEXT UNIQUE NOT NULL -- UUID, used in invite URL

expiresAt TIMESTAMPTZ NOT NULL -- +7 days from creation

usedAt TIMESTAMPTZ

\-- api_tokens

id TEXT PRIMARY KEY

userId TEXT REFERENCES users(id) ON DELETE CASCADE

name TEXT NOT NULL -- "CI Pipeline"

tokenHash TEXT UNIQUE NOT NULL -- bcrypt of raw token

prefix TEXT NOT NULL -- first 8 chars, shown in UI

expiresAt TIMESTAMPTZ -- null = never

lastUsedAt TIMESTAMPTZ

createdAt TIMESTAMPTZ DEFAULT NOW()

## **5.2 Organisations & Projects**

\-- projects

id TEXT PRIMARY KEY -- proj_abc123

name TEXT NOT NULL

repositoryUrl TEXT NOT NULL -- <https://github.com/org/repo>

repositoryBranch TEXT NOT NULL DEFAULT 'main'

description TEXT

status TEXT DEFAULT 'active' -- active | archived

createdAt TIMESTAMPTZ DEFAULT NOW()

updatedAt TIMESTAMPTZ DEFAULT NOW()

\-- project_members

id TEXT PRIMARY KEY

projectId TEXT REFERENCES projects(id) ON DELETE CASCADE

userId TEXT REFERENCES users(id) ON DELETE CASCADE

role TEXT NOT NULL -- owner | admin | member | viewer

status TEXT DEFAULT 'active' -- active | invited | suspended

invitedAt TIMESTAMPTZ NOT NULL

joinedAt TIMESTAMPTZ

UNIQUE(projectId, userId)

\-- agent_config (one row per project)

projectId TEXT PRIMARY KEY REFERENCES projects(id)

maxConcurrentTasks INTEGER DEFAULT 3 -- 1-10

taskTimeoutSeconds INTEGER DEFAULT 300 -- 5 minutes

maxRetriesPerTask INTEGER DEFAULT 2 -- 0-5

retryDelaySeconds INTEGER DEFAULT 30

requireApproval BOOLEAN DEFAULT TRUE

autoGeneratePlan BOOLEAN DEFAULT FALSE

planExpiryHours INTEGER -- null = never

## **5.3 Specifications & Versioning**

\-- specs

id TEXT PRIMARY KEY -- spec_abc

projectId TEXT REFERENCES projects(id) ON DELETE CASCADE

name TEXT NOT NULL

currentVersionId TEXT -- FK to spec_versions (set after first version)

status TEXT DEFAULT 'drafting'

\-- drafting | pending_plan | pending_approval | executing | complete | stalled

createdBy TEXT REFERENCES users(id)

createdAt TIMESTAMPTZ DEFAULT NOW()

updatedAt TIMESTAMPTZ DEFAULT NOW()

\-- spec_versions

id TEXT PRIMARY KEY

specId TEXT REFERENCES specs(id) ON DELETE CASCADE

versionNumber INTEGER NOT NULL -- 1, 2, 3 ...

markdownContent TEXT NOT NULL

createdBy TEXT REFERENCES users(id)

createdAt TIMESTAMPTZ DEFAULT NOW()

UNIQUE(specId, versionNumber)

## **5.4 Plans & Tasks**

\-- plans

id TEXT PRIMARY KEY

specId TEXT REFERENCES specs(id) ON DELETE CASCADE

specVersionId TEXT REFERENCES spec_versions(id)

status TEXT DEFAULT 'pending_approval'

\-- pending_approval | approved | rejected | abandoned | changes_requested | complete

approvedAt TIMESTAMPTZ

approvedBy TEXT REFERENCES users(id)

createdAt TIMESTAMPTZ DEFAULT NOW()

\-- plan_reviews (audit trail for every review action)

id TEXT PRIMARY KEY

planId TEXT REFERENCES plans(id) ON DELETE CASCADE

userId TEXT REFERENCES users(id)

action TEXT NOT NULL -- approved | rejected | changes_requested | abandoned

notes TEXT -- required for rejected / changes_requested

createdAt TIMESTAMPTZ DEFAULT NOW()

\-- architecture_decisions

id TEXT PRIMARY KEY

planId TEXT REFERENCES plans(id) ON DELETE CASCADE

title TEXT NOT NULL

rationale TEXT NOT NULL

affectedTaskIds TEXT\[\] -- references task IDs

createdAt TIMESTAMPTZ DEFAULT NOW()

\-- tasks

id TEXT PRIMARY KEY -- T-042

planId TEXT REFERENCES plans(id) ON DELETE CASCADE

specId TEXT REFERENCES specs(id)

title TEXT NOT NULL

description TEXT

status TEXT DEFAULT 'todo'

\-- todo | in_progress | blocked | done | failed

dependencyIds TEXT\[\] -- sibling task IDs

executionOrder INTEGER NOT NULL -- dependency-safe sort order

attemptCount INTEGER DEFAULT 0

currentAttemptId TEXT -- FK to current task_attempt

verificationPassed BOOLEAN -- null until attempted

blockedReason TEXT

humanContext TEXT -- user input to unblock

forcedDone BOOLEAN DEFAULT FALSE -- set when manually marked done

createdAt TIMESTAMPTZ DEFAULT NOW()

updatedAt TIMESTAMPTZ DEFAULT NOW()

startedAt TIMESTAMPTZ

completedAt TIMESTAMPTZ

## **5.5 Task Attempts & File Changes**

\-- task_attempts

id TEXT PRIMARY KEY

taskId TEXT REFERENCES tasks(id) ON DELETE CASCADE

attemptNumber INTEGER NOT NULL

status TEXT -- running | succeeded | failed

startedAt TIMESTAMPTZ NOT NULL

endedAt TIMESTAMPTZ

errorMessage TEXT

logLines JSONB -- LogLine\[\] { timestamp, level, message }

\-- level: info | warn | error | debug

\-- file_changes

id TEXT PRIMARY KEY

taskId TEXT REFERENCES tasks(id) ON DELETE CASCADE

attemptId TEXT REFERENCES task_attempts(id)

filePath TEXT NOT NULL

changeType TEXT NOT NULL -- created | modified | deleted

diff TEXT NOT NULL -- unified diff format

linesAdded INTEGER DEFAULT 0

linesRemoved INTEGER DEFAULT 0

createdAt TIMESTAMPTZ DEFAULT NOW()

## **5.6 Sessions & Events**

\-- agent_sessions

id TEXT PRIMARY KEY -- ses_abc

specId TEXT REFERENCES specs(id)

planId TEXT REFERENCES plans(id)

status TEXT DEFAULT 'running'

\-- running | paused | completed | failed | cancelled

currentTaskId TEXT -- which task is active right now

lastHeartbeatAt TIMESTAMPTZ -- updated every 15s by agent

tasksExecuted INTEGER DEFAULT 0

tasksSucceeded INTEGER DEFAULT 0

tasksFailed INTEGER DEFAULT 0

startedAt TIMESTAMPTZ NOT NULL

endedAt TIMESTAMPTZ

startedBy TEXT REFERENCES users(id)

\-- agent_events

id TEXT PRIMARY KEY

sessionId TEXT REFERENCES agent_sessions(id) ON DELETE CASCADE

specId TEXT REFERENCES specs(id)

taskId TEXT -- nullable, not all events are task-level

userId TEXT -- nullable, null for system events

eventType TEXT NOT NULL

\-- PLAN_GENERATED | PLAN_APPROVED | PLAN_REJECTED | CHANGES_REQUESTED

\-- TASK_START | TASK_DONE | TASK_BLOCKED | TASK_FAILED | TASK_RETRIED

\-- SESSION_PAUSED | SESSION_RESUMED | SESSION_COMPLETED | SESSION_FAILED | SESSION_CANCELLED

message TEXT NOT NULL

metadata JSONB DEFAULT '{}'

timestamp TIMESTAMPTZ DEFAULT NOW()

## **5.7 Notifications**

\-- notifications

id TEXT PRIMARY KEY

userId TEXT REFERENCES users(id) ON DELETE CASCADE

type TEXT NOT NULL

\-- plan_generated | plan_approved | plan_rejected | changes_requested

\-- session_complete | session_failed | task_blocked | member_invited | role_changed

title TEXT NOT NULL

body TEXT NOT NULL

linkUrl TEXT NOT NULL

readAt TIMESTAMPTZ -- null = unread

actorUserId TEXT -- null for system (DAEMON) events

createdAt TIMESTAMPTZ DEFAULT NOW()

\-- notification_preferences (one row per user per event type)

userId TEXT REFERENCES users(id) ON DELETE CASCADE

eventType TEXT NOT NULL

email BOOLEAN DEFAULT FALSE

inApp BOOLEAN DEFAULT TRUE

PRIMARY KEY (userId, eventType)

## **5.8 Integrations & Audit**

\-- integrations

id TEXT PRIMARY KEY

projectId TEXT REFERENCES projects(id) ON DELETE CASCADE

type TEXT NOT NULL -- github | slack | webhook

status TEXT -- connected | disconnected | error

config JSONB -- provider-specific: { accessToken, channelId, endpoint, secret }

createdAt TIMESTAMPTZ DEFAULT NOW()

UNIQUE(projectId, type)

\-- audit_log

id TEXT PRIMARY KEY

projectId TEXT REFERENCES projects(id) ON DELETE CASCADE

userId TEXT REFERENCES users(id)

action TEXT NOT NULL

\-- PLAN_APPROVED | PLAN_REJECTED | CHANGES_REQUESTED | MEMBER_INVITED

\-- MEMBER_REMOVED | ROLE_CHANGED | PROJECT_SETTINGS_CHANGED

\-- AGENT_SETTINGS_CHANGED | SESSION_CANCELLED | API_TOKEN_CREATED | API_TOKEN_REVOKED

targetType TEXT -- plan | session | member | settings

targetId TEXT

detail JSONB -- structured diff of what changed

createdAt TIMESTAMPTZ DEFAULT NOW()

# **6\. API Specification**

All endpoints are versioned under /api/v1. All responses return JSON with the envelope { data } on success or { error: { code, message } } on failure. Authentication is required on all endpoints unless explicitly noted.

Authentication: Pass the session cookie (browser clients) or Authorization: Bearer {api_token} header (agent / integrations). The AGENT_TOKEN is a project-scoped API token, not a user session.

## **6.1 Authentication Endpoints**

| **Method** | **Path**                  | **Description**                                                        | **Auth required** |
| ---------- | ------------------------- | ---------------------------------------------------------------------- | ----------------- |
| **POST**   | /api/auth/signin          | Email + password login. Sets httpOnly session cookie.                  | No                |
| **POST**   | /api/auth/signout         | Invalidates session cookie + Redis session key.                        | Yes               |
| **POST**   | /api/auth/forgot-password | Sends reset email. Always returns 200 (never reveals if email exists). | No                |
| **POST**   | /api/auth/reset-password  | Validates token, sets new password, invalidates token.                 | No                |
| **POST**   | /api/auth/accept-invite   | Accepts invite token, creates user, auto-signs in.                     | No                |
| **GET**    | /api/auth/session         | Returns current user and active project context.                       | Yes               |

## **6.2 Projects**

| **Method** | **Path**             | **Description**                                                               |
| ---------- | -------------------- | ----------------------------------------------------------------------------- |
| **GET**    | /api/v1/projects     | List all projects the current user is a member of.                            |
| **POST**   | /api/v1/projects     | Create project. Body: { name, repositoryUrl, repositoryBranch, description }. |
| **GET**    | /api/v1/projects/:id | Get single project with member count and last session summary.                |
| **PATCH**  | /api/v1/projects/:id | Update project settings. Admin only.                                          |
| **DELETE** | /api/v1/projects/:id | Delete project and all children. Owner only. Requires confirmation token.     |

## **6.3 Specifications**

| **Method** | **Path**                        | **Description**                                                                                              |
| ---------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **GET**    | /api/v1/specs                   | List specs for active project. Supports ?status=, ?search=, ?page=.                                          |
| **POST**   | /api/v1/specs                   | Create spec. Body: { name, markdownContent, projectId }. Creates spec + version 1.                           |
| **GET**    | /api/v1/specs/:id               | Get spec with current version, plan summary, and task counts.                                                |
| **PATCH**  | /api/v1/specs/:id               | Update spec name or status only. Content edits create a new version.                                         |
| **DELETE** | /api/v1/specs/:id               | Delete spec. Fails if status = executing. Admin only.                                                        |
| **GET**    | /api/v1/specs/:id/versions      | List all spec versions with metadata (no content).                                                           |
| **GET**    | /api/v1/specs/:id/versions/:vId | Get a specific version's full markdownContent.                                                               |
| **POST**   | /api/v1/specs/:id/versions      | Create new version. Body: { markdownContent }. Increments versionNumber. Abandons current non-complete plan. |

## **6.4 Plans**

| **Method** | **Path**                          | **Description**                                                                                                |
| ---------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **POST**   | /api/v1/specs/:id/plan/generate   | Triggers async plan generation. Returns immediately with { status: pending_plan }. Poll GET to check progress. |
| **GET**    | /api/v1/specs/:id/plan            | Get current plan with all architecture decisions and tasks. Used for polling during generation.                |
| **POST**   | /api/v1/plans/:id/approve         | Approve plan. Admin/Owner only. Body: { notes? }. Creates agent_session, sets status = executing.              |
| **POST**   | /api/v1/plans/:id/reject          | Reject plan. Admin/Owner only. Body: { notes } (required). Sets status = rejected.                             |
| **POST**   | /api/v1/plans/:id/request-changes | Request changes. Admin/Owner only. Body: { notes } (required). Sets status = changes_requested.                |
| **POST**   | /api/v1/plans/:id/abandon         | Abandon plan. Sets status = abandoned.                                                                         |

## **6.5 Tasks**

| **Method** | **Path**                   | **Description**                                                  |
| ---------- | -------------------------- | ---------------------------------------------------------------- |
| **GET**    | /api/v1/tasks/:id          | Full task detail including current attempt and blockedReason.    |
| **PATCH**  | /api/v1/tasks/:id          | Update humanContext, status (manual override), or blockedReason. |
| **POST**   | /api/v1/tasks/:id/retry    | Re-queue task for execution. Increments attemptCount.            |
| **GET**    | /api/v1/tasks/:id/attempts | List all attempts newest-first with logLines and duration.       |
| **GET**    | /api/v1/tasks/:id/changes  | List all file_changes produced by this task's attempts.          |

## **6.6 Sessions**

| **Method** | **Path**                       | **Description**                                                        |
| ---------- | ------------------------------ | ---------------------------------------------------------------------- |
| **GET**    | /api/v1/sessions               | List sessions. Supports ?projectId=, ?specId=, ?status=, ?from=, ?to=. |
| **GET**    | /api/v1/sessions/:id           | Get session with task counts and status.                               |
| **POST**   | /api/v1/sessions/:id/pause     | Pause running session. Agent stops after completing current task.      |
| **POST**   | /api/v1/sessions/:id/resume    | Resume paused session.                                                 |
| **POST**   | /api/v1/sessions/:id/cancel    | Cancel session. Marks in-progress tasks as failed.                     |
| **GET**    | /api/v1/sessions/:id/events    | List agent events for this session, newest-first.                      |
| **POST**   | /api/v1/sessions/:id/heartbeat | Agent-only. Updates lastHeartbeatAt. Returns { shouldStop: bool }.     |

## **6.7 Team Management**

| **Method** | **Path**                                      | **Description**                                                            |
| ---------- | --------------------------------------------- | -------------------------------------------------------------------------- |
| **GET**    | /api/v1/projects/:id/members                  | List project members with role and status.                                 |
| **POST**   | /api/v1/projects/:id/invites                  | Send invite. Body: { email, role }. Admin only.                            |
| **PATCH**  | /api/v1/projects/:id/members/:userId          | Update member role or status. Admin only. Cannot escalate beyond own role. |
| **DELETE** | /api/v1/projects/:id/members/:userId          | Remove member. Admin only. Cannot remove self.                             |
| **POST**   | /api/v1/projects/:id/invites/:inviteId/resend | Resend invite email. Resets token expiry to +7 days.                       |

## **6.8 Notifications & User**

| **Method** | **Path**                       | **Description**                                                         |
| ---------- | ------------------------------ | ----------------------------------------------------------------------- |
| **GET**    | /api/v1/notifications          | List notifications. Supports ?unread=true, ?page=. Returns 50 per page. |
| **POST**   | /api/v1/notifications/read-all | Mark all notifications as read.                                         |
| **PATCH**  | /api/v1/notifications/:id      | Mark single notification read/unread.                                   |
| **GET**    | /api/v1/users/me               | Current user profile.                                                   |
| **PATCH**  | /api/v1/users/me               | Update name. Email cannot be changed via API.                           |
| **POST**   | /api/v1/users/me/password      | Change password. Body: { currentPassword, newPassword }.                |
| **GET**    | /api/v1/users/me/tokens        | List API tokens (masked).                                               |
| **POST**   | /api/v1/users/me/tokens        | Generate API token. Returns full raw token once only.                   |
| **DELETE** | /api/v1/users/me/tokens/:id    | Revoke API token immediately.                                           |

## **6.9 API Error Codes**

| **HTTP Status** | **Error Code**      | **Meaning**                                                                             |
| --------------- | ------------------- | --------------------------------------------------------------------------------------- |
| 400             | VALIDATION_ERROR    | Zod validation failed. Includes field-level errors array.                               |
| 401             | UNAUTHORIZED        | No valid session or token.                                                              |
| 403             | FORBIDDEN           | Authenticated but insufficient role for this action.                                    |
| 404             | NOT_FOUND           | Entity does not exist or does not belong to the active project.                         |
| 409             | CONFLICT            | Duplicate name, stale version, or concurrent edit detected.                             |
| 422             | PRECONDITION_FAILED | Action is valid but entity state prevents it (e.g. approving an already-rejected plan). |
| 429             | RATE_LIMITED        | Too many requests. Retry-After header included.                                         |
| 500             | INTERNAL_ERROR      | Unexpected server error. Request ID included for tracing.                               |

# **7\. Authentication & Authorisation**

## **7.1 Auth System**

- Authentication provider: NextAuth.js v5 (Auth.js) with Credentials provider.
- Session storage: Redis, key = session:{sessionToken}. TTL = 30 days, refreshed on each request.
- Passwords: bcrypt, cost factor 12. Never stored in plain text. Never logged.
- Password reset: time-limited token (UUID, 1 hour TTL) stored in Redis key reset:{token}. Always returns HTTP 200 regardless of whether email exists.
- Invite flow: unique UUID token, 7-day TTL, single-use. Stored in invites table. On use, user is created and token is invalidated in one transaction.
- API tokens: generated as sdk_{projectSlug}\_{48 random hex chars}. Stored as bcrypt hash. Shown to user exactly once on creation.

## **7.2 RBAC - Roles & Permissions**

Roles are per-project. A user can be Admin on Project A and Member on Project B. Owner is a special global role - exactly one per project.

| **Permission**                              | **Viewer** | **Member** | **Admin** | **Owner** |
| ------------------------------------------- | ---------- | ---------- | --------- | --------- |
| View specs, plans, tasks, sessions, changes | ✓          | ✓          | ✓         | ✓         |
| Create and edit specifications              | ✗          | ✓          | ✓         | ✓         |
| Generate plan                               | ✗          | ✓          | ✓         | ✓         |
| Approve / reject plan                       | ✗          | ✗          | ✓         | ✓         |
| Request plan changes                        | ✗          | ✗          | ✓         | ✓         |
| Start / pause / cancel sessions             | ✗          | ✗          | ✓         | ✓         |
| Provide blocking context (unblock task)     | ✗          | ✓          | ✓         | ✓         |
| Manually mark task done / blocked           | ✗          | ✗          | ✓         | ✓         |
| Invite team members                         | ✗          | ✗          | ✓         | ✓         |
| Change member roles (up to own role)        | ✗          | ✗          | ✓         | ✓         |
| View audit log                              | ✗          | ✗          | ✓         | ✓         |
| Modify project and agent settings           | ✗          | ✗          | ✓         | ✓         |
| Manage integrations                         | ✗          | ✗          | ✓         | ✓         |
| Delete project                              | ✗          | ✗          | ✗         | ✓         |
| Transfer ownership                          | ✗          | ✗          | ✗         | ✓         |

UI Rule: Never hide permission-gated actions from lower roles - always show them in a disabled state with a Tooltip explaining the required role. Visibility without access teaches users what is possible and how to request it.

# **8\. Design System**

## **8.1 Design Philosophy**

The aesthetic is developer-native: precision, information density, and honest interfaces. The retro-computing accents (phosphor terminals, monospace IDs, scanline overlays) are applied surgically to agent-facing surfaces only. The base layout is clean and Linear-precise.

Simple by default, powerful on demand: default views hide complexity behind progressive disclosure. Power users unlock depth via keyboard shortcuts, not navigation changes.

## **8.2 Colour Tokens**

| **Token**             | **Hex** | **Usage**                                              |
| --------------------- | ------- | ------------------------------------------------------ |
| \--bg-base            | #0a0a0b | Page background. Never use pure black.                 |
| \--bg-surface         | #111113 | Cards, panels, sidebar, dialogs.                       |
| \--bg-elevated        | #18181b | Hover states, dropdowns, tooltips.                     |
| \--border-default     | #1e1e21 | All borders in layout chrome.                          |
| \--border-muted       | #27272a | Separator lines within surfaces.                       |
| \--text-primary       | #f4f4f5 | Primary text.                                          |
| \--text-secondary     | #a1a1aa | Secondary labels, descriptions.                        |
| \--text-muted         | #52525b | Timestamps, IDs when dev mode off, captions.           |
| \--accent-violet      | #7c5cfc | Primary action, current nav item, running sessions.    |
| \--accent-violet-dim  | #5b3fd4 | Hover state of violet elements.                        |
| \--phosphor-amber     | #ffb300 | Terminal surfaces, retro IDs, blocked state, warnings. |
| \--phosphor-amber-dim | #b45309 | Text on amber surfaces.                                |
| \--status-emerald     | #059669 | Success, done, complete states.                        |
| \--status-red         | #dc2626 | Error, failed, rejected, danger zone.                  |
| \--status-orange      | #d97706 | Failed task attempts, degraded state.                  |
| \--terminal-bg        | #0d0d0a | xterm.js container background.                         |
| \--terminal-green     | #39ff14 | Success lines in terminal output.                      |

## **8.3 Typography**

| **Usage**                               | **Font**                                | **Size**      | **Weight**                  |
| --------------------------------------- | --------------------------------------- | ------------- | --------------------------- |
| Body text                               | Inter                                   | 14px (22 DXA) | Regular 400                 |
| Labels / captions                       | Inter                                   | 12px          | 400 / 500                   |
| Monospace IDs (T-042, SES-001)          | Berkeley Mono / Fira Code / Courier New | 12px          | 400                         |
| Terminal output                         | Berkeley Mono / Fira Code / Courier New | 13px          | 400                         |
| Retro uppercase labels (SPECIFICATIONS) | Inter mono                              | 11px          | 600, letter-spacing: 0.08em |
| Spec editor                             | @uiw/react-codemirror (CodeMirror 6)    | 14px          | 400                         |

## **8.4 Retro Aesthetic System**

Retro elements are applied selectively. The layout chrome (sidebar, top bar, page structure) is clean and modern. Retro accents appear exclusively on terminal/agent-facing surfaces.

- Scanline overlay (.terminal-surface): CSS ::after pseudo-element with repeating-linear-gradient of 0.15 opacity horizontal lines on 4px pitch. Applied to xterm.js containers and agent log panels.
- ASCII progress bars: ▓ for filled segments, ▒ for empty. Monospace font. Used in specs table Tasks column.
- Status characters: ▶ (in_progress, blinking), ✓ (done, emerald), ⚠ (blocked, amber), ✕ (failed, red), ○ (todo, muted).
- Monospace ID badges: T-042, SPEC-003, SES-0091 - code element with amber text, amber-950/30 background, rounded-sm.
- Retro uppercase section labels: uppercase, monospace, letter-spaced, muted - used for section headers like SPECIFICATIONS, EVENT LOG.
- Phosphor palette: amber #ffb300 and green #39ff14 used only within .terminal-surface elements. Never in layout chrome.

## **8.5 Component Rules**

- Buttons: rounded-md everywhere. Never rounded-full. Primary = violet fill. Outline = transparent with border. Destructive = red fill.
- Lists: dense table rows, not card grids. Row height: 36px for task rows, 40px for session rows, 48px for notification rows.
- Loading states: shadcn Skeleton rows. Never spinners on page-level. Button-level operations use button spinner only.
- Toasts: Sonner, bottom-right, max 3 simultaneous. Success auto-close 3s. Error auto-close 6s. Destructive: persist until dismissed.
- Dialogs: shadcn Dialog (full modal) for destructive confirms, onboarding. shadcn AlertDialog (compact) for quick confirms.
- Drawers: Vaul for Task Detail - slides from right, 640px wide on desktop, snap points at 50% and 95% height.

# **9\. DAEMON Mascot Specification**

## **9.1 Identity**

DAEMON (Data-Autonomous Execution Machine - Operational Node) is the app's agent mascot. A small, friendly retro robot rendered as an SVG component. It communicates agent state visually at every level: sidebar (16px), toast (16px), drawers (20-24px), dialogs and empty states (32-64px).

Design lineage: inspired by CRT-era robot aesthetics applied to modern flat SVG style. No outlines - fill only. Amber eyes are the primary emotional indicator. Antenna is the secondary state indicator visible even at 16px.

## **9.2 Physical Design (viewBox: 0 0 34 40)**

| **Part**    | **Specification**                                                                      |
| ----------- | -------------------------------------------------------------------------------------- |
| Body        | Rounded-rect, violet gradient #9b7ffd → #5b3fd4. Slight vertical taper (wider at top). |
| Head/screen | Inset dark panel #1a1025 → #0d0a1a with subtle radial glow from centre.                |
| Eyes        | Amber #ffb300 ellipses. The only warm colour - all emotional focus here.               |
| Antenna     | Thin violet wire from top of body + amber dot tip. Primary 16px state indicator.       |
| Feet        | Two small rounded rects at base of body. Same violet as body.                          |
| Mouth       | Simple arc or flat line. Visible at 32px+. Hidden at 16px.                             |

## **9.3 Expressions**

| **Expression** | **Eyes**                              | **Mouth**            | **Antenna**                       | **Use case**                                      |
| -------------- | ------------------------------------- | -------------------- | --------------------------------- | ------------------------------------------------- |
| idle           | Round amber ellipses                  | Flat line (neutral)  | Upright, slow pulse               | Ready state, empty states, plan approval wait     |
| working        | Horizontal scan-bar (CRT scan effect) | Hidden               | Upright, tip pulses amber         | Active session, plan generation, async operations |
| success        | Wider ellipses (^\_^ shape)           | Upward arc (smile)   | Tips forward slightly, fast pulse | Session complete, task done, approval confirmed   |
| blocked        | Narrowed ellipses (>\_< shape)        | Downward arc (frown) | Droops to -34°                    | Task blocked, needs attention banner              |
| error          | X shape (✕ amber)                     | Deeper downward arc  | Droops to -18°, no pulse          | Session failed, plan rejected, 404 page           |

## **9.4 Usage Sizes & Rules**

| **Size** | **Context**                        | **Visible parts**                     |
| -------- | ---------------------------------- | ------------------------------------- |
| 16px     | Sidebar status bar, toasts         | Body silhouette + antenna angle only  |
| 20-24px  | Plan review banner, blocked banner | Body + eyes (simplified) + antenna    |
| 32px     | Dialog headers, plan states        | Full design - all expressions legible |
| 48-64px  | Empty states, Mission Control idle | Full design with animation            |
| 120px+   | Onboarding, 404 page               | Full design with full animation       |

## **9.5 Microcopy Voice**

DAEMON speaks in first person. Always one sentence. No exclamation marks. No ellipsis. Sparse and purposeful - fewer appearances means more impact.

| **Context**                   | **Copy**                                                |
| ----------------------------- | ------------------------------------------------------- |
| Idle, no specs                | "No specs yet. I'm ready to build something."           |
| Plan ready for approval       | "Ready when you are."                                   |
| Blocked                       | "I hit a wall on T-042. I need your input to continue." |
| Session complete              | "All tasks complete. Ship it."                          |
| Plan generating               | "Working on your plan."                                 |
| Empty sessions                | "No sessions yet. Approve a plan to begin."             |
| All caught up (notifications) | "Nothing to report."                                    |

# **10\. Application Shell**

## **10.1 Persistent Shell (all pages except Spec Editor)**

The app shell is a fixed layout - sidebar and top bar never unmount during navigation. Only the main content area changes.

### **Left Sidebar (240px fixed width)**

- Top: DAEMON sprite (24px) + "SPECDRIVR" wordmark in monospace - logo area.
- Below logo: Project switcher dropdown. Displays current project as org/repo. Clicking opens a popover listing all projects. Switching sets activeProjectId in session and triggers re-fetch of all scoped data.
- Nav links (icon + label, in order): Mission Control · Specifications · Sessions · Settings.
- Active nav item: violet left border + violet text. Inactive: muted text, no border.
- Bottom section: DAEMON status bar (16px animated sprite + status text). See priority table in Section 12. Clicking when state is "N BLOCKED" navigates to Mission Control.
- Below status: version tag (v0.1.0, muted, tiny). Dev Mode badge \[DEV\] in amber monospace when active.

### **Top Bar (per-page, 56px height)**

- Left: page title (bold, 18px) + breadcrumb for nested pages (muted, separated by / ).
- Right (always present): notification bell with unread count badge · user avatar (32px initials circle) + dropdown menu.
- Right (per-page contextual): primary action button(s) that change based on the current page and state.

### **User Avatar Dropdown**

- Shows: name + email (read-only header) · Profile Settings · Security · Notification Preferences · Keyboard Shortcuts · Sign Out.
- Sign Out: immediate, no confirm. Clears session cookie. Redirects to /login.

## **10.2 Global Overlays**

| **Overlay**                | **Trigger**                                          | **Dismissal**          |
| -------------------------- | ---------------------------------------------------- | ---------------------- |
| Task Drawer (Vaul)         | Open Detail → link in task row, or blocked task pill | Escape / close button  |
| New Project Dialog         | \+ New Project button on /projects                   | Escape / Cancel        |
| Approve & Execute Dialog   | \[APPROVE & EXECUTE\] button on PLAN tab             | Escape / \[CANCEL\]    |
| Danger Zone Confirm Dialog | Any Danger Zone action button                        | Escape / \[CANCEL\]    |
| Command Palette            | Cmd+K from anywhere                                  | Escape / click outside |
| Keyboard Shortcut Help     | ? key from anywhere (not in input)                   | Escape                 |
| Notification Panel         | Bell icon click                                      | Click outside / Escape |
| Member Profile Sheet       | View Profile in Team table                           | Escape / close         |

## **10.3 Keyboard Shortcuts**

| **Shortcut**                 | **Action**                                 |
| ---------------------------- | ------------------------------------------ |
| Cmd+K                        | Open command palette                       |
| N                            | New specification (when not in text input) |
| G M                          | Go to Mission Control                      |
| G S                          | Go to Specifications                       |
| G A                          | Go to Sessions (Activity)                  |
| Ctrl+\`                      | Toggle Dev Mode                            |
| ?                            | Show keyboard shortcut reference dialog    |
| Escape                       | Close drawer / dialog / panel              |
| ↑ / ↓ (in task list)         | Move focus between task rows               |
| Enter / Space (in task list) | Expand / collapse focused task row         |
| O (in task list)             | Open Task Drawer for focused row           |

# **11\. Pages - Detailed Specification**

## **11.1 Authentication Pages**

### **Login (/login)**

- Shell: none. Full-page centered layout on #0a0a0b background.
- Card: 400px wide, bg-surface, border, rounded-xl, p-8. Contains: DAEMON idle (48px) + SPECDRIVR wordmark + tagline.
- Fields: EMAIL (text, autofocus) · PASSWORD (password type) · \[Sign In\] (primary violet, full width) · Forgot password? link.
- \[Sign In\] disabled only while request in-flight. Never disabled due to empty fields - server validates.
- Error state: red banner below button ("Invalid email or password."). Never field-level errors - security principle.
- Demo bar (dev only): below card, dashed border, \[Sign in as Admin\] and \[Sign in as Member\] buttons.
- Redirect: unauthenticated access to any route → /login?next={path}. After login → next param or /.

### **Forgot Password (/forgot-password)**

- Single email field. \[Send Reset Link\] button.
- Always shows success state regardless of whether email exists: DAEMON success + "Check your email."

### **Reset Password (/reset-password?token={token})**

- Token validated on page load. Invalid/expired token: DAEMON error + "This link has expired." + \[Request a new link\].
- Two password fields + 4-segment strength indicator (colour only, no text labels).
- Passwords must match. Minimum 12 characters.

### **Accept Invite (/invite?token={token})**

- Token validated on page load. Invalid token: DAEMON error + "This invite link has expired."
- Valid token: email pre-filled (read-only). Fields: Name + Password + Confirm. \[Accept Invite & Sign In\].
- On success: user created, auto-signed in, redirected to / with onboarding overlay (if first time).

## **11.2 Mission Control (/)**

### **Needs Attention Banner (conditional - only when blocked tasks exist)**

- Amber full-width banner. DAEMON blocked (20px) + "I need your help with {N} tasks".
- Blocked task pills inline: T-019 T-033 T-041 - each clickable, opens Task Drawer.
- \[Dismiss\] button right-aligned. Dismissal is session-only - banner re-appears on next load if tasks still blocked.

### **Live Execution Panel (left 60%)**

- Session running: header with ● LIVE badge (pulsing violet) + Session ID (mono amber) + elapsed timer. Progress bar: N / N tasks. Current task line: ▶ T-019 · Scaffold auth middleware (blinking ▶). xterm.js log tail (200px height, last ~20 lines, ANSI colours, scanline overlay, auto-scroll). Footer: \[PAUSE\] · \[CANCEL\] buttons.
- Session paused: same layout but timer frozen, \[RESUME\] instead of \[PAUSE\], amber ⏸ PAUSED indicator, terminal shows > SESSION PAUSED line.
- Session just completed (< 60s): DAEMON success (48px) + "Execution complete." + "N/N tasks succeeded." + \[View Changes →\] link. Auto-clears to idle after 60 seconds.
- No active session: DAEMON idle (48px, centred) + "SYSTEM READY" (mono, muted) + "No active session." + link to /specs.
- Boot sequence: when a new session starts, 800ms typewriter animation in terminal before real log lines begin.

### **Event Log Feed (right 40%)**

- Header: EVENT LOG (mono, muted, uppercase, small). Last 30 agent events.
- Row format: timestamp (mono) · \[EVENT_TYPE\] (colour-coded) · entity ID · description.
- Colour coding: \[TASK_DONE\] emerald · \[BLOCKED\] amber · \[ERROR\] red · \[PLAN_\*\] violet.
- Newest row has pulsing dot if session active. View all → link to /sessions.

## **11.3 Projects (/projects)**

- Table columns: ID (mono amber) · Name · Repository (mono, org/repo) · Branch (mono) · Specs count · Last Run · Status · ⋯ menu.
- \+ New Project (top bar) → New Project Dialog: Name · Repository URL · Branch (default: main) · Description. \[Initialize Project\] button.
- Row click → sets active project → navigates to /specs.
- Empty state: DAEMON idle + "No projects yet." + "Point me at a repository and I'll get to work." + \[Initialize First Project\].

## **11.4 Specifications (/specs)**

- Table columns: ID (mono amber) · Name · Status badge · Version (mono, muted) · Tasks (ASCII progress bar ▓▒) · Plan badge · Last Run · ⋯ menu.
- Status badges: DRAFT (muted) · GENERATING (violet, pulsing) · REVIEW (amber) · RUNNING (violet, pulsing) · STALLED (red) · DONE (emerald).
- \+ New Spec → navigates to /specs/new (not a dialog).
- Empty state: DAEMON idle + "No specifications." + "Write what you want to build. I'll figure out the how." + \[Write First Spec\].

## **11.5 Spec Editor (/specs/new, /specs/\[id\]/edit)**

- Full-page. Sidebar hidden. Top bar only: back arrow · spec name (large input, mono font) · \[Save Draft\] · \[Save & Generate Plan\].
- \[Save Draft\]: enabled when name is non-empty. \[Save & Generate Plan\]: enabled when name filled AND content ≥ 50 characters.
- Layout: two-pane split with drag handle, default 50/50. Left: CodeMirror 6 editor (line numbers, active line highlight, wrap on). Right: live preview (Markdown rendered, prose styles).
- Footer strip: word count · line count · version indicator (v3 if editing).
- If editing a spec with an active plan: amber sticky banner - "⚠ This spec has an active plan (vN). Saving will create vN+1 and abandon the current plan."
- If Changes Requested by reviewer: amber sticky banner quoting the reviewer's note.
- Concurrent edit warning: if another user has the editor open, amber banner - "\[Name\] is currently editing this spec."

## **11.6 Specification Detail (/specs/\[id\])**

### **Page Header**

- SPEC-003 badge (mono amber) above spec name h1. Status indicator + plan status badge.
- Contextual action button (right):
  - drafting / stalled → \[Generate Plan →\] (primary violet)
  - pending_approval → \[Review Plan →\] (amber outline) - scrolls to PLAN tab
  - executing → \[▶ SES-0091\] (violet link) + \[PAUSE\] (outline)
  - complete → \[Re-run\] + \[Edit\] (both outline)
- ⋯ menu: Edit · Duplicate · Delete (contextual based on status).

### **Tab: SPEC**

- Rendered Markdown of current version.
- Version history strip: v1 Jan 3 → v2 Jan 8 → v3 Jan 12 (current) - clickable pills. Clicking shows that version's content inline with a "Viewing v1 · Not current" banner. \[Back to current\] link.

### **Tab: PLAN**

- No plan: DAEMON idle + "No plan generated." + \[Generate Plan\] button.
- pending_approval: amber review banner (DAEMON idle 20px + summary + three action buttons) → Architecture Decisions accordion → Execution plan (task list, read-only, all tasks show ○) → Review History (collapsed).
- changes_requested: amber banner with quoted note + \[Edit Spec →\]. Plan content visible but greyed. No action buttons.
- rejected: red banner with quoted reason + \[Generate New Plan\] + \[View Rejected Plan ▾\] collapsible.
- approved / executing / complete: plan content read-only + approval timestamp. No action buttons.

### **Plan Review Action Buttons (pending_approval only)**

- \[Request Changes\] (amber outline): slide-down panel with required textarea. On submit: plan → changes_requested, spec author notified.
- \[Reject Plan\] (red outline): slide-down panel with required reason textarea + warning text. On confirm: plan → rejected, spec → drafting.
- \[Approve & Execute\] (primary violet): opens Approval Confirmation Dialog. Admin/Owner only. Member sees disabled button with Tooltip.
- Approval Confirmation Dialog: DAEMON working (32px) + repo/branch + task count + optional notes field. \[CANCEL\] · \[CONFIRM EXECUTION\].

### **Tab: TASKS**

- pending_approval state: task list visible (read-only preview, no click handlers) + amber notice strip: "Tasks will begin executing after plan approval."
- Other states: full interactive list. Filter pills (ALL · TODO · RUNNING · BLOCKED · DONE · FAILED) + search. Summary strip with colour-coded counts.
- Task row (36px): status char · T-042 (mono amber) · title · duration (muted, right) · ⋯ menu.
- Blocked rows: red left border · ⚠ · blockedReason truncated inline (60 chars).
- Click row (not ⋯): inline expand - description (3 lines) · dependency pills · last log line · attempt count if > 1 · \[Open Detail →\] link.
- \[Open Detail →\] or ⋯ → View Full Detail → opens Task Drawer. Row click never opens drawer directly.

### **Tab: CHANGES**

- Header: FILE CHANGES (mono) + +142 −38 summary (green/red, mono).
- Two-pane: file tree (200px, +/~/- prefix, file path mono, line counts) + Shiki diff viewer (line numbers, green additions, red deletions, via T-019 task link).

### **Tab: ACTIVITY**

- Event log scoped to this spec, grouped by session. Session headers collapsible. Links to /sessions filtered to that session.

## **11.7 Task Drawer (Vaul Overlay)**

- Entry: \[Open Detail →\] in expanded task row, or ⋯ → View Full Detail, or blocked task pill in Mission Control.
- Header: T-042 (mono amber, large) · title · status badge (editable inline dropdown) · DAEMON sprite (expression = task status).

### **Tab: OVERVIEW**

- Description (Markdown rendered). Dependencies (↳ linked pills - click navigates to that task's drawer). Architecture decisions referencing this task.
- Blocked state: red surface panel · DAEMON blocked (24px) · blockedReason text · Context textarea ("Provide context for DAEMON") · \[RETRY WITH CONTEXT\] button (violet, disabled until textarea non-empty).
- Failed state: orange panel · last error message · \[RETRY\] button.

### **Tab: ATTEMPTS**

- List newest-first. Each row header: Attempt N · status · duration · timestamp (collapsible).
- Expanded: xterm.js terminal panel (320px, ANSI colours, scanline overlay, scrollable).
- In-progress attempt: auto-scroll + blinking cursor.

### **Tab: CHANGES**

- Shiki diff viewer scoped to this task. Empty state: DAEMON idle + "No file changes yet." if task not complete.

### **Footer Actions (context-sensitive)**

- \[RE-RUN\] · \[MARK BLOCKED\] · \[MARK DONE\] - shown only when contextually valid. Never shown for done tasks in terminal state.

## **11.8 Sessions (/sessions)**

- Filter bar: search · status filter · spec dropdown · date range.
- Timeline grouped by date: TODAY / YESTERDAY / THIS WEEK (mono uppercase group headers).
- Session row (40px): status dot (pulsing violet if running) · session ID (mono amber) · spec name (linked) · time range · task count + status char · ⋯ menu.
- Click row: inline expand with per-task event log (mono, colour-coded). Running session: mini xterm.js panel (120px) at bottom of expanded row.

## **11.9 Notifications (/notifications)**

- Filter tabs: All · Unread · Mentions. Full-width list, 56px rows.
- \[Mark all read\] button (top right). Infinite scroll (50 per page).
- Bell icon in top bar: amber numeric badge (max: 9+). Click → Notification Panel (Popover, 380px wide, 480px max).

## **11.10 Settings (/settings)**

### **Sub-navigation (200px left column)**

- ACCOUNT: Profile · Security · Notifications
- PROJECT: General · Team · Integrations · Agent · Audit Log
- DANGER ZONE

### **Profile**

- Initials avatar (64px, deterministic colour from name hash). Name field (editable). Email (read-only, with note).

### **Security**

- Change password: Current · New · Confirm. Same strength indicator as reset flow.
- Active sessions table: Device · Location · Last active · \[Revoke\]. Current session highlighted "(this session)", no revoke. \[Revoke all other sessions\] link.
- API tokens table: Name · Prefix · Created · Last used · Expires · \[Revoke\]. \[+ Generate Token\] → Dialog (name + expiry radio) → one-time reveal dialog on creation.

### **Notifications**

- Two-column toggle grid: event type (left) · Email switch · In-app switch. \[Save Preferences\] at bottom.

### **General (Project)**

- Name · Description · Repository URL (with \[Verify Connection\] inline) · Default Branch · Timezone. \[Save Changes\].

### **Team**

- Invite section: email + role dropdown + \[Send Invite\] in one row.
- Members table: Avatar+Name · Email · Role (inline editable popover) · Status · Last Active · ⋯ menu.
- ⋯ menu: View Profile · Resend Invite (if invited) · Suspend (if active) · Reactivate (if suspended) · Remove from Project.

### **Integrations**

- Card grid (3 columns). GitHub: OAuth connect, webhook URL after connect, event checkboxes. Slack: OAuth connect, channel selector, event toggles. Generic Webhook: endpoint URL + HMAC secret + event checkboxes.

### **Agent**

- Max concurrent tasks (Slider 1-10). Task timeout (number input, live human-readable preview). Max retries (Slider 0-5). Retry delay (Select). Require approval (Switch, default ON, disabling requires AlertDialog). Auto-generate plan (Switch). Plan expiry (Select).
- Agent Token section: masked token display + rotation instructions. Never editable here - set via environment variable.

### **Audit Log**

- Admin/Owner only. Filter bar: search · actor · action type · date range. Full-width table. Row expand shows raw JSON detail (.terminal-surface). \[Export CSV\].

### **Danger Zone**

- \[Abandon All Sessions\] → AlertDialog (no type-to-confirm needed).
- \[Reset Agent Settings to Defaults\] → AlertDialog.
- \[Delete All Specs & Plans\] → type project name to confirm.
- \[Delete Project\] → two-step: AlertDialog first, then type-to-confirm dialog. Success → navigates to /projects.

# **12\. State Machines**

## **12.1 Spec Status**

| **Transition**                  | **Trigger**                     | **Side effects**                                                          |
| ------------------------------- | ------------------------------- | ------------------------------------------------------------------------- |
| (none) → drafting               | Spec created (Save Draft)       | Creates spec + version 1                                                  |
| drafting → pending_plan         | Save & Generate Plan clicked    | Creates new version if editing; triggers async plan generation            |
| pending_plan → pending_approval | Plan generation succeeds        | Plan record created with all tasks and arch decisions; notifications sent |
| pending_plan → stalled          | Plan generation fails           | Plan record with error; DAEMON error state; notification sent             |
| pending_approval → executing    | Plan approved                   | Plan status → approved; agent_session created; first task queued          |
| pending_approval → stalled      | Plan rejected                   | Plan status → rejected; notification to spec creator                      |
| pending_approval → stalled      | Changes requested               | Plan status → changes_requested; notification to spec creator             |
| executing → complete            | All tasks reach done            | Session completed; notifications sent; confetti on Mission Control        |
| executing → stalled             | Session cancelled               | In-progress tasks → failed; DAEMON idle                                   |
| any → drafting                  | Spec edited (new version saved) | New spec_version; active non-complete plan → abandoned                    |
| complete → pending_plan         | Re-run triggered                | New plan generation cycle begins                                          |

## **12.2 Plan Status**

| **Status**        | **Meaning**                                                            | **Next valid statuses**                          |
| ----------------- | ---------------------------------------------------------------------- | ------------------------------------------------ |
| pending_approval  | Plan generated, awaiting review. Approval buttons visible.             | approved, rejected, changes_requested, abandoned |
| approved          | Admin approved. Session starting/running.                              | complete (via executing implicitly)              |
| rejected          | Rejected by reviewer. Cannot be recovered - must generate new plan.    | (terminal)                                       |
| changes_requested | Reviewer wants spec changes first. Cannot approve until spec re-saved. | (terminal for this plan - new plan needed)       |
| abandoned         | Spec was edited while plan was active. Auto-set.                       | (terminal)                                       |
| complete          | All tasks done.                                                        | (terminal)                                       |

## **12.3 Task Status**

| **Status**  | **Character** | **Colour** | **Can transition to**               |
| ----------- | ------------- | ---------- | ----------------------------------- |
| todo        | ○             | Muted      | in_progress                         |
| in_progress | ▶ (blink)     | Violet     | done, failed, blocked               |
| blocked     | ⚠             | Amber      | in_progress (on retry with context) |
| done        | ✓             | Emerald    | todo (on re-run, manual override)   |
| failed      | ✕             | Red        | todo (on retry)                     |

## **12.4 Session Status**

| **Status** | **Panel state on Mission Control**                       | **DAEMON sidebar**                             |
| ---------- | -------------------------------------------------------- | ---------------------------------------------- |
| running    | Live panel with log stream, timer, progress              | working · T-{taskId} (violet)                  |
| paused     | Same panel, timer frozen, \[RESUME\] button, ⏸ indicator | idle · PAUSED (amber)                          |
| completed  | DAEMON success + summary (auto-clears after 60s)         | success · COMPLETE (brief), then READY         |
| failed     | DAEMON error + \[View Session →\] + \[Retry →\]          | error · SESSION FAILED (red, highest priority) |
| cancelled  | Returns to idle state immediately                        | idle · READY                                   |

## **12.5 Sidebar DAEMON Priority**

| **Priority** | **Condition**         | **Expression** | **Text**                       | **Colour** |
| ------------ | --------------------- | -------------- | ------------------------------ | ---------- |
| 1 (highest)  | Any session failed    | error          | DAEMON · SESSION FAILED        | Red        |
| 2            | Any task blocked      | blocked        | DAEMON · N BLOCKED (clickable) | Amber      |
| 3            | Any session running   | working        | DAEMON · T-{taskId}            | Violet     |
| 4            | Any session paused    | idle           | DAEMON · PAUSED                | Amber      |
| 5            | Plan pending approval | idle           | DAEMON · PLAN READY            | Amber      |
| 6 (lowest)   | None of above         | idle           | DAEMON · READY                 | Muted      |

# **13\. Integrations**

## **13.1 GitHub Integration**

- OAuth flow: redirect to GitHub → return to /settings/integrations?connected=github. Stores encrypted access token in integrations.config.
- After connect: webhook URL revealed - https://{domain}/api/webhooks/github/{projectId}. User configures this in GitHub repo settings.
- Supported events: push to watched branch (notifies team) · pull_request opened that references a spec.
- The DAEMON agent uses a separate GITHUB_TOKEN environment variable (PAT or GitHub App token) with repo read/write scope to clone, branch, commit, and push. This is not the OAuth token - it is the agent's operational credential.
- Agent git workflow per task: git checkout -b daemon/spec-{specId}/task-{taskId} · make changes · git commit -m "feat(T-042): {task title}" · git push. Never pushes to main directly.

## **13.2 Slack Integration**

- OAuth flow: redirect to Slack → return to /settings/integrations?connected=slack. Stores bot token + selected channel.
- Notification events sent to Slack channel: session_started · session_completed · session_failed · task_blocked.
- Slack message format: simple block kit message. No complex attachments. Includes direct link back to Specdrivr.

## **13.3 Generic Webhooks**

- User configures endpoint URL + optional HMAC-SHA256 secret + event subscription checkboxes.
- POST body: { event: string, timestamp: ISO8601, projectId, specId?, sessionId?, taskId?, data: {...} }.
- If secret configured: X-Specdrivr-Signature header = HMAC-SHA256(secret, raw body). Receiving server should verify.
- Retry policy: exponential backoff (1s, 5s, 30s, 5m). After 4 failures, webhook marked error status in UI.

## **13.4 DAEMON Agent Protocol**

The DAEMON agent is a separate process that communicates with the Specdrivr API. It does not access the database directly.

| **Agent action**      | **API call**                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------- |
| Poll for next task    | GET /api/v1/sessions/{id} - checks currentTaskId and shouldStop                               |
| Heartbeat (every 15s) | POST /api/v1/sessions/{id}/heartbeat - server returns { shouldStop: bool }                    |
| Write task log line   | PATCH /api/v1/tasks/{id} with { logLine: { level, message } }                                 |
| Mark task in-progress | PATCH /api/v1/tasks/{id} with { status: "in_progress" }                                       |
| Mark task done        | PATCH /api/v1/tasks/{id} with { status: "done", verificationPassed: true }                    |
| Mark task blocked     | PATCH /api/v1/tasks/{id} with { status: "blocked", blockedReason }                            |
| Submit file change    | POST /api/v1/tasks/{id}/changes with { filePath, changeType, diff, linesAdded, linesRemoved } |
| Mark session complete | POST /api/v1/sessions/{id}/complete                                                           |

Session health: if lastHeartbeatAt is > 60 seconds old, the web application shows a "Session may have lost connection" banner. If > 5 minutes old, the session is automatically marked failed and a notification is sent.

# **14\. Onboarding**

Triggered after invite acceptance or first login when onboardingDone = false. A full-page modal overlay (backdrop blur, app dimly visible behind). Three steps, ~30 seconds total. No skip button.

| **Step** | **Title**     | **Content**                                                                                                                                                                                                                                  |
| -------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 / 3    | Welcome       | DAEMON idle (64px) + "Welcome to Specdrivr, {Name}. I'm DAEMON. I'll execute your specifications as code. Here's how we work together." + \[Get Started →\]                                                                                  |
| 2 / 3    | The Flow      | Visual flow diagram: \[Write Spec\] → \[I Generate a Plan\] → \[You Approve\] → \[I Build It\]. Human steps in violet, DAEMON steps in amber. Caption: "You stay in control. I never execute without your approval." + \[← Back\] \[Next →\] |
| 3 / 3    | First Project | Inline form: Project name · Repository URL · Branch. \[Create Project & Start\]. On success: overlay closes, land on /specs (empty state).                                                                                                   |

onboardingDone flag is set to true on step 3 completion. Never shown again. Can be restarted via Settings → General → \[Restart Onboarding Tour\] link.

# **15\. Notification System**

## **15.1 Delivery Channels**

- In-app: Notification Panel (bell icon popover) + /notifications page. Polled every 3 seconds (same interval as session polling).
- Email: transactional via Resend. Templates are plain-text-first, minimal HTML. Never send more than one email per event per user.

## **15.2 Notification Events & Defaults**

| **Event**         | **Trigger**                                          | **Email default** | **In-app default** |
| ----------------- | ---------------------------------------------------- | ----------------- | ------------------ |
| plan_generated    | Plan generation complete for a spec the user created | Off               | On                 |
| plan_approved     | Plan approved (notify spec creator and team members) | Off               | On                 |
| plan_rejected     | Plan rejected (notify spec creator)                  | On                | On                 |
| changes_requested | Changes requested (notify spec creator)              | On                | On                 |
| session_complete  | Execution session completed                          | Off               | On                 |
| session_failed    | Execution session failed                             | On                | On                 |
| task_blocked      | Task blocked - for specs the user owns               | On                | On                 |
| member_invited    | User invited to a project                            | On                | On                 |
| role_changed      | User's role in a project changed                     | On                | On                 |

## **15.3 Notification Panel Behaviour**

- Bell badge: amber background, white text, max displayed "9+". Updates via 3-second poll on GET /api/v1/notifications?unread=true&count=true.
- Click notification row: marks as read (PATCH /api/v1/notifications/{id}) + navigates to linkUrl. Single action, no separate mark-read step.
- \[Mark all read\]: POST /api/v1/notifications/read-all. Badge clears immediately (optimistic).

# **16\. Error States & Edge Cases**

## **16.1 Spec Name Collision**

If a user saves a spec with the same name as an existing spec in the project, the server returns HTTP 409 CONFLICT. The editor shows an inline error below the name field with a generated suggestion chip (clicking fills the name field).

## **16.2 Session Auto-Recovery**

If lastHeartbeatAt is > 60 seconds old on a session with status = running, Mission Control and Spec Detail show a yellow banner: "Session SES-0091 may have lost connection. Last heartbeat N minutes ago." with \[Check Status\] and \[Abandon Session\] buttons. \[Check Status\] pings the session health endpoint; if dead, marks session failed. After 5 minutes without heartbeat, the server auto-marks the session failed and sends notifications.

## **16.3 Concurrent Edit Warning**

If two users open the same Spec Editor simultaneously, each sees an amber banner: "\[Name\] is currently editing this spec." On save with a stale currentVersionId, the server returns HTTP 409 with options to \[View their changes\] or \[Save anyway as a new version\].

## **16.4 Task Dependency Violation**

If a user manually marks a task done when its dependencies are not yet done, the server returns HTTP 422. An AlertDialog presents the dependency conflict and offers \[Force Mark Done\] which sets forcedDone: true on the task record.

## **16.5 Plan Generation Timeout**

If plan generation takes > 30 seconds: the PLAN tab updates subtext to "Still working... complex specs take a moment." After 2 minutes with no response: DAEMON error + "Plan generation is taking longer than expected." + \[Check again\] (re-polls) + \[Cancel generation\] link.

## **16.6 Permission-Gated Actions**

Actions unavailable to the current user's role are never hidden from the DOM - they are always visible in a disabled state with a Tooltip naming the required role and, where applicable, a secondary \[Request Approval\] button visible to Members that sends a notification to all Admins.

## **16.7 Session Limit Warning**

If maxConcurrentTasks = 1 and a task is already running, clicking \[RE-RUN\] in the Task Drawer shows an inline note: "Max concurrent tasks (1) reached. This task will queue and start when the current task completes." with \[Queue Anyway\] and \[Cancel\] options.

## **16.8 404 / Unmatched Routes**

DAEMON error expression (large, centred) + "404 - Not found." + "This page doesn't exist or you don't have access." + \[Go to Mission Control\] link.

# **17\. Non-Functional Requirements**

## **17.1 Performance**

| **Metric**                      | **Target**                                               |
| ------------------------------- | -------------------------------------------------------- |
| Page load (Time to Interactive) | < 2 seconds on 4G connection                             |
| API response time (p95)         | < 300ms for all read endpoints                           |
| Plan generation latency         | < 30 seconds for specs up to 5,000 words                 |
| Task log streaming lag          | < 1 second from agent write to UI display (via 3s poll)  |
| Diff rendering                  | < 500ms for diffs up to 10,000 lines (Shiki server-side) |
| Notification badge update       | < 3 seconds from event creation to badge update          |

## **17.2 Security**

- All input validated with Zod at the API boundary. No raw SQL string interpolation - parameterised queries only (Drizzle ORM enforces this).
- Rate limiting: Upstash Ratelimit in proxy.ts. Auth endpoints: 10 req/min per IP. API endpoints: 100 req/min per user. Agent endpoints: 1000 req/min per token.
- CSRF protection: NextAuth.js handles for session-based requests. API token requests are exempt (no cookies involved).
- Secrets: never stored in database. Never logged. Never returned in API responses (except one-time token reveal). AGENT_TOKEN visible only in infrastructure environment variables.
- import 'server-only' on lib/db.ts, lib/env.ts, lib/logger.ts - build-time enforcement of server boundary.
- Audit log: all administrative actions are written to audit_log within the same DB transaction as the action. Cannot be suppressed.

## **17.3 Accessibility**

- WCAG 2.1 AA compliance target.
- All interactive elements: keyboard focusable with visible focus ring (violet 2px outline).
- ARIA attributes on all custom components (Radix primitives handle most automatically).
- Colour is never the sole indicator of state - always paired with a text label or icon.
- DAEMON sprite: role="img" with aria-label describing current expression and meaning.
- Terminal panels (xterm.js): not keyboard-accessible internally, but all terminal content is also available in structured form via the ATTEMPTS tab log lines.

## **17.4 Data Retention & Privacy**

- Session and event logs retained for 90 days by default (configurable per project).
- User data: name and email. No tracking, no analytics cookies, no third-party pixels.
- Spec content: retained indefinitely unless the spec is deleted by an Admin/Owner.
- File change diffs: retained with the session that produced them. Deleted when session is deleted.
- GDPR: user account deletion (by Owner) removes all personal data. Spec history and agent events retain only userId references which become null-valued after deletion.

## **17.5 Observability**

- Structured logging: Pino, JSON format, level-gated (info in prod, debug in dev). Correlation ID on every request.
- Never log: passwords, tokens, session cookies, PII (email, name), spec content, or diff content.
- Error tracking: Sentry or equivalent - capture unhandled exceptions with request context. PII scrubbed before submission.
- Health endpoint: GET /api/health returns { status: "ok", db: bool, redis: bool } - used by load balancer.

# **18\. Reference Seed Data**

The following seed data must be present in development and demo environments. Every spec status must be represented. See the State Machine & Correctness prompt for the full rationale.

## **18.1 Users**

| **ID**   | **Name**    | **Email**            | **Role** | **Purpose**                                        |
| -------- | ----------- | -------------------- | -------- | -------------------------------------------------- |
| user_001 | Alex Rivera | <alex@example.com>   | Admin    | Primary demo user. Approval buttons enabled.       |
| user_002 | Sam Okafor  | <sam@example.com>    | Member   | Demo Member. Approval button visible but disabled. |
| user_003 | Jordan Chen | <jordan@example.com> | Viewer   | Demo Viewer. Read-only.                            |

## **18.2 Specifications (one per status)**

| **ID**   | **Name**                            | **Status**       | **Plan status**  | **Purpose**                                              |
| -------- | ----------------------------------- | ---------------- | ---------------- | -------------------------------------------------------- |
| spec_001 | Authentication & Session Management | pending_approval | pending_approval | PRIMARY DEMO - all review buttons must be active here.   |
| spec_002 | PostgreSQL Schema Migration         | executing        | approved         | Shows active session, mixed task statuses, blocked task. |
| spec_003 | REST API Rate Limiting              | complete         | complete         | Shows finished execution and file changes.               |
| spec_004 | Real-time Notification System       | drafting         | null             | No plan yet - tests empty PLAN/TASKS state.              |
| spec_005 | File Upload Pipeline                | stalled          | rejected         | Tests rejection flow and \[Generate New Plan\] button.   |
| spec_006 | Admin Dashboard                     | pending_plan     | null             | Tests the generating/loading PLAN tab state.             |

Critical seed constraint: spec_001's plan must have approvedAt: null and status: 'pending_approval'. It must NOT be pre-approved. This is the primary demonstration of the product's core value proposition.

## **18.3 Required Blocked Task**

task_105 in spec_002 must have status: "blocked" with blockedReason: "Cannot determine correct rollback order for the composite index on (user_id, created_at). Need guidance." This ensures the Needs Attention banner on Mission Control is active on initial load, demonstrating the unblocking flow without any user action.

# **19\. Async Simulation Requirements (Development / Demo Mode)**

In development and demo environments, async operations must be simulated with realistic delays. Instant resolutions obscure loading states and make the application feel unreliable rather than fast.

| **Action**                         | **Minimum delay**                   | **End state**                              |
| ---------------------------------- | ----------------------------------- | ------------------------------------------ |
| Save & Generate Plan               | 2000ms (pending_plan), then resolve | pending_approval with full plan content    |
| Approve & Execute (dialog confirm) | 800ms                               | executing, session created, DAEMON working |
| Pause session                      | 400ms                               | paused across all surfaces                 |
| Resume session                     | 400ms                               | running                                    |
| Retry with context (unblock)       | 600ms                               | in_progress, new attempt row               |
| Reject plan                        | 600ms                               | rejected state on PLAN tab                 |
| Request changes                    | 600ms                               | changes_requested state on PLAN tab        |
| Initialize project                 | 1000ms                              | project row in table                       |
| Sign in                            | 800ms                               | redirect to / or error state               |
| Mark task done / blocked           | 400ms                               | updated task state in drawer and list      |

Rule: No async action should resolve in under 400ms. Users need to observe the loading state to build a mental model that the operation involved a real network round-trip. Instant transitions feel like bugs, not speed.

# **20\. Empty States & Microcopy Reference**

| **Context**                  | **DAEMON** | **Heading**           | **Subtext**                                                              | **CTA**                      |
| ---------------------------- | ---------- | --------------------- | ------------------------------------------------------------------------ | ---------------------------- |
| /projects (no projects)      | idle       | No projects yet.      | Point me at a repository and I'll get to work.                           | \[Initialize First Project\] |
| /specs (no specs)            | idle       | No specifications.    | Write what you want to build. I'll figure out the how.                   | \[Write First Spec\]         |
| PLAN tab (no plan)           | idle       | No plan generated.    | Run me on this spec and I'll produce an architecture and execution plan. | \[Generate Plan\]            |
| PLAN tab (rejected)          | error      | Plan rejected.        | {Reviewer} rejected this plan. Edit the spec or generate a new one.      | \[Generate New Plan\]        |
| TASKS tab (no approved plan) | idle       | No tasks yet.         | Tasks are created when a plan is approved.                               | \[Go to Plan →\]             |
| CHANGES tab (no changes)     | idle       | No file changes.      | Changes will appear here once DAEMON starts executing tasks.             | \[View Tasks →\]             |
| ACTIVITY tab (no sessions)   | idle       | No sessions yet.      | Approve a plan to start the first execution session.                     | \[Go to Plan →\]             |
| Task Drawer CHANGES (none)   | idle       | No changes yet.       | DAEMON hasn't modified any files for this task.                          | none                         |
| /sessions (empty)            | idle       | No sessions recorded. | Sessions appear here once execution begins.                              | none                         |
| /notifications (empty)       | idle       | All caught up.        | Nothing to report.                                                       | none                         |
| Audit log (empty)            | idle       | No audit entries.     | Administrative actions will be logged here.                              | none                         |
| Team (no members)            | idle       | Just you.             | Invite your team to collaborate on specs and review plans.               | \[Invite Someone\]           |
| 404                          | error      | 404 - Not found.      | This page doesn't exist or you don't have access.                        | \[Go to Mission Control\]    |
| Mission Control (idle)       | idle       | SYSTEM READY          | No active session. Open a spec to begin.                                 | link to /specs               |

# **21\. Extended Data Model - Missing & Corrected Fields**

This section documents fields omitted from Section 5 that are required for correct UI rendering, agent protocol operation, cost tracking, or developer API correctness. These are additive to the tables already specified.

## **21.1 Users - Additional Fields**

\-- add to users

avatarUrl TEXT -- populated from OAuth provider; overrides initials avatar

timezone TEXT -- IANA tz string, e.g. "America/New_York". Default: "UTC"

locale TEXT -- BCP-47 e.g. "en-US". Used for date/number formatting in UI

onboardingStep INTEGER DEFAULT 0 -- 0 = not started, 1-3 = step reached, 4 = complete

timezone and locale are set during onboarding step 1 (browser Intl.DateTimeFormat().resolvedOptions() pre-fill) and editable in Profile settings. All timestamps stored in UTC; converted to user timezone only at display time - never on write.

## **21.2 Projects - Additional Fields**

\-- add to projects

slug TEXT UNIQUE NOT NULL -- URL-safe name for display, e.g. "auth-service"

createdBy TEXT REFERENCES users(id) ON DELETE SET NULL

avatarColor TEXT DEFAULT '7c5cfc' -- hex, deterministic from name hash if not set

isDemo BOOLEAN DEFAULT FALSE -- seed/demo projects, shown differently in UI

slug is auto-generated from name (lowercase, hyphens, max 40 chars) and checked for uniqueness. Editable in General settings. Used in browser tab titles and breadcrumbs.

## **21.3 Invites - Additional Fields**

\-- add to invites

invitedBy TEXT NOT NULL REFERENCES users(id) -- who sent the invite

resendCount INTEGER DEFAULT 0 -- incremented on each resend

lastResentAt TIMESTAMPTZ

invitedBy is needed in the Team table ("Invited by Alex" displayed under pending invites). Resend is limited to 5 times per invite token to prevent abuse.

## **21.4 Plans - Additional Fields**

\-- add to plans

generationDurationMs INTEGER -- wall-clock time for plan generation (for observability)

generationError TEXT -- error message if generation failed (spec → stalled)

modelVersion TEXT -- e.g. "claude-opus-4-6" - the model that generated this plan

taskCount INTEGER -- denormalized: COUNT(tasks) for display without join

totalEstimatedMinutes INTEGER -- sum of task.estimatedMinutes for session ETA

generationDurationMs is displayed in the plan banner as "Generated in 14s". modelVersion is shown in Plan → Audit History. taskCount avoids a COUNT query on every specs list row.

## **21.5 Tasks - Additional Fields**

\-- add to tasks

estimatedMinutes INTEGER -- DAEMON's estimate from plan generation

actualDurationMs INTEGER -- computed: completedAt - startedAt in ms

gitBranch TEXT -- e.g. "daemon/spec-abc/task-T042" - set on first attempt

gitCommitHash TEXT -- the commit DAEMON produced for this task

expectedFiles TEXT\[\] -- file paths DAEMON declared it would touch (from plan)

agentVersion TEXT -- version string of DAEMON agent that ran this task

promptTokensUsed INTEGER -- LLM input tokens for this task

completionTokensUsed INTEGER -- LLM output tokens

totalCostUsd NUMERIC(10,6) -- computed from token counts + model pricing at run time

gitBranch and gitCommitHash enable deep linking from the CHANGES tab directly to the GitHub commit. expectedFiles vs actual file_changes is shown as a "plan accuracy" indicator in the Task Drawer OVERVIEW tab. Token costs are shown in Dev Mode overlay per task, and aggregated in the Usage section of Settings.

## **21.6 Task Attempts - Additional Fields**

\-- add to task_attempts

agentVersion TEXT -- version of DAEMON agent process that ran this attempt

promptTokensUsed INTEGER

completionTokensUsed INTEGER

exitCode INTEGER -- process exit code if agent crashed (non-zero = abnormal)

workingDirectory TEXT -- absolute path to the repo checkout used for this attempt

\-- logLines stays as JSONB; individual entries must include "seq" for ordering:

\-- { seq: number, timestamp: ISO8601, level: "info"|"warn"|"error"|"debug", message: string }

seq is critical: JSONB array insertion order is not guaranteed to be preserved under concurrent writes. Rendering the terminal sorts by seq, not array index. The agent writes log lines by appending to the JSONB array via jsonb_insert - if seq is missing, the terminal renders in arbitrary order.

## **21.7 File Changes - Additional Fields**

\-- add to file_changes

isBinary BOOLEAN DEFAULT FALSE -- binary files store null diff; just changeType

language TEXT -- detected language for Shiki: "typescript", "python" etc.

sizeBytes INTEGER -- file size after change (for large file warnings)

previousHash TEXT -- git object hash before (null if created)

newHash TEXT -- git object hash after (null if deleted)

language is detected server-side from file extension and stored to avoid re-detection on every render. isBinary = true means the CHANGES tab shows a "Binary file - N bytes" placeholder instead of a diff. sizeBytes triggers a warning in the UI if > 500KB.

## **21.8 Agent Sessions - Additional Fields**

\-- add to agent_sessions

agentVersion TEXT -- version of the DAEMON agent process

gitBaseBranch TEXT -- the branch being targeted (from project settings)

gitBaseCommit TEXT -- SHA of HEAD when session started

gitHeadCommit TEXT -- SHA of HEAD after session completed

totalPromptTokens INTEGER -- sum across all tasks for cost aggregation

totalCompletionTokens INTEGER

totalCostUsd NUMERIC(10,4) -- session total for usage dashboard

pauseCount INTEGER DEFAULT 0 -- times session was paused (for analytics)

errorMessage TEXT -- set when status = failed, human-readable

gitBaseCommit and gitHeadCommit enable a "View diff on GitHub" deep link on the Session detail page showing all changes the session produced. totalCostUsd aggregates to the project-level usage dashboard.

## **21.9 Agent Config - Additional Fields**

\-- add to agent_config

modelId TEXT DEFAULT 'claude-sonnet-4-6' -- which LLM to use for tasks

planModelId TEXT DEFAULT 'claude-opus-4-6' -- model for plan generation (usually stronger)

branchPrefix TEXT DEFAULT 'daemon' -- e.g. "daemon/spec-{specId}/task-{taskId}"

commitMessagePrefix TEXT DEFAULT 'feat' -- conventional commits prefix

allowedFileGlobs TEXT\[\] -- e.g. \["src/\*\*", "tests/\*\*"\] - DAEMON only touches these

forbiddenFileGlobs TEXT\[\] -- e.g. \[".env", "\*\*/\*.pem", "secrets/\*\*"\] - hard stop

testCommand TEXT -- e.g. "npm test" - run after each task; failure = task failed

lintCommand TEXT -- e.g. "npm run lint" - run before commit

setupCommand TEXT -- e.g. "npm install" - run once at session start

maxDiffSizeKb INTEGER DEFAULT 500 -- tasks producing diffs larger than this → warning

prAutoCreate BOOLEAN DEFAULT FALSE -- open a GitHub PR when session completes

prTargetBranch TEXT DEFAULT 'main'

forbiddenFileGlobs is a hard security constraint. If DAEMON's diff touches any file matching a forbidden glob, the task is marked failed immediately and the session is paused. The agent must check this list before committing, and the API must verify after receiving file_changes. This prevents DAEMON from accidentally modifying .env files, private keys, or migration files that require human review.

## **21.10 New Table: webhook_deliveries**

Required for the integrations UI to show delivery history and enable manual re-delivery - without this table there is no way to debug failed webhook calls.

\-- webhook_deliveries

id TEXT PRIMARY KEY

integrationId TEXT REFERENCES integrations(id) ON DELETE CASCADE

eventType TEXT NOT NULL

payload JSONB NOT NULL

requestHeaders JSONB

responseStatus INTEGER

responseBody TEXT

durationMs INTEGER

attempt INTEGER DEFAULT 1

nextRetryAt TIMESTAMPTZ

status TEXT -- pending | delivered | failed | exhausted

createdAt TIMESTAMPTZ DEFAULT NOW()

Retention: 7 days. The Integrations settings page shows the last 20 deliveries per integration with status, response code, and a \[Re-deliver\] button. Re-delivery creates a new webhook_delivery row (attempt = 1, new payload) rather than mutating the old one.

## **21.11 New Table: usage_snapshots**

Aggregated daily cost/usage data per project. The agent writes raw token counts to task and session records; a nightly job aggregates them into usage_snapshots for efficient dashboard queries.

\-- usage_snapshots

id TEXT PRIMARY KEY

projectId TEXT REFERENCES projects(id) ON DELETE CASCADE

date DATE NOT NULL -- the calendar day (UTC)

sessionsRun INTEGER DEFAULT 0

tasksExecuted INTEGER DEFAULT 0

tasksSucceeded INTEGER DEFAULT 0

tasksFailed INTEGER DEFAULT 0

promptTokens INTEGER DEFAULT 0

completionTokens INTEGER DEFAULT 0

estimatedCostUsd NUMERIC(10,4) DEFAULT 0

specsCreated INTEGER DEFAULT 0

UNIQUE(projectId, date)

# **22\. Git Workflow Specification**

DAEMON's interaction with git is the highest-risk part of the system from a data integrity perspective. This section specifies exact behaviour for every git operation. The agent process must follow this protocol precisely.

## **22.1 Session Initialisation**

- Verify the repository is clean: git status --porcelain. If there are uncommitted changes, fail the session immediately with errorMessage: "Repository has uncommitted changes. Clean the working tree before starting a session."
- Record base commit: git rev-parse HEAD → store in agent_sessions.gitBaseCommit.
- Do NOT create a session-level branch. DAEMON works on task-level branches only.
- Run setupCommand (if configured, e.g. npm install) before the first task. If it fails, fail the session.

## **22.2 Per-Task Branch Lifecycle**

- Before starting a task: git checkout {gitBaseBranch} && git pull origin {gitBaseBranch} to ensure the branch is up to date.
- Create a task branch: git checkout -b {branchPrefix}/{specId}/task-{taskId}. Store branch name in tasks.gitBranch.
- Execute the task. All file operations happen on this branch.
- Run lintCommand (if configured). Lint failures: log as "warn" lines, do not fail the task.
- Run testCommand (if configured). Test failures: fail the task, status → failed, errorMessage = test output summary (first 500 chars).
- If task succeeds: git add -A && git commit -m "{commitMessagePrefix}({taskId}): {task.title}". Store commit hash in tasks.gitCommitHash.
- Record file changes: diff HEAD~1 HEAD via git diff --stat and git show. Store in file_changes table.
- Do NOT push to remote per task. Accumulate locally. Pushing happens at session end.

## **22.3 Forbidden File Check**

After git add -A but before commit, the agent must check every staged file against agent_config.forbiddenFileGlobs using micromatch. If any staged file matches:

- Unstage all changes: git reset HEAD.
- Set task status → failed, errorMessage: "Staged files match forbidden glob pattern: {pattern}. File: {path}."
- Do NOT commit.
- Pause the session immediately (do not proceed to the next task).
- Send a session_failed notification.

This check must also be performed server-side when the agent POSTs to /api/v1/tasks/:id/changes. If the API receives a file_change for a forbidden path, it must reject it (HTTP 422) and mark the task failed, even if the agent bypassed the local check.

## **22.4 Session Completion - Merge Strategy**

When all tasks are done, DAEMON must merge the task branches back to the base branch in dependency order:

- Checkout the base branch.
- For each task branch in executionOrder: git merge --no-ff {taskBranch} -m "merge({taskId}): {task.title}". The --no-ff flag preserves branch history for auditability.
- If a merge conflict occurs: abort the merge (git merge --abort), fail the session with errorMessage: "Merge conflict between {T-042} and {T-038}. Manual resolution required." Do not attempt auto-resolution.
- If prAutoCreate = true and all merges succeed: push to a session-level branch (daemon/session/{sessionId}) and open a GitHub PR via the Integrations GitHub API. Store PR URL in agent_sessions (see gitHeadCommit after push).
- If prAutoCreate = false: push all merged commits directly to the base branch.
- Record final HEAD commit: git rev-parse HEAD → agent_sessions.gitHeadCommit.

## **22.5 Task Branch Cleanup**

Task branches are deleted from the local working tree after successful merge. Remote task branches (if any were pushed) are deleted via git push origin --delete. The agent does NOT delete branches if the session ended in failed or cancelled state - they are preserved for debugging.

## **22.6 Dirty State Recovery**

If the agent process crashes mid-task (detected by heartbeat timeout):

- The web application marks the session failed after 5 minutes without heartbeat.
- When the agent is restarted manually (via \[Retry\] on Session page), it runs git status. If the working tree is dirty, it resets: git checkout -- . && git clean -fd.
- The crashed task is marked failed with errorMessage: "Session lost connection during execution. Task state is uncertain - verify the repository manually before retrying."
- Human must review the repository state before clicking \[Resume\].

# **23\. Stack-Specific Engineering Constraints**

This section documents known pitfalls and required mitigations for the specific technology choices made in this project. Every item here represents a failure mode that will occur in production if not addressed during development.

## **23.1 Next.js 16 App Router**

| **Pitfall**                                                                                                                                                                                                                      | **Mitigation**                                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server Component / Client Component boundary confusion: useEffect, useState, and event handlers cannot be used in Server Components. Accidentally importing a client library in a Server Component causes a cryptic build error. | Establish a naming convention: components in app/ that are purely data-fetching are Server Components by default. Add "use client" explicitly at the top of any component file that uses hooks or handles events. Never use "use client" in a component that fetches DB data. |
| Aggressive caching in App Router: fetch() calls inside Server Components are cached by default. Mutations that happen via Route Handlers or Server Actions will not invalidate the cache automatically.                          | Call revalidatePath('/specs') or revalidateTag('specs') at the end of every Server Action that mutates data. Define consistent cache tags in a central lib/cache-keys.ts. Never rely on the default fetch cache for mutable data.                                             |
| Server Actions and optimistic updates: without React Query, managing optimistic state requires useOptimistic from React 19. Rollback on error must be handled explicitly.                                                        | Use useOptimistic for all task status changes and notification reads. Always include the error rollback path. Server Actions throw on failure - catch in the calling component.                                                                                               |
| Streaming and Suspense: if a page uses async Server Components with Suspense, a slow DB query blocks the entire page until resolved.                                                                                             | Wrap independently-loadable sections in &lt;Suspense fallback={<Skeleton /&gt;}>. Spec detail page should stream the header immediately while the tabs load. Do not nest Suspense boundaries in a way that waterfalls queries - fetch in parallel with Promise.all.           |

## **23.2 Drizzle ORM**

| **Pitfall**                                                                                                                                                                                                              | **Mitigation**                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Missing transactions: multi-table writes in Server Actions that are not wrapped in db.transaction() will leave the database in a partial state if the second write fails.                                                | Every Server Action that writes to more than one table MUST use db.transaction(async (tx) => { ... }). The transaction callback receives a tx object - all writes inside must use tx, not the global db. Partial writes are the hardest bug to reproduce in production. |
| N+1 queries: fetching a list of specs and then fetching the plan for each one in a loop.                                                                                                                                 | Use Drizzle's relational query API (db.query.specs.findMany({ with: { plan: true } })) for joined fetches. Check query counts in dev mode with the pg query logging enabled.                                                                                            |
| Drizzle singleton in serverless: creating a new PgPool on every Lambda invocation exhausts connection limits within minutes.                                                                                             | lib/db.ts must use the global pattern: const globalDb = global as any; if (!globalDb.db) { globalDb.db = drizzle(pool); } export const db = globalDb.db;. Use pg-pool with max: 5 to limit connections per instance.                                                    |
| Type drift between schema and runtime: Drizzle types inferred from schema are the source of truth. If you add a column to the DB without updating schema.ts, TypeScript will not catch queries that miss the new column. | Never write raw SQL migrations by hand. Always use drizzle-kit generate → drizzle-kit migrate. schema.ts is the single source of truth. CI must run drizzle-kit check to verify schema is not out of sync.                                                              |

## **23.3 Redis / Upstash**

| **Pitfall**                                                                                                                              | **Mitigation**                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Using ioredis (TCP) in serverless: Vercel Lambda functions do not maintain persistent TCP connections. ioredis will fail on cold starts. | Use @upstash/redis which uses HTTP fetch under the hood. Safe for serverless. Do not install ioredis in this project.                                         |
| Session key naming collisions: if multiple projects share a Redis instance, session keys for different apps could collide.               | Prefix all keys: session:{sessionToken}, reset:{token}, ratelimit:{ip}:{endpoint}, queue:task:{taskId}. Never store a bare key.                               |
| Rate limit bypass via header spoofing: using X-Forwarded-For as the rate limit key allows clients to spoof IP addresses.                 | Extract real IP from Vercel's trusted x-vercel-forwarded-for header in production. In development, fall back to req.ip. Never trust X-Forwarded-For directly. |

## **23.4 Plan Generation as a Long-Running Job**

Plan generation cannot be implemented as a synchronous Route Handler on serverless infrastructure. Vercel Lambda has a maximum execution time of 60 seconds (Pro) or 300 seconds (Enterprise). Plan generation for complex specs can exceed 30 seconds.

| **Option**                                      | **Trade-offs**                                                                                                                                                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Upstash QStash (recommended)                    | HTTP-based background job queue. POST a job to QStash; it calls back your /api/internal/plan-generate webhook. Serverless-compatible. Handles retries. Dead-letter queue available. |
| Vercel Edge Functions with streaming            | Can stream responses but still has a 30s CPU time limit. Does not work for Claude API calls which may take longer.                                                                  |
| Dedicated background worker (Node.js container) | Most reliable. Polls a Redis queue for plan generation jobs. Required if self-hosting. Adds infrastructure complexity.                                                              |

The chosen approach must be documented in lib/jobs/plan-generator.ts. The plan generation job writes status updates directly to the DB (spec.status = "pending_plan" → tasks inserted one by one) so the frontend can display incremental progress via polling.

## **23.5 xterm.js (Client-Side Only)**

| **Pitfall**                                                                                                                                                                         | **Mitigation**                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSR crash: xterm.js accesses document and window on import. Next.js SSR will crash if it is imported in a Server Component or without dynamic().                                    | Always import: const Terminal = dynamic(() => import('@/components/Terminal'), { ssr: false }). Never import xterm directly in a Server Component.                                                                                                   |
| Canvas z-index bleeding through Vaul drawer: xterm.js renders via an HTML &lt;canvas&gt; element. Canvas elements can bleed through CSS z-index stacking contexts on some browsers. | Wrap each xterm instance in a div with transform: translateZ(0) to create a new stacking context. In the Task Drawer, pause xterm rendering (terminal.element.style.visibility = 'hidden') when the drawer is closed to prevent off-screen repaints. |
| Memory leak: each Terminal instance holds a WebGL rendering context. Creating terminal instances without disposing them on unmount will exhaust GPU memory.                         | Always call terminal.dispose() in the useEffect cleanup function. Use a ref to track the Terminal instance across renders.                                                                                                                           |
| Auto-scroll conflict: if the user has scrolled up to review history and DAEMON writes a new log line, auto-scrolling to the bottom disrupts the review.                             | Track isAtBottom state: terminal.onScroll(() => { isAtBottom = terminal.buffer.active.viewportY + terminal.rows >= terminal.buffer.active.length - 1 }). Only call terminal.scrollToBottom() if isAtBottom === true when a new line arrives.         |

## **23.6 Shiki Diff Rendering**

| **Pitfall**                                                                                                                       | **Mitigation**                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Highlighter re-initialization: createHighlighter() is async and expensive. Calling it on every render causes significant latency. | Create a singleton in lib/shiki.ts using the module-level caching pattern. The singleton is shared across all Server Component renders in the same process.                           |
| Large diffs crash the browser: diffs with > 10,000 lines sent as a single Shiki render will freeze the main thread.               | If diff.split('\\n').length > 5000, render the first 2500 lines and the last 500 lines with a "… N lines omitted …" bridge. The full diff remains available via the API for download. |
| Language detection mismatch: Shiki requires the correct language identifier. Unknown file types will fail to highlight.           | Use the language field from file_changes (set by agent on upload). If language is null or unknown, fall back to "text" - never throw on unknown language.                             |

## **23.7 Polling vs Server-Sent Events**

The spec currently uses 3-second polling for session state and notifications. This is correct for the initial implementation. The following considerations apply:

| **Concern**                                                                                                                     | **Resolution**                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Poll when tab is hidden: polling continues when the user switches tabs, wasting bandwidth and server resources.                 | Add document.addEventListener("visibilitychange") to all polling intervals. Pause polling when document.hidden === true. Resume immediately on visibility restore with a forced re-fetch to catch up.                                                                      |
| Poll thundering herd: if many users have the app open during a popular session, polling creates a spike of concurrent DB reads. | Add ±500ms jitter to all polling intervals (setInterval(fn, 3000 + Math.random() \* 500)). This spreads load across the 3-second window.                                                                                                                                   |
| SSE upgrade path: a future version should replace polling with Server-Sent Events for live session log streaming.               | The GET /api/v1/sessions/:id/stream endpoint (specified in Section 6.10) is the SSE upgrade path. The client switches to SSE only when a session is active; polling remains for idle state. Do not implement SSE in v1 unless polling proves insufficient in load testing. |

## **23.8 Motion (Framer Motion) with Vaul**

| **Pitfall**                                                                                                                                                                                | **Mitigation**                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exit animations conflict with Vaul's DOM removal: Vaul removes the drawer from the DOM on close. If a Motion animate on unmount is running, Framer will throw because the element is gone. | Wrap Vaul's content in AnimatePresence with mode="wait". All exit animations must complete within 200ms (Vaul's default close duration). Use custom={...} to pass close state into the exit variant. |
| DAEMON sprite layout shift: when DAEMON expression changes, a layout animation can cause surrounding text to jump.                                                                         | Apply layout="size" only on the DAEMON sprite container, not on the parent flex row. Never use layout on text elements adjacent to DAEMON.                                                           |

## **23.9 NextAuth v5 Breaking Changes (vs v4)**

| **Change**                                                                                      | **Required action**                                                                                                               |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Session shape changed: session.user no longer contains id by default.                           | Add the id to the session in auth.ts: callbacks: { session({ session, token }) { session.user.id = token.sub; return session; } } |
| jwt callback renamed: the jwt callback receives a token, not a user object on subsequent calls. | Check token.sub (the user ID) instead of token.id. The user object is only present on the first sign-in call.                     |
| getServerSession renamed: use auth() from the NextAuth config instead.                          | Import auth from @/auth everywhere. Never import getServerSession from next-auth/next - it does not exist in v5.                  |
| Middleware pattern changed: NextAuth v5 middleware exports auth as a default middleware.        | export { auth as middleware } from '@/auth'. The config export controls which routes require authentication.                      |

# **24\. Concurrency & Race Condition Handling**

The following scenarios represent real concurrent-user conflicts that will occur in production. Each requires an explicit server-side resolution strategy - optimistic locking or last-write-wins is not acceptable for any of these cases.

## **24.1 Concurrent Plan Approval**

Scenario: two admins both click \[Approve & Execute\] within milliseconds of each other. Without a guard, two agent sessions would be created for the same plan.

Resolution: use a Postgres advisory lock or an UPDATE with WHERE status = 'pending_approval' returning id. The approve Server Action must:

- BEGIN TRANSACTION.
- UPDATE plans SET status = 'approved', approvedAt = now(), approvedBy = userId WHERE id = planId AND status = 'pending_approval' RETURNING id.
- If no row returned: the plan was already approved. Return HTTP 409 with code CONFLICT and message "This plan was already approved by another reviewer."
- If row returned: create agent_session in the same transaction. COMMIT.

The UI must handle HTTP 409 on this endpoint by showing an amber Sonner toast ("This plan was approved moments ago by \[Name\]") and refreshing the plan state.

## **24.2 Spec Edit While Executing**

Scenario: a Member opens the spec editor while DAEMON is actively executing tasks on that spec.

Resolution: the server does NOT block the edit. The spec editor shows a red sticky banner: "⚠ DAEMON is currently executing tasks on this spec. Saving will create a new version and abandon the running session." The \[Save Draft\] button is replaced by \[Save & Abandon Session\] - which requires the user to type "ABANDON" in a confirmation field. The underlying save logic calls db.transaction() to update the spec version and set agent_sessions.status = 'cancelled' atomically.

## **24.3 Concurrent Spec Editors**

Scenario: two users both have /specs/\[id\]/edit open and both click \[Save Draft\] within seconds.

Resolution: optimistic locking via specVersionId. The edit form includes a hidden field: lastVersionId = spec.currentVersionId (set when the editor was loaded).

The save Server Action runs: UPDATE specs SET currentVersionId = newVersionId WHERE id = specId AND currentVersionId = lastVersionId RETURNING id. If no row returned, the version changed under the user - return HTTP 409. The UI presents a \[Merge Editor\] modal showing the conflicting content side-by-side with a diff view. The user must choose a resolution or merge manually. The server never auto-merges spec content.

## **24.4 Task Retry During Active Session**

Scenario: user clicks \[RE-RUN\] on a task while the session is actively executing other tasks. The retry queues the task, but the session may also have scheduled it.

Resolution: tasks are picked up by the agent by querying SELECT \* FROM tasks WHERE planId = :planId AND status = 'todo' AND NOT (id = ANY(currentlyRunningTaskIds)) ORDER BY executionOrder LIMIT maxConcurrentTasks. The currentlyRunningTaskIds set is maintained in Redis (key: session:{sessionId}:running). A task retry simply sets status = 'todo' - the agent's next poll cycle picks it up naturally. No separate queue operation is needed.

## **24.5 Notification Delivery on Member Role Change**

Scenario: Admin removes Member from a project while Member has an active session. Member's requests should immediately return 403.

Resolution: all project-scoped endpoints check project_members status and role on every request (not cached in the session token). Caching membership in the JWT is not acceptable - role changes must take effect immediately. The session token contains only userId; role is always fetched fresh from the DB per request. This is a deliberate performance trade-off: one extra DB read per request vs stale permission data.

## **24.6 Session Heartbeat Race**

Scenario: the agent sends a heartbeat, and simultaneously the user clicks \[Cancel\] - the heartbeat response says shouldStop: true, but the agent has already started the next task.

Resolution: the agent MUST check the heartbeat response before executing each task, not just at the heartbeat interval. The task execution loop is: 1) send heartbeat, 2) if shouldStop → exit loop, 3) pick up next task. The heartbeat is the only mechanism for stopping a session - never kill the agent process externally.

# **25\. Developer Integration Reference**

This section documents conventions and contracts that external developers - or internal engineers building new integrations - need to build against the Specdrivr API reliably.

## **25.1 Pagination**

All list endpoints use cursor-based pagination, not offset pagination. Offset pagination produces inconsistent results when items are inserted or deleted between pages.

| **Parameter** | **Description**                                                                  |
| ------------- | -------------------------------------------------------------------------------- |
| limit         | Number of items per page. Default: 25. Maximum: 100.                             |
| cursor        | Opaque cursor string from previous response. Absent on first request.            |
| direction     | "next" (default) or "prev". Use prev with the startCursor to paginate backwards. |

All list responses include a pagination envelope:

{ "data": \[...\], "pagination": { "hasNextPage": bool, "hasPreviousPage": bool, "startCursor": string, "endCursor": string, "totalCount": integer } }

totalCount is included only when the query can compute it efficiently (small result sets). For large tables (agent_events, audit_log), totalCount is omitted and pagination.totalCount = null.

## **25.2 Idempotency Keys**

Certain POST endpoints accept an Idempotency-Key header. If two requests with the same key arrive within 24 hours, the second returns the cached response of the first without re-executing the operation. This is essential for safely retrying plan approvals or session starts after a network timeout.

| **Endpoint**                         | **Idempotency behaviour**                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| POST /api/v1/plans/:id/approve       | Same key returns the original approval response. Second request does NOT create a second session.      |
| POST /api/v1/specs/:id/plan/generate | Same key returns the in-progress or completed generation result. Does NOT trigger a second generation. |
| POST /api/v1/projects/:id/invites    | Same key + same email returns the existing invite. Does NOT send a duplicate email.                    |
| POST /api/v1/sessions/:id/heartbeat  | Not idempotent - each heartbeat updates lastHeartbeatAt. No key accepted.                              |

Idempotency keys are stored in Redis with a 24-hour TTL. Keys must be unique per operation type - reusing a key across different endpoint types produces undefined behaviour.

## **25.3 Rate Limit Headers**

Every API response includes rate limit headers:

X-RateLimit-Limit: 100 -- requests allowed in the window

X-RateLimit-Remaining: 87 -- requests remaining this window

X-RateLimit-Reset: 1709654400 -- Unix timestamp when the window resets

Retry-After: 30 -- only present on HTTP 429 responses

Rate limit tiers: unauthenticated: 10 req/min per IP. User session: 100 req/min per userId. API token: 500 req/min per token (500 for standard, configurable per enterprise plan). Agent heartbeat endpoint: 1000 req/min per token (not deducted from the general token budget).

## **25.4 Server-Sent Events (SSE) - Session Log Streaming**

Endpoint: GET /api/v1/sessions/:id/stream

This endpoint returns a text/event-stream response and streams agent events in real time. It is the replacement for 3-second polling once v1 polling is validated at scale.

Event format:

event: agent_event

data: {"id":"evt_abc","eventType":"TASK_DONE","taskId":"T-042","message":"Task complete","timestamp":"2026-01-01T12:00:00Z"}

event: log_line

data: {"taskId":"T-042","attemptId":"att_xyz","seq":142,"level":"info","message":"Wrote 48 lines to src/auth/session.ts"}

event: session_status

data: {"status":"completed","tasksSucceeded":8,"tasksFailed":0}

event: heartbeat

data: {}

The server sends a heartbeat event every 30 seconds to prevent proxy timeouts. The client must reconnect automatically on connection loss using the EventSource API's built-in retry behaviour. Authentication: session cookie (for browser clients) or Authorization header (for server-side consumers). Maximum stream duration: 4 hours, after which the client must reconnect.

## **25.5 Expand Parameter**

GET endpoints accept an ?expand= query parameter to embed related resources and avoid N+1 round trips from API consumers.

| **Endpoint**             | **Expandable relations**                   |
| ------------------------ | ------------------------------------------ |
| GET /api/v1/specs/:id    | plan, tasks, currentVersion, latestSession |
| GET /api/v1/plans/:id    | tasks, architectureDecisions, reviews      |
| GET /api/v1/sessions/:id | spec, plan, events (last 50)               |
| GET /api/v1/tasks/:id    | attempts, changes, plan                    |

Usage: GET /api/v1/specs/spec_001?expand=plan,tasks. Expanded objects are nested under their relation name in the response. Maximum 3 expand relations per request to prevent accidental over-fetching.

## **25.6 Filtering & Sorting**

List endpoints support consistent filter and sort parameters:

| **Parameter**         | **Format**                                            | **Example**                                     |
| --------------------- | ----------------------------------------------------- | ----------------------------------------------- |
| filter\[field\]       | Exact match                                           | filter\[status\]=executing                      |
| filter\[field\]\[op\] | Operator match                                        | filter\[createdAt\]\[gte\]=2026-01-01T00:00:00Z |
| search                | Full-text search across name/title fields             | search=authentication                           |
| sort                  | Comma-separated field names. Prefix - for descending. | sort=-createdAt,name                            |

Supported operators: eq (default), neq, gt, gte, lt, lte, in (comma-separated values), null, notnull. Example: filter\[status\]\[in\]=executing,paused.

## **25.7 Webhook Signature Verification**

When a webhook secret is configured, every request includes X-Specdrivr-Signature: sha256={HMAC-SHA256(secret, rawBody)}.

Verification example (Node.js):

import { createHmac, timingSafeEqual } from 'crypto';

function verifyWebhookSignature(secret: string, rawBody: Buffer, signature: string): boolean {

const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex');

const sig = Buffer.from(signature);

const exp = Buffer.from(expected);

if (sig.length !== exp.length) return false;

return timingSafeEqual(sig, exp); // constant-time comparison

}

Always use timingSafeEqual for HMAC comparison. String equality (===) is vulnerable to timing attacks that allow an attacker to determine the correct signature byte by byte.

## **25.8 OpenAPI Specification**

A machine-readable OpenAPI 3.1 spec is available at GET /api/openapi.json (authenticated - requires a valid session or token). This endpoint is auto-generated from the Zod schemas in lib/schemas/ using @asteasolutions/zod-to-openapi.

The OpenAPI spec is the authoritative source for external SDK generation. Any discrepancy between this document and the OpenAPI spec must be resolved in favour of the OpenAPI spec.

Planned SDKs (not in v1 scope): TypeScript/Node.js (first-party), Python (community maintained). The TypeScript SDK type definitions are auto-generated from the OpenAPI spec using openapi-typescript.

## **25.9 Agent API Contract Summary**

This is the complete list of API calls the DAEMON agent process makes. External developers building a compatible agent implementation must support exactly these calls and no others.

| **Call**                              | **When**                           | **Notes**                                                                               |
| ------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------- |
| POST /api/v1/agent/sessions/:id/start | On agent process startup           | Records agentVersion. Returns { tasks: Task\[\], agentConfig: AgentConfig }.            |
| POST /api/v1/sessions/:id/heartbeat   | Every 15 seconds                   | Returns { shouldStop: bool, pauseRequested: bool }.                                     |
| PATCH /api/v1/tasks/:id               | On status change and each log line | Batches log lines in groups of 10 to reduce write frequency.                            |
| POST /api/v1/tasks/:id/changes        | After each task commit             | One POST per file change. Max 100 file changes per task - larger tasks should be split. |
| POST /api/v1/sessions/:id/complete    | When all tasks are done            | Payload includes gitHeadCommit and totalTokenCounts.                                    |
| POST /api/v1/sessions/:id/fail        | On unrecoverable error             | Payload includes errorMessage.                                                          |

The agent must set User-Agent: specdrivr-agent/{version} on all requests. The API uses this to distinguish agent calls from user API calls in the audit log and rate limiting tiers. Requests without this header from a bearer token that matches an AGENT_TOKEN are rejected with HTTP 403.

# **26\. Cost & Usage Tracking**

Token usage and associated LLM costs are a first-class concern for engineering teams using Specdrivr. The cost data collected at the task and session level feeds the Usage section in Settings.

## **26.1 Cost Data Flow**

- Agent records promptTokensUsed and completionTokensUsed on each task and task_attempt after the LLM call returns.
- When session completes, agent POSTs totalPromptTokens and totalCompletionTokens to POST /api/v1/sessions/:id/complete.
- The server computes totalCostUsd using the model pricing table (stored in lib/pricing.ts, versioned in source control - not in DB, since prices change rarely).
- A nightly cron job aggregates all completed sessions for the day into usage_snapshots.
- The Usage page in Settings queries usage_snapshots for the trailing 90 days, grouped by day, with a 7-day and 30-day rollup.

## **26.2 Usage Settings Page**

Route: /settings/usage (accessible to Admin/Owner only).

- Chart: daily cost bar chart, trailing 30 days. Tooltip shows tasks executed + cost per day.
- Summary cards: This month total cost · Total tasks executed · Average cost per task · Most expensive spec (linked).
- Breakdown table: by spec - spec name · sessions · tasks · tokens · cost. Sortable.
- Model breakdown: if project has used multiple models, shows cost split by model.
- \[Export CSV\] - exports raw usage_snapshots for the selected date range.

If no usage data exists (no sessions yet), show DAEMON idle + "No usage data. Run your first session to see cost breakdown here."

## **26.3 Per-Task Cost in Dev Mode**

When Dev Mode is enabled (Ctrl+\`), the Task Drawer OVERVIEW tab shows a cost panel below the main content:

COST BREAKDOWN

Prompt tokens: 12,483 (\$0.0374)

Completion tokens: 4,201 (\$0.0504)

Total: \$0.0878

Model: claude-sonnet-4-6

This panel is hidden in normal mode. It is intended for developers debugging expensive tasks, not for end-user-facing cost visibility.

## **26.4 Budget Alerts (Future - Not v1)**

Specify the data structure now so the schema is ready when budget alerts are implemented:

\-- budget_alerts (create now, implement UI later)

id TEXT PRIMARY KEY

projectId TEXT REFERENCES projects(id) ON DELETE CASCADE

threshold NUMERIC(10,4) -- USD amount

period TEXT -- "daily" | "monthly"

alertType TEXT -- "email" | "webhook" | "both"

triggeredAt TIMESTAMPTZ -- last time this alert fired

createdAt TIMESTAMPTZ DEFAULT NOW()

# **27\. Document Control**

| **Field**      | **Value**                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Document title | Specdrivr Master Product Specification                                                                                                           |
| Version        | 1.1                                                                                                                                              |
| Status         | Draft - Authoritative                                                                                                                            |
| Supersedes     | All prior Lovable prompt documents (v1, v2, v3), Screen Map, Interaction Flows, Real-World Detail, State Machine prompts. v1.0 of this document. |
| Owner          | Product & Engineering                                                                                                                            |
| Review cadence | Updated with each significant product decision. Minor corrections do not increment version.                                                      |

Specdrivr Master Specification v1.1 · Confidential