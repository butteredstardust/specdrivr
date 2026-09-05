SPECDRIVR

Master Product Specification — Specifications & Planning

---

## 1. Overview

Use this module to create Markdown specifications and implementation plans. Require plan approval before execution.

## 2. User Interface

### 2.1 Specifications List (`/specs`)

- **Route**: `/specs`
- **Contents**: Show a full-width table with:
  - Spec ID & Name
  - Status (Drafting, Pending Plan, Pending Approval, Executing, Complete)
  - Version and task count
- **Action**: Use **New spec** to open the editor.

### 2.2 Spec Editor (`/specs/new` | `/specs/[id]/edit`)

- **Layout**: Use a full-page split-pane editor.
- **Features**:
  - Put the CodeMirror 6 Markdown editor on the left.
  - Put the live preview on the right.
  - Show a warning banner when editing a specification with an active plan.
- **Actions**: Provide **Save draft** and **Save & generate plan**.

### 2.3 Specification Detail (`/specs/[id]`)

Use five tabs to manage the specification lifecycle:

1. **Spec**: Show rendered Markdown for the current version. Provide version history controls.
2. **Plan**:
   - Show the AI-generated implementation plan.
   - Show generation, timeout, empty, review, changes-requested, rejected/abandoned, approved, executing, and completed lifecycle states.
   - During `pending_approval`, let members edit or request changes. Let admins reject or **Approve & execute**. Use `GatedButton` explanations for unavailable actions.
3. **Tasks**: Show a filterable, dependency-ordered task list. See [tasks.md](./tasks.md) for details.
4. **Changes**: Show file tabs and a Shiki diff viewer for agent-authored code.
5. **Activity**: Show an event log scoped to the specification.

## 3. Interaction Flows

### 3.1 FLOW 3: Create a New Specification

1. User clicks **New spec** on the Specifications page.
2. Navigate to the Spec Editor.
3. User writes the specification in Markdown.
4. User clicks **Save draft**.
5. Create the specification record. Redirect to the Spec Detail page (Spec tab).

### 3.2 FLOW 4: Save Spec and Generate Plan

1. In the Spec Editor, user clicks **Save & generate plan**.
2. Save the specification. Trigger an **async plan generation job** (Gemini).
3. Set the specification status to `pending_plan`.
4. Redirect the user to Spec Detail (Plan tab). Show a loading state.
5. When generation completes, update the status to `pending_approval`.

### 3.3 FLOW 5: Approve Plan and Start Execution

1. User reviews the plan in the PLAN tab.
2. User clicks **Approve & execute**.
3. Open the confirmation dialog.
4. On confirmation:
   - Sets plan status to `approved`.
   - Sets spec status to `executing`.
   - Creates a new Agent Session.
   - Triggers the first set of dependency-free tasks.

## 4. State Machines

### 4.1 Spec Status Machine

`drafting` → `pending_plan` → `pending_approval` → `executing` → `complete`

- When editing a specification outside `drafting`, reset it to `drafting`. Abandon the current plan.

### 4.2 Plan Status Machine

`pending_approval` → `approved` | `rejected` | `abandoned` | `changes_requested`

## 5. Agent Handbook

### 5.1 Key Files

- **Logic**: Use `src/lib/gemini.ts` for plan generation. Use `src/actions/specifications.ts`.
- **Database**: Use `src/db/schema.ts` for the `specifications`, `specVersions`, `plans`, `planJobs`, and `planReviews` tables.
- **UI Components**: `src/components/specs/spec-editor.tsx`, `plan-tab.tsx`, `changes-tab.tsx`, and
  `src/components/specs/plan/{shared,plan-review,use-plan}`.

### 5.2 Critical Paths

- **Async Planning**: Run plan generation as fire-and-forget in the Route Handler. Poll or listen for status changes in the UI.
- **Version Reset**: Keep `spec_versions` immutable. Create a new version for every edit.

### 5.3 Common Pitfalls

- **State Mismatch**: Do not allow plan approval when the specification changed after plan generation.
- **Dependency Deadlock**: Check that the AI-generated plan has no circular task dependencies.
