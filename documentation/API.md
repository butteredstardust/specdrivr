**SPECDRIVR**

Master Product Specification

Version 1.0 · Confidential

_Spec-driven autonomous code execution for engineering teams_

# **6\. API Specification**

All endpoints are versioned under /api/v1. All responses return JSON with the envelope { data } on success or { error: { code, message } } on failure. Authentication is required on all endpoints unless explicitly noted.

Authentication: Pass the session cookie (browser clients) or Authorization: Bearer {api_token} header (agent / integrations). The AGENT_TOKEN is a project-scoped API token, not a user session.

## **6.1 Authentication Endpoints**

| **Method** | **Path**                  | **Description**                                                        | **Auth required** |
| ---------- | ------------------------- | ---------------------------------------------------------------------- | ----------------- |
| **POST**   | /api/auth/sign-in/email   | Email + password login. Sets httpOnly session cookie.                  | No                |
| **POST**   | /api/auth/sign-out        | Invalidates session cookie + DB session record.                        | Yes               |
| **POST**   | /api/auth/forget-password | Sends reset email (Better Auth flow).                                  | No                |
| **POST**   | /api/auth/reset-password  | Validates token and sets new password.                                 | No                |
| **POST**   | /api/auth/get-session     | Returns current user and session data.                                 | Yes               |

Note: These are handled by the Better Auth catch-all handler at `/api/auth/[...auth]`.

## **6.2 Projects**

| **Method** | **Path**             | **Description**                                                               |
| ---------- | -------------------- | ----------------------------------------------------------------------------- |
| **GET**    | /api/v1/projects     | List all projects the current user is a member of.                            |
| **POST**   | /api/v1/projects     | Create project. Body: { name, repositoryUrl, repositoryBranch, description }. |
| **GET**    | /api/v1/projects/:id | Get single project with member count and last session summary.                |
| **PATCH**  | /api/v1/projects/:id | Update project settings. Admin only.                                          |
| **DELETE** | /api/v1/projects/:id | Delete project and all children. Owner only. Requires confirmation token.     |

## **6.3 Specifications**

| **Method** | **Path**                        | **Description**                                                                                              |
| ---------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **GET**    | /api/v1/specs                   | List specs for active project. Supports ?status=, ?search=, ?page=.                                          |
| **POST**   | /api/v1/specs                   | Create spec. Body: { name, markdownContent, projectId }. Creates spec + version 1.                           |
| **GET**    | /api/v1/specs/:id               | Get spec with current version, plan summary, and task counts.                                                |
| **PATCH**  | /api/v1/specs/:id               | Update spec name or status only. Content edits create a new version.                                         |
| **DELETE** | /api/v1/specs/:id               | Delete spec. Fails if status = executing. Admin only.                                                        |
| **GET**    | /api/v1/specs/:id/versions      | List all spec versions with metadata (no content).                                                           |
| **GET**    | /api/v1/specs/:id/versions/:vId | Get a specific version's full markdownContent.                                                               |
| **POST**   | /api/v1/specs/:id/versions      | Create new version. Body: { markdownContent }. Increments versionNumber. Abandons current non-complete plan. |

## **6.4 Plans**

| **Method** | **Path**                          | **Description**                                                                                                |
| ---------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **POST**   | /api/v1/specs/:id/plan/generate   | Triggers async plan generation. Returns immediately with { status: pending_plan }. Poll GET to check progress. |
| **GET**    | /api/v1/specs/:id/plan            | Get current plan with all architecture decisions and tasks. Used for polling during generation.                |
| **POST**   | /api/v1/plans/:id/approve         | Approve plan. Admin/Owner only. Body: { notes? }. Creates agent_session, sets status = executing.              |
| **POST**   | /api/v1/plans/:id/reject          | Reject plan. Admin/Owner only. Body: { notes } (required). Sets status = rejected.                             |
| **POST**   | /api/v1/plans/:id/request-changes | Request changes. Admin/Owner only. Body: { notes } (required). Sets status = changes_requested.                |
| **POST**   | /api/v1/plans/:id/abandon         | Abandon plan. Sets status = abandoned.                                                                         |

## **6.5 Tasks**

