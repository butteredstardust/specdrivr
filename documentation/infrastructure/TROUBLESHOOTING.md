SPECDRIVR

Master Product Specification — Agent Troubleshooting Tree

---

## 1. Overview

When an automated build, test, or agent run fails, use this decision tree. Identify the root cause before you apply a fix.

## 2. Failure: "Database Migration Error"

**WARNING:** NEVER use `db:push` in production. Do not use it for shared schema changes.

- **Symptom**: `pnpm db:migrate` fails or reports "relation does not exist."
- **Path**:
  1.  Check `drizzle/` for migration conflicts.
  2.  Run `pnpm tsx scripts/db-verify.ts`. Check the current schema state.
  3.  If you detect drift, run `pnpm db:generate`. Then run `db:migrate`.

## 3. Failure: "RBAC / Access Denied"

- **Symptom**: API returns `ERR_RBAC_FORBIDDEN` or 403.
- **Path**:
  1.  Verify the user role in `project_members` for the specified `projectId`.
  2.  Check `src/lib/rbac.ts`. Ensure the action maps to the correct required role.
  3.  Check that the client passes `projectId` correctly to the server action.

## 4. Failure: "Zod Validation Failed"

- **Symptom**: The API returns `ERR_VALIDATION_FAILED` with a detail object.
- **Path**:
  1.  Locate the schema in `src/lib/schemas.ts`.
  2.  Compare the client payload with schema requirements. Check string length and date format.
  3.  Check whether a Create schema incorrectly requires a database `serial` ID.

## 5. Failure: "Agent Lost / Zombie Session"

- **Symptom**: Mission Control shows "Session may have lost connection."
- **Path**:
  1.  Check the `lastHeartbeatAt` in the `sessions` table.
  2.  Verify that the `AGENT_TOKEN` has not expired in the `tokens` table.
  3.  Check local agent logs for "5 consecutive errors" exit triggers.

## 6. Failure: "XSS Policy Violation"

- **Symptom**: The pre-push hook fails on `dangerouslySetInnerHTML`.
- **Path**:
  1.  Ensure that `sanitizeHtml()` from `@/lib/sanitize` wraps the content.
  2.  Check that the file includes the import.
