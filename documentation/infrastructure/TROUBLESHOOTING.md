**SPECDRIVR**

Master Product Specification — Agent Troubleshooting Tree

[Status: GROUND TRUTH]

---

## 1. Overview

When an automated build, test, or agent run fails, follow this decision tree to identify and resolve the root cause.

## 2. Failure: "Database Migration Error"

- **Symptom**: `pnpm db:migrate` fails or reporting "relation does not exist."
- **Path**:
  1.  Check `drizzle/` for conflicting migration files.
  2.  Run `pnpm tsx scripts/db-verify.ts` to check current schema state.
  3.  If drift is detected, run `pnpm db:generate` followed by `db:migrate`.
  4.  **NEVER** use `db:push` in production or for shared schema changes.

## 3. Failure: "RBAC / Access Denied"

- **Symptom**: API returns `ERR_RBAC_FORBIDDEN` or 403.
- **Path**:
  1.  Verify the user's role in the `project_members` table for the specific `projectId`.
  2.  Check `src/lib/rbac.ts` to ensure the action is mapped to the correct required role.
  3.  Check if the `projectId` is being passed correctly from the client to the server action.

## 4. Failure: "Zod Validation Failed"

- **Symptom**: API returns `ERR_VALIDATION_FAILED` with detail object.
- **Path**:
  1.  Locate the schema in `src/lib/schemas.ts`.
  2.  Compare the client-side payload with the schema requirements (e.g., string length, date format).
  3.  Verify if a database `serial` ID is being incorrectly required in a "Create" schema.

## 5. Failure: "Agent Lost / Zombie Session"

- **Symptom**: Mission Control shows "Session may have lost connection."
- **Path**:
  1.  Check the `lastHeartbeatAt` in the `sessions` table.
  2.  Verify the `AGENT_TOKEN` has not expired in the `tokens` table.
  3.  Check the agent's local logs for "5 consecutive errors" exit triggers.

## 6. Failure: "XSS Policy Violation"

- **Symptom**: Pre-push hook fails on `dangerouslySetInnerHTML`.
- **Path**:
  1.  Ensure the content is wrapped in `sanitizeHtml()` from `@/lib/sanitize`.
  2.  Verify the import is present in the file.
