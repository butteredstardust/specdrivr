# Specdrivr Codebase Audit and Implementation Plan

Audit branch: `docs/codebase-audit-plan`  
Baseline: merged `main` at `97265f8`  
Audit date: 2026-09-03

## Implementation Outcome

Implementation completed on 2026-09-04 in the prescribed A1 → D3 order. The branch now contains
the application, database, worker, deployment, UI, and quality-gate remediations described below.

| Gate | Status   | Delivered outcome                                                                                                                                                                                                                            |
| ---- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A    | Complete | Deterministic PostgreSQL/Redis tests, pinned pnpm, scoped and revocable agent tokens, redacted encrypted credentials, constrained repository verification, and atomic plan-generation writes.                                                |
| B    | Complete | Durable task-attempt leases, idempotent scoped completion, cancellation/ghost recovery, independent heartbeats and timeouts, version-fenced plan jobs, repaired plan UI flows, audited human overrides, and persisted bounded verification.  |
| C    | Complete | Separate migration/web/plan/recovery/webhook processes, liveness/readiness probes, leased durable webhook delivery with bounded retries, request and agent rate limits, and correlation propagation from ingress into plan jobs and workers. |
| D    | Complete | Correct project/session navigation, responsive core layouts, explicit plan-approval confirmation, real E2E coverage, enforced repository policy, and ratcheted coverage reporting.                                                           |

The coverage gate starts at the measured repository baseline (46% lines, 45% statements, 38%
functions, 33% branches) and may only move upward toward the 80% target. External APM dashboards
and alert destinations remain deployment configuration; the application-side correlation IDs and
structured telemetry needed to feed them are implemented here.

## Audit Method

Five independent reviewers inspect non-overlapping areas. Every finding must cite concrete evidence,
state user or operational impact, assign severity (`Critical`, `High`, `Medium`, or `Low`), and
propose a verifiable remediation. Unverified suspicions belong under follow-up questions, not the
actionable backlog.

## 1. Security, Authentication, Authorization, and API Boundaries

<!-- AUDIT:SECURITY:START -->

### Findings

#### SEC-001 — Critical — Any authenticated user can mint an agent credential for an arbitrary project

- **Evidence:** `src/app/api/v1/users/me/tokens/route.ts:9-13` accepts a caller-supplied optional `projectId`; `:32-56` authenticates the caller but performs no membership or `requireAdmin` check before persisting that project ID. `src/app/api/v1/agent/tasks/next/route.ts:16-18` treats the token's stored `projectId` as its authorization scope and claims work for it.
- **Impact:** A regular account can create a valid bearer token bound to another tenant's numeric project ID, then use it as that project's DAEMON credential. This permits task claiming and exposes the selected task payload; when GitHub is configured, that payload includes the project's GitHub credential (`tasks/next/route.ts:48-61`).
- **Trigger / reproduction:** Sign in as a user with no membership in project `B`; `POST /api/v1/users/me/tokens` with `{ "name": "x", "projectId": B }`; use the returned `sdk_...` token in `Authorization: Bearer ...` against `GET /api/v1/agent/tasks/next?sessionId=<B-session>`.
- **Recommended remediation:** Require a positive project ID and `requireAdmin(session.user.id, projectId)` before creation; disallow project-less DAEMON tokens unless a separately designed, tightly constrained token type is needed. Add a database/service-level scope assertion so direct repository calls cannot create cross-tenant agent credentials.
- **Dependencies:** Token issuance API, `verifyAgentToken`, agent polling endpoint, and GitHub-config delivery contract.
- **Acceptance test:** A non-member and a Viewer both receive 403 when creating a token for a project; an Admin can create one only for their project; the returned token can poll only a session in that project.

#### SEC-002 — High — Revoked and expired agent tokens remain valid

- **Evidence:** The token schema records `expiresAt` and `revokedAt` in `src/db/schema.ts:226-228`, and revocation writes `revokedAt` in `src/repositories/token-repository.ts:49-52`. But `verifyAgentToken` only finds by prefix and compares the hash (`src/lib/agent-auth.ts:21-46`); it never rejects either state. All DAEMON endpoints rely on this helper, e.g. task completion at `src/app/api/v1/tasks/[id]/complete/route.ts:21-25`.
- **Impact:** A leaked credential continues to operate after a user revokes it or after its selected expiry time, defeating both advertised containment controls and incident response.
- **Trigger / reproduction:** Create a token with a past `expiresAt`, or revoke a previously created token through `DELETE /api/v1/users/me/tokens/:id`; submit it to an agent endpoint. Hash verification still succeeds and the request proceeds.
- **Recommended remediation:** In the shared verifier, reject tokens with non-null `revokedAt` or `expiresAt <= now`; update `lastUsedAt` only after successful authorization. Cover all agent endpoints through shared tests.
- **Dependencies:** `tokenRepository.getByPrefix`, token revocation API/actions, all routes importing `verifyAgentToken`.
- **Acceptance test:** Valid credentials authorize; revoked and expired credentials get 401 on polling, heartbeat, log, task completion, and session completion; no state changes occur.

#### SEC-003 — High — Agent endpoints mutate sessions and tasks outside the token's project scope

- **Evidence:** The heartbeat route authenticates a token then updates the path-supplied session ID with no project comparison (`src/app/api/v1/sessions/[id]/heartbeat/route.ts:8-20`). Session completion does the same (`src/app/api/v1/sessions/[id]/complete/route.ts:13-28`). Task completion likewise sends a path-supplied task ID directly to the repository (`src/app/api/v1/tasks/[id]/complete/route.ts:22-40`), whose completion logic updates that task by ID (`src/repositories/task-repository.ts:651-664`). In contrast, the log route explicitly verifies `session.projectId !== authResult.token.projectId` before writing (`src/app/api/v1/sessions/[id]/log/route.ts:31-45`), demonstrating the missing guard.
- **Impact:** Possession of any valid project-scoped agent credential is sufficient to keep another project's session alive, mark another project's session complete, or mark arbitrary tasks done/failed. This is a direct tenancy-isolation breach even without the token-creation flaw in SEC-001.
- **Trigger / reproduction:** With a valid token for project `A`, POST to `/api/v1/sessions/<project-B-session>/heartbeat`, `/complete`, or `/api/v1/tasks/<project-B-task>/complete` with a schema-valid body. The handlers do not load and compare the resource project before mutation.
- **Recommended remediation:** Resolve each task/session before mutation and require exact equality with `authResult.token.projectId`; additionally bind task completion to an active attempt/session claimed by that token. Put scoped update predicates in repositories to prevent future callers from bypassing the handler check.
- **Dependencies:** Agent protocol clients, task-attempt model, session lifecycle endpoints, repositories.
- **Acceptance test:** A token for project A gets 403 for B's heartbeat, completion, and task completion; database rows and events for B remain unchanged. A valid A task attempt can complete only its own claimed task.

#### SEC-004 — High — Any project member can retrieve plaintext integration and LLM secrets

- **Evidence:** `GET /api/v1/projects/:id/agent-config` authorizes merely with `requireMember` (`src/app/api/v1/projects/[id]/agent-config/route.ts:43-73`) and returns the repository result unchanged. That repository uses `db.select()` (`src/repositories/agent-config-repository.ts:7-12`). The selected schema contains `githubToken`, `githubWebhookSecret`, `slackBotToken`, `geminiApiKey`, and `claudeApiKey` (`src/db/schema.ts:549-557`).
- **Impact:** A Viewer can extract credentials that can grant repository write access, forge GitHub webhooks, send Slack messages, or consume paid model APIs. This violates the module's Admin/Owner-only settings boundary.
- **Trigger / reproduction:** Join a project as Viewer, then call `GET /api/v1/projects/<project-id>/agent-config`; when configured, the response includes the credential columns.
- **Recommended remediation:** Never serialize stored secrets in configuration reads or mutation responses. Use an explicit public configuration projection; restrict sensitive configuration access to Admin/Owner as needed; encrypt credentials at rest and provide only set/unset metadata to clients.
- **Dependencies:** Agent settings UI, `AgentConfigRepository`, configured GitHub/Slack/LLM integrations, agent polling's deliberate GitHub credential handoff.
- **Acceptance test:** A Viewer and Member receive a response with no secret keys or values; an Admin response likewise contains only redacted/set-state fields. Stored credentials remain usable server-side.

#### SEC-005 — High — Repository verification endpoint is an authenticated SSRF primitive

