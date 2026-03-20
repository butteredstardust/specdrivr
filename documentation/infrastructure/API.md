**SPECDRIVR**

Master Product Specification

Version 1.0 · Confidential

_Spec-driven autonomous code execution for engineering teams_

# **6. API Specification**

All endpoints are versioned under /api/v1. Responses follow a standard envelope: `{ data }` on success, or `{ error: { code, message } }` on failure. Authentication is required for all endpoints.

## **6.1 Authentication**

Authentication is managed by BetterAuth under `/api/auth/[...auth]`.

| **Method** | **Path**              | **Description**                       |
| ---------- | --------------------- | ------------------------------------- |
| **POST**   | /api/auth/sign-in     | Sign in with email and password.      |
| **POST**   | /api/auth/sign-up     | Create a new user account.            |
| **POST**   | /api/auth/sign-out    | Invalidate the current session.       |
| **GET**    | /api/auth/get-session | Returns the current user and session. |

## **6.2 Projects**

| **Method** | **Path**             | **Description**                                          |
| ---------- | -------------------- | -------------------------------------------------------- |
| **GET**    | /api/v1/projects     | List projects for the current user. Supports pagination. |
| **POST**   | /api/v1/projects     | Create a new project. Body: `{ name, description? }`.    |
| **GET**    | /api/v1/projects/:id | Get a single project by ID.                              |
| **PATCH**  | /api/v1/projects/:id | Update project details (Admin/Owner only).               |
| **DELETE** | /api/v1/projects/:id | Delete a project and all associated data (Owner only).   |

## **6.3 Specifications**

| **Method** | **Path**                        | **Description**                                               |
| ---------- | ------------------------------- | ------------------------------------------------------------- |
| **GET**    | /api/v1/specs                   | List all specifications for a project (?projectId= required). |
| **POST**   | /api/v1/specs                   | Create a spec + initial version. Body: `{ name, markdown }`.  |
| **GET**    | /api/v1/specs/:id               | Get specification with current version and plan summary.      |
| **POST**   | /api/v1/specs/:id/versions      | Create a new version. Content change resets plans.            |
| **GET**    | /api/v1/specs/:id/plan/generate | **Trigger async plan generation** using Gemini.               |

## **6.4 Plans**

| **Method** | **Path**                          | **Description**                                          |
| ---------- | --------------------------------- | -------------------------------------------------------- |
| **GET**    | /api/v1/specs/:id/plan            | Get the latest plan for the given specification.         |
| **POST**   | /api/v1/plans/:id/approve         | Approve a plan. Creates a session and sets to executing. |
| **POST**   | /api/v1/plans/:id/reject          | Reject a plan with notes.                                |
| **POST**   | /api/v1/plans/:id/request-changes | Request changes to the plan.                             |

## **6.5 Tasks**

| **Method** | **Path**                   | **Description**                                       |
| ---------- | -------------------------- | ----------------------------------------------------- |
| **GET**    | /api/v1/tasks/:id          | Get detailed task information and current status.     |
| **PATCH**  | /api/v1/tasks/:id          | Update human context or manually override status.     |
| **POST**   | /api/v1/tasks/:id/retry    | Re-queue a failed or done task.                       |
| **GET**    | /api/v1/tasks/:id/attempts | List execution attempts with full logs.               |
| **POST**   | /api/v1/tasks/:id/complete | **Agent Endpoint**: Report task result (done/failed). |

## **6.6 Sessions**

| **Method** | **Path**                       | **Description**                                       |
| ---------- | ------------------------------ | ----------------------------------------------------- |
| **GET**    | /api/v1/sessions/:id           | Get session health, task counts, and status.          |
| **POST**   | /api/v1/sessions/:id/heartbeat | **Agent Endpoint**: Update agent lastActiveAt.        |
| **POST**   | /api/v1/sessions/:id/log       | **Agent Endpoint**: Append a log line to the session. |
| **POST**   | /api/v1/sessions/:id/cancel    | Mark a session as cancelled.                          |

### **Heartbeat Response Schema**

```json
{
  "status": "ok",
  "command": "continue" | "pause" | "stop",
  "config": {
    "maxConcurrentTasks": 3,
    "logLevel": "info"
  }
}
```

## **6.7 Agent Internal**

| **Method** | **Path**                 | **Description**                                       |
| ---------- | ------------------------ | ----------------------------------------------------- |
| **GET**    | /api/v1/agent/tasks/next | **Atomic claim** of the next available task via HTTP. |
| **GET**    | /api/v1/verify-repo      | **Admin**: Verify repository integration and health.  |

### **Task Claiming Logic**

The `GET /api/v1/agent/tasks/next` endpoint MUST enforce the following before returning a task:

1. **Concurrency Check**: Verify that `activeTaskCount < maxConcurrentTasks` for the current session.
2. **Atomic Claim**: Use `SELECT ... FOR UPDATE SKIP LOCKED` to prevent multiple agents from claiming the same task.

## **6.8 API Standards**

- **Enveloping**: All data returned in a `data` key.
- **Pagination**: Meta object returned for lists: `{ data: [], meta: { page, limit, total } }`.
- **Errors**: Standardized `{ error: { code, message, details? } }`.
- **RBAC**: Checked at the route handler level via `src/lib/rbac.ts`.
- **Safety**: `isomorphic-dompurify` used for sanitizing HTML/Markdown on both client and server.
