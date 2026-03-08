**SPECDRIVR**

Master Product Specification

Version 1.0 · Confidential

_Spec-driven autonomous code execution for engineering teams_

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