- **Evidence:** `GET /api/v1/verify-repo` accepts arbitrary caller-controlled `url` (`src/app/api/v1/verify-repo/route.ts:24-43`) and only limits it to `http`/`https` (`:44-49`), then server-side fetches it while following redirects (`:52-55`). It requires any authenticated user, but no project permission or hostname/private-network allowlist (`:15-22`).
- **Impact:** Any signed-in account can make the application reach internal services and cloud metadata/private addresses reachable from its runtime, using redirect chains as well. The response exposes reachability/status, enabling internal network probing.
- **Trigger / reproduction:** As any authenticated user, request `/api/v1/verify-repo?url=http://127.0.0.1:<port>/` or an internal hostname; the server performs the HEAD request. An externally allowed URL may redirect to a private address because redirects are followed.
- **Recommended remediation:** Restrict this feature to authorized project admins and an allowlist of supported source-control hosts; resolve DNS and reject loopback, link-local, private, multicast, and otherwise non-public IPs on every redirect hop. Prefer provider-specific repository validation APIs rather than an arbitrary URL fetch.
- **Dependencies:** Project creation/settings repository verification flow and outbound networking policy.
- **Acceptance test:** An Admin can verify an approved public GitHub/GitLab repository; non-admin callers get 403; literal private IPs, private DNS targets, and public-to-private redirect chains are rejected without an outbound request.

### Strengths observed

- Project-scoped browser routes generally resolve the target resource and use `requireMember`, `requireAdmin`, or `requireOwner` before returning or mutating it (for example `src/app/api/v1/tasks/[id]/route.ts:31-49` and `src/app/api/v1/projects/[id]/route.ts:15-44`).
- Agent log ingestion correctly validates the session belongs to the bearer token's project before persistence (`src/app/api/v1/sessions/[id]/log/route.ts:31-45`).
- Route schemas cap several high-volume inputs, including task output at 50,000 characters and log lines at 4,096 characters (`src/app/api/v1/tasks/[id]/complete/route.ts:7-15`, `src/app/api/v1/sessions/[id]/log/route.ts:9-13`).

### Follow-up questions

- Are agent tokens intended to be usable after revocation/expiry for a migration or grace-period reason? The schema and settings specification indicate no.
- Is project agent configuration intentionally available to Viewers? If so, what secret-storage and response-redaction boundary is intended?
- Is arbitrary repository URL verification a supported product requirement, or can it be constrained to connected SCM providers?
<!-- AUDIT:SECURITY:END -->

## 2. Persistence, Repositories, Workers, and Orchestration

<!-- AUDIT:BACKEND:START -->

### Findings

#### BE-001 — Critical — Plan-generation endpoint does not actually make its three writes atomic

**Evidence:** `src/app/api/v1/specs/[id]/plan/generate/route.ts:58-79` opens `db.transaction`, but calls `specificationRepository.updateStatus` at line 69 and `planJobRepository.create` at lines 71-77. Both repositories use the module-global `db`, not the provided `tx` (`src/repositories/specification-repository.ts:358-360`, `src/repositories/plan-job-repository.ts:8-12`).

**Impact:** The comment asserting rollback protection is false. On a pooled connection, the job insert can wait on the uncommitted plan FK while the outer transaction waits for that insert (or independently commit state/job changes), leaving a stuck request or inconsistent `specifications` / `plans` / `plan_jobs` state.

**Trigger/reproduction:** POST plan generation for a drafting spec against PostgreSQL with more than one pool connection; the nested global writes are not part of the outer transaction. Force a failure after either global write to observe that the outer rollback cannot roll it back.

**Recommended remediation:** Perform all three writes directly through `tx`, or change repository APIs to accept a transaction executor and enforce its use. Add a transactional integration test that injects a failure at each write boundary.

**Dependencies:** Drizzle transaction-executor plumbing; no migration required.

**Acceptance test:** For each injected failure after plan insert, spec transition, and job insert, assert no plan/job exists and the spec remains `drafting`; on success all records are committed together.

#### BE-002 — High — Task concurrency limit is ineffective and task claims lack a durable session/attempt lease

**Evidence:** Claiming counts only joins to pre-existing `task_attempts` (`src/repositories/task-repository.ts:274-281`), but a claim creates no attempt (`:317-346`); attempts are inserted only at completion (`:668-695`). The session is merely share-locked (`:265-270`), allowing concurrent claimers to see the same zero count and lock different task rows.

**Impact:** A session configured with `maxConcurrentTasks = 1` can run multiple tasks simultaneously. Since no running attempt or task-to-session lease is stored at claim time, recovery and completion cannot reliably identify ownership.

**Trigger/reproduction:** Create two dependency-free tasks and issue two concurrent `claimNextTaskForProject` calls for a max-1 session. Each call can observe zero active attempts and claim one task.

**Recommended remediation:** On claim, create a running attempt/lease in the same transaction and set `currentAttemptId`; serialize capacity accounting with a row lock/advisory lock or atomic counter; use a unique active-lease invariant. Bind task ownership to the session explicitly.

**Dependencies:** Schema migration for a task/session lease (or robust `task_attempts` constraints), claim-path and recovery changes.

**Acceptance test:** Concurrent claim tests prove at most N active leases for a session, including N=1; a claimed task has a running attempt linked to the claiming session before the API returns.

#### BE-003 — High — Task completion is neither state-conditional nor idempotent, and can attach to the wrong session

**Evidence:** The completion API accepts only a task ID, not a session/attempt ID (`src/app/api/v1/tasks/[id]/complete/route.ts:7-15,40`). `completeTaskAttempt` updates by `tasks.id` with no expected `in_progress` status or ownership predicate (`src/repositories/task-repository.ts:655-666`), chooses an arbitrary running session for the plan (`:678-684`), and computes/inserts the next attempt sequence without a unique `(task_id, seq)` constraint (`:669-695`; schema only has a non-unique task index at `src/db/schema.ts:377-390` and `drizzle/0000_jazzy_ink.sql:491`).

**Impact:** Retries, delayed network requests, or two agents can complete a task more than once, corrupt attempt history and session attribution. A completion can also mutate a todo task or a task claimed by a different session.

**Trigger/reproduction:** Send two simultaneous completion POSTs for one task, or complete a task after a newer session begins for the same plan. Both updates can succeed; attempts can receive duplicate sequence numbers and the later running session is credited.

**Recommended remediation:** Require a claim-issued attempt/lease ID and session ID; update conditionally from the owned running state; make completion idempotent with a completion key/unique attempt constraint; derive session counters/status from the owned lease.

**Dependencies:** BE-002 lease design and a migration for unique attempt sequencing/idempotency.

**Acceptance test:** Duplicate/concurrent completion of one attempt yields one terminal transition and one attempt record; cross-session and unclaimed completion requests are rejected without mutation.

#### BE-004 — High — Cancellation and ghost recovery do not recover all work or meet the documented reset semantics

**Evidence:** Cancellation only marks the session cancelled (`src/app/api/v1/sessions/[id]/cancel/route.ts:45-49`). Ghost recovery resets only each session's single `currentTaskId` (`src/repositories/agent-session-repository.ts:47-58`), does not increment `attemptCount`, and emits only `SESSION_FAILED` events (`:70-79`). The execution specification requires every in-progress task for failed/cancelled sessions to reset, increment attempts, and emit `GHOST_TASK_RESET` (`documentation/modules/execution.md:74-88`).

**Impact:** In-progress tasks outside the last `currentTaskId` become permanent zombies; cancelled sessions leave their task in progress. This is especially damaging once configured concurrency exceeds one.

**Trigger/reproduction:** Claim two tasks in a multi-concurrent session, then cancel it or let it time out. Only the most recently assigned `currentTaskId` is eligible for reset; the other remains `in_progress`.

**Recommended remediation:** Track all active task leases by session (BE-002) and atomically reset every lease on cancellation/failure, increment attempt counts, close attempts with a recovery reason, and emit one `GHOST_TASK_RESET` per task.

**Dependencies:** BE-002 session ownership data model; session cancellation lifecycle changes.

**Acceptance test:** A failed/cancelled session with several claimed tasks leaves none `in_progress`; each is `todo`, attempt count increases exactly once, and corresponding recovery events exist.

#### BE-005 — High — Editing a specification does not fence an already-running plan job, so stale work can resurrect an abandoned plan

**Evidence:** Editing abandons nonterminal plans and returns the spec to `drafting` (`src/repositories/specification-repository.ts:223-245`) but does not cancel/mark related `plan_jobs`. The worker reads the _current_ spec version and unconditionally changes its referenced plan to `pending_approval` and the spec to `pending_approval` (`scripts/plan-worker.ts:48-55,91-116`), without checking the job/plan status or the plan's original `specVersionId`.

**Impact:** A generation job started before an edit can finish afterward and revive an abandoned plan using content from a newer version. Users may approve execution of a plan not bound to the reviewed version.

**Trigger/reproduction:** Queue plan generation, allow the worker to claim it, edit the spec before the model call returns, then let the worker finish. The abandoned plan and drafting spec are overwritten back to pending approval.

**Recommended remediation:** Store and validate the target spec-version/job generation token; atomically verify plan/job/spec state before applying results. Cancel superseded pending/running jobs when adding a version and discard stale worker results.

**Dependencies:** Job cancellation/version fencing fields or predicates; worker changes.

**Acceptance test:** In the race above, the old job is cancelled/discarded and cannot mutate either plan or spec; only a new job for the new version can reach pending approval.

#### BE-006 — Medium — Generated task metadata and verification contract are silently not persisted or run

