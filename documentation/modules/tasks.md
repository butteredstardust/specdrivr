SPECDRIVR

Master Product Specification — Tasks & Human Intervention

---

## 1. Overview

Tasks are atomic implementation units. The AI creates them during planning. The DAEMON agent executes them. Use this module to manage, view, and unblock tasks.

## 2. User Interface

### 2.1 Task List (Spec Detail > TASKS Tab)

- **Contents**: Show a dependency-ordered list of specification tasks.
- **Columns**:
  - **ID**: Mono entity identifier (e.g., `T-042`).
  - **Title**: Show a short work description.
  - **Status**: Show a visual indicator: `todo`, `in_progress`, `done`, `blocked`, or `failed`.
  - **Dependencies**: Show an icon when the task waits for other tasks.
- **Filtering**: Filter by status, for example "Show Blocked Only".

### 2.2 Task Drawer (Overlay)

Use this as the central task-detail hub. Open it from any task row:

- **Overview**: Show the full task description, done criteria, and blocked-task human-context form.
- **Attempts**: Show execution attempts in reverse chronology with agent log output.
- **Changes**: Show a Shiki-powered diff viewer for changes from this task.

Put lifecycle actions in the footer. Show Admin/Owner status controls in the header. Explain the required role for gated actions.

## 3. Interaction Flows

### 3.1 Unblocking a Task

1. Agent finds an ambiguity or missing dependency. Mark the task `blocked`.
2. Show a semantic **Needs attention** warning in Mission Control.
3. User opens the blocked task in the **Task Drawer**.
4. User enters instructions or missing data in **Human Context**.
5. User clicks **Retry with context**.
6. Set the task status to `todo`. Prioritize the new context in the agent's next execution prompt.

### 3.2 Manual Task Management

- **Mark Done**: `Admin` and `Owner` users can set a task to `done`. Use this when verification fails but the work is visually correct.
- **Retry**: Users can retry any `failed` or `done` task. This makes the agent run the implementation again.

## 4. Logic & Rules

### 4.1 Dependency Resolution

- **Rule**: Do not let an agent claim a task until its `dependsOn` tasks are `done`.
- **Enforcement**: Enforce this on the server during the `GET /api/v1/agent/tasks/next` atomic claim query.

### 4.2 Verification Logic

- **Mechanism**: A task can include a `verifyCommand` (e.g., `pnpm test tests/auth.test.ts`).
- **Pass/Fail**: Run this command after changes. A non-zero exit code creates a `failed` attempt unless human intervention overrides it.

## 5. Agent Handbook

### 5.1 Key Files

- **Logic**: `src/repositories/task-repository.ts`, `src/actions/tasks.ts`.
- **Database**: Use `src/db/schema.ts` for the `tasks`, `taskAttempts`, and `fileChanges` tables.
- **UI Components**: Use `src/components/tasks/task-drawer.tsx`, `task-drawer-footer.tsx`, `task-drawer-attempts.tsx`, `task-drawer-changes.tsx`, `task-drawer-overview.tsx`, and `use-task-actions.ts`.

### 5.2 Critical Paths

- **Context Injection**: Include `humanContext` in the prompt construction logic in `scripts/agent.ts`.
- **Atomic State Transitions**: Use optimistic locking for every task status update. This prevents state drift between agents or users.
