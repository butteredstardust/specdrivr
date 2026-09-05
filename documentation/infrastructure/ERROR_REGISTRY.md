SPECDRIVR

Master Product Specification — Error Registry

---

## 1. Overview

Use the standard error format for consistent client, server, and DAEMON agent failure handling.

## 2. Standard Error Envelope

Return all API errors in this JSON structure:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "optional object or array"
  }
}
```

## 3. Common Error Codes

### 3.1 Authentication & Authorization

- `ERR_AUTH_UNAUTHORIZED`: No valid session exists.
- `ERR_AUTH_SESSION_EXPIRED`: The session timed out.
- `ERR_RBAC_FORBIDDEN`: The user lacks the required role for this action.
- `ERR_INVALID_AGENT_TOKEN`: The provided AGENT_TOKEN is invalid or inactive.

### 3.2 Specification & Planning

- `ERR_SPEC_NOT_FOUND`: No requested specification exists.
- `ERR_PLAN_GEN_FAILED`: Gemini did not produce a valid plan.
- `ERR_PLAN_VERSION_MISMATCH`: A plan approval targets an outdated specification version.

### 3.3 Task & Session Execution

- `ERR_TASK_ALREADY_CLAIMED`: Another agent claimed this task.
- `ERR_TASK_NOT_CLAIMABLE`: The task has unmet dependencies.
- `ERR_SESSION_PAUSED`: A task operation targets a paused session.
- `ERR_HEARTBEAT_TIMEOUT`: The session failed because of inactivity.

### 3.4 Validation & System

- `ERR_VALIDATION_FAILED`: The request body failed Zod validation. Details are included.
- `ERR_DB_QUERY_FAILED`: An internal database error occurred.
- `ERR_RATE_LIMIT_EXCEEDED`: This IP or user sent too many requests.

---

### Future Work
- **Error Mapping Middleware**: Create centralized error mapping that translates repository exceptions into these standard API error codes.
