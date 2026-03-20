**SPECDRIVR**

Master Product Specification — Symbol Registry

[Status: GROUND TRUTH]

---

## 1. Overview

This registry maps the core repository method signatures to help AI agents identify implementation paths without redundant source reads.

## 2. TaskRepository (`src/repositories/task-repository.ts`)

| Method        | Signature                                                       | Description                                       |
| ------------- | --------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------- |
| `getById`     | `async getById(id: number): Promise<Task                        | null>`                                            | Fetch a single task by its numeric ID.          |
| `getByPlanId` | `async getByPlanId(planId: number): Promise<Task[]>`            | List all tasks associated with an execution plan. |
| `getBySpecId` | `async getBySpecId(specId: number): Promise<Task[]>`            | List all tasks for a specific specification.      |
| `create`      | `async create(data: CreateTaskData): Promise<Task>`             | Insert a new task and dispatch webhooks.          |
| `update`      | `async update(id: number, data: UpdateTaskData): Promise<Task>` | Update task fields and trigger state transitions. |
| `claimNext`   | `async claimNext(sessionId: string): Promise<Task               | null>`                                            | Atomically claim the next eligible `todo` task. |

## 3. ProjectRepository (`src/repositories/project-repository.ts`)

| Method           | Signature                                                              | Description                                |
| ---------------- | ---------------------------------------------------------------------- | ------------------------------------------ | --------------------------- |
| `getById`        | `async getById(id: string): Promise<Project                            | null>`                                     | Fetch project by UUID.      |
| `getBySlug`      | `async getBySlug(owner: string, repo: string): Promise<Project         | null>`                                     | Fetch by GitHub-style slug. |
| `getWithMembers` | `async getWithMembers(projectId: string): Promise<ProjectWithMembers>` | Fetch project including its member list.   |
| `create`         | `async create(data: CreateProjectData): Promise<Project>`              | Initialize a new project and audit log it. |

## 4. AgentSessionRepository (`src/repositories/agent-session-repository.ts`)

| Method        | Signature                                                        | Description                                        |
| ------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| `create`      | `async create(data: CreateSessionData): Promise<AgentSession>`   | Start a new agent execution session.               |
| `heartbeat`   | `async heartbeat(sessionId: string): Promise<void>`              | Update the `updatedAt` timestamp for recovery.     |
| `getWithLogs` | `async getWithLogs(sessionId: string): Promise<SessionWithLogs>` | Fetch session metadata + streaming execution logs. |

## 5. SpecificationRepository (`src/repositories/specification-repository.ts`)

| Method          | Signature                                                           | Description                               |
| --------------- | ------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------- |
| `getLatest`     | `async getLatest(projectId: string): Promise<Specification          | null>`                                    | Fetch the most recent spec version for a project. |
| `createVersion` | `async createVersion(data: CreateSpecData): Promise<Specification>` | Create a new immutable version of a spec. |

---

## 6. Global Helper: executeQuery

All repository methods MUST wrap their Drizzle calls in the `executeQuery` helper found in `BaseRepository`:

```typescript
// Standard implementation pattern
async getById(id: number) {
  return this.executeQuery(() =>
    db.select().from(tasks).where(eq(tasks.id, id)).limit(1)
  );
}
```
