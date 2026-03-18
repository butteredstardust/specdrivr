# Specdrivr — Screen & Flow Documentation Index

**Version 1.0 · Complete UI/UX/Flow Specification for Frontend Development**

---

## Overview

This directory contains three comprehensive documents that specify every screen, interaction, and state transition in the Specdrivr application. These files work together to provide complete coverage for frontend development.

## Documentation Files

| File                                         | Lines  | Purpose                                                   | Audience                      |
| -------------------------------------------- | ------ | --------------------------------------------------------- | ----------------------------- |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)       | ~300   | Design philosophy, mascot, tech stack, theming            | Designers, Frontend Engineers |
| [USER_INTERFACE.md](./USER_INTERFACE.md)     | ~1,650 | Screens, navigation, interactions, state machines         | Frontend Engineers            |
| [PRODUCT_FEATURES.md](./PRODUCT_FEATURES.md) | ~900   | Authentication, RBAC, settings, notifications, onboarding | Product Managers, Engineers   |

**Total: ~2,850 lines of detailed specification**

---

## Quick Reference: What Are You Building?

**"I need to build..."** → **Read this file**

- "...the login/auth flow" → PRODUCT_FEATURES.md (Part 1)
- "...the main dashboard screen" → USER_INTERFACE.md (Part 1 - 1.2 P1 Mission Control)
- "...the specifications list page" → USER_INTERFACE.md (Part 1 - 1.4 P3 Specifications)
- "...the spec editor" → USER_INTERFACE.md (Part 1 - 1.5 P4 Spec Editor)
- "...how a user creates a spec and generates a plan" → USER_INTERFACE.md (Part 2 - Flows 3-4)
- "...the plan approval flow" → USER_INTERFACE.md (Part 2 - Flow 5) + PRODUCT_FEATURES.md (Part 3)
- "...what happens when a task gets blocked" → USER_INTERFACE.md (Part 2 - Flows 9, 21)
- "...all the navigation between screens" → USER_INTERFACE.md (Part 1 - 1.12 Complete Navigation Flow Diagram)
- "...how DAEMON mascot expressions work" → DESIGN_SYSTEM.md (Section 4)
- "...the settings page structure" → PRODUCT_FEATURES.md (Part 6)
- "...role-based permissions" → PRODUCT_FEATURES.md (Part 2)
- "...task drawer component" → USER_INTERFACE.md (Part 1 - 1.7 P5-OVERLAY Task Drawer)
- "...how the sidebar status bar works" → DESIGN_SYSTEM.md (Section 12)
- "...which UI components are shared" → USER_INTERFACE.md (Part 1 - 1.14 Shared Component Inventory)

---

## Complete Screen Inventory

### Authentication Screens

