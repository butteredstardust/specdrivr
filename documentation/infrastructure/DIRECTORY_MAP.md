**SPECDRIVR**

Master Product Specification — Directory Map & Responsibilities

[Status: GROUND TRUTH]

---

## 1. Overview

This document defines the mental model for the Specdrivr codebase. Every directory has a single responsibility. Agents MUST NOT cross-pollinate logic between these layers.

## 2. Directory Mapping

| **Directory**        | **Responsibility**      | **Rules**                                                 |
| -------------------- | ----------------------- | --------------------------------------------------------- |
| `src/app/`           | Routing & Page Layouts. | Server Components by default. No DB calls.                |
| `src/app/api/`       | REST Endpoints.         | Strictly for external or Agent access.                    |
| `src/actions/`       | User-driven Mutations.  | MUST use 'use server'. MUST call auth().                  |
| `src/repositories/`  | Data Access Layer.      | The ONLY place where `db.select/insert` occurs.           |
| `src/queries/`       | Read-only Logic.        | Shared fetching logic used across Pages/Actions.          |
| `src/components/ui/` | shadcn/ui Primitives.   | DO NOT modify these.                                      |
| `src/components/`    | Feature Components.     | Use `ui/` primitives to build feature UI.                 |
| `src/lib/`           | Shared Utilities.       | Auth, RBAC, Env, Schemas, and Logging.                    |
| `src/db/`            | Database Schema.        | Table definitions and Drizzle configuration.              |
| `scripts/`           | Automation Tools.       | Standalone Node/Shell scripts. No imports from `src/app`. |

## 3. The "No-Fly" Zones

1.  **No direct DB in Actions**: Always use a method from a Repository.
2.  **No direct DB in Components**: Pass data via Props or call a Repository in a Server Component.
3.  **No Side-Effects in Queries**: Functions in `src/queries` must be pure and read-only.
4.  **No `process.env` in Components**: Always import `env` from `@/lib/env`.

## 4. Barrel Exports

- Repositories must be exported from `src/repositories/index.ts`.
- Actions must be exported from `src/actions/index.ts`.
- This ensures agents can find symbols easily.