**Evidence:** The generator returns `filesInvolved`, `doneCriteria`, and `verifyCommand` (`src/lib/gemini.ts:30-34`; passed by `scripts/plan-worker.ts:188-192`), but `tasks` has no `verifyCommand` or `doneCriteria` columns (`src/db/schema.ts:330-364`; initial migration `drizzle/0000_jazzy_ink.sql:314-345`). The worker stores `expectedFiles: []` regardless (`src/repositories/task-repository.ts:156-162`), and `scripts/agent.ts` never executes `task.verifyCommand` before reporting `done` (`scripts/agent.ts:175-214`).

**Impact:** The planned done criteria, file scope, and verification command are discarded; a successful agent-process exit marks a task done even when its promised check fails or was never attempted.

**Trigger/reproduction:** Generate a task with a non-null `verifyCommand` and inspect its persisted row/prompt; the schema has no field to retain it and the agent submits `done` without executing it.

**Recommended remediation:** Add the missing columns (including expected files), persist generated values, place them in the claim payload/prompt, execute verification in the agent, and persist its result/output before allowing `done`.

**Dependencies:** Forward migration, task schema/repository updates, agent protocol/version rollout.

**Acceptance test:** A generated verification command survives round-trip persistence, is executed once, and a nonzero result produces a failed attempt rather than a done task.

#### BE-007 — Medium — Generated-task creation is non-transactional and permits duplicates/partial plans

**Evidence:** The worker inserts generated tasks one at a time then updates task count (`scripts/plan-worker.ts:168-204`) with no transaction. `(plan_id, external_id)` is indexed but not unique (`src/db/schema.ts:366-370`; `drizzle/0000_jazzy_ink.sql:492-494`), and `plan_jobs` has no uniqueness constraint for a plan/type (`src/db/schema.ts:618-639`).

**Impact:** A worker crash or repeated job can leave a partial task graph or duplicate `T-001` records. Duplicates make dependency resolution ambiguous because it matches by external ID (`src/repositories/task-repository.ts:303-308`).

**Trigger/reproduction:** Fail the worker after one of several inserts, then requeue/retry the generate-tasks job; existing rows remain and new rows reuse the same external IDs.

**Recommended remediation:** Generate and validate the complete DAG first, then insert tasks and plan taskCount in one transaction. Enforce unique `(plan_id, external_id)` and one active job per `(plan_id, type)` (or make job execution idempotent).

**Dependencies:** Migration for unique constraints; worker retry policy.

**Acceptance test:** Inject an insert failure mid-batch and assert zero tasks/taskCount update; replaying a completed or retried job leaves exactly one deterministic task set with valid dependencies.

### Strengths

- The primary task and plan-job selection paths use PostgreSQL row locking with `SKIP LOCKED` (`src/repositories/task-repository.ts:291-313`, `src/repositories/plan-job-repository.ts:41-65`), providing a sound base for queue claiming once lease accounting is corrected.
- Immutable spec-version numbering is protected with a unique `(spec_id, version_number)` index (`src/db/schema.ts:242-268`), and creation/version updates use transactions (`src/repositories/specification-repository.ts:130-176,198-259`).
- Existing repository integration tests exercise basic dependency gating, task completion, ghost reset, and job claiming (`tests/integration/repository.test.ts:17-105,293-510`), though they do not cover the identified races.

### Follow-up questions

1. Is `maxConcurrentTasks` intended to be operational today, or is the shipped agent deliberately single-threaded? The schema/configuration advertises concurrency while the agent loop is sequential.
2. What durable worker runtime is responsible for retrying failed plan jobs? `recoverStuckJobs` marks jobs failed (`src/repositories/plan-job-repository.ts:129-148`) but no retry/backoff path was found in the worker.
3. Should a failed task halt its session/plan, retry automatically, or allow independent tasks to continue? Current behavior leaves the session running with the failed task terminal, without an explicit domain transition.
<!-- AUDIT:BACKEND:END -->

## 3. Frontend Product Flows, UX, and Accessibility

<!-- AUDIT:FRONTEND:START -->

### Findings

#### FE-001 — High — “Save & Generate Plan” creates a new specification but never starts planning

- **Evidence:** `src/components/specs/spec-editor.tsx:70-91` saves first but invokes the generation endpoint only when `_specId` already exists. The new-spec page supplies no `specId` and its save callback only redirects to edit (`src/app/(app)/specs/new/page.tsx:12-40`). This contradicts the documented create-and-plan flow in `documentation/modules/specifications.md:39-45`.
- **User impact:** A user who chooses the primary “Save & Generate Plan” action on a new spec lands on the edit page with a draft and no plan/job. They must infer that they need to invoke the action again, risking duplicate versions or abandonment of the intended flow.
- **Reproduction / trigger:** On `/specs/new`, enter a title and at least 50 characters, click **Save & Generate Plan**, then inspect the resulting spec: it remains `drafting` and no request to `/api/v1/specs/{newId}/plan/generate` was made.
- **Recommended remediation:** Have creation return the new ID to the editor (or expose a single create-and-generate server action/route), then start generation before navigating to the PLAN tab/detail state. Preserve a single in-flight state and show a recoverable failure if persistence succeeds but generation does not.
- **Dependencies:** `POST /api/v1/specs`, `POST /api/v1/specs/[id]/plan/generate`, editor navigation/state contract.
- **Acceptance test:** An authenticated member creates a new spec with **Save & Generate Plan**; assert exactly one spec creation and one generation request/job, navigation to its PLAN view, and a visible `pending_plan` state.

#### FE-002 — High — Re-generate Plan controls call a route that does not exist

- **Evidence:** `src/components/specs/plan-tab.tsx:232-247` POSTs to `/api/v1/specs/${spec.id}/regenerate-plan`, and the controls are rendered for rejected/abandoned and changes-requested plans (`:365-396`). The API route inventory has `/api/v1/specs/[id]/plan/generate/route.ts` but no `regenerate-plan` route; `rg --files src/app/api/v1` confirms no such handler.
- **User impact:** Users cannot recover a rejected, abandoned, or changes-requested plan from the advertised CTA; every attempt produces the generic failure toast.
- **Reproduction / trigger:** Open a spec whose plan is `rejected`, `abandoned`, or `changes_requested`, click **Re-generate Plan**, and observe the browser POST return 404.
- **Recommended remediation:** Point the UI at a supported state-aware generation endpoint, or implement the explicitly named route with its required state transition. Refresh/replace the local spec state after a successful request so the plan-generation screen begins polling immediately.
- **Dependencies:** Plan lifecycle API and state-machine rules for terminal/review states.
- **Acceptance test:** For each rendered recovery state, clicking the CTA returns 202, transitions the spec to `pending_plan`, and presents the generation state rather than an error toast.

#### FE-003 — High — Task retry and unblock controls omit the required context payload

- **Evidence:** The shared retry handler POSTs `/unblock` without a request body (`src/components/tasks/task-drawer.tsx:168-176`) and drives both failed-state retry (`src/components/tasks/task-drawer-overview.tsx:139-153`) and the footer **RE-RUN** action (`src/components/tasks/task-drawer.tsx:370-377`). The endpoint unconditionally parses JSON and requires non-empty `humanContext` (`src/app/api/v1/tasks/[id]/unblock/route.ts:14-19,72-78`). Even the blocked-task form saves context through an admin-only PATCH (`src/components/tasks/task-drawer-overview.tsx:25-47`; `src/app/api/v1/tasks/[id]/route.ts:84-113`) before calling that same body-less retry.
- **User impact:** Every retry CTA fails; a Member attempting the documented unblock-with-context workflow also fails before retry because the preliminary PATCH requires Admin. This prevents human intervention from returning blocked/failed work to the queue.
- **Reproduction / trigger:** Open a failed task and select **RETRY TASK** or **RE-RUN**; the POST has no JSON payload and is rejected. As a Member, enter context on a blocked task and choose **RETRY WITH CONTEXT**; the PATCH returns 403 despite `/unblock` allowing Members (`unblock/route.ts:58-70`).
- **Recommended remediation:** Submit `{ humanContext }` directly to `/unblock` for the blocked workflow; provide a separate retry contract for failed/done tasks if context is optional there. Align UI affordances with the endpoint’s Member permission and avoid the privileged intermediary PATCH.
- **Dependencies:** Task unblock/retry API contract, task status transition semantics, RBAC UX.
- **Acceptance test:** A Member can enter valid context and unblock a blocked task; failed/done retry behavior follows its documented policy and succeeds with the required payload; no retry action sends an empty body to `/unblock`.

#### FE-004 — High — Admin “Mark Done” control calls an agent-only completion endpoint without required credentials or payload

