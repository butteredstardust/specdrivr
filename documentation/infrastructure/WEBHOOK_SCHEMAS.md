SPECDRIVR

Master Product Specification — Webhook Schemas

---

## 1. Overview

Specdrivr sends outgoing webhooks for session and task events. Use this document to implement payloads and integration security.

## 2. Security

### 2.1 HMAC Signing

Sign all outgoing webhooks with the configured project secret (HMAC-SHA256).

- **Header**: Use `X-Specdrivr-Signature`.
- **Payload**: Use the raw UTF-8 JSON body.
- **Verification**: Receivers compute the payload HMAC-SHA256 hash with their secret. Compare it with the header.

## 3. Payload Structure

Return all events in the standard envelope.

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

- **Strategy**: Use exponential backoff (1m, 5m, 1h).
- **Failure**: Mark a webhook as `failed` after 3 attempts.
