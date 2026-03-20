**SPECDRIVR**

Master Product Specification — Execution & Agent Sessions

[Status: GROUND TRUTH]

---

## 1. Overview

This module covers the live execution of implementation plans. It includes the Mission Control dashboard, agent session management, task lifecycle, and the communication protocol between the Specdrivr API and the DAEMON agent.

## 2. User Interface

### 2.1 Mission Control (`/`)
The primary dashboard for active work:
- **Live Execution Panel**: Shows the current session ID, elapsed timer, progress bar, and active task.
- **Terminal UI**: Real-time log tailing using `xterm.js`.
- **Event Log**: A feed of the last 30 agent events (pushed via WebSockets/Server-Sent Events).
- **Needs Attention**: An amber banner that appears only if tasks are blocked.

### 2.2 Sessions Browser (`/sessions`)
- **Route**: `/sessions`
- **Contents**: A timeline list of historical and active sessions grouped by date.
- **Action**: Click a row to expand the per-task event log and live terminal tail.

### 2.3 Task Drawer (Overlay)
A detailed view of a single task, accessible from Mission Control or Spec Detail:
- **OVERVIEW**: Task description, dependencies, and blocking context.
- **ATTEMPTS**: History of execution attempts with full ANSI logs.
- **CHANGES**: Shiki-powered diff viewer for code authored during the task.

## 3. Interaction Flows

### 3.1 Session Control (Pause/Resume/Cancel)
- **Pause**: User clicks `[PAUSE]`. System sets session status to `paused`. The agent receives `shouldStop: true` on its next heartbeat and stops execution after the current task.
- **Resume**: User clicks `[RESUME]`. Status returns to `running`. The agent resumes polling for the next task.
- **Cancel**: User clicks `[CANCEL]`. Status set to `cancelled`. All in-progress tasks are marked `failed`.

### 3.2 Unblocking a Task
1. Task is marked `blocked` by the agent (e.g., missing dependency, ambiguous spec).
2. User opens the **Task Drawer**.
3. User provides the required info in the "Human Context" textarea.
4. User clicks `[RETRY WITH CONTEXT]`.
5. Task status resets to `todo`, and the context is appended to the next agent prompt.

## 4. DAEMON Agent Protocol

The agent is a standalone process that polls the API using an `AGENT_TOKEN`.

| **Action** | **API Endpoint** | **Description** |
|---|---|---|
| **Poll** | `GET /api/v1/agent/tasks/next` | Atomic claim of the next available task using `FOR UPDATE SKIP LOCKED`. |
| **Heartbeat** | `POST /api/v1/sessions/:id/heartbeat` | Sent every 15s to maintain session health and check for `shouldStop`. |
| **Log** | `POST /api/v1/sessions/:id/log` | Appends a log line to the session's central log. |
| **Complete** | `POST /api/v1/tasks/:id/complete` | Reports task result (done/failed) and file changes. |

## 5. Cost & Usage Tracking

- **Token Tracking**: The agent reports `promptTokens` and `completionTokens` for every LLM call.
- **Cost Calculation**: The server calculates USD cost using a versioned pricing table in `src/lib/pricing.ts`.
- **Visibility**: Usage data is aggregated nightly and shown in `/settings/usage`.

## 6. Agent Handbook

### 6.1 Key Files
- **Logic**: `src/lib/agent-protocol.ts`, `scripts/agent.ts` (The actual agent code).
- **Database**: `src/db/schema/sessions.ts`, `src/db/schema/tasks.ts`, `src/db/schema/logs.ts`.
- **UI Components**: `src/components/terminal/xterm-viewer.tsx`, `src/components/execution/session-progress.tsx`.

### 6.2 Critical Paths
- **Atomic Claiming**: Task claiming MUST be atomic to prevent multiple agents from working on the same task.
- **Dependency Gates**: A task cannot be claimed until all its `dependsOn` tasks are in the `done` state.

### 6.3 Common Pitfalls
- **Zombie Sessions**: Sessions where the agent has crashed but status is still `running`. Handled by the 60s heartbeat timeout.
- **Log Overflow**: Ensure log lines are capped or paginated to prevent memory issues in the browser.