| **Method** | **Path**                   | **Description**                                                  |
| ---------- | -------------------------- | ---------------------------------------------------------------- |
| **GET**    | /api/v1/tasks/:id          | Full task detail including current attempt and blockedReason.    |
| **PATCH**  | /api/v1/tasks/:id          | Update humanContext, status (manual override), or blockedReason. |
| **POST**   | /api/v1/tasks/:id/retry    | Re-queue task for execution. Increments attemptCount.            |
| **GET**    | /api/v1/tasks/:id/attempts | List all attempts newest-first with logLines and duration.       |
| **GET**    | /api/v1/tasks/:id/changes  | List all file_changes produced by this task's attempts.          |

## **6.6 Sessions**

| **Method** | **Path**                       | **Description**                                                        |
| ---------- | ------------------------------ | ---------------------------------------------------------------------- |
| **GET**    | /api/v1/sessions               | List sessions. Supports ?projectId=, ?specId=, ?status=, ?from=, ?to=. |
| **GET**    | /api/v1/sessions/:id           | Get session with task counts and status.                               |
| **POST**   | /api/v1/sessions/:id/pause     | Pause running session. Agent stops after completing current task.      |
| **POST**   | /api/v1/sessions/:id/resume    | Resume paused session.                                                 |
| **POST**   | /api/v1/sessions/:id/cancel    | Cancel session. Marks in-progress tasks as failed.                     |
| **GET**    | /api/v1/sessions/:id/events    | List agent events for this session, newest-first.                      |
| **POST**   | /api/v1/sessions/:id/heartbeat | Agent-only. Updates lastHeartbeatAt. Returns { shouldStop: bool }.     |

## **6.7 Team Management**

| **Method** | **Path**                                      | **Description**                                                            |
| ---------- | --------------------------------------------- | -------------------------------------------------------------------------- |
| **GET**    | /api/v1/projects/:id/members                  | List project members with role and status.                                 |
| **POST**   | /api/v1/projects/:id/invites                  | Send invite. Body: { email, role }. Admin only.                            |
| **PATCH**  | /api/v1/projects/:id/members/:userId          | Update member role or status. Admin only. Cannot escalate beyond own role. |
| **DELETE** | /api/v1/projects/:id/members/:userId          | Remove member. Admin only. Cannot remove self.                             |
| **POST**   | /api/v1/projects/:id/invites/:inviteId/resend | Resend invite email. Resets token expiry to +7 days.                       |

## **6.8 Notifications & User**

| **Method** | **Path**                       | **Description**                                                         |
| ---------- | ------------------------------ | ----------------------------------------------------------------------- |
| **GET**    | /api/v1/notifications          | List notifications. Supports ?unread=true, ?page=. Returns 50 per page. |
| **POST**   | /api/v1/notifications/read-all | Mark all notifications as read.                                         |
| **PATCH**  | /api/v1/notifications/:id      | Mark single notification read/unread.                                   |
| **GET**    | /api/v1/users/me               | Current user profile.                                                   |
| **PATCH**  | /api/v1/users/me               | Update name. Email cannot be changed via API.                           |
| **POST**   | /api/v1/users/me/password      | Change password. Body: { currentPassword, newPassword }.                |
| **GET**    | /api/v1/users/me/tokens        | List API tokens (masked).                                               |
| **POST**   | /api/v1/users/me/tokens        | Generate API token. Returns full raw token once only.                   |
| **DELETE** | /api/v1/users/me/tokens/:id    | Revoke API token immediately.                                           |

## **6.9 API Error Codes**

| **HTTP Status** | **Error Code**      | **Meaning**                                                                             |
| --------------- | ------------------- | --------------------------------------------------------------------------------------- |
| 400             | VALIDATION_ERROR    | Zod validation failed. Includes field-level errors array.                               |
| 401             | UNAUTHORIZED        | No valid session or token.                                                              |
| 403             | FORBIDDEN           | Authenticated but insufficient role for this action.                                    |
| 404             | NOT_FOUND           | Entity does not exist or does not belong to the active project.                         |
| 409             | CONFLICT            | Duplicate name, stale version, or concurrent edit detected.                             |
| 422             | PRECONDITION_FAILED | Action is valid but entity state prevents it (e.g. approving an already-rejected plan). |
| 429             | RATE_LIMITED        | Too many requests. Retry-After header included.                                         |
| 500             | INTERNAL_ERROR      | Unexpected server error. Request ID included for tracing.                               |

