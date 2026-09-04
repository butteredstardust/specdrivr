**SPECDRIVR**

Master Product Specification — Specifications & Planning

[Status: GROUND TRUTH]

---

## 1. Overview

This module is the core of Specdrivr. It covers the creation of Markdown-based specifications, the AI-driven generation of implementation plans, and the approval workflow required before execution begins.

## 2. User Interface

### 2.1 Specifications List (`/specs`)

- **Route**: `/specs`
- **Contents**: Full-width table showing:
  - Spec ID & Name
  - Status (Drafting, Pending Plan, Pending Approval, Executing, Complete)
  - Version and task count
- **Action**: **New spec** navigates to the editor.

### 2.2 Spec Editor (`/specs/new` | `/specs/[id]/edit`)

- **Layout**: Full-page split-pane editor.
- **Features**:
  - CodeMirror 6 Markdown editor (left).
  - Live preview (right).
  - Warning banner if editing a spec with an active plan.
- **Actions**: **Save draft** or **Save & generate plan**.

### 2.3 Specification Detail (`/specs/[id]`)

Five-tab interface for managing the spec lifecycle:

1. **Spec**: Rendered markdown of the current version plus version history controls.
2. **Plan**:
   - Displays the AI-generated implementation plan.
   - Lifecycle routing shows generation, timeout, empty, review, changes-requested,
     rejected/abandoned, approved, executing, and completed states.
   - During `pending_approval`, members can edit/request changes and admins can reject or
     **Approve & execute**; unavailable actions use `GatedButton` explanations.
3. **Tasks**: Filterable, dependency-ordered list of tasks. (Detailed in [tasks.md](./tasks.md)).
4. **Changes**: File tabs and a Shiki diff viewer showing agent-authored code.
5. **Activity**: Scoped event log for the specification.

## 3. Interaction Flows

### 3.1 FLOW 3: Create a New Specification

1. User clicks **New spec** on the Specifications page.
2. Navigates to the Spec Editor.
3. User writes the specification in Markdown.
4. User clicks **Save draft**.
5. System creates the spec record and redirects to the Spec Detail page (Spec tab).

### 3.2 FLOW 4: Save Spec and Generate Plan

1. In the Spec Editor, user clicks **Save & generate plan**.
2. System saves the spec and triggers an **async plan generation job** (Gemini).
3. Spec status set to `pending_plan`.
4. User is redirected to Spec Detail (Plan tab) with a loading state.
5. When generation completes, status updates to `pending_approval`.

### 3.3 FLOW 5: Approve Plan and Start Execution

1. User reviews the plan in the PLAN tab.
2. User clicks **Approve & execute**.
3. Confirmation dialog opens.
4. On confirm, system:
   - Sets plan status to `approved`.
   - Sets spec status to `executing`.
   - Creates a new Agent Session.
   - Triggers the first set of dependency-free tasks.

## 4. State Machines

### 4.1 Spec Status Machine

`drafting` → `pending_plan` → `pending_approval` → `executing` → `complete`

- Editing a spec in any state (except `drafting`) resets it to `drafting` and abandons the current plan.

### 4.2 Plan Status Machine

`pending_approval` → `approved` | `rejected` | `abandoned` | `changes_requested`

## 5. Agent Handbook

### 5.1 Key Files

- **Logic**: `src/lib/gemini.ts` (Plan generation), `src/actions/specifications.ts`.
- **Database**: `src/db/schema.ts` (`specifications`, `specVersions`, `plans`, `planJobs`, `planReviews` tables).
- **UI Components**: `src/components/specs/spec-editor.tsx`, `plan-tab.tsx`, `changes-tab.tsx`, and
  `src/components/specs/plan/{shared,plan-review,use-plan}`.

### 5.2 Critical Paths

- **Async Planning**: Plan generation is fire-and-forget in the Route Handler; the UI polls or listens for status changes.
- **Version Reset**: Ensure `spec_versions` are immutable. Every edit creates a new version.

### 5.3 Common Pitfalls

- **State Mismatch**: Never allow plan approval if the spec has been edited since the plan was generated.
- **Dependency Deadlock**: Verify the AI-generated plan does not contain circular dependencies between tasks.