- **Evidence:** The Task Drawer exposes **MARK DONE** to Admin/Owner users (`src/components/tasks/task-drawer.tsx:412-423`) and POSTs only browser cookies to `/api/v1/tasks/${task.id}/complete` (`:137-165`). That endpoint first requires a bearer agent token (`src/app/api/v1/tasks/[id]/complete/route.ts:21-25`) and then requires a JSON body containing `status` (`:7-15,30-38`).
- **User impact:** The documented manual task-management capability is a dead control: authorized administrators receive 401 (or, with an agent token, 400) and cannot override completion to release dependent work.
- **Reproduction / trigger:** As a project Admin, open a non-done task and click **MARK DONE** (then confirm if requested). The browser request lacks `Authorization` and a body; the endpoint rejects it.
- **Recommended remediation:** Add a browser-authenticated, admin-authorized manual completion/override action with an explicit audit reason/verification override, or connect the control to an existing compatible endpoint. Keep agent completion separate from the human UI protocol.
- **Dependencies:** Task state transition/audit behavior and the task drawer’s force-confirmation UI.
- **Acceptance test:** An Admin can mark an eligible task done through the drawer and sees the updated status; a Member/Viewer sees no executable control; agent completion remains covered by its bearer-token contract.

#### FE-005 — Medium — Project-list navigation does not select the project it claims to open

- **Evidence:** Project rows link to `/specs?projectId=${project.id}` and `/settings?projectId=${project.id}` (`src/app/(app)/projects/page.tsx:140-162`). The specs page derives data exclusively from the active-project cookie and never reads `searchParams` (`src/app/(app)/specs/page.tsx:17-39`). The sidebar is the only visible project-selection mechanism and changes state through `setActiveProjectId` (`src/components/shell/sidebar.tsx:230-247`).
- **User impact:** Selecting a project from **All Projects** can show specifications/settings for whichever project was already active, not the clicked project. This is especially misleading when users manage multiple projects.
- **Reproduction / trigger:** Make project A active, visit `/projects`, then click project B’s name or settings menu. The URL contains B’s ID but the specs server query remains scoped to A.
- **Recommended remediation:** On project-row selection, switch the active project through the supported persisted context mechanism before navigation, or make all relevant pages consistently validate and honor a project route/query parameter. Do not display a target-specific URL that the page ignores.
- **Dependencies:** Shell project context/cookie persistence, project switch action, specs/settings routing.
- **Acceptance test:** With two accessible projects, clicking each project row changes the active context and renders only that project’s specs/settings after refresh and direct navigation.

#### FE-006 — Medium — The empty Sessions CTA navigates to a nonexistent page

- **Evidence:** The Sessions empty state links **Create Session** to `/plans` (`src/app/(app)/sessions/components/sessions-table.tsx:170-180`). There is no `src/app/(app)/plans/page.tsx` in the route tree; plan review/execution is specified under `/specs/[id]` (`documentation/modules/specifications.md:24-34`).
- **User impact:** Users without sessions encounter a 404 from the only next-step CTA instead of being guided to a specification and plan approval.
- **Reproduction / trigger:** Visit `/sessions` for a project with no matching sessions and click **Create Session**.
- **Recommended remediation:** Link to `/specs` (optionally with a focused filter/onboarding message) or to a concrete eligible spec’s PLAN tab; only retain `/plans` if a real route and product flow are added.
- **Dependencies:** Specs list/detail navigation and plan-approval eligibility state.
- **Acceptance test:** The empty-state CTA resolves to an existing route and guides a user to an actionable plan-approval/create-spec path without a 404.

#### FE-007 — Medium — Core editor, task drawer, and session detail layouts are desktop-fixed and unusable on narrow screens

- **Evidence:** The editor permanently uses a two-column grid and a single-row toolbar (`src/components/specs/spec-editor.tsx:124-168,190-205`); the task overlay is hard-coded to `w-[640px]` (`src/components/tasks/task-drawer.tsx:204-205`); and session detail permanently uses five stat columns plus two `w-1/2` panes (`src/app/(app)/sessions/[id]/page.tsx:208-224,239-250`). None of these sections introduces a base/mobile layout or horizontal containment. The design system requires responsive, progressive disclosure and specifies the task drawer’s mobile snap behavior (`documentation/infrastructure/DESIGN_SYSTEM.md:10.2,11.7`).
- **User impact:** On phones and narrow tablets, editor controls overflow, the drawer exceeds the viewport, and session data/log panes become cramped or horizontally clipped. Users cannot reliably read controls or operate task intervention.
- **Reproduction / trigger:** Render `/specs/new`, any Task Drawer, or `/sessions/{id}` at a 320–480px viewport. Observe fixed two/five-column and 640px-wide layouts rather than a stacked or viewport-bounded presentation.
- **Recommended remediation:** Use mobile-first breakpoints: stack/scroll editor panes and toolbar actions, constrain the drawer to viewport width with mobile snap points, and collapse session stats/content into readable vertical sections. Verify keyboard focus, Escape, and scrolling still work in each responsive mode.
- **Dependencies:** Existing Vaul drawer configuration, shared page shell, editor/terminal components.
- **Acceptance test:** At 320px, 375px, 768px, and desktop widths, each flow has no unintended horizontal overflow; all actions remain visible/reachable, focus is trapped/restored correctly in the drawer, and task/session content remains readable.

#### FE-008 — Medium — Plan approval starts execution immediately, bypassing the required confirmation step

- **Evidence:** Clicking **Approve & Execute** directly invokes `handleApprove` (`src/components/specs/plan-tab.tsx:473-483`), which posts immediately with no dialog or notes (`:167-184`). The product specification requires an Approval Confirmation Dialog showing repository, branch, task count, optional notes, and cancel/confirm actions (`documentation/infrastructure/DESIGN_SYSTEM.md:11.6`, “Plan Review Action Buttons”).
- **User impact:** An irreversible/high-cost execution can be triggered by a single click without users reviewing the execution target or cancelling an accidental action; optional approval notes are impossible to provide from the UI.
- **Reproduction / trigger:** As an Admin on a pending-approval plan, click **Approve & Execute**. A session/job is started immediately instead of presenting a confirmation dialog.
- **Recommended remediation:** Implement the specified accessible confirmation dialog, pass optional notes to the compatible approval API, and only invoke approval from explicit confirmation. Preserve disabled/loading states to prevent duplicate submissions.
- **Dependencies:** Plan approval endpoint, session creation feedback, dialog component and plan metadata projection.
- **Acceptance test:** Clicking the button opens a keyboard-accessible dialog with cancel and confirm; cancel makes no network call, confirm makes exactly one approval call (including notes when supplied), then reports the queued/executing state.

### Strengths observed

- Authenticated client-side requests consistently include `credentials: 'include'`, including spec, session, plan, and task interactions (for example `src/app/(app)/specs/[id]/page.tsx:95` and `src/components/specs/plan-tab.tsx:149-154`).
- The app uses explicit loading/empty/error states and short polling for live execution surfaces, rather than hiding asynchronous transitions (`src/hooks/use-polling.ts:95-177`, `src/components/specs/plan-tab.tsx:253-289`).
- Role-limited controls in the plan and task drawers use disabled affordances and explanatory tooltips, which makes unavailable actions understandable (`src/components/specs/plan-tab.tsx:430-500`, `src/components/tasks/task-drawer.tsx:380-441`).

### Follow-up questions

1. Is mobile/tablet support a release requirement? The current product specification describes responsive drawer behavior, but no frontend viewport tests were found for the audited flows.
2. Should Members (rather than only Admins) be able to supply human context and unblock a task? The task module and `/unblock` endpoint say yes, while the current UI’s preliminary PATCH says no.
3. Is a standalone `/plans` page planned? If so, its lifecycle and route need to be added before the Sessions empty-state CTA can target it.
<!-- AUDIT:FRONTEND:END -->

## 4. Tests, CI, and Developer Tooling

<!-- AUDIT:QUALITY:START -->

### Findings

#### QA-001 — High — The required Unit Tests job is nondeterministic because all integration files reset one shared database

- **Evidence:** `vitest.config.ts:13-20` creates one template DB for the entire run and has no explicit single-worker pool; `tests/setup.ts:37-65` always derives the same `specdrivr_test_1` database when `VITEST_POOL_ID` is absent; every integration suite invokes global `TRUNCATE ... CASCADE` in `beforeEach` (for example `tests/integration/api.test.ts:50-51`, `tests/integration/repository.test.ts:13-14`, and `tests/helpers.ts:16-65`). PR #87's required **Unit Tests** check failed on 2026-09-03 with PostgreSQL `40P01 deadlock detected` on precisely that `TRUNCATE` statement after exhausting the five fixed 200 ms retries (`tests/helpers.ts:50-65`; CI run `33797606750`, job `100788955330`).
- **Impact:** A correct change can be blocked by a flaky CI failure, while reruns provide no confidence about isolation. PR #87 was merged even though this required-quality candidate failed.
- **Trigger / reproduction:** Run the integration suite where two test execution contexts or application-created database connections overlap a test's `cleanDatabase`; each context requests incompatible locks while the other holds a relation lock. PR #87 is a recorded reproduction.
- **Recommended remediation:** Give each Vitest worker a database created from the migrated template before its tests run, or serialize all database integration tests in a dedicated project with a single connection lifecycle. Close application/test pools between cases; replace retry-as-synchronization with a fixture transaction or exclusive test ownership. Preserve and publish deadlock diagnostics when a test fails.
- **Dependencies:** Vitest pool/global setup design, database client lifecycle, and CI test-job configuration.
- **Acceptance test:** Run the database suite repeatedly with the production worker setting and with at least two workers; every run has isolated database names and completes without `40P01`, `55P03`, leaked handles, or cleanup retries.

