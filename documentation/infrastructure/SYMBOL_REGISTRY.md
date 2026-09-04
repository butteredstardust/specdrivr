**SPECDRIVR**

Master Product Specification — Symbol Registry

[Status: GROUND TRUTH — reconciled 2026-09-04]

---

## 1. Purpose

This registry points agents to current high-value repository and UI symbols. Signatures are
transcribed from source; inferred object return types are described instead of duplicated.

## 2. TaskRepository (`src/repositories/task-repository.ts`)

| Method | Current signature | Responsibility |
| --- | --- | --- |
| `getById` | `getById(id: number): Promise<Task \| null>` | Fetch one task. |
| `getProjectId` | `getProjectId(id: number): Promise<number \| null>` | Resolve task ownership through plan/spec joins. |
| `getByPlanId` | `getByPlanId(planId: number): Promise<Task[]>` | List plan tasks. |
| `getBySpecId` | `getBySpecId(specId: number): Promise<Task[]>` | List spec tasks in execution order. |
| `getBlockedByProjectId` | `getBlockedByProjectId(projectId: number): Promise<Task[]>` | List blocked tasks scoped to a project. |
| `create` | `create(data: CreateTaskData): Promise<Task>` | Validate and create a task. |
| `update` | `update(id: number, data: UpdateTaskData): Promise<Task>` | Update fields and dispatch status integrations. |
| `claimNextTaskForProject` | `claimNextTaskForProject(projectId: number, sessionId: number): Promise<(Task & { attemptId: number; sessionId: number }) \| null>` | Atomically lease the next dependency-ready task. |
| `retryTask` | `retryTask(id: number, userId: string): Promise<Task>` | Reset an eligible completed/failed/skipped task and audit it. |
| `unblockTask` | `unblockTask(id: number, humanContext: string, userId: string): Promise<Task>` | Return a blocked task to todo with human context. |
| `overrideStatus` | `overrideStatus(id: number, status: TaskStatus, userId: string, notes?: string \| null): Promise<Task>` | Apply an audited manual status override. |
| `getAttempts` | `getAttempts(taskId: number): Promise<TaskAttempt[]>` | List attempts newest first. |
| `getFileChanges` | `getFileChanges(taskId: number): Promise<FileChange[]>` | List task file changes. |
| `getFileChangesBySpecId` | `getFileChangesBySpecId(specId: number): Promise<FileChange[]>` | List all file changes for a spec. |

The old `claimNext(sessionId: string)` name/signature is obsolete.

## 3. ProjectRepository (`src/repositories/project-repository.ts`)

| Method | Current signature | Responsibility |
| --- | --- | --- |
| `getAll` | `getAll(limit?: number, offset?: number): Promise<Project[]>` | Paginated project list. |
| `getById` | `getById(id: number): Promise<Project \| null>` | Fetch by numeric ID. |
| `getByUserId` | `getByUserId(userId: string, limit?: number, offset?: number): Promise<Project[]>` | List projects visible to a user. |
| `getActive` | `getActive(): Promise<Project[]>` | List active projects. |
| `create` | `create(data: CreateProjectData): Promise<Project>` | Create a project and owner membership transactionally. |
| `update` | `update(id: number, data: UpdateProjectData): Promise<Project>` | Update a project. |
| `archive` | `archive(id: number): Promise<Project>` | Mark a project archived. |
| `delete` | `delete(id: number): Promise<void>` | Delete a project. |

The former UUID `getById`, `getBySlug`, and `getWithMembers` entries were not present in the
repository and have been removed from this registry.

## 4. AgentSessionRepository (`src/repositories/agent-session-repository.ts`)

