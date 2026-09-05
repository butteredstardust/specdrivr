SPECDRIVR

Master Product Specification — Symbol Registry

---

## 1. Purpose

Use this registry to find current high-value repository and UI symbols. It transcribes source
signatures. It describes inferred object return types without duplicating them.

## 2. TaskRepository (`src/repositories/task-repository.ts`)

| Method | Current signature | Responsibility |
| --- | --- | --- |
| `getById` | `getById(id: number): Promise<Task \| null>` | Return one task. |
| `getProjectId` | `getProjectId(id: number): Promise<number \| null>` | Find task ownership through plan and specification joins. |
| `getByPlanId` | `getByPlanId(planId: number): Promise<Task[]>` | Return tasks for a plan. |
| `getBySpecId` | `getBySpecId(specId: number): Promise<Task[]>` | Return specification tasks in execution order. |
| `getBlockedByProjectId` | `getBlockedByProjectId(projectId: number): Promise<Task[]>` | Return blocked tasks for one project. |
| `create` | `create(data: CreateTaskData): Promise<Task>` | Validate input. Create a task. |
| `update` | `update(id: number, data: UpdateTaskData): Promise<Task>` | Update fields. Dispatch status integrations. |
| `claimNextTaskForProject` | `claimNextTaskForProject(projectId: number, sessionId: number): Promise<(Task & { attemptId: number; sessionId: number }) \| null>` | Atomically lease the next task with ready dependencies. |
| `retryTask` | `retryTask(id: number, userId: string): Promise<Task>` | Reset and audit an eligible completed, failed, or skipped task. |
| `unblockTask` | `unblockTask(id: number, humanContext: string, userId: string): Promise<Task>` | Set a blocked task to todo with human context. |
| `overrideStatus` | `overrideStatus(id: number, status: TaskStatus, userId: string, notes?: string \| null): Promise<Task>` | Apply and audit a manual status override. |
| `getAttempts` | `getAttempts(taskId: number): Promise<TaskAttempt[]>` | Return attempts, newest first. |
| `getFileChanges` | `getFileChanges(taskId: number): Promise<FileChange[]>` | Return task file changes. |
| `getFileChangesBySpecId` | `getFileChangesBySpecId(specId: number): Promise<FileChange[]>` | Return all file changes for one specification. |

Do not use the obsolete `claimNext(sessionId: string)` name or signature.

## 3. ProjectRepository (`src/repositories/project-repository.ts`)

| Method | Current signature | Responsibility |
| --- | --- | --- |
| `getAll` | `getAll(limit?: number, offset?: number): Promise<Project[]>` | Return a paginated project list. |
| `getById` | `getById(id: number): Promise<Project \| null>` | Return a project by numeric ID. |
| `getByUserId` | `getByUserId(userId: string, limit?: number, offset?: number): Promise<Project[]>` | Return projects visible to one user. |
| `getActive` | `getActive(): Promise<Project[]>` | Return active projects. |
| `create` | `create(data: CreateProjectData): Promise<Project>` | Create a project and owner membership in one transaction. |
| `update` | `update(id: number, data: UpdateProjectData): Promise<Project>` | Update one project. |
| `archive` | `archive(id: number): Promise<Project>` | Set a project as archived. |
| `delete` | `delete(id: number): Promise<void>` | Remove a project. |

Do not use UUID `getById`, `getBySlug`, or `getWithMembers`. These entries are not in the
repository.

## 4. AgentSessionRepository (`src/repositories/agent-session-repository.ts`)

