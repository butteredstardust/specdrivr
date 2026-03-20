**SPECDRIVR**

Master Product Specification — State Machines

[Status: GROUND TRUTH]

---

## 1. Overview

Specdrivr relies on deterministic state transitions to manage the asynchronous lifecycle of specifications, implementation plans, and agent execution.

## 2. Specification Status Machine

The specification is the top-level entity.

| **State**          | **Trigger**                                      | **Next State**       | **Action**                                     |
| ------------------ | ------------------------------------------------ | -------------------- | ---------------------------------------------- |
| `drafting`         | User creates or edits a specification            | `pending_plan`       | User clicks `Save & Generate Plan`.            |
| `pending_plan`     | Gemini job started                               | `pending_approval`   | Gemini returns a valid JSON plan.              |
| `pending_plan`     | Gemini job fails                                 | `drafting`           | System logs error; user must retry.            |
| `pending_approval` | User reviews the plan                            | `executing`          | User clicks `Approve & Execute`.               |
| `pending_approval` | User reviews the plan                            | `drafting`           | User clicks `Request Changes` or `Edit Spec`.  |
| `executing`        | Agent claims all tasks                           | `completed`          | Last task marked `done`.                       |
| `executing`        | Manual cancellation                              | `drafting`           | User clicks `Abandon Session`.                 |

## 3. Plan Status Machine

The plan represents a specific implementation strategy for a version of a spec.

| **State**            | **Trigger**                                 | **Resulting Action**                         |
| -------------------- | ------------------------------------------- | -------------------------------------------- |
| `pending_approval`   | Plan generation completes                   | Plan visible in PLAN tab.                    |
| `approved`           | User clicks `Approve`                       | Session created; tasks become `todo`.        |
| `rejected`           | User clicks `Reject`                        | Plan archived; spec remains `drafting`.      |
| `abandoned`          | User edits the specification                | Current plan is voided.                      |

## 4. Task Status Machine

Tasks are the atomic units of work within a session.

| **State**       | **Trigger**                                    | **Next State**    |
| --------------- | ---------------------------------------------- | ----------------- |
| `todo`          | Session started or dependency cleared          | `in_progress`     |
| `in_progress`   | Agent claims task (`GET /tasks/next`)          | `done`            |
| `in_progress`   | Agent reports success                          | `done`            |
| `in_progress`   | Agent reports failure or binary missing        | `failed`          |
| `in_progress`   | Agent reports ambiguity or missing dependency  | `blocked`         |
| `blocked`       | User provides "Human Context"                  | `todo`            |
| `failed`        | User clicks `Retry`                            | `todo`            |

## 5. Session Status Machine

The session is the active runtime container for an agent.

| **State**     | **Trigger**                                     | **Next State** |
| ------------- | ----------------------------------------------- | -------------- |
| `running`     | User approves plan                              | `completed`    |
| `running`     | All tasks reach `done`                          | `completed`    |
| `running`     | User clicks `Pause`                             | `paused`       |
| `paused`      | User clicks `Resume`                            | `running`      |
| `running`     | 60s Heartbeat timeout                           | `failed`       |
| `running`     | User clicks `Cancel`                            | `cancelled`    |
