**SPECDRIVR**

Master Product Specification — Project Management

[Status: GROUND TRUTH]

---

## 1. Overview

This module covers the project lifecycle, including creation, switching, and administrative settings. Projects are the top-level container for specifications, plans, and agent sessions.

## 2. User Interface

### 2.1 Projects List (`/projects`)

- **Route**: `/projects`
- **Contents**: Full-width table showing:
  - Project ID & Name
  - Repository URL & Branch
  - Spec Count & Last Run status
- **Action**: `+ New Project` button in the top bar.

### 2.2 Project Switching

- **Location**: Sidebar dropdown (below logo).
- **Behavior**: Shows current project as `org/repo`. Switching projects triggers a global context update and navigates to the Mission Control for the selected project.

### 2.3 General Project Settings (`/settings/general`)

- **Fields**:
  - **Project Name** (Required)
  - **Description** (Textarea)
  - **Repository URL**: Includes a `[Verify Connection]` button to ping the repo.
  - **Default Branch**: Default is `main`.
  - **Timezone**: Used for date displays and scheduling.

### 2.4 Danger Zone

destructive actions found in `/settings/general` (bottom):

- **Abandon All Sessions**: Immediately stops running agent sessions.
- **Delete All Specs & Plans**: Purges data but keeps the project and team.
- **Delete Project**: Permanently deletes the project. Requires a two-step confirmation, including typing the project name to confirm.

## 3. Interaction Flows

### 3.1 FLOW 1: Create a New Project

1. User clicks `+ New Project` on the Projects page.
2. Opens **New Project Dialog**.
3. User enters Name and Repository URL.
4. User clicks `[Create Project]`.
5. System validates repository access.
6. On success, the user is redirected to the new project's Mission Control.

### 3.2 FLOW 2: Switch Active Project

1. User clicks the project switcher in the sidebar.
2. Selects a project from the list.
3. The application shell reloads with the new project context.
4. User is navigated to `/` (Mission Control).

## 4. Agent Handbook

### 4.1 Key Files

- **Logic**: `src/lib/projects.ts`, `src/actions/projects.ts`.
- **Database**: `src/db/schema/projects.ts`.
- **UI Components**: `src/components/projects/project-list.tsx`, `src/components/projects/create-project-dialog.tsx`.
- **Routes**: `src/app/(app)/projects/page.tsx`, `src/app/api/v1/projects/route.ts`.

### 4.2 Critical Paths

- **Repository Verification**: Ensure the `AGENT_TOKEN` has `read` access to the provided repository URL.
- **Slug Generation**: Project names are converted to unique URL-friendly slugs during creation.

### 4.3 Common Pitfalls

- **Active Project Context**: Always verify that the current `projectId` in the session matches the resource being accessed.
- **Deletion Cleanup**: Deleting a project must also purge its specs, plans, tasks, and sessions from the database and invalidate active agent sessions.
