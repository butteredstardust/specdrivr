SPECDRIVR

Master Product Specification — Project Management

---

## 1. Overview

Use this module for the project lifecycle. It defines project creation, switching, and administration. Projects contain specifications, plans, and agent sessions.

## 2. User Interface

### 2.1 Projects List (`/projects`)

- **Route**: `/projects`
- **Contents**: Show a searchable full-width table with project ID, name, description, creation date, and a settings action.
- **Action**: Put **New project** in the page header. Open `CreateProjectDialog`.

### 2.2 Project Switching

- **Location**: Use the sidebar dropdown below the logo.
- **Behavior**: Show the current project name. Update shell context when switching. Open Mission Control for the selected project.

### 2.3 General Project Settings (`/settings/general`)

- **Fields**:
  - **Project Name** (Required)
  - **Description** (Textarea)
  - **Repository URL**: Include a `[Verify Connection]` button to ping the repository.
  - **Default Branch**: Default is `main`.
  - **Timezone**: Use for date displays and scheduling.

### 2.4 Danger Zone (`/settings/danger`)

WARNING: These actions are destructive. Keep them on the dedicated danger settings route:

- **Abandon All Sessions**: Stop running agent sessions immediately.
- **Delete All Specs & Plans**: Remove data. Keep the project and team.
- **Delete Project**: Remove the project permanently. Require two confirmation steps. Require the project name for confirmation.

## 3. Interaction Flows

### 3.1 FLOW 1: Create a New Project

1. User clicks **New project** on the Projects page.
2. Open **New Project Dialog**.
3. User enters Name and Repository URL.
4. User clicks **Create project**.
5. Validate repository access.
6. On success, redirect the user to the new project's Mission Control.

### 3.2 FLOW 2: Switch Active Project

1. User clicks the project switcher in the sidebar.
2. User selects a project from the list.
3. Reload the application shell with the new project context.
4. Navigate the user to `/` (Mission Control).

## 4. Agent Handbook

### 4.1 Key Files

- **Logic**: `src/repositories/project-repository.ts`, `src/actions/projects.ts`.
- **Database**: Use `src/db/schema.ts` for the `projects` and `projectMembers` tables.
- **UI Components**: `src/components/projects/create-project-dialog.tsx`.
- **Routes**: `src/app/(app)/projects/page.tsx`, `src/app/api/v1/projects/route.ts`.

### 4.2 Critical Paths

- **Repository Verification**: Check that `AGENT_TOKEN` has `read` access to the repository URL.
- **Slug Generation**: Convert project names to unique URL-friendly slugs during creation.

### 4.3 Common Pitfalls

- **Active Project Context**: Always check that the session `projectId` matches the resource.
- **Deletion Cleanup**: When removing a project, remove its specs, plans, tasks, and sessions from the database. Invalidate active agent sessions.
