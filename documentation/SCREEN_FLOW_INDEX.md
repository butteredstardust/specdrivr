# Specdrivr — Screen & Flow Documentation Index

**Version 1.0 · Complete UI/UX/Flow Specification for Frontend Development**

---

## Overview

This directory contains five comprehensive documents that specify every screen, interaction, and state transition in the Specdrivr application. These files work together to provide complete coverage for frontend development.

## Documentation Files

| File | Lines | Purpose | Audience |
|------|-------|---------|----------|
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | ~300 | Design philosophy, mascot, tech stack, theming | Designers, Frontend Engineers |
| [USER_INTERFACE.md](./USER_INTERFACE.md) | ~1,650 | Screens, navigation, interactions, state machines | Frontend Engineers |
| [PRODUCT_FEATURES.md](./PRODUCT_FEATURES.md) | ~900 | Authentication, RBAC, settings, notifications, onboarding | Product Managers, Engineers |

**Total: ~2,850 lines of detailed specification**

---

## Quick Reference: What Are You Building?

**"I need to build..."** → **Read this file**

- "...the login/auth flow" → PRODUCT_FEATURES.md (Part 1)
- "...the main dashboard screen" → USER_INTERFACE.md (Part 1 - P1 Mission Control)
- "...the specifications list page" → USER_INTERFACE.md (Part 1 - P3 Specifications)
- "...the spec editor" → USER_INTERFACE.md (Part 1 - P4 Spec Editor)
- "...how a user creates a spec and generates a plan" → USER_INTERFACE.md (Part 2 - Flows 3-4)
- "...the plan approval flow" → USER_INTERFACE.md (Part 2 - Flow 5) + USER_INTERFACE.md (Part 3)
- "...what happens when a task gets blocked" → USER_INTERFACE.md (Part 2 - Flows 9, 21)
- "...all the navigation between screens" → USER_INTERFACE.md (Part 1 - Navigation Flow Diagram)
- "...how DAEMON mascot expressions work" → DESIGN_SYSTEM.md (Part 2)
- "...the settings page structure" → PRODUCT_FEATURES.md (Part 6)
- "...role-based permissions" → PRODUCT_FEATURES.md (Part 2)
- "...task drawer component" → USER_INTERFACE.md (Part 1 - P5-OVERLAY Task Drawer)
- "...how the sidebar status bar works" → DESIGN_SYSTEM.md (Part 6)
- "...which UI components are shared" → USER_INTERFACE.md (Part 1 - Shared Component Inventory)

---

## Complete Screen Inventory

### Authentication Screens (from realworld-detail-prompt.md)

