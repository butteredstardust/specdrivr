**SPECDRIVR**

Master Product Specification — Webhook Schemas

[Status: GROUND TRUTH]

---

## 1. Overview

Specdrivr supports outgoing webhooks to notify external systems of session and task events. This document defines the payload structure and security requirements for these integrations.

## 2. Security

### 2.1 HMAC Signing

All outgoing webhooks are signed using the project's configured secret (HMAC-SHA256).

- **Header**: `X-Specdrivr-Signature`
- **Payload**: The raw UTF-8 JSON body.
- **Verification**: Receivers should compute the HMAC-SHA256 hash of the payload using their secret and compare it to the header.

## 3. Payload Structure

All events follow a standardized envelope.

### 3.1 Common Envelope

```json
{
  "id": "evt_0123456789",
  "event": "session.completed",
  "timestamp": "2026-03-20T20:45:00Z",
  "projectId": "proj_abc",
  "projectName": "Marketing Site",
  "data": { ... }
}
```

### 3.2 Event-Specific Data

#### `session.completed`

```json
{
  "sessionId": "ses_001",
  "specName": "New Login Flow",
  "status": "completed",
  "taskCount": 12,
  "durationMs": 450000
}
```

#### `task.blocked`

```json
{
  "taskId": "t_042",
  "title": "Database migration",
  "reason": "Missing column definition in spec",
  "humanContextUrl": "https://specdrivr.app/specs/3/tasks/42"
}
```

## 4. Retries

- **Strategy**: Exponential backoff (1m, 5m, 1h).
- **Failure**: A webhook is marked as `failed` after 3 attempts.