#### QA-002 — High — CI and the local pre-push gate omit the advertised E2E suite and do not measure the mandated coverage target

- **Evidence:** The repository defines full test as unit plus Playwright (`package.json:20-24`) and AGENTS requires at least 80% business-logic/repository coverage (`AGENTS.md:182`). CI intentionally runs only `pnpm test:unit` and explicitly omits E2E (`.github/workflows/ci.yml:71-75`); `scripts/hooks/checks/suite.sh:30-34` runs only typecheck. Neither `vitest.config.ts:12-29` nor package scripts configure a coverage provider, reporter, or threshold. The sole E2E case verifies only title and nonempty body (`tests/e2e/home.spec.ts:3-13`).
- **Impact:** Pull requests can pass every automated release gate while breaking user workflows, browser integration, or untested repository logic. The stated 80% threshold is not enforceable or observable.
- **Trigger / reproduction:** Introduce a browser-flow regression or reduce repository test coverage; `pnpm test:unit`, CI, and pre-push can remain green because neither runs meaningful E2E nor evaluates coverage.
- **Recommended remediation:** Make a browser suite (at minimum authentication and the critical project/spec/task flows) a required CI job with installed pinned browsers and test data; add Vitest coverage collection plus explicit per-area/global thresholds. Make the local fast gate clearly named and provide an opt-in/full pre-push gate, rather than documenting it as the full suite.
- **Dependencies:** Deterministic test environment/test data, Playwright browser installation, CI duration budget, and a coverage policy for generated/UI code.
- **Acceptance test:** CI executes Playwright against a clean app/database and uploads its report on failure; a deliberate critical-flow failure fails CI. A deliberately uncovered repository branch fails the configured coverage threshold.

#### QA-003 — High — Pre-push selects a machine-global pnpm version instead of the checkout's pinned toolchain

- **Evidence:** `.nvmrc:1` pins Node `25.6.1`, but `package.json:1-161` has neither `packageManager` nor `engines`; the lockfile is format 9 (`pnpm-lock.yaml:1`). CI independently installs pnpm 9 (`.github/workflows/ci.yml:24-30,62-68,99-105`; `security.yml:19-25`). Conversely, `scripts/hooks/prepush.sh:7` prepends `/opt/homebrew/bin:/usr/local/bin`; PR #87 documents that this made the hook select Homebrew pnpm 11 rather than the checkout's pnpm 10 and abort non-interactively while attempting its modules-directory replacement (`documentation/branches/feat/icon-visual-identity/BRANCH_CHANGES.md:37`).
- **Impact:** A developer can be forced to bypass quality gates based solely on PATH ordering, and local resolution/install behavior diverges from CI. This is an actual developer-workflow failure, not a hypothetical version-policy concern.
- **Trigger / reproduction:** Use a checkout installed with pnpm 10 and a machine whose `/opt/homebrew/bin/pnpm` is pnpm 11; invoke git pre-push. The hook resolves pnpm 11 first and can stop before its suite.
- **Recommended remediation:** Declare one exact pnpm version in `packageManager`, enable/use Corepack (or a repository-owned runner) in hooks and CI, and pin the same version in every workflow. Preserve PATH only to find the version manager; never make a system pnpm authoritative. State and check the supported Node range too.
- **Dependencies:** Developer bootstrap instructions, CI action setup, and a clean reinstall under the selected pnpm version.
- **Acceptance test:** On a host with conflicting pnpm 10 and 11 binaries, pre-commit, pre-push, CI, and `pnpm --version` all resolve the declared version; no modules-purge prompt occurs and the hook reaches its intended checks.

#### QA-004 — Medium — Local hooks are documented as enforcement but allow formatting/lint failures and do not run the test suite

- **Evidence:** AGENTS says pre-commit automatically runs `pnpm lint` and `pnpm typecheck`, and pre-push runs modular checks including `pnpm test` (`AGENTS.md:123-127`). In practice `scripts/hooks/precommit.sh:21-34` runs only lint-staged and exits 0 after a failure; `scripts/hooks/checks/suite.sh:30-34` executes typecheck but comments out lint and unit tests. The developer reference still calls `pnpm test` the “full test suite (used by `.husky/pre-push`)” (`documentation/infrastructure/SCRIPTS_REFERENCE.md:33-38`), which is false.
- **Impact:** Contributors receive a green local hook despite a known staged lint/format failure or failing tests, and documentation trains them to expect protection that does not exist.
- **Trigger / reproduction:** Stage an ESLint violation in a matching source file, or introduce a failing Vitest test, then commit/push; the pre-commit code returns success after lint-staged fails, and pre-push runs no tests.
- **Recommended remediation:** Decide and document fast versus blocking checks. Make selected pre-commit failures nonzero; run lint/typecheck/unit tests in a blocking pre-push/full verification command, or remove the enforcement claims and require CI status checks. Add hook contract tests for failure exit codes.
- **Dependencies:** Team tolerance for hook duration and the QA-001 isolation repair if tests become local-blocking.
- **Acceptance test:** A deliberately invalid staged file blocks commit, and a deliberately failing unit test blocks the documented full pre-push command; docs, package scripts, and hook behavior describe the same commands.

#### QA-005 — Medium — CI does not execute the repository-policy or hook-integrity verifiers, and checksum coverage stops at wrappers

- **Evidence:** `scripts/ci-verify-hooks.sh:12-67` is designed to run policy checks in CI and `scripts/verify-hooks.js:119-174` verifies hook integrity, but neither is referenced by any workflow (`.github/workflows/ci.yml:17-107`, `security.yml:12-65`). Moreover, `scripts/verify-hooks.js:25-27` defines only `.husky/pre-push` and `.husky/pre-commit` as critical; the checks that implement policy reside outside that checksum scope in `scripts/hooks/prepush.sh` and `scripts/hooks/checks/*.sh`.
- **Impact:** Direct GitHub pushes/PRs bypass local hooks, while a change that weakens the actual modular hook implementation can leave wrapper checksums valid. CI's lint/typecheck/tests do not cover the custom policy gates.
- **Trigger / reproduction:** Modify a file caught only by a modular policy check, or change `scripts/hooks/checks/suite.sh`; submit without running local hooks. Current CI has no step that invokes its policy or integrity scripts.
- **Recommended remediation:** Add a required CI policy job invoking the intended verifier(s) over the correct PR/push range; checksum/version the orchestrators and policy scripts or remove the misleading tamper-detection claim. Test the range calculation on shallow/new-branch and merge-queue checkouts.
- **Dependencies:** Branch-protection required checks and a decision whether custom policy checks are authoritative.
- **Acceptance test:** A fixture PR that violates each blocking policy fails the CI policy job, and modifying any covered hook/orchestrator/check script causes integrity verification to fail until its reviewed manifest is updated.

#### QA-006 — Medium — The unit job declares no Redis service although tested routes create a real Redis client, producing unhandled connection errors

- **Evidence:** CI's only test service is PostgreSQL (`.github/workflows/ci.yml:39-59`); `REDIS_URL` defaults to `redis://localhost:6379` (`src/lib/env-core.ts:19-24`), and importing `src/lib/redis.ts:1-7` creates an immediate ioredis client with no error handler. PR #87's Unit Tests log repeatedly reports `[ioredis] Unhandled error event: AggregateError` while integration tests execute (CI run `33797606750`, job `100788955330`).
- **Impact:** Tests produce noisy unhandled errors and may exercise error/fallback paths rather than their intended integration behavior. Future Node/ioredis behavior can convert these warnings into test instability or hangs.
- **Trigger / reproduction:** Run the CI unit job or any route test importing the Redis client without a listener; no process listens on localhost:6379.
- **Recommended remediation:** Either add a health-checked Redis service and supply its URL for genuine integration tests, or inject/mock a deterministic Redis boundary for unit tests. Ensure all test-created clients are closed and expected unavailable-service behavior is explicitly asserted.
- **Dependencies:** Redis client abstraction, test setup/teardown, and whether rate-limit/pub-sub behavior is within the unit or integration test contract.
- **Acceptance test:** Test logs contain no unhandled Redis error; Redis-dependent behavior runs against the declared test double/service and fails deterministically if that dependency is unavailable.

#### QA-007 — Low — Placeholder tests create passing assertions without covering product behavior

- **Evidence:** `tests/home.test.tsx:4-21` labels itself a placeholder, renders a literal `Hello World` rather than an application component, and contains an async “interaction” test with no assertions or interactions. The browser smoke test similarly checks only page title and a nonempty body (`tests/e2e/home.spec.ts:4-13`).
- **Impact:** Test counts and green status overstate UI regression protection, encouraging confidence in checks that do not exercise the shipped interface.
- **Trigger / reproduction:** Break the actual home page rendering or its user interactions; these tests can still pass because they never import or operate the feature.
- **Recommended remediation:** Delete demonstration tests or replace them with tests of the real route/components and observable user outcomes. Require every async test to contain an expectation or verified action.
- **Dependencies:** Stable home-page requirements and supported test-rendering/mocking boundaries.
- **Acceptance test:** A deliberate regression in the real home page's primary rendered state or interaction fails a test; no committed test remains marked placeholder or has an empty test body.