| Screen | Route | Purpose | Section Link |
|--------|-------|---------|--------------|
| AUTH-1: Login | `/login` | User authentication | [Login Page](./specdrivr-realworld-detail-prompt.md#auth-1) |
| AUTH-2: Forgot Password | `/forgot-password` | Password reset request | [Forgot Password](./specdrivr-realworld-detail-prompt.md#auth-2) |
| AUTH-3: Reset Password | `/reset-password` | Set new password | [Reset Password](./specdrivr-realworld-detail-prompt.md#auth-3) |

### Main Application Screens (from screen-map.md)

| Screen | Route | Purpose | Section Link |
|--------|-------|---------|--------------|
| P1: Mission Control | `/` | Main dashboard, live session view | [Mission Control](./specdrivr-screen-map.md#p1-mission-control) |
| P2: Projects | `/projects` | Project management, switch active project | [Projects](./specdrivr-screen-map.md#p2-projects) |
| P3: Specifications | `/specs` | List all specifications | [Specifications](./specdrivr-screen-map.md#p3-specifications) |
| P4: Spec Editor | `/specs/new`, `/specs/[id]/edit` | Create/edit specifications | [Spec Editor](./specdrivr-screen-map.md#p4-spec-editor) |
| P5: Spec Detail | `/specs/[id]` | View spec with 5 tabs (SPEC, PLAN, TASKS, CHANGES, ACTIVITY) | [Spec Detail](./specdrivr-screen-map.md#p5-specification-detail) |
| P6: Sessions | `/sessions` | Historical session browser | [Sessions](./specdrivr-screen-map.md#p6-sessions) |
| P7: Settings | `/settings` | Project and agent configuration | [Settings](./specdrivr-screen-map.md#p7-settings) |

### Overlay Components (from screen-map.md)

| Component | Trigger | Purpose | Section Link |
|-----------|---------|---------|--------------|
| P5-OVERLAY: Task Drawer | Click task row, blocked pill | Detailed task view with 3 tabs | [Task Drawer](./specdrivr-screen-map.md#p5-overlay-task-drawer) |
| New Project Dialog | `+ New Project` button | Create new project modal | [Dialog in P2](./specdrivr-screen-map.md#p2-projects) |
| Approval Dialog | `[APPROVE & EXECUTE]` button | Confirm plan execution | [Dialog in Flow 5](./specdrivr-interaction-flows.md#flow-5) |
| Command Palette | `Cmd+K` | Quick navigation/actions | [Command Palette](./specdrivr-interaction-flows.md#flow-23) |
| Danger Zone Dialogs | Various destructive actions | Confirm dangerous operations | [Various flows](./specdrivr-interaction-flows.md) |

---

## Flow Inventory (from interaction-flows.md)

### Core Product Flows

| # | Flow | Trigger | Pages Affected | Section |
|---|------|---------|----------------|---------|
| 1 | Create New Project | `+ New Project` button | P2 → P2 (with new project) | [Flow 1](./specdrivr-interaction-flows.md#flow-1) |
| 2 | Switch Active Project | Project switcher | Global (all pages reload) | [Flow 2](./specdrivr-interaction-flows.md#flow-2) |
| 3 | Create Specification | `+ New Spec` button | P3 → P4 | [Flow 3](./specdrivr-interaction-flows.md#flow-3) |
| 4 | Save & Generate Plan | `[Save & Generate Plan]` | P4 → P5 (PLAN tab) | [Flow 4](./specdrivr-interaction-flows.md#flow-4) |
| **5** | **Approve Plan & Start Execution** | `[APPROVE & EXECUTE]` | P5 → P5 + session starts | **[Flow 5](./specdrivr-interaction-flows.md#flow-5)** |
| 6 | Pause Session | `[PAUSE]` button | P5, Sidebar, P1, P6 | [Flow 6](./specdrivr-interaction-flows.md#flow-6) |
| 7 | Resume Session | `[RESUME]` button | Same as pause (reversed) | [Flow 7](./specdrivr-interaction-flows.md#flow-7) |
| 8 | Cancel Session | `[CANCEL]` button | P5, P1, P6 | [Flow 8](./specdrivr-interaction-flows.md#flow-8) |
| 9 | Unblock Task | `[RETRY WITH CONTEXT]` | Task Drawer → P5 | [Flow 9](./specdrivr-interaction-flows.md#flow-9) |

### Task Management Flows

| # | Flow | Trigger | Pages | Section |
|---|------|---------|-------|---------|
| 10 | Manually Mark Task Done | `[MARK DONE]` | Task Drawer | [Flow 10](./specdrivr-interaction-flows.md#flow-10) |
| 11 | Manually Mark Task Blocked | `[MARK BLOCKED]` | Task Drawer | [Flow 11](./specdrivr-interaction-flows.md#flow-11) |
| 12 | Re-run Task | `[RE-RUN]` | Task Drawer | [Flow 12](./specdrivr-interaction-flows.md#flow-12) |

### Spec Management Flows

| # | Flow | Trigger | Pages | Section |
|---|------|---------|-------|---------|
| 13 | Edit Existing Spec | `Edit` button | P5 → P4 → P5 | [Flow 13](./specdrivr-interaction-flows.md#flow-13) |
| 14 | View Previous Spec Version | Version pill click | P5 (SPEC tab) | [Flow 14](./specdrivr-interaction-flows.md#flow-14) |
| 15 | Inline Task Expand | Click task row | P5 (TASKS tab) | [Flow 15](./specdrivr-interaction-flows.md#flow-15) |
| 16 | Open Task Drawer | `Open Detail →` | P5 (overlay) | [Flow 16](./specdrivr-interaction-flows.md#flow-16) |
| 17 | Approve via Header | `Review Plan →` button | P5 (scrolls to PLAN) | [Flow 17](./specdrivr-interaction-flows.md#flow-17) |
| 18 | Abandon Plan | `[ABANDON]` | P5 (PLAN tab) | [Flow 18](./specdrivr-interaction-flows.md#flow-18) |
| 19 | Generate Plan | `[Generate Plan]` | P5 (PLAN tab) | [Flow 19](./specdrivr-interaction-flows.md#flow-19) |
| 20 | View File Diff | Click file row | P5 (CHANGES tab) | [Flow 20](./specdrivr-interaction-flows.md#flow-20) |

### Navigation & Utility Flows

| # | Flow | Trigger | Pages | Section |
|---|------|---------|-------|---------|
| 21 | Submit Context via Mission Control | Blocked pill click | P1 → Task Drawer | [Flow 21](./specdrivr-interaction-flows.md#flow-21) |
| 22 | Session Row Expand | Click session row | P6 (inline expand) | [Flow 22](./specdrivr-interaction-flows.md#flow-22) |
| 23 | Command Palette | `Cmd+K` | Global overlay | [Flow 23](./specdrivr-interaction-flows.md#flow-23) |
| 24 | Toggle Dev Mode | `Ctrl+`` | Global (all pages) | [Flow 24](./specdrivr-interaction-flows.md#flow-24) |
| 25 | Save Settings | `[Save Changes]` | P7 | [Flow 25](./specdrivr-interaction-flows.md#flow-25) |
| 26 | Delete Project | `[DELETE PROJECT]` | P7 → P2 | [Flow 26](./specdrivr-interaction-flows.md#flow-26) |

---

## State Machine Quick Reference

### Spec Status Flow (from state-machine-prompt.md)

```
drafting → pending_plan → pending_approval → executing → complete
                               ↓              ↓           ↑
                              stalled       stalled      │
                                            (rejected)   │
                                                         (all tasks done)
```

**Key state: `pending_approval`** - This is where the core review UI appears. See [Part 3](./specdrivr-state-machine-prompt.md#part-3-conditional-rendering-truth-tables)

### Plan Status Flow (from state-machine-prompt.md)

```
(none) → pending_approval → approved → executing → complete
           ↘ rejected       ↘ abandoned
           ↘ changes_requested
```

**Key state: `pending_approval`** - Only state with `[Approve & Execute]`, `[Reject Plan]`, `[Request Changes]` buttons

### Task Status Flow (from state-machine-prompt.md)

```
todo → in_progress → done
            ↘ failed → todo (on retry)
            ↘ blocked → in_progress (on unblock)
```

**Key state: `blocked`** - Shows red panel in Task Drawer, triggers "Needs Attention" banner

### Session Status Flow (from state-machine-prompt.md)

```
running → completed
   ↘ paused → running
   ↘ failed (terminal)
   ↘ cancelled (terminal)
```

**Global states**: Affect sidebar DAEMON status, Mission Control live panel

---

## Component Cross-Reference (from screen-map.md)

These components appear across multiple screens and must be consistent:

| Component | Used On | Behavior/States | Primary File |
|-----------|---------|-----------------|--------------|
| **DAEMON Sprite** | All: P1-P7, all overlays, all toasts | Expressions: idle, working, success, blocked, error | [lovable-prompt-v3.md](./specdrivr-lovable-prompt-v3.md) |
| **Task Row** | P5 TASKS tab, P1 blocked pills | Collapsible, status badges, expandable | [screen-map.md](./specdrivr-screen-map.md#p5-tasks-contents) |
| **Event Log Row** | P1, P5 ACTIVITY, P6 expanded | Mono font, color-coded brackets, timestamp | [screen-map.md](./specdrivr-screen-map.md#shared-component-inventory) |
| **xterm.js Terminal** | P1 live log, P5-OVERLAY, P6 | ANSI rendering, auto-scroll, copy support | [screen-map.md](./specdrivr-screen-map.md#shared-component-inventory) |
| **Shiki Diff Viewer** | P5 CHANGES, P5-OVERLAY | Syntax highlighting, line numbers, diff colors | [screen-map.md](./specdrivr-screen-map.md#shared-component-inventory) |
| **ASCII Progress Bar** | P3 table, P5 header | `▓▒░` blocks showing completion % | [screen-map.md](./specdrivr-screen-map.md#shared-component-inventory) |
| **Status Indicator** | All task/session/spec rows | Retro ASCII: `● ✓ ✗ ⚠` with colors | [state-machine-prompt.md](./specdrivr-state-machine-prompt.md) |

---

## Critical UI Logic Reference

### Conditional Rendering Truth Tables

Located in: [state-machine-prompt.md Part 3](./specdrivr-state-machine-prompt.md#part-3-conditional-rendering-truth-tables)

Key patterns:
- Spec Detail Header button changes by `(spec.status, plan.status)` pair
- PLAN tab content completely changes by `plan.status` value
- TASKS tab interactivity depends on `spec.status` (non-interactive during `pending_approval`)
- Sidebar DAEMON status uses priority system (error > blocked > working > idle)

### Mock Data Requirements

Located in: [state-machine-prompt.md Part 2](./specdrivr-state-machine-prompt.md#part-2-required-mock-seed-data)

Critical for demo:
- 3 users (Admin, Member, Viewer) - test RBAC differences
- 2 projects (active: proj_001)
- 6 specs (one per meaningful status)
- 1 plan with `status: 'pending_approval'` (spec_001) - THE PRIMARY DEMO
- 1 active session (ses_001) running task_103
- 1 blocked task (task_105) - triggers Needs Attention banner
- 2 unread notifications

### Anti-Patterns to Avoid

Located in: [state-machine-prompt.md Part 5](./specdrivr-state-machine-prompt.md#part-5-what-lovable-must-not-do-anti-patterns)

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
1. **lovable-prompt-v3.md** - Understand design philosophy and theming
2. **screen-map.md** - Check if similar screen exists, see component inventory
3. **interaction-flows.md** - Find the flow that triggers your screen
4. **state-machine-prompt.md** - Check state transitions that affect your screen

### "I need to implement a user interaction"

Read files in this order:
1. **interaction-flows.md** - Find the exact flow (check table of contents)
2. **screen-map.md** - Verify which page/component the interaction is on
3. **state-machine-prompt.md** - Check state conditions for the action buttons
4. **realworld-detail-prompt.md** - Check RBAC permissions if needed

### "I need to understand state transitions"

Read files in this order:
1. **state-machine-prompt.md** - Read Parts 1-2 for state flows and mock data
2. **state-machine-prompt.md** - Read Part 3 for conditional rendering rules
3. **interaction-flows.md** - Find the flow that causes the transition
4. **screen-map.md** - Check which screens are affected by state change

### "I need to implement RBAC"

Read files in this order:
1. **realworld-detail-prompt.md** - Part 1 (Authentication & RBAC)
2. **state-machine-prompt.md** - Part 4 (Role-switching test for demonstration)
3. **interaction-flows.md** - Find user flows and check permission requirements
4. **lovable-prompt-v3.md** - Design philosophy (trust the user, keyboard-first)

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

All screens, elements, functions, flows, and state machines are documented across the five files:
- ✅ **Screens**: 11 pages + 4 overlays (screen-map.md)
- ✅ **Elements**: All UI components specified (screen-map.md, lovable-prompt-v3.md)
- ✅ **Functions**: 26 interaction flows documented (interaction-flows.md)
- ✅ **Flows**: Complete navigation and state transitions (screen-map.md, interaction-flows.md)
- ✅ **State Machines**: 4 status flows with conditional logic (state-machine-prompt.md)

**No additional consolidation needed** - the five files provide complete coverage with focused purpose per file.

---

## How to Use This Index

1. **Find your task** - Use Quick Reference or Search above
2. **Read the primary file** - Follow the link to the detailed specification
3. **Check cross-references** - Review related components in other files
4. **Verify with state machine** - Check status transitions in state-machine-prompt.md
5. **Implement & test** - Verify against the specification

**Remember**: The specification is the source of truth. When in doubt, check the specification before asking or implementing.
