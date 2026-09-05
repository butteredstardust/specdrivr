SPECDRIVR

Master Product Specification — Execution & Agent Sessions

---

## 1. Overview

Use this module for live plan execution. It defines Mission Control, agent sessions, task lifecycle, and DAEMON agent API communication.

## 2. User Interface

### 2.1 Mission Control (`/`)

Use this dashboard for active work:

- **Live Execution Panel**: Show the current session ID, elapsed timer, progress bar, and active task.
- **Log surface**: Show real-time `xterm.js` tailing in a neutral mono panel. Do not use CRT effects.
- **Event Log**: Show the last 30 agent events. Push events through WebSockets or Server-Sent Events.
- **Needs attention**: Show this semantic warning banner only for blocked tasks. Link to [tasks.md](./tasks.md).

### 2.2 Sessions Browser (`/sessions`)

- **Route**: `/sessions`
- **Contents**: Show a filterable table of active and historical sessions, grouped by date. Include status, specification, start time, duration, and task counts.
- **Actions**: Use the disclosure button to expand the session event log in place. Use the session ID or row action to open the session detail page.

## 3. Interaction Flows

### 3.1 Session Control (Pause/Resume/Cancel)

- **Pause**: User clicks **Pause**. Set the session status to `paused`. Send `shouldStop: true` on the next heartbeat. Stop after the current task.
- **Resume**: User clicks **Resume**. Return the status to `running`. Resume polling for the next task.
- **Cancel**: User clicks **Cancel**. Set the status to `cancelled`. Recover active leases.

## 4. DAEMON Agent Protocol

The agent is a standalone process. It polls the API with an `AGENT_TOKEN`.

| **Action**    | **API Endpoint**                      | **Description**                                                         |
| ------------- | ------------------------------------- | ----------------------------------------------------------------------- |
| **Poll**      | `GET /api/v1/agent/tasks/next`        | Atomic claim of the next available task using `FOR UPDATE SKIP LOCKED`. |
| **Heartbeat** | `POST /api/v1/sessions/:id/heartbeat` | Sent every 15s to maintain session health and check for `shouldStop`.   |
| **Log**       | `POST /api/v1/sessions/:id/log`       | Appends a log line to the session's central log.                        |
| **Complete**  | `POST /api/v1/tasks/:id/complete`     | Reports task result (done/failed) and file changes.                     |

## 5. Cost & Usage Tracking

- **Token Tracking**: Report `promptTokens` and `completionTokens` for each LLM call.
- **Cost Calculation**: Calculate USD cost with the versioned pricing table in `src/lib/pricing.ts`.
- **Visibility**: Aggregate usage data nightly. Show it in `/settings/usage`.

## 6. Agent Handbook

### 6.1 Key Files

- **Logic**: Use `src/lib/agent-models.ts`, `src/lib/agent-auth.ts`, `scripts/agent.ts` for the agent process, and `scripts/plan-worker.ts`.
- **Database**: Use `src/db/schema.ts` for the `agentSessions`, `agentEvents`, `agentLogs`, and `tasks` tables.
- **UI Components**: `src/components/ui/live-terminal.tsx`, `src/components/mission-control/session-panel.tsx`, `src/components/mission-control/activity-feed.tsx`, `src/components/mission-control/event-log.tsx`, `src/components/sessions/task-timeline.tsx`.

### 6.2 Critical Paths

- **Atomic Claiming**: Claim tasks atomically. This prevents multiple agents from working on one task.
- **Dependency Gates**: Do not claim a task until all its `dependsOn` tasks are in the `done` state.

### 6.3 Common Pitfalls

- **Zombie Sessions**: An agent can crash while its session remains `running`. Use the 60s heartbeat timeout to handle this state.
- **Log Overflow**: Cap or paginate log lines. This prevents browser memory issues.

## 7. Automated Recovery

### 7.1 Ghost Task Reset

When a session is `failed` or `cancelled`, apply these steps to its `in_progress` tasks:

1. **Reset Status**: Set the task status to `todo`.
2. **Increment Attempt**: Increase `attempt_count` by 1.
3. **Log Event**: Write a "GHOST_TASK_RESET" entry in the activity log.

### 7.2 Heartbeat Timeout

Monitor `lastHeartbeatAt` for every `running` session.

- **Threshold**: 60 seconds.
- **Action**: If `now() - lastHeartbeatAt > 60s`, mark the session `failed`. Trigger the **Ghost Task Reset**.