### Strengths observed

- CI uses immutable SHA-pinned actions, frozen lockfile installs, explicit timeouts, PostgreSQL health checks, and IPv4 DNS preference (`.github/workflows/ci.yml:20-33,38-69`).
- The test harness fails loudly rather than silently continuing when template or worker-database setup fails (`tests/setup/migrate.ts:21-30`, `tests/setup.ts:58-64`).
- The project has a useful real-PostgreSQL test pattern and a single `cleanDatabase` helper, making isolation repair centralized (`tests/helpers.ts:10-67`).
- Playwright disallows `.only` in CI and captures retry traces (`playwright.config.ts:6-17`).

### Follow-up questions

1. Which CI checks are protected merge requirements? PR #87 merged while its Unit Tests run concluded failure, so branch-protection/override policy needs confirmation.
2. Is pnpm 9, 10, or 11 the intended supported version? The evidence shows all three in active workflow/developer context.
3. Should Redis be a required integration dependency for test correctness, or should route/unit tests always isolate it behind a fake?
4. Are custom hook policy checks meant to be an authoritative gate or developer advisory? Current documentation and execution disagree.
<!-- AUDIT:QUALITY:END -->

## 5. Reliability, Performance, Observability, and Operations

<!-- AUDIT:OPERATIONS:START -->

### Findings

#### OPS-001 — Critical — No production deployment starts the plan worker or schedules recovery jobs

- **Evidence:** Plan generation is queued for asynchronous processing (the worker polls jobs in `scripts/plan-worker.ts:251-267`), and ghost recovery is only exposed as a one-shot script (`scripts/ghost-buster.ts:5-22`) or an authenticated HTTP endpoint (`src/app/api/v1/system/ghost-buster/route.ts:12-50`). The shipped Compose topology defines only `postgres`, `redis`, and the web `app` (`infra/compose/docker-compose.yml:2-58`); the production image entrypoint only migrates/seeds then executes `pnpm start` (`infra/docker/docker-entrypoint.sh:4-22`). The sole release workflow is explicitly a no-op placeholder (`.github/workflows/release.yml:20-24`).
- **Operational impact:** In the supplied deployment path, accepted plan jobs never have a consumer, and stale sessions are never recovered unless an operator manually invokes an undocumented external process/endpoint. Plans remain queued indefinitely and lost agents leave work unavailable.
- **Trigger / reproduction:** Deploy using the documented Compose or release configuration, create a plan-generation job, and wait beyond the worker poll interval: no `scripts/plan-worker.ts` process exists to claim it. Stop an agent and wait beyond the ghost threshold: no scheduler invokes recovery.
- **Recommended remediation:** Define a real production topology and release target with separately supervised worker and recovery/cron workloads, explicit health/readiness checks, restart policy, concurrency/scaling limits, and deployment runbooks. Make the scheduler invocation durable and observable rather than relying on an in-memory route guard.
- **Dependencies:** Deployment provider choice, process supervisor/cron service, worker configuration and operational ownership.
- **Acceptance test:** An ephemeral production-like deployment starts web, worker, and scheduled recovery workloads; a newly queued job reaches a terminal state without manual action, and a stale session is recovered within the configured threshold. Killing and restarting either worker proves jobs are reclaimed without duplicate execution.

#### OPS-002 — High — The documented load-balancer health endpoint is blocked by the proxy, and the app container has no healthcheck

- **Evidence:** Operations specifies `GET /api/health` as the load-balancer probe (`documentation/infrastructure/OPERATIONS.md:53-58`). The route performs DB and Redis checks and returns 200/503 (`src/app/api/health/route.ts:7-28`), but the proxy public allowlist contains only `/api/v1/health` (`src/proxy.ts:5-13`); all other API routes without a session cookie receive 401 (`src/proxy.ts:77-86`). The Compose `app` service declares no `healthcheck` (`infra/compose/docker-compose.yml:35-58`), whereas its dependencies do (`:15-19,29-33`).
- **Operational impact:** An unauthenticated load balancer probing the documented endpoint is reported unhealthy even when the application is healthy. Conversely, the container runtime has no application-level readiness signal, making rolling deploys and incident diagnosis unreliable.
- **Trigger / reproduction:** Run the app without an auth cookie and request `GET /api/health`; the proxy returns 401 instead of the route's DB/Redis status. Inspect `docker compose ps` after startup: `app` has no health state.
- **Recommended remediation:** Select one canonical unauthenticated liveness/readiness contract, exempt it explicitly in the proxy, and configure deployment/container probes with bounded timeouts and appropriate initial delay. Keep detailed dependency state on a restricted readiness endpoint if public disclosure is undesirable.
- **Dependencies:** Ingress/load-balancer configuration and deployment platform probe semantics.
- **Acceptance test:** Unauthenticated liveness/readiness probes return the documented status before and after dependency failure; the deployment waits for readiness and removes an unhealthy replica from traffic.

#### OPS-003 — High — Outbound webhooks are neither durable nor bounded, so retries can be lost or exhaust application capacity

- **Evidence:** Event dispatch deliberately starts `Promise.allSettled` without awaiting it (`src/lib/webhooks.ts:58-63`), while retry work sleeps in-process for up to five minutes (`:69,133-149`). Each delivery performs `fetch` and reads the entire response body with no `AbortSignal`/timeout or size cap (`:92-100`). Dispatch is invoked fire-and-forget after committed mutations throughout the repositories, for example session transitions (`src/repositories/agent-session-repository.ts:307-329`) and task transitions (`src/repositories/task-repository.ts:556-590`).
- **Operational impact:** Process/serverless request teardown, deployment, or crash loses pending delivery and retry state; a slow endpoint can hold promises/connections indefinitely, and many unavailable endpoints accumulate timers and outbound work in the web process. Delivery history records attempts but cannot serve as a recoverable outbox because no worker claims pending deliveries.
- **Trigger / reproduction:** Configure a webhook endpoint that accepts a TCP connection but never responds, then generate events; each call remains pending without a deadline. Restart the web process during the in-memory 5-minute retry delay; the remaining retry is never attempted.
- **Recommended remediation:** Commit an outbox record atomically with the domain event, process it in a supervised worker with a lease, exponential backoff/jitter, retry budget, and dead-letter state. Use `AbortSignal.timeout` (and an explicit maximum response-body size) for every outbound request; expose queue age, failures, and DLQ metrics.
- **Dependencies:** Outbox/delivery schema migration, worker runtime from OPS-001, webhook status UI/retention policy.
- **Acceptance test:** A hanging endpoint is aborted within the configured timeout; a process restart between attempts resumes the same delivery exactly according to retry policy; concurrent workers deliver each outbox item at most once per attempt and permanently failed items become queryable in a DLQ.

#### OPS-004 — High — Agent execution can run indefinitely without heartbeats, causing false ghost recovery and unrecoverable capacity loss

- **Evidence:** The agent sends a heartbeat only at the top of its sequential loop (`scripts/agent.ts:248-256`), then awaits the spawned model process closing with no timeout, abort controller, or periodic heartbeat (`:136-160`). The documented protocol requires a heartbeat every 15 seconds and declares sessions lost after 60 seconds (`documentation/infrastructure/INTEGRATIONS.md:36-48`), while the executable recovery script defaults to five minutes (`scripts/ghost-buster.ts:6-7`).
- **Operational impact:** Any normal long-running model/tool invocation stops heartbeats for its entire duration. A recovery service configured to the documented 60 seconds can reset work still executing; with the shipped five-minute default, a hung subprocess instead monopolizes a task/session until an operator intervenes. The agent has no graceful task cancellation or child-process cleanup path.
- **Trigger / reproduction:** Start a task whose model CLI runs longer than 60 seconds (or never exits). Observe no heartbeat requests during the child wait; invoke ghost recovery with the documented threshold and the session is classified stale while the child continues running.
- **Recommended remediation:** Run heartbeat/cancellation polling independently of task execution; enforce configurable wall-clock, idle-output, and shutdown deadlines; terminate the child process group on cancellation/timeout and report a bounded, idempotent failure. Reconcile one documented ghost threshold across scheduler and agent behavior.
- **Dependencies:** Task-attempt/lease ownership model, worker/scheduler deployment, model CLI cancellation semantics.
- **Acceptance test:** A simulated 90-second task produces heartbeats at or below 15-second intervals and is not ghosted; a hung child is terminated at the configured deadline, its task is consistently failed/released, and no descendant process survives agent shutdown.

#### OPS-005 — Medium — The declared Redis rate limiter is entirely disconnected from request handling and is unsafe to await during Redis outages

