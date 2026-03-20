**SPECDRIVR**

Master Product Specification — Error Registry

[Status: GROUND TRUTH]

---

## 1. Overview

Specdrivr uses a standardized error format to ensure consistent handling of failures across the client, server, and DAEMON agent.

## 2. Standard Error Envelope

All API errors must follow this JSON structure:

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
- `ERR_AUTH_UNAUTHORIZED`: No valid session found.
- `ERR_AUTH_SESSION_EXPIRED`: Session has timed out.
- `ERR_RBAC_FORBIDDEN`: User lacks the required role for this action.
- `ERR_INVALID_AGENT_TOKEN`: Provided AGENT_TOKEN is invalid or inactive.

### 3.2 Specification & Planning
- `ERR_SPEC_NOT_FOUND`: The requested specification does not exist.
- `ERR_PLAN_GEN_FAILED`: Gemini failed to produce a valid plan.
- `ERR_PLAN_VERSION_MISMATCH`: Attempted to approve a plan for an outdated spec version.

### 3.3 Task & Session Execution
- `ERR_TASK_ALREADY_CLAIMED`: Another agent has already claimed this task.
- `ERR_TASK_NOT_CLAIMABLE`: Task has unmet dependencies.
- `ERR_SESSION_PAUSED`: Attempted task operation on a paused session.
- `ERR_HEARTBEAT_TIMEOUT`: Session marked failed due to inactivity.

### 3.4 Validation & System
- `ERR_VALIDATION_FAILED`: Request body failed Zod validation (details included).
- `ERR_DB_QUERY_FAILED`: Internal database error.
- `ERR_RATE_LIMIT_EXCEEDED`: Too many requests from this IP or user.

---

### **Future Work**
- **Error Mapping Middleware**: Implement a centralized error mapping utility that translates repository-level exceptions into these standardized API error codes.