| Screen                  | Route              | Purpose                | Section Link                                                                        |
| ----------------------- | ------------------ | ---------------------- | ----------------------------------------------------------------------------------- |
| AUTH-1: Login           | `/login`           | User authentication    | [Login Page](./PRODUCT_FEATURES.md#11-login-page-login)                             |
| AUTH-2: Forgot Password | `/forgot-password` | Password reset request | [Forgot Password](./PRODUCT_FEATURES.md#12-forgot-password-forgot-password)         |
| AUTH-3: Reset Password  | `/reset-password`  | Set new password       | [Reset Password](./PRODUCT_FEATURES.md#13-reset-password-reset-passwordtoken-token) |

### Main Application Screens

| Screen              | Route                            | Purpose                                                      | Section Link                                                                                                         |
| ------------------- | -------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| P1: Mission Control | `/`                              | Main dashboard, live session view                            | [Mission Control](./USER_INTERFACE.md#12-p1--mission-control)                                                        |
| P2: Projects        | `/projects`                      | Project management, switch active project                    | [Projects](./USER_INTERFACE.md#13-p2--projects)                                                                      |
| P3: Specifications  | `/specs`                         | List all specifications                                      | [Specifications](./USER_INTERFACE.md#14-p3--specifications)                                                          |
| P4: Spec Editor     | `/specs/new`, `/specs/[id]/edit` | Create/edit specifications                                   | [Spec Editor](./USER_INTERFACE.md#15-p4--spec-editor)                                                                |
| P5: Spec Detail     | `/specs/[id]`                    | View spec with 5 tabs (SPEC, PLAN, TASKS, CHANGES, ACTIVITY) | [Spec Detail](./USER_INTERFACE.md#16-p5--specification-detail-status-verified-specification--implementation-pending) |
| P6: Sessions        | `/sessions`                      | Historical session browser                                   | [Sessions](./USER_INTERFACE.md#18-p6--sessions-status-verified-specification--implementation-pending)                |
| P7: Settings        | `/settings`                      | Project and agent configuration                              | [Settings](./USER_INTERFACE.md#19-p7--settings-status-verified-specification--implementation-pending)                |

### Overlay Components

| Component               | Trigger                      | Purpose                        | Section Link                                                                             |
| ----------------------- | ---------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------- |
| P5-OVERLAY: Task Drawer | Click task row, blocked pill | Detailed task view with 3 tabs | [Task Drawer](./USER_INTERFACE.md#17-p5-overlay--task-drawer)                            |
| New Project Dialog      | `+ New Project` button       | Create new project modal       | [Dialog in P2](./USER_INTERFACE.md#13-p2--projects)                                      |
| Approval Dialog         | `[APPROVE & EXECUTE]` button | Confirm plan execution         | [Flow 5](./USER_INTERFACE.md#25-flow-5--approve-plan-and-start-execution--the-main-flow) |
| Command Palette         | `Cmd+K`                      | Quick navigation/actions       | [Command Palette](./USER_INTERFACE.md#223-flow-23--command-palette-actions)              |
| Danger Zone Dialogs     | Various destructive actions  | Confirm dangerous operations   | [Danger Zone](./PRODUCT_FEATURES.md#68-danger-zone)                                      |

---

## Flow Inventory

### Core Product Flows

| #     | Flow                               | Trigger                  | Pages Affected             | Section                                                                                      |
| ----- | ---------------------------------- | ------------------------ | -------------------------- | -------------------------------------------------------------------------------------------- |
| 1     | Create New Project                 | `+ New Project` button   | P2 → P2 (with new project) | [Flow 1](./USER_INTERFACE.md#21-flow-1--create-a-new-project)                                |
| 2     | Switch Active Project              | Project switcher         | Global (all pages reload)  | [Flow 2](./USER_INTERFACE.md#22-flow-2--switch-active-project)                               |
| 3     | Create Specification               | `+ New Spec` button      | P3 → P4                    | [Flow 3](./USER_INTERFACE.md#23-flow-3--create-a-new-specification)                          |
| 4     | Save & Generate Plan               | `[Save & Generate Plan]` | P4 → P5 (PLAN tab)         | [Flow 4](./USER_INTERFACE.md#24-flow-4--save-spec-and-generate-plan)                         |
| **5** | **Approve Plan & Start Execution** | `[APPROVE & EXECUTE]`    | P5 → P5 + session starts   | **[Flow 5](./USER_INTERFACE.md#25-flow-5--approve-plan-and-start-execution--the-main-flow)** |
| 6     | Pause Session                      | `[PAUSE]` button         | P5, Sidebar, P1, P6        | [Flow 6](./USER_INTERFACE.md#26-flow-6--pause-a-running-session)                             |
| 7     | Resume Session                     | `[RESUME]` button        | Same as pause (reversed)   | [Flow 7](./USER_INTERFACE.md#27-flow-7--resume-a-paused-session)                             |
| 8     | Cancel Session                     | `[CANCEL]` button        | P5, P1, P6                 | [Flow 8](./USER_INTERFACE.md#28-flow-8--cancel-a-running-session)                            |
| 9     | Unblock Task                       | `[RETRY WITH CONTEXT]`   | Task Drawer → P5           | [Flow 9](./USER_INTERFACE.md#29-flow-9--unblock-a-task)                                      |

### Task Management Flows

| #   | Flow                       | Trigger          | Pages       | Section                                                                  |
| --- | -------------------------- | ---------------- | ----------- | ------------------------------------------------------------------------ |
| 10  | Manually Mark Task Done    | `[MARK DONE]`    | Task Drawer | [Flow 10](./USER_INTERFACE.md#210-flow-10--manually-mark-a-task-done)    |
| 11  | Manually Mark Task Blocked | `[MARK BLOCKED]` | Task Drawer | [Flow 11](./USER_INTERFACE.md#211-flow-11--manually-mark-a-task-blocked) |
| 12  | Re-run Task                | `[RE-RUN]`       | Task Drawer | [Flow 12](./USER_INTERFACE.md#212-flow-12--re-run-a-task)                |

### Spec Management Flows

| #   | Flow                       | Trigger                | Pages                | Section                                                                              |
| --- | -------------------------- | ---------------------- | -------------------- | ------------------------------------------------------------------------------------ |
| 13  | Edit Existing Spec         | `Edit` button          | P5 → P4 → P5         | [Flow 13](./USER_INTERFACE.md#213-flow-13--edit-an-existing-spec)                    |
| 14  | View Previous Spec Version | Version pill click     | P5 (SPEC tab)        | [Flow 14](./USER_INTERFACE.md#214-flow-14--view-a-previous-spec-version)             |
| 15  | Inline Task Expand         | Click task row         | P5 (TASKS tab)       | [Flow 15](./USER_INTERFACE.md#215-flow-15--inline-task-row-expand--collapse)         |
| 16  | Open Task Drawer           | `Open Detail →`        | P5 (overlay)         | [Flow 16](./USER_INTERFACE.md#216-flow-16--open-task-drawer)                         |
| 17  | Approve via Header         | `Review Plan →` button | P5 (scrolls to PLAN) | [Flow 17](./USER_INTERFACE.md#217-flow-17--approve-plan-from-header-button-shortcut) |
| 18  | Abandon Plan               | `[ABANDON]`            | P5 (PLAN tab)        | [Flow 18](./USER_INTERFACE.md#218-flow-18--abandon-a-plan)                           |
| 19  | Generate Plan              | `[Generate Plan]`      | P5 (PLAN tab)        | [Flow 19](./USER_INTERFACE.md#219-flow-19--generate-plan-from-empty-plan-tab)        |
| 20  | View File Diff             | Click file row         | P5 (CHANGES tab)     | [Flow 20](./USER_INTERFACE.md#220-flow-20--view-file-diff)                           |

### Navigation & Utility Flows

| #   | Flow                               | Trigger            | Pages              | Section                                                                                   |
| --- | ---------------------------------- | ------------------ | ------------------ | ----------------------------------------------------------------------------------------- |
| 21  | Submit Context via Mission Control | Blocked pill click | P1 → Task Drawer   | [Flow 21](./USER_INTERFACE.md#221-flow-21--submit-context-to-unblock-via-mission-control) |
| 22  | Session Row Expand                 | Click session row  | P6 (inline expand) | [Flow 22](./USER_INTERFACE.md#222-flow-22--session-row-expand-sessions-page)              |
| 23  | Command Palette                    | `Cmd+K`            | Global overlay     | [Flow 23](./USER_INTERFACE.md#223-flow-23--command-palette-actions)                       |
| 24  | Toggle Dev Mode                    | `Ctrl+``           | Global (all pages) | [Flow 24](./USER_INTERFACE.md#224-flow-24--toggle-dev-mode)                               |
| 25  | Save Settings                      | `[Save Changes]`   | P7                 | [Flow 25](./USER_INTERFACE.md#225-flow-25--settings-save-agent-configuration)             |
| 26  | Delete Project                     | `[DELETE PROJECT]` | P7 → P2            | [Flow 26](./USER_INTERFACE.md#226-flow-26--danger-zone-delete-project)                    |

---

## State Machine Quick Reference

### Spec Status Flow

```
drafting → pending_plan → pending_approval → executing → complete
                               ↓              ↓           ↑
                              stalled       stalled      │
                                            (rejected)   │
                                                         (all tasks done)
```

**Key state: `pending_approval`** - This is where the core review UI appears. See [Truth Tables](./USER_INTERFACE.md#36-conditional-rendering-truth-tables)

### Plan Status Flow

```
(none) → pending_approval → approved → executing → complete
           ↘ rejected       ↘ abandoned
           ↘ changes_requested
```

**Key state: `pending_approval`** - Only state with `[Approve & Execute]`, `[Reject Plan]`, `[Request Changes]` buttons. See [Plan Review Actions](./PRODUCT_FEATURES.md#31-plan-review-actions)

### Task Status Flow

```
todo → in_progress → done
            ↘ failed → todo (on retry)
            ↘ blocked → in_progress (on unblock)
```

**Key state: `blocked`** - Shows red panel in Task Drawer, triggers "Needs Attention" banner. See [Task Status Machine](./USER_INTERFACE.md#33-task-status-machine)

### Session Status Flow

```
running → completed
   ↘ paused → running
   ↘ failed (terminal)
   ↘ cancelled (terminal)
```

**Global states**: Affect sidebar DAEMON status, Mission Control live panel. See [Session Status Machine](./USER_INTERFACE.md#34-session-status-machine)

---

## Component Cross-Reference

These components appear across multiple screens and must be consistent:

| Component              | Used On                              | Behavior/States                                     | Primary File                                                            |
| ---------------------- | ------------------------------------ | --------------------------------------------------- | ----------------------------------------------------------------------- |
| **DAEMON Sprite**      | All: P1-P7, all overlays, all toasts | Expressions: idle, working, success, blocked, error | [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md#section-4)                        |
| **Task Row**           | P5 TASKS tab, P1 blocked pills       | Collapsible, status badges, expandable              | [USER_INTERFACE.md](./USER_INTERFACE.md#114-shared-component-inventory) |
| **Event Log Row**      | P1, P5 ACTIVITY, P6 expanded         | Mono font, color-coded brackets, timestamp          | [USER_INTERFACE.md](./USER_INTERFACE.md#114-shared-component-inventory) |
| **xterm.js Terminal**  | P1 live log, P5-OVERLAY, P6          | ANSI rendering, auto-scroll, copy support           | [USER_INTERFACE.md](./USER_INTERFACE.md#114-shared-component-inventory) |
| **Shiki Diff Viewer**  | P5 CHANGES, P5-OVERLAY               | Syntax highlighting, line numbers, diff colors      | [USER_INTERFACE.md](./USER_INTERFACE.md#114-shared-component-inventory) |
| **ASCII Progress Bar** | P3 table, P5 header                  | `▓▒░` blocks showing completion %                   | [USER_INTERFACE.md](./USER_INTERFACE.md#114-shared-component-inventory) |
| **Status Indicator**   | All task/session/spec rows           | Retro ASCII: `● ✓ ✗ ⚠` with colors                  | [USER_INTERFACE.md](./USER_INTERFACE.md#114-shared-component-inventory) |

---

## Critical UI Logic Reference

### Conditional Rendering Truth Tables

Located in: [USER_INTERFACE.md Part 3](./USER_INTERFACE.md#36-conditional-rendering-truth-tables)

Key patterns:

- Spec Detail Header button changes by `(spec.status, plan.status)` pair
- PLAN tab content completely changes by `plan.status` value
- TASKS tab interactivity depends on `spec.status` (non-interactive during `pending_approval`)
- Sidebar DAEMON status uses priority system (error > blocked > working > idle)

### Mock Data Requirements

Located in: [USER_INTERFACE.md Part 3.5](./USER_INTERFACE.md#35-required-mock--seed-data)

Critical for demo:

- 3 users (Admin, Member, Viewer) - test RBAC differences
- 2 projects (active: proj_001)
- 6 specs (one per meaningful status)
- 1 plan with `status: 'pending_approval'` (spec_001) - THE PRIMARY DEMO
- 1 active session (ses_001) running task_103
- 1 blocked task (task_105) - triggers Needs Attention banner
- 2 unread notifications

### Anti-Patterns to Avoid

Located in: [USER_INTERFACE.md Part 3.8](./USER_INTERFACE.md#38-anti-patterns-to-avoid)

Top 5:

1. ❌ Seeding spec as already approved (use `pending_approval` for demo)
2. ❌ Rendering `pending_approval` as loading skeleton (should be fully interactive)
3. ❌ Putting `[Approve & Execute]` in header (must be in PLAN tab only)
4. ❌ Making tasks interactive during `pending_approval` (should be read-only)
5. ❌ Showing DAEMON status without checking global state

---

## Common Development Scenarios

### "I need to create a new screen"

Read files in this order:

1. **DESIGN_SYSTEM.md** - Understand design philosophy and theming
2. **USER_INTERFACE.md** - Check if similar screen exists, see component inventory
3. **USER_INTERFACE.md (Part 2)** - Find the flow that triggers your screen
4. **USER_INTERFACE.md (Part 3)** - Check state transitions that affect your screen

### "I need to implement a user interaction"

Read files in this order:

1. **USER_INTERFACE.md (Part 2)** - Find the exact flow (check table of contents)
2. **USER_INTERFACE.md (Part 1)** - Verify which page/component the interaction is on
3. **USER_INTERFACE.md (Part 3)** - Check state conditions for the action buttons
4. **PRODUCT_FEATURES.md** - Check RBAC permissions if needed

### "I need to understand state transitions"

Read files in this order:

1. **USER_INTERFACE.md (Part 3)** - Read for state flows and mock data
2. **USER_INTERFACE.md (Part 3.6)** - Read for conditional rendering rules
3. **USER_INTERFACE.md (Part 2)** - Find the flow that causes the transition
4. **USER_INTERFACE.md (Part 1)** - Check which screens are affected by state change

### "I need to implement RBAC"

Read files in this order:

1. **PRODUCT_FEATURES.md (Part 1-2)** - Authentication & RBAC
2. **USER_INTERFACE.md (Part 3.11)** - Role-switching test for demonstration
3. **USER_INTERFACE.md (Part 2)** - Find user flows and check permission requirements
4. **DESIGN_SYSTEM.md** - Design philosophy (trust the user, keyboard-first)

---

## Implementation Checklist

When building the app, ensure each of these is implemented according to the specification:

### Screens (8 main + 3 auth + overlays)

- [ ] Login page (`/login`)
- [ ] Forgot password (`/forgot-password`)
- [ ] Reset password (`/reset-password`)
- [ ] Mission Control (`/`)
- [ ] Projects (`/projects`)
- [ ] Specifications (`/specs`)
- [ ] Spec Editor (`/specs/new`, `/specs/[id]/edit`)
- [ ] Spec Detail (`/specs/[id]` with 5 tabs)
- [ ] Sessions (`/sessions`)
- [ ] Settings (`/settings`)
- [ ] Task Drawer (overlay)
- [ ] Project Dialog (overlay)
- [ ] Plan Approval Dialog (overlay)
- [ ] Command Palette (overlay)

### Interactions (26 flows)

- [ ] Create project (Flow 1)
- [ ] Switch project (Flow 2)
- [ ] Create spec (Flow 3)
- [ ] Generate plan (Flow 4)
- [ ] **Approve & execute (Flow 5 - critical)**
- [ ] Pause session (Flow 6)
- [ ] Resume session (Flow 7)
- [ ] Cancel session (Flow 8)
- [ ] Unblock task with context (Flow 9)
- [ ] Mark task done (Flow 10)
- [ ] Mark task blocked (Flow 11)
- [ ] Re-run task (Flow 12)
- [ ] Edit spec (Flow 13)
- [ ] View spec version history (Flow 14)
- [ ] Expand/collapse task row (Flow 15)
- [ ] Open task drawer (Flow 16)
- [ ] Approve via header shortcut (Flow 17)
- [ ] Abandon plan (Flow 18)
- [ ] Generate plan from empty state (Flow 19)
- [ ] View file diff (Flow 20)
- [ ] Submit context via Mission Control (Flow 21)
- [ ] Expand session row (Flow 22)
- [ ] Command palette (Flow 23)
- [ ] Toggle dev mode (Flow 24)
- [ ] Save settings (Flow 25)
- [ ] Delete project (Flow 26)

### State Machines (4 status flows)

- [ ] Spec status transitions
- [ ] Plan status transitions
- [ ] Task status transitions
- [ ] Session status transitions

### Conditional UI (truth tables)

- [ ] Spec Detail header button by status
- [ ] PLAN tab content by plan.status
- [ ] TASKS tab interactivity by spec.status
- [ ] Mission Control live panel by session state
- [ ] Sidebar DAEMON status by global state
- [ ] Task row appearance by status

### Mock Data (for demo)

- [ ] Seed users (3 roles)
- [ ] Seed projects (2)
- [ ] Seed specs (6, one per status)
- [ ] Seed plans (4, with spec_001 pending_approval)
- [ ] Seed tasks (todo, done, in_progress, blocked)
- [ ] Seed sessions (2, one running, one completed)
- [ ] Seed notifications (2 unread)

### Permissions (RBAC)

- [ ] Admin can approve plans
- [ ] Member can view approval button (disabled)
- [ ] Viewer cannot see approval button
- [ ] Admin can access all settings sections
- [ ] Member restrictions in settings
- [ ] Viewer read-only access

---

## Coverage Verification

All screens, elements, functions, flows, and state machines are documented across the primary specification files:

- ✅ **Screens**: 11 pages + 4 overlays (USER_INTERFACE.md)
- ✅ **Elements**: All UI components specified (USER_INTERFACE.md, DESIGN_SYSTEM.md)
- ✅ **Functions**: 26 interaction flows documented (USER_INTERFACE.md)
- ✅ **Flows**: Complete navigation and state transitions (USER_INTERFACE.md)
- ✅ **State Machines**: 4 status flows with conditional logic (USER_INTERFACE.md)

**No additional consolidation needed** - the three primary files provide complete coverage with focused purpose per file.

---

## How to Use This Index

1. **Find your task** - Use Quick Reference or Search above
2. **Read the primary file** - Follow the link to the detailed specification
3. **Check cross-references** - Review related components in other files
4. **Verify with state machine** - Check status transitions in USER_INTERFACE.md
5. **Implement & test** - Verify against the specification

**Remember**: The specification is the source of truth. When in doubt, check the specification before asking or implementing.