- **Evidence:** `checkRateLimit` is defined only in `src/lib/rate-limiter.ts:26-50`; repository-wide usage search finds no caller outside that module. The proxy imports only Next request/response types (`src/proxy.ts:1-2`) and implements no rate-limit check. The Redis client config sets `maxRetriesPerRequest: null` (`src/lib/redis.ts:5-7`), so requests issued while Redis repeatedly reconnects need not reject promptly for the limiter's intended fail-open catch path.
- **Operational impact:** The documented traffic ceilings are not enforced, leaving API/agent capacity susceptible to accidental or malicious request storms. If the helper is later wired naively, a Redis outage can turn a best-effort limiter into unbounded request latency rather than controlled fail-open behavior.
- **Trigger / reproduction:** Send more than 100 API requests/minute from one authenticated identity or more than 10 auth requests/minute from one IP; no handler invokes the limiter or returns its 429 response. Disconnect Redis and call the helper in a process using the current infinite retry configuration.
- **Recommended remediation:** Apply rate limiting at an appropriate request boundary with authenticated identifiers and route-specific exemptions, and add endpoint-level coverage. Configure finite Redis connect/command retry behavior or a deadline around limiter calls so the stated fail-open policy is timely and measurable.
- **Dependencies:** Edge/runtime compatibility decision (current ioredis client is server-only), Redis availability objectives, product policy for fail-open vs. fail-closed auth throttling.
- **Acceptance test:** Contract tests prove each tier returns 429 with correct headers at its limit and does not rate-limit excluded probes; with Redis unavailable, requests complete according to the chosen fallback within a bounded latency and emit a fallback metric/log.

#### OPS-006 — Medium — Production telemetry cannot correlate requests or measure the documented reliability targets

- **Evidence:** The logger is a bare Pino instance with only a level and optional pretty transport (`src/lib/logger.ts:5-15`). There is no correlation/request ID middleware or logger child binding in the proxy (`src/proxy.ts:43-93`), and a repository-wide search for `correlationId` finds no implementation. Operations requires a correlation ID on every request and external instrumentation for request/database/agent timings (`documentation/infrastructure/OPERATIONS.md:88-101`), but the worker only logs coarse job duration after completion (`scripts/plan-worker.ts:51-53,239-242`).
- **Operational impact:** Operators cannot join an agent request, API call, database action, and webhook outcome during an incident, nor establish p95 API latency, queue age, error-rate, dependency latency, or task-execution SLOs. Failures may be visible only as isolated log messages.
- **Trigger / reproduction:** Issue a request that creates a plan and subsequently produces a worker/webhook failure; emitted logs have no shared request/correlation identifier, and no metric records the API/database/external-call latency chain.
- **Recommended remediation:** Introduce a request context that accepts or generates a correlation ID and binds it to structured logs/responses; propagate job/session IDs through worker and integration logs. Add OpenTelemetry/APM metrics and traces for HTTP, DB, Redis, queue claim/age, agent heartbeat, external-call latency/retry, and health state, with dashboards and alert thresholds tied to the documented SLOs.
- **Dependencies:** Telemetry backend selection, privacy/redaction policy, Next.js runtime instrumentation design.
- **Acceptance test:** A synthetic request can be traced from ingress through database, worker, and webhook attempts using one correlation ID; dashboards expose p50/p95/error rate/queue age/dependency availability, and a deliberate SLO breach raises a test alert without including secret or PII fields.

#### OPS-007 — Medium — The production container mutates shared data at startup and seeds demo data on an empty database

- **Evidence:** Every container boot runs `pnpm db:migrate` (`infra/docker/docker-entrypoint.sh:4-5`), queries the user count (`:7-14`), and runs `pnpm db:seed` whenever it is zero (`:16-19`) before starting the server (`:21-22`). The application image is used by the production `app` service (`infra/compose/docker-compose.yml:35-40`).
- **Operational impact:** A first production boot populates an otherwise empty customer database with development/demo records. On replica starts or incident restarts, schema migration becomes part of the serving critical path, potentially delaying readiness or failing all replicas together; it also couples recovery to a write-capable database principal.
- **Trigger / reproduction:** Start the supplied production Compose stack against a fresh database. The entrypoint reports "Seeding demo data" and inserts seed records before the app serves traffic. Restart multiple replicas during a migration/database incident and each executes the migration check on boot.
- **Recommended remediation:** Separate migrations into a single deployment job with locking, observability, rollback/runbook controls, and fail-fast readiness. Remove automatic production seeding entirely; make explicit development/demo seeding opt-in and require a production-safe guard.
- **Dependencies:** Deployment orchestration from OPS-001, migration ownership/rollback strategy, environment classification.
- **Acceptance test:** A clean production deployment creates no demo user or sample project; exactly one migration job runs before application rollout, and a failed migration prevents traffic promotion without repeatedly restarting application replicas.

### Strengths observed

- The primary health route checks both PostgreSQL and Redis and returns 503 when either dependency fails (`src/app/api/health/route.ts:7-28`).
- Webhook delivery captures status, response code, truncated response text, duration, and attempt number (`src/lib/webhooks.ts:116-128`), which is a useful foundation for a durable outbox.
- Queue polling uses a fixed backoff rather than tight spinning in both the plan worker and agent (`scripts/plan-worker.ts:262-266`, `scripts/agent.ts:258-277`), and the worker logs individual job duration (`scripts/plan-worker.ts:239-242`).
- Redis-backed lock release uses token-checked Lua deletion, avoiding accidental release of another holder's lock (`src/lib/lock-manager.ts:21-35`).

### Follow-up questions

1. Which production deployment platform and process supervisor are authoritative? The repository currently contains only a no-op release workflow and a local Compose topology.
2. What is the intended recovery SLO: the integration specification's 60 seconds or the ghost-buster executable's five-minute default?
3. Are generic webhooks an at-least-once contract, and what retention/visibility is required for permanently failed deliveries?
4. Is Redis intended to be required for readiness, as `/api/health` currently implies, or an optional dependency with the documented fail-open behavior?
<!-- AUDIT:OPERATIONS:END -->

## Consolidated Implementation and Fix Plan

<!-- CONSOLIDATED:START -->

### Primary Review

The audit contains **34 verified findings**: 3 Critical, 18 High, 12 Medium, and 1 Low. The
specialist sections use consistent evidence and acceptance criteria. The primary review found no
duplicate IDs or unsupported release-blocking claim. Several items are intentionally coupled and
must be delivered together rather than fixed as isolated endpoints:

- `SEC-003`, `BE-002`, `BE-003`, `BE-004`, and `OPS-004` are one ownership/lease problem across the
  agent protocol. Route-only authorization checks would contain cross-tenant access but would not
  fix duplicate completion, session attribution, recovery, or heartbeat safety.
- `BE-001`, `BE-005`, `BE-007`, `FE-001`, and `FE-002` are one plan-generation consistency problem.
  The transaction and version fence must exist before the UI is pointed at a unified generate /
  regenerate flow.
- `QA-001`, `QA-003`, and `QA-006` explain current false-negative/noisy quality gates. Repairing
  them is prerequisite work because later concurrency and security changes depend on trustworthy
  integration tests.
- `OPS-001` is Critical despite the Product Map calling the background worker “visionary”: plan
  generation itself is marked ground truth and already queues work, so a deployment that never
  runs its consumer is functionally incomplete. Resolve that documentation contradiction as part
  of the deployment work.

### Delivery Rules

1. Freeze new execution/integration features until Release Gate A is green.
2. Keep each pull request to one independently reviewable invariant and generally below 300 lines;
   split migrations, compatibility code, and cleanup where necessary.
3. Add a failing regression test before each bug fix. Concurrency findings require deterministic
   multi-connection PostgreSQL tests, not mocked repositories.
4. Use additive, backward-compatible migrations first. Deploy readers/writers before enforcing new
   constraints, then remove compatibility paths in a later PR.
5. Version agent-protocol changes. During rollout, old agents must be rejected clearly or supported
   explicitly; they must never silently bypass lease/session binding.
6. Never return stored secret values to a browser. Configuration responses expose only public
   fields and `isConfigured` metadata.
7. A work package is complete only when its acceptance tests, module documentation, and operational
   runbook are updated together.

### Decisions Required Before Coding

| Decision                     | Recommended default                                                                                                | Unblocks                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| D-01: Supported pnpm version | Pin pnpm 10 through `packageManager` + Corepack and make hooks honor it.                                           | `QA-003`, all reliable local gates |
| D-02: Agent concurrency      | Support configured concurrency with a durable per-attempt lease; do not silently force one.                        | `BE-002`–`BE-004`, `OPS-004`       |
| D-03: Agent token scope      | Require exactly one project and Admin/Owner issuance.                                                              | `SEC-001`–`SEC-003`                |
| D-04: Secret storage         | Envelope encryption using a deployment-managed key; return set/unset metadata only.                                | `SEC-004`                          |
| D-05: Repository providers   | Initially allow GitHub and GitLab provider APIs only; reject arbitrary URLs.                                       | `SEC-005`                          |
| D-06: Production runtime     | Supervised web + plan worker + webhook worker + scheduled recovery workloads.                                      | `OPS-001`, `OPS-003`, `OPS-007`    |
| D-07: Recovery SLO           | 60-second stale threshold with heartbeats every 15 seconds and bounded jitter.                                     | `BE-004`, `OPS-004`                |
| D-08: Redis posture          | Required for production readiness and integration tests; explicit bounded fail-open only for non-auth rate limits. | `QA-006`, `OPS-002`, `OPS-005`     |

