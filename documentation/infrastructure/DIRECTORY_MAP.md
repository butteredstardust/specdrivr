SPECDRIVR

Master Product Specification — Directory Map & Responsibilities

---

## 1. Overview

Use this document to navigate the Specdrivr codebase. Each directory has one responsibility. Agents MUST NOT mix logic between these layers.

## 2. Directory Mapping

| **Directory**        | **Responsibility**      | **Rules**                                                 |
| -------------------- | ----------------------- | --------------------------------------------------------- |
| `src/app/`           | Routing & Page Layouts. | Server Components by default. No DB calls.                |
| `src/app/api/`       | REST Endpoints.         | Strictly for external or Agent access.                    |
| `src/actions/`       | User-driven Mutations.  | MUST use 'use server'. MUST call auth().                  |
| `src/repositories/`  | Data Access Layer.      | The ONLY place where `db.select/insert` occurs.           |
| `src/queries/`       | Read-only Logic.        | Shared fetching logic used across Pages/Actions.          |
| `src/components/ui/` | Maintained shadcn/Radix primitive wrappers. | Reuse before creating feature controls; keep global focus and token rules intact. |
| `src/components/`    | Feature Components.     | Use `ui/` primitives to build feature UI.                 |
| `src/components/settings/integrations/` | Integration cards and shared integration UI. | One provider/card per file; the parent section only composes them. |
| `src/components/settings/agent-config/` | Agent configuration form sections and shared fields. | Consume the parent `FormProvider` with `useFormContext`; do not prop-drill form methods. |
| `src/components/specs/plan/` | Plan lifecycle UI, shared plan types/renderers, and `usePlan`. | Keep lifecycle routing in `plan-tab.tsx`; keep resource operations in the hook. |
| `src/hooks/`         | Reusable client behavior and polling hooks. | The former systems bar is gone; `use-system-health.ts` now feeds the sidebar footer. |
| `src/lib/`           | Shared Utilities.       | Auth, RBAC, Env, Schemas, and Logging.                    |
| `src/db/`            | Database Schema.        | Table definitions and Drizzle configuration.              |
| `scripts/`           | Automation Tools.       | Standalone Node/Shell scripts. No imports from `src/app`. |

## 3. The "No-Fly" Zones

1.  **No direct DB in Actions**: Use a Repository method.
2.  **No direct DB in Components**: Pass data by props. Or use a Repository in a Server Component.
3.  **No Side-Effects in Queries**: Keep functions in `src/queries` pure and read-only.
4.  **No `process.env` in Components**: Import `env` from `@/lib/env`.

## 4. UI Topology Notes

- System-health presentation is in `src/components/shell/sidebar.tsx`. Reusable polling and state
  are in `src/hooks/use-system-health.ts`.
- Large settings and plan surfaces use local `shared.tsx` modules. These modules provide types and
  small composition helpers. They are not global primitives.
- `src/components/ui/gated-button.tsx`, `entity-id.tsx`, and `status-icon.tsx` provide reusable
  semantic primitives.

## 5. Barrel Exports

- Repositories must be exported from `src/repositories/index.ts`.
- Actions must be exported from `src/actions/index.ts`.
- This helps agents find symbols.
