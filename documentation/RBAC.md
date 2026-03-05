# Role-Based Access Control (RBAC)

SpecDrivr implements a simple Role-Based Access Control mechanism. The `role` column in the `users` table governs what actions an authenticated user can perform.

## Defined Roles

The system uses three primary roles, defined in the `user_role` pgEnum:

1.  **`admin`**
2.  **`developer`**
3.  **`viewer`** (Default)

*(Note: There is also an `isAdmin` boolean flag on the user model, which historically granted blanket superuser privileges. The system is transitioning to prefer the `role` enum).*

---

## Role Permissions Matrix

### 1. Admin (`role: 'admin'` or `isAdmin: true`)
The Admin role has unrestricted access to all system features.
*   **Project Management:** Create, mutate, and completely archive/delete any project.
*   **Agent Control:** Start, stop, pause, and skip tasks across all projects.
*   **User Management:** Access the `/admin/users` dashboard to invite new users, revoke access, and change roles of other users.
*   **Global Settings:** Modify global configurations and system dependencies.

### 2. Developer (`role: 'developer'`)
The Developer role is the primary collaborative role for team members actively building projects.
*   **Project Management:** View all projects. Create new projects. Edit details (description, mission, constitution) for projects. Modify specifications and trigger new plan generation.
*   **Task Management:** Update kanban board task statuses, priorities, and assignments. 
*   **Agent Control:** Can control the agent (start, stop, retry tasks) for active projects.
*   **Restrictions:** Cannot access the `/admin/*` routes. Cannot delete other users or change user roles.

### 3. Viewer (`role: 'viewer'`)
The Viewer role is a read-only role intended for stakeholders, PMs, or external clients.
*   **Project Visibility:** Can view dashboards, kanban boards, specifications, and test results.
*   **Restrictions:** 
    *   Cannot edit or create projects.
    *   Cannot modify specifications or trigger plan generation.
    *   Cannot move tasks on the Kanban board.
    *   Cannot start, stop, or manage the agent.
    *   Cannot manage users.

---

## Enforcement Implementation

Currently, role enforcement is primarily handled in:
*   **`middleware.ts`**: Verifies authentication. Could be extended to block `/admin` paths based on role.
*   **Server Actions (`auth-utils.ts` / `actions.ts`)**: Server actions that mutate data should check `await getSessionUser()` and assert `user.role === 'admin' || user.role === 'developer'`.
*   **UI Client Components**: Components conditionally render inputs or "Edit" buttons based on the user's role (e.g., hiding the "Settings" tab or disabling the Kanban drag-and-drop for viewers).