| Method | Current signature | Responsibility |
| --- | --- | --- |
| `recoverGhostSessions` | `recoverGhostSessions(thresholdSeconds?: number): Promise<number>` | Fail stale sessions and release running task leases. |
| `cancelWithLeaseRecovery` | `cancelWithLeaseRecovery(sessionId: number, actorId: string): Promise<AgentSession>` | Cancel a session and recover its leases atomically. |
| `getById` | `getById(id: number): Promise<AgentSession \| null>` | Fetch one session. |
| `heartbeatForProject` | `heartbeatForProject(id: number, projectId: number): Promise<boolean>` | Update heartbeat within project scope. |
| `getByProjectId` | `getByProjectId(projectId: number, limit?: number, offset?: number): Promise<AgentSession[]>` | List project sessions. |
| `create` | `create(data: { projectId: number; specId?: number; planId?: number; startedBy?: string }): Promise<AgentSession>` | Start an execution session. |
| `update` | `update(id: number, data: Partial<AgentSessionInsert>, actorId?: string): Promise<AgentSession>` | Update a session and emit lifecycle integrations. |
| `getProjectActivity` | `getProjectActivity(projectId: number, limit?: number): Promise<Record<string, unknown>[]>` | Fetch dashboard activity. |
| `getEvents` | `getEvents(sessionId: number, limit: number): Promise<AgentEventSelect[]>` | Fetch session events. |
| `addEvent` | `addEvent(data: Omit<AgentEventInsert, 'id' \| 'createdAt'>): Promise<void>` | Persist an event. |
| `delete` | `delete(id: number): Promise<void>` | Delete a session. |

There is no `getWithLogs` method; logs/events use dedicated access paths.

## 5. SpecificationRepository (`src/repositories/specification-repository.ts`)

| Method | Current signature | Responsibility |
| --- | --- | --- |
| `getById` | `getById(id: number): Promise<Specification \| null>` | Fetch one specification. |
| `getByIdWithVersion` | `getByIdWithVersion(id: number)` | Fetch a spec plus its latest version content. |
| `getByProjectId` | `getByProjectId(projectId: number): Promise<Specification[]>` | List project specifications. |
| `listByProjectId` | `listByProjectId(projectId: number, options?: { page?: number; limit?: number })` | Return paginated specifications. |
| `existsByName` | `existsByName(projectId: number, name: string): Promise<boolean>` | Check project-local name uniqueness. |
| `createWithVersion` | `createWithVersion(data: { projectId: number; name: string; markdownContent: string; createdBy: string }): Promise<Specification>` | Create the spec and immutable first version atomically. |
| `addVersion` | `addVersion(data: { specId: number; markdownContent: string; createdBy: string }): Promise<Specification>` | Add an immutable version and reconcile active plan state. |
| `getVersionsBySpecId` | `getVersionsBySpecId(specId: number)` | List immutable versions. |
| `getVersionById` | `getVersionById(specId: number, versionId: number)` | Fetch one version within its spec. |
| `updateStatus` | `updateStatus(id: number, status: SpecStatus): Promise<Specification>` | Change lifecycle status. |

The former `getLatest` and `createVersion` entries were not present and have been removed.

## 6. UI overhaul symbols

| Symbol | File | Responsibility |
| --- | --- | --- |
| `GatedButton` | `src/components/ui/gated-button.tsx` | Disabled action with a keyboard-accessible explanation tooltip. |
| `EntityId` | `src/components/ui/entity-id.tsx` | Consistent mono treatment for entity identifiers. |
| `StatusIcon` | `src/components/ui/status-icon.tsx` | Accessible semantic status glyph. |
| `usePlan` | `src/components/specs/plan/use-plan.ts` | Plan fetch plus all review mutations through one `act` helper. |
| `PlanReview` | `src/components/specs/plan/plan-review.tsx` | Review-state plan UI. |
| `useTaskActions` | `src/components/tasks/use-task-actions.ts` | Task drawer mutations and shared action state. |
| `useSystemHealth` | `src/hooks/use-system-health.ts` | Health polling formerly embedded in the removed systems bar. |

## 7. Repository rule

Every repository extends `BaseRepository` and sends Drizzle work through `executeQuery`. Import the
exported singleton (for example, `taskRepository`) outside the repository layer; never import `db`
from a component.