### Ordered Work Packages

#### Gate A — Immediate containment and trustworthy tests

No production rollout should occur until every Gate A package is complete.

| Order | Work package                            | Findings                     | Implementation slices                                                                                                                                                               | Exit criteria                                                                                                                    |
| ----- | --------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| A1    | Deterministic test foundation           | `QA-001`, `QA-003`, `QA-006` | Isolate each integration file in its own cloned DB or serialize all DB suites; close pools/Redis clients; add Redis service/test double; pin pnpm and stop hooks overriding `PATH`. | Five consecutive CI runs pass without PostgreSQL deadlocks or Redis errors; local hooks use the pinned pnpm.                     |
| A2    | Agent-token containment                 | `SEC-001`, `SEC-002`         | Require project-scoped Admin/Owner issuance; reject project-less tokens; enforce expiry/revocation centrally; update `lastUsedAt` only after success.                               | Cross-tenant, Viewer, revoked, and expired token tests deny every agent endpoint without mutation.                               |
| A3    | Agent resource scoping                  | `SEC-003`                    | Add shared token-to-resource scope resolution and repository predicates for session/task mutations. This is containment before the full lease redesign.                             | Project-A credentials cannot heartbeat, complete, log to, or mutate project-B resources.                                         |
| A4    | Secret and outbound-request containment | `SEC-004`, `SEC-005`         | Introduce redacted config DTOs and Admin/Owner access; encrypt stored secrets; replace arbitrary URL fetch with provider-specific validation and private-network rejection.         | No API/browser response contains stored secrets; SSRF test matrix blocks literals, DNS rebinding/private results, and redirects. |
| A5    | Atomic plan-generation request          | `BE-001`                     | Pass the Drizzle transaction executor through all three writes; add failure injection at every boundary.                                                                            | Generation either commits plan + spec state + job together or commits none.                                                      |

#### Gate B — Correct execution and plan lifecycle

Gate B establishes durable execution invariants and repairs the primary product flows.

| Order | Work package                          | Findings            | Implementation slices                                                                                                                                                                                          | Exit criteria                                                                                                                |
| ----- | ------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| B1    | Attempt lease and capacity model      | `BE-002`, `BE-003`  | Add lease/session ownership and unique active-attempt/idempotency constraints; atomically claim capacity; require attempt + session identity on completion; condition terminal updates on owned running state. | Concurrent tests prove max-N capacity, exactly-once completion, and correct session attribution.                             |
| B2    | Cancellation, recovery, and heartbeat | `BE-004`, `OPS-004` | Recover every active lease transactionally; increment/close attempts and emit reset events; run heartbeat/cancel polling independently; enforce child-process timeouts and process-group cleanup.              | Long tasks remain healthy; cancelled/hung agents leave no child process or zombie `in_progress` task; recovery meets D-07.   |
| B3    | Version-fenced, idempotent plan jobs  | `BE-005`, `BE-007`  | Bind jobs to spec versions/generation tokens; cancel superseded jobs; condition result application on current state; atomically persist the generated DAG; add uniqueness/idempotency constraints.             | Editing during generation cannot revive stale work; retries cannot create partial or duplicate task graphs.                  |
| B4    | Unified create/generate/regenerate UI | `FE-001`, `FE-002`  | Expose one state-aware application service; return the new spec ID; navigate to and poll the Plan tab; wire every regeneration state to the supported contract.                                                | Create-and-generate and every rendered regenerate CTA produce exactly one current-version job and no 404.                    |
| B5    | Human task intervention               | `FE-003`, `FE-004`  | Separate member unblock-with-context from Admin/Owner manual completion; use browser-authenticated actions; require audit reason and explicit state-transition policy.                                         | Role-correct retry/unblock/manual-complete controls work and create an audit record; agent bearer endpoints remain separate. |
| B6    | Persisted verification contract       | `BE-006`            | Add done-criteria/files/verification fields; persist and return them; execute verification with a bounded runner; store result/output before terminal success.                                                 | A failing verify command cannot mark a task done; metadata survives generation-to-agent round trip.                          |

#### Gate C — Production-operable deployment

| Order | Work package                | Findings             | Implementation slices                                                                                                                                                           | Exit criteria                                                                                                                       |
| ----- | --------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| C1    | Production process topology | `OPS-001`, `OPS-007` | Select the production target; add supervised web/worker/recovery processes and readiness; move migrations to a single deployment job; remove automatic production demo seeding. | A clean production-like deploy processes queued plans and recovery automatically, runs one migration job, and creates no demo data. |
| C2    | Canonical health contract   | `OPS-002`            | Define public liveness and bounded dependency readiness routes; exempt only those paths in the proxy; add app container/platform probes.                                        | Unauthenticated probes return correct states and unhealthy replicas leave traffic.                                                  |
| C3    | Durable webhook outbox      | `OPS-003`            | Persist event + outbox atomically; add leased worker, timeouts/body caps, jittered retry budget, DLQ, and replay/visibility.                                                    | Restart and hanging-endpoint tests prove bounded, durable at-least-once delivery without lost retries.                              |
| C4    | Rate limits and telemetry   | `OPS-005`, `OPS-006` | Wire identity-aware limits with bounded Redis behavior; add request/correlation context, structured propagation, metrics/traces, dashboards, and alerts.                        | Limit contract tests pass; one synthetic request is traceable through API, DB, worker, and webhook; SLO breach raises an alert.     |

#### Gate D — Product completeness and sustained quality

| Order | Work package                         | Findings                               | Implementation slices                                                                                                                               | Exit criteria                                                                                                                             |
| ----- | ------------------------------------ | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| D1    | Project/session navigation repair    | `FE-005`, `FE-006`                     | Make project selection update validated active context before navigation; point the empty-session CTA at a real actionable flow.                    | Multi-project navigation always shows the selected tenant; no primary CTA reaches 404.                                                    |
| D2    | Safe approval and responsive core UI | `FE-007`, `FE-008`                     | Add accessible approval confirmation with target/task count/notes; implement mobile-first editor, drawer, and session layouts plus viewport tests.  | Approval requires explicit confirmation; 320/375/768px and desktop tests show no overflow and correct focus behavior.                     |
| D3    | Honest quality gates                 | `QA-002`, `QA-004`, `QA-005`, `QA-007` | Run E2E and coverage in CI; align hook docs/behavior; execute policy/checksum validation in CI; replace placeholder tests with real route outcomes. | Required checks match documentation, coverage is reported/enforced at the agreed threshold, and deliberate UI/policy regressions fail CI. |

### Suggested Pull-Request Sequence

Use one branch per numbered item unless the migration rollout requires an additional compatibility
PR. Recommended order:

1. `fix/test-isolation-toolchain` — A1
2. `fix/agent-token-boundaries` — A2
3. `fix/agent-resource-scope` — A3
4. `fix/integration-secret-boundaries` — A4
5. `fix/atomic-plan-generation` — A5
6. `feat/attempt-leases` — B1 (schema, dual-read/write, then constraint enforcement if needed)
7. `fix/session-recovery-heartbeats` — B2
8. `fix/plan-version-fencing` — B3
9. `fix/spec-plan-ui-flow` — B4
10. `fix/human-task-intervention` — B5
11. `feat/task-verification-contract` — B6
12. `ops/production-process-topology` — C1 + C2 only if review size remains bounded
13. `feat/durable-webhook-outbox` — C3
14. `ops/rate-limits-telemetry` — split rate limiting and telemetry if either exceeds review scope
15. `fix/project-session-navigation` — D1
16. `fix/approval-responsive-ui` — split confirmation and responsive layouts if needed
17. `chore/quality-gates` — D3

### Release Gates and Definition of Done

- **Release Gate A — Security:** zero known Critical/High cross-tenant, token-lifecycle, secret
  disclosure, SSRF, or plan-transaction defects; regression tests pass against PostgreSQL and Redis.
- **Release Gate B — Correctness:** all agent mutations are lease/session/project bound and
  idempotent; plan jobs are version-fenced; primary create/generate/retry/manual-intervention flows
  pass E2E tests.
- **Release Gate C — Operations:** production topology runs every required workload; migrations and
  seed behavior are safe; health, recovery, webhook durability, rate limits, and minimum telemetry
  have production-like verification.
- **Release Gate D — Quality:** CI and hooks use one pinned toolchain; unit, integration, E2E,
  policy, and coverage gates match documentation; core workflows pass accessibility and responsive
  checks.

For every PR: run lint, typecheck, affected integration/concurrency tests, the full unit suite, and
relevant Playwright journeys. For schema or protocol work, also test upgrade compatibility and
rollback/failure behavior. Update `PRODUCT_MAP.md` only when the corresponding exit criteria are
actually demonstrated.

<!-- CONSOLIDATED:END -->
