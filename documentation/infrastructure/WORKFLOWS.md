SPECDRIVR

Master Product Specification — Technical Recipes & Workflows

---

## 1. Overview

Use these checklists for common technical tasks. Keep code, database schema, and documentation aligned.

## 2. Recipe: Adding a new Status / Enum

Use this recipe when you add a state to `spec_status`, `task_status`, or a similar enum.

1.  **Database**: Update the enum definition. Use `src/db/schema.ts`.
2.  **Migration**: Run `pnpm db:generate`. Then run `pnpm db:migrate`.
3.  **Documentation**: Update the relevant section of `infrastructure/STATE_MACHINES.md`.
4.  **UI Tokens**: Add the new status color and icon to the status map in `infrastructure/DESIGN_SYSTEM.md`.
5.  **Components**: Update status-aware components such as `TaskStatusBadge`.

## 3. Recipe: Creating a new API Endpoint

Use this recipe when you add a resource or action to the system.

1.  **Schema**: Define request and response Zod schemas in `src/lib/schemas.ts`.
2.  **Repository**: Implement data access logic in the relevant `src/repositories/` file.
3.  **Route Handler**: Create `route.ts` under `src/app/api/v1/`.
    - Use `import 'server-only'`.
    - Call `await auth()` first.
    - Use `checkPermission()` from `lib/rbac`.
4.  **Error Registry**: Update `infrastructure/ERROR_REGISTRY.md` when you add an error condition.
5.  **Documentation**: Add the endpoint to `infrastructure/API.md`.

## 4. Recipe: Adding a Feature Module (Vertical Slice)

Use this recipe when you build a major feature area.

1.  **Architecture**: Define the "Vertical Slice" boundaries: UI, Flow, and Logic.
2.  **Documentation**: Create `documentation/modules/{feature}.md`.
    - Include Overview, UI, Interaction Flows, and **Agent Handbook**.
3.  **Indexing**: Add the module to `documentation/README.md`.
4.  **Status**: Update the high-level roadmap in `documentation/PRODUCT_MAP.md`.

## 5. Recipe: Fixing a Bug (Agent Procedure)

1.  **Research**: Find relevant error codes in `infrastructure/ERROR_REGISTRY.md`.
2.  **State Check**: Check the current entity state against `infrastructure/STATE_MACHINES.md`.
3.  **Code Audit**: Use the "Key Files" list in the relevant `modules/*.md`. Find the logic.
4.  **Verification**: Create a Vitest unit test that reproduces the failure. Do this before you apply the fix.
