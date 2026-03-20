**SPECDRIVR**

Master Product Specification — Technical Recipes & Workflows

[Status: GROUND TRUTH]

---

## 1. Overview

These recipes provide step-by-step checklists for common technical tasks. Following these ensures that code, database schema, and documentation remain perfectly aligned.

## 2. Recipe: Adding a new Status / Enum

Use this when adding a new state to `spec_status`, `task_status`, or similar.

1.  **Database**: Update the enum definition in `src/db/schema.ts`.
2.  **Migration**: Run `pnpm db:generate` then `pnpm db:migrate`.
3.  **Documentation**: Update the relevant section in `infrastructure/STATE_MACHINES.md`.
4.  **UI Tokens**: Add the new status color and icon to the status mapping in `infrastructure/DESIGN_SYSTEM.md`.
5.  **Components**: Update status-aware components (e.g., `TaskStatusBadge`).

## 3. Recipe: Creating a new API Endpoint

Use this when adding a new resource or action to the system.

1.  **Schema**: Define the request/response Zod schemas in `src/lib/schemas.ts`.
2.  **Repository**: Implement the data access logic in the relevant `src/repositories/` file.
3.  **Route Handler**: Create the `route.ts` file under `src/app/api/v1/`.
    -   Must use `import 'server-only'`.
    -   Must call `await auth()` first.
    -   Must use `checkPermission()` from `lib/rbac`.
4.  **Error Registry**: If adding a new error condition, update `infrastructure/ERROR_REGISTRY.md`.
5.  **Documentation**: Add the endpoint to `infrastructure/API.md`.

## 4. Recipe: Adding a Feature Module (Vertical Slice)

Use this when building a major new feature area.

1.  **Architecture**: Determine the "Vertical Slice" boundaries (UI, Flow, Logic).
2.  **Documentation**: Create `documentation/modules/{feature}.md`.
    -   Include: Overview, UI, Interaction Flows, and **Agent Handbook**.
3.  **Indexing**: Add the new module to `documentation/README.md` and `SPECIFICATION_INDEX.md`.
4.  **Status**: Update the high-level roadmap in `documentation/PRODUCT_MAP.md`.

## 5. Recipe: Fixing a Bug (Agent Procedure)

1.  **Research**: Locate relevant error codes in `infrastructure/ERROR_REGISTRY.md`.
2.  **State Check**: Verify the current entity state against `infrastructure/STATE_MACHINES.md`.
3.  **Code Audit**: Use the "Key Files" list in the relevant `modules/*.md` to find the logic.
4.  **Verification**: Add a Vitest unit test reproducing the failure before applying the fix.
