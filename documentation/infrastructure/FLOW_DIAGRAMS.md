SPECDRIVR

Master Product Specification — Core Flow Diagrams

---

## 1. Overview

Use these Mermaid diagrams to understand core asynchronous operations in Specdrivr.

## 2. Specification-to-Execution Flow

This flow shows the lifecycle from a user specification save to an agent session start.

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Gemini
    participant DB

    User->>API: POST /api/v1/specs (Save & Plan)
    API->>DB: Save Spec (status: drafting)
    API->>API: Set status: pending_plan
    API-->>User: Redirect to Spec Detail (PLAN tab)

    API->>Gemini: POST /v1/models/gemini-2.0-flash:generateContent
    Gemini-->>API: Returns JSON Plan (tasks, deps, etc.)
    API->>DB: Save Plan & Tasks
    API->>DB: Update Spec (status: pending_approval)

    User->>API: POST /api/v1/plans/:id/approve
    API->>DB: Update Plan (status: approved)
    API->>DB: Update Spec (status: executing)
    API->>DB: Create Session (status: running)
    API-->>User: Refresh to Mission Control
```

## 3. Agent Polling & Execution Loop

This flow shows communication between the standalone DAEMON agent and the API.

```mermaid
sequenceDiagram
    participant Agent
    participant API
    participant DB
    participant LLM

    loop Every 15s
        Agent->>API: POST /api/v1/sessions/:id/heartbeat
        API->>DB: Update lastHeartbeatAt
        API-->>Agent: { shouldStop: false }
    end

    loop Until Session Done
        Agent->>API: GET /api/v1/agent/tasks/next?sessionId={id}
        API->>DB: SELECT FOR UPDATE SKIP LOCKED
        DB-->>API: Next atomic Task (T-042)
        API-->>Agent: Returns Task payload

        Agent->>LLM: POST /v1/chat/completions (Execute Task)
        LLM-->>Agent: Code Changes + Cost

        Agent->>API: POST /api/v1/sessions/:id/log (Stream Output)
        Agent->>API: PATCH /api/v1/tasks/042 (Report Cost)
        Agent->>API: POST /api/v1/tasks/042/complete (Done/Fail)
        API->>DB: Update Task status & result
    end
```

## 4. Webhook Integration Flow

This flow shows the outgoing notification system.

```mermaid
sequenceDiagram
    participant DB
    participant API
    participant IntegrationService
    participant Slack/GitHub

    DB->>API: Task blocked event
    API->>IntegrationService: Trigger Webhook
    IntegrationService->>IntegrationService: Sign Payload (HMAC-SHA256)
    IntegrationService->>Slack/GitHub: POST JSON Payload
    alt Request Failed
        IntegrationService->>IntegrationService: Exponential Backoff (Retry)
    end
```
