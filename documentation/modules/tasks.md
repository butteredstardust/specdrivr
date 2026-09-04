**SPECDRIVR**

Master Product Specification — Tasks & Human Intervention

[Status: GROUND TRUTH]

---

## 1. Overview

Tasks are the atomic units of implementation work in Specdrivr. They are authored by the AI during the Planning phase and executed by the DAEMON agent during the Execution phase. This module covers how tasks are managed, visualized, and unblocked by human team members.

## 2. User Interface

### 2.1 Task List (Spec Detail > TASKS Tab)

- **Contents**: A dependency-ordered list of all tasks for the specification.
- **Columns**:
  - **ID**: Mono entity identifier (e.g., `T-042`).
  - **Title**: Short description of the work.
  - **Status**: Visual indicator (`todo`, `in_progress`, `done`, `blocked`, `failed`).
  - **Dependencies**: Icon indicating if the task is waiting on others.
- **Filtering**: Filter by status (e.g., "Show Blocked Only").

### 2.2 Task Drawer (Overlay)

The central hub for task-level detail, accessible from any task row:

- **Overview**: Full task description, done criteria, and blocked-task human-context form.
- **Attempts**: A reverse-chronological list of execution attempts with agent log output.
- **Changes**: Shiki-powered diff viewer for modifications made during this task.

The footer owns lifecycle actions. Admin/Owner status controls are visible in the header; gated
actions explain the required role instead of disappearing.

## 3. Interaction Flows

### 3.1 Unblocking a Task

1. Agent encounters an ambiguity or missing dependency and marks the task as `blocked`.
2. A semantic **Needs attention** warning appears in Mission Control.
3. User opens the **Task Drawer** for the blocked task.
4. User enters instructions or missing data in the **Human Context** field.
5. User clicks **Retry with context**.
6. Task status reverts to `todo`, and the new context is prioritized in the agent's next execution prompt.

### 3.2 Manual Task Management

- **Mark Done**: Users with `Admin` or `Owner` roles can manually override a task to `done` if the agent failed the verification but the work is visually correct.
- **Retry**: Users can manually trigger a retry for any `failed` or `done` task to force the agent to re-run the implementation.

## 4. Logic & Rules

### 4.1 Dependency Resolution

- **Rule**: A task cannot be claimed by an agent until all tasks listed in its `dependsOn` array are in the `done` state.
- **Enforcement**: This is enforced server-side during the `GET /api/v1/agent/tasks/next` atomic claim query.

### 4.2 Verification Logic

- **Mechanism**: Tasks may include a `verifyCommand` (e.g., `pnpm test tests/auth.test.ts`).
- **Pass/Fail**: The agent executes this command after making changes. A non-zero exit code results in a `failed` attempt unless human intervention overrides it.

## 5. Agent Handbook

### 5.1 Key Files

- **Logic**: `src/repositories/task-repository.ts`, `src/actions/tasks.ts`.
- **Database**: `src/db/schema.ts` (`tasks`, `taskAttempts`, `fileChanges` tables).
- **UI Components**: `src/components/tasks/task-drawer.tsx`, `task-drawer-footer.tsx`,
  `task-drawer-attempts.tsx`, `task-drawer-changes.tsx`, `task-drawer-overview.tsx`, and
  `use-task-actions.ts`.

### 5.2 Critical Paths

- **Context Injection**: The `humanContext` field MUST be included in the prompt construction logic in `scripts/agent.ts`.
- **Atomic State Transitions**: All task status updates must use optimistic locking to prevent state drift between multiple agents or users.
