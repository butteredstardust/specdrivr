**SPECDRIVR**

Master Product Specification

Version 1.0 · Confidential

_Spec-driven autonomous code execution for engineering teams_

---

[Status: GROUND TRUTH]

# **13\. Integrations**

## **13.1 GitHub Integration**

- OAuth flow: redirect to GitHub → return to /settings/integrations?connected=github. Stores encrypted access token in integrations.config.
- After connect: webhook URL revealed - https://{domain}/api/webhooks/github/{projectId}. User configures this in GitHub repo settings.
- Supported events: push to watched branch (notifies team) · pull_request opened that references a spec.
- The DAEMON agent uses a separate GITHUB_TOKEN environment variable (PAT or GitHub App token) with repo read/write scope to clone, branch, commit, and push. This is not the OAuth token - it is the agent's operational credential.
- Agent git workflow per task: git checkout -b daemon/spec-{specId}/task-{taskId} · make changes · git commit -m "feat(T-042): {task title}" · git push. Never pushes to main directly.

## **13.2 Slack Integration**

- OAuth flow: redirect to Slack → return to /settings/integrations?connected=slack. Stores bot token + selected channel.
- Notification events sent to Slack channel: session_started · session_completed · session_failed · task_blocked.
- Slack message format: simple block kit message. No complex attachments. Includes direct link back to Specdrivr.

## **13.3 Generic Webhooks**

- User configures endpoint URL + optional HMAC-SHA256 secret + event subscription checkboxes.
- POST body: { event: string, timestamp: ISO8601, projectId, specId?, sessionId?, taskId?, data: {...} }.
- If secret configured: X-Specdrivr-Signature header = HMAC-SHA256(secret, raw body). Receiving server should verify.
- Retry policy: exponential backoff (1s, 5s, 30s, 5m). After 4 failures, webhook marked error status in UI.

## **13.4 DAEMON Agent Protocol**

The DAEMON agent is a standalone process that polls the Specdrivr API. It authenticates via an `AGENT_TOKEN` and operates in a pull-based model.

| **Agent action**      | **API call**                                                                                  | **Notes** |
| --------------------- | --------------------------------------------------------------------------------------------- | --------- |
| **Heartbeat**         | `POST /api/v1/sessions/{id}/heartbeat`                                                        | Every 15s. Returns `{ shouldStop: bool }`. |
| **Poll for next task**| `GET /api/v1/agent/tasks/next?sessionId={id}`                                                 | Atomic claim via `FOR UPDATE SKIP LOCKED`. |
| **Write log line**    | `POST /api/v1/sessions/{id}/log`                                                              | Buffers locally; flushes every 100ms. |
| **Complete task**     | `POST /api/v1/tasks/{id}/complete`                                                            | Reports `{ status: "done" | "failed" }`. |
| **Update task (Cost)**| `PATCH /api/v1/tasks/{id}`                                                                    | Used for reporting `totalCostUsd` from LLM output. |

### **Agent Exit Rules**
1. **Heartbeat Stop**: If `/heartbeat` returns `shouldStop: true`, the agent stops after finishing the current task.
2. **Consecutive Errors**: If the agent fails to communicate with the API for **5 consecutive attempts**, it stops to prevent infinite retry loops.
3. **Session Health**: If `lastHeartbeatAt` is > 60 seconds old, the server marks the session as `failed` (Zombie Session).

---

# **26. Cost & Usage Tracking**

Token usage and associated LLM costs are a first-class concern for engineering teams using Specdrivr. The cost data collected at the task and session level feeds the Usage section in Settings.

## **26.1 Cost Data Flow**

- Agent records promptTokensUsed and completionTokensUsed on each task and task_attempt after the LLM call returns.
- When session completes, agent POSTs totalPromptTokens and totalCompletionTokens to POST /api/v1/sessions/:id/complete.
- The server computes totalCostUsd using the model pricing table (stored in lib/pricing.ts, versioned in source control - not in DB, since prices change rarely).
- A nightly cron job aggregates all completed sessions for the day into usage_snapshots.
- The Usage page in Settings queries usage_snapshots for the trailing 90 days, grouped by day, with a 7-day and 30-day rollup.

## **26.2 Usage Settings Page**

Route: /settings/usage (accessible to Admin/Owner only).

- Chart: daily cost bar chart, trailing 30 days. Tooltip shows tasks executed + cost per day.
- Summary cards: This month total cost · Total tasks executed · Average cost per task · Most expensive spec (linked).
- Breakdown table: by spec - spec name · sessions · tasks · tokens · cost. Sortable.
- Model breakdown: if project has used multiple models, shows cost split by model.
- \[Export CSV\] - exports raw usage_snapshots for the selected date range.

If no usage data exists (no sessions yet), show DAEMON idle + "No usage data. Run your first session to see cost breakdown here."

## **26.3 Per-Task Cost in Dev Mode**

When Dev Mode is enabled (Ctrl+\`), the Task Drawer OVERVIEW tab shows a cost panel below the main content:

COST BREAKDOWN

Prompt tokens: 12,483 (\$0.0374)

Completion tokens: 4,201 (\$0.0504)

Total: \$0.0878

Model: claude-sonnet-4-6

This panel is hidden in normal mode. It is intended for developers debugging expensive tasks, not for end-user-facing cost visibility.