| Method | Current signature | Responsibility |
| --- | --- | --- |
| `recoverGhostSessions` | `recoverGhostSessions(thresholdSeconds?: number): Promise<number>` | Fail stale sessions. Release running task leases. |
| `cancelWithLeaseRecovery` | `cancelWithLeaseRecovery(sessionId: number, actorId: string): Promise<AgentSession>` | Cancel a session. Recover its leases atomically. |
| `getById` | `getById(id: number): Promise<AgentSession \| null>` | Return one session. |
| `heartbeatForProject` | `heartbeatForProject(id: number, projectId: number): Promise<boolean>` | Update a heartbeat in project scope. |
| `getByProjectId` | `getByProjectId(projectId: number, limit?: number, offset?: number): Promise<AgentSession[]>` | Return project sessions. |
| `create` | `create(data: { projectId: number; specId?: number; planId?: number; startedBy?: string }): Promise<AgentSession>` | Create an execution session. |
| `update` | `update(id: number, data: Partial<AgentSessionInsert>, actorId?: string): Promise<AgentSession>` | Update a session. Emit lifecycle integrations. |
| `getProjectActivity` | `getProjectActivity(projectId: number, limit?: number): Promise<Record<string, unknown>[]>` | Return dashboard activity. |
| `getEvents` | `getEvents(sessionId: number, limit: number): Promise<AgentEventSelect[]>` | Return session events. |
| `addEvent` | `addEvent(data: Omit<AgentEventInsert, 'id' \| 'createdAt'>): Promise<void>` | Store an event. |
| `delete` | `delete(id: number): Promise<void>` | Remove a session. |

Do not use `getWithLogs`. Use the dedicated access paths for logs and events.

## 5. SpecificationRepository (`src/repositories/specification-repository.ts`)

| Method | Current signature | Responsibility |
| --- | --- | --- |
| `getById` | `getById(id: number): Promise<Specification \| null>` | Return one specification. |
| `getByIdWithVersion` | `getByIdWithVersion(id: number)` | Return a specification and its latest version content. |
| `getByProjectId` | `getByProjectId(projectId: number): Promise<Specification[]>` | Return project specifications. |
| `listByProjectId` | `listByProjectId(projectId: number, options?: { page?: number; limit?: number })` | Return paginated specifications. |
| `existsByName` | `existsByName(projectId: number, name: string): Promise<boolean>` | Check name uniqueness within one project. |
| `createWithVersion` | `createWithVersion(data: { projectId: number; name: string; markdownContent: string; createdBy: string }): Promise<Specification>` | Create the specification and immutable first version atomically. |
| `addVersion` | `addVersion(data: { specId: number; markdownContent: string; createdBy: string }): Promise<Specification>` | Add an immutable version. Reconcile active plan state. |
| `getVersionsBySpecId` | `getVersionsBySpecId(specId: number)` | Return immutable versions. |
| `getVersionById` | `getVersionById(specId: number, versionId: number)` | Return one version within its specification. |
| `updateStatus` | `updateStatus(id: number, status: SpecStatus): Promise<Specification>` | Update lifecycle status. |

Do not use `getLatest` or `createVersion`. These entries are not present.

## 6. UI overhaul symbols

| Symbol | File | Responsibility |
| --- | --- | --- |
| `GatedButton` | `src/components/ui/gated-button.tsx` | Provide a disabled action with a keyboard-accessible explanation tooltip. |
| `EntityId` | `src/components/ui/entity-id.tsx` | Apply consistent mono styling to entity identifiers. |
| `StatusIcon` | `src/components/ui/status-icon.tsx` | Show an accessible semantic status glyph. |
| `usePlan` | `src/components/specs/plan/use-plan.ts` | Fetch a plan. Run all review mutations through one `act` helper. |
| `PlanReview` | `src/components/specs/plan/plan-review.tsx` | Provide the review-state plan UI. |
| `useTaskActions` | `src/components/tasks/use-task-actions.ts` | Run task drawer mutations and share action state. |
| `useSystemHealth` | `src/hooks/use-system-health.ts` | Poll system health outside the systems bar. |

## 7. Repository rule

Every repository extends `BaseRepository`. Send Drizzle work through `executeQuery`. Outside the
repository layer, import the exported singleton, such as `taskRepository`. Never import `db` from a
component.
