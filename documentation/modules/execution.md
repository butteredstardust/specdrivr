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
- **Needs Attention**: An amber banner that appears only if tasks are blocked (Links to [tasks.md](./tasks.md)).

### 2.2 Sessions Browser (`/sessions`)

- **Route**: `/sessions`
- **Contents**: A timeline list of historical and active sessions grouped by date.
- **Action**: Click a row to expand the per-task event log and live terminal tail.

## 3. Interaction Flows

### 3.1 Session Control (Pause/Resume/Cancel)

- **Pause**: User clicks `[PAUSE]`. System sets session status to `paused`. The agent receives `shouldStop: true` on its next heartbeat and stops execution after the current task.
- **Resume**: User clicks `[RESUME]`. Status returns to `running`. The agent resumes polling for the next task.
- **Cancel**: User clicks `[CANCEL]`. Status set to `cancelled`. All in-progress tasks are marked `failed`.

## 4. DAEMON Agent Protocol

The agent is a standalone process that polls the API using an `AGENT_TOKEN`.

| **Action**    | **API Endpoint**                      | **Description**                                                         |
| ------------- | ------------------------------------- | ----------------------------------------------------------------------- |
| **Poll**      | `GET /api/v1/agent/tasks/next`        | Atomic claim of the next available task using `FOR UPDATE SKIP LOCKED`. |
| **Heartbeat** | `POST /api/v1/sessions/:id/heartbeat` | Sent every 15s to maintain session health and check for `shouldStop`.   |
| **Log**       | `POST /api/v1/sessions/:id/log`       | Appends a log line to the session's central log.                        |
| **Complete**  | `POST /api/v1/tasks/:id/complete`     | Reports task result (done/failed) and file changes.                     |

## 5. Cost & Usage Tracking

- **Token Tracking**: The agent reports `promptTokens` and `completionTokens` for every LLM call.
- **Cost Calculation**: The server calculates USD cost using a versioned pricing table in `src/lib/pricing.ts`.
- **Visibility**: Usage data is aggregated nightly and shown in `/settings/usage`.

## 6. Agent Handbook

### 6.1 Key Files

- **Logic**: `src/lib/agent-models.ts`, `src/lib/agent-auth.ts`, `scripts/agent.ts` (the actual agent process), `scripts/plan-worker.ts`.
- **Database**: `src/db/schema.ts` (`agentSessions`, `agentEvents`, `agentLogs`, `tasks` tables).
- **UI Components**: `src/components/ui/live-terminal.tsx`, `src/components/mission-control/session-panel.tsx`, `src/components/mission-control/activity-feed.tsx`, `src/components/mission-control/event-log.tsx`, `src/components/sessions/task-timeline.tsx`.

### 6.2 Critical Paths

- **Atomic Claiming**: Task claiming MUST be atomic to prevent multiple agents from working on the same task.
- **Dependency Gates**: A task cannot be claimed until all its `dependsOn` tasks are in the `done` state.

### 6.3 Common Pitfalls

- **Zombie Sessions**: Sessions where the agent has crashed but status is still `running`. Handled by the 60s heartbeat timeout.
- **Log Overflow**: Ensure log lines are capped or paginated to prevent memory issues in the browser.

## 7. Automated Recovery

### 7.1 Ghost Task Reset

If a session is marked `failed` or `cancelled`, the following must occur for any tasks currently in the `in_progress` state for that session:

1. **Reset Status**: Revert task status to `todo`.
2. **Increment Attempt**: Increase the `attempt_count` by 1.
3. **Log Event**: Write a "GHOST_TASK_RESET" entry to the activity log.

### 7.2 Heartbeat Timeout

The API must monitor the `lastHeartbeatAt` timestamp for all `running` sessions.

- **Threshold**: 60 seconds.
- **Action**: If `now() - lastHeartbeatAt > 60s`, mark the session as `failed` and trigger the **Ghost Task Reset**.
