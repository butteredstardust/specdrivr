**SPECDRIVR**

Master Product Specification

Version 1.0 · Confidential

_Spec-driven autonomous code execution for engineering teams_

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

