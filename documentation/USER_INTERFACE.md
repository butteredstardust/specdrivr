**SPECDRIVR**

Master Product Specification - User Interface

Version 1.0 · Confidential

Spec-driven autonomous code execution for engineering teams

---

## Table of Contents

**Part 1 — Screen Inventory & Navigation**
- 1.1 App Shell
- 1.2 P1 - Mission Control
- 1.3 P2 - Projects
- 1.4 P3 - Specifications
- 1.5 P4 - Spec Editor
- 1.6 P5 - Specification Detail
- 1.7 P5-OVERLAY - Task Drawer
- 1.8 P6 - Sessions
- 1.9 P7 - Settings
- 1.10 P8 - 404 / Error
- 1.11 Global Overlays
- 1.12 Complete Navigation Flow Diagram
- 1.13 Default Tab States
- 1.14 Shared Component Inventory

**Part 2 — Interaction Flows**
- 2.1 FLOW 1: Create a New Project
- 2.2 FLOW 2: Switch Active Project
- 2.3 FLOW 3: Create a New Specification
- 2.4 FLOW 4: Save Spec and Generate Plan
- 2.5 FLOW 5: Approve Plan and Start Execution ⭐
- 2.6 FLOW 6: Pause a Running Session
- 2.7 FLOW 7: Resume a Paused Session
- 2.8 FLOW 8: Cancel a Running Session
- 2.9 FLOW 9: Unblock a Task
- 2.10 FLOW 10: Manually Mark a Task Done
- 2.11 FLOW 11: Manually Mark a Task Blocked
- 2.12 FLOW 12: Re-run a Task
- 2.13 FLOW 13: Edit an Existing Spec
- 2.14 FLOW 14: View a Previous Spec Version
- 2.15 FLOW 15: Inline Task Row Expand / Collapse
- 2.16 FLOW 16: Open Task Drawer
- 2.17 FLOW 17: Approve Plan (from header button shortcut)
- 2.18 FLOW 18: Abandon a Plan
- 2.19 FLOW 19: Generate Plan (from empty PLAN tab)
- 2.20 FLOW 20: View File Diff
- 2.21 FLOW 21: Submit Context to Unblock via Mission Control
- 2.22 FLOW 22: Session Row Expand (Sessions Page)
- 2.23 FLOW 23: Command Palette Actions
- 2.24 FLOW 24: Toggle Dev Mode
- 2.25 FLOW 25: Settings: Save Agent Configuration
- 2.26 FLOW 26: Danger Zone: Delete Project

**Part 3 — State Machines & Conditional UI**
- 3.1 Spec Status Machine
- 3.2 Plan Status Machine
- 3.3 Task Status Machine
- 3.4 Session Status Machine
- 3.5 Required Mock / Seed Data
- 3.6 Conditional Rendering Truth Tables
- 3.7 Plan Review Panel DOM Structure
- 3.8 Anti-Patterns to Avoid
- 3.9 Simulated Async Flows in Mock Mode
- 3.10 First Load State Checklist
- 3.11 Role-Switching Test

---

# Part 1 — Screen Inventory & Navigation

## 1.1 App Shell

The app shell wraps every screen. It is never unmounted during navigation.

**Left sidebar (240px)**:
- Logo: DAEMON sprite (24px) + "SPECDRIVR" wordmark
- Below logo: Project switcher dropdown (shows current project as `org/repo`)
- Nav links (in order): Mission Control · Specifications · Sessions · Settings
- Bottom of sidebar: DAEMON status bar (16px sprite + status text) · version tag

**Top bar** (per page):
- Page title + breadcrumb (nested pages only)
- Contextual action buttons (right-aligned, change per page)

---

## 1.2 P1 — Mission Control

**Route**: `/`
**Nav link**: "Mission Control" in sidebar

**Contents**:
- Needs Attention banner (amber, conditional — only if blocked tasks exist)
  - Blocked task pills → click any pill → opens **Task Drawer** (overlay, stays on this page)
- Live Execution panel (left 60%)
  - If session running: session ID, elapsed timer, progress bar, current task line, xterm.js log tail, `[PAUSE]` + `[CANCEL]` buttons
  - If idle: DAEMON idle state + link to Specifications
- Event Log feed (right 40%): last 30 agent events, mono rows
  - `View all →` link → navigates to **P6 Sessions**

**Navigation out**:
| Trigger | Destination |
|---|---|
| Sidebar "Specifications" | P3 Specifications |
| Sidebar "Sessions" | P6 Sessions |
| Sidebar "Settings" | P7 Settings |
| "No active session" link | P3 Specifications |
| `View all →` in event log | P6 Sessions |
| Blocked task pill click | Task Drawer (overlay on P1) |
| Session ID link (if running) | P5 Spec Detail → ACTIVITY tab |

---

## 1.3 P2 — Projects

**Route**: `/projects`
**Nav link**: none — accessed via project switcher dropdown in sidebar, or initial onboarding

**Contents**:
- Full-width table: ID · Name · Repository · Branch · Specs count · Last Run · Status · ⋯ menu
- `+ New Project` button (top bar) → opens **New Project Dialog** (overlay, stays on P2)
- Empty state: DAEMON idle + CTA

**Navigation out**:
| Trigger | Destination |
|---|---|
| Row click | Sets active project → navigates to P3 Specifications |
| ⋯ → Settings | P7 Settings (Project section) |
| Project switcher dropdown (sidebar) | Opens P2, or switches active project |

---

## 1.4 P3 — Specifications

**Route**: `/specs`
**Nav link**: "Specifications" in sidebar

**Contents**:
- Full-width table: ID · Name · Status · Version · Tasks progress (ASCII bar) · Plan badge · Last Run · ⋯ menu
- `+ New Spec` button (top bar) → navigates to **P4 Spec Editor (new)**
- Empty state: DAEMON idle + CTA

**Navigation out**:
| Trigger | Destination |
|---|---|
| Row click | P5 Spec Detail |
| `+ New Spec` button | P4 Spec Editor (new) |
| ⋯ → Edit | P4 Spec Editor (edit) |
| ⋯ → Delete | Confirmation Dialog → stays on P3 |

---

## 1.5 P4 — Spec Editor

**Route**: `/specs/new` (create) · `/specs/[id]/edit` (edit)
**Entry**: `+ New Spec` button on P3, or ⋯ → Edit on P3/P5

**Contents**:
- Full-page editor. Shell sidebar hidden. Top bar only.
- Top bar: back arrow · spec name · `Save Draft` · `Save & Generate Plan`
- Two-pane split: CodeMirror 6 markdown editor (left) · live preview (right)
- If editing a spec with an active plan: amber warning banner (sticky)
- Footer strip: word count · line count · version indicator

**Navigation out**:
| Trigger | Destination |
|---|---|
| Back arrow | P3 Specifications (or P5 if editing from spec detail) |
| `Save Draft` | Saves → navigates to **P5 Spec Detail** (SPEC tab) |
| `Save & Generate Plan` | Saves + triggers plan generation → navigates to **P5 Spec Detail** (PLAN tab) |
| Escape | Back (same as back arrow) |

---

## 1.6 P5 — Specification Detail [Status: Verified Specification / Implementation Pending]

**Route**: `/specs/[id]`
**Entry**: Row click from P3, or redirect after save from P4

**Contents**:
- Header: SPEC ID badge · spec name · status indicator · plan status badge · contextual action button · ⋯ menu
- Contextual action button changes by spec status:
  - `drafting` / `stalled` → `Generate Plan →` (primary)
  - `pending_approval` → `Review Plan →` (amber) → scrolls to PLAN tab
  - `executing` → `▶ SES-0091` (violet link) + `[PAUSE]`
  - `complete` → `Re-run` + `Edit`
- Five tabs: `SPEC` · `PLAN` · `TASKS` · `CHANGES` · `ACTIVITY`

**SPEC tab contents**:
- Rendered markdown of current spec version
- Version history strip (v1 → v2 → v3 pills) — click pill → shows that version's content inline

**PLAN tab contents**:
- Empty state if no plan (DAEMON idle + Generate Plan button)
- If pending approval: amber banner + Architecture Decisions accordion + task list preview + `[ABANDON]` + `[APPROVE & EXECUTE]` button
  - `[APPROVE & EXECUTE]` → opens Approval Confirmation Dialog (overlay) → on confirm: starts session, updates status to `executing`
- If approved/executing/complete: same content read-only + approval timestamp

**TASKS tab contents**:
- Filter pills (ALL / TODO / RUNNING / BLOCKED / DONE / FAILED) + search
- Summary count strip
- Dependency-ordered task list
- Click row → inline expand (description, deps, last log line, `Open Detail →` link)
- `Open Detail →` or ⋯ → View Full Detail → opens **Task Drawer** (overlay on P5)
- Blocked rows show `blockedReason` inline + red left border

**CHANGES tab contents**:
- File tree (left 200px) + Shiki diff viewer (right)
- Click file in tree → shows that file's diff on right
- Each file shows which task wrote it → click task ID → opens **Task Drawer**

**ACTIVITY tab contents**:
- Agent event log scoped to this spec, grouped by session
- Session header is collapsible
- Each session header links to P6 Sessions (filtered to that session)

**Navigation out**:
| Trigger | Destination |
|---|---|
| Breadcrumb "Specifications" | P3 Specifications |
| `Edit` button / ⋯ → Edit | P4 Spec Editor (edit) |
| `▶ SES-0091` link | P6 Sessions (filtered to that session) |
| Task ID in CHANGES tab | Task Drawer (overlay) |
| `Open Detail →` in TASKS tab | Task Drawer (overlay) |
| Session link in ACTIVITY tab | P6 Sessions |
| `Generate Plan →` | Triggers plan gen, stays on P5, switches to PLAN tab |

---

## 1.7 P5-OVERLAY — Task Drawer

**Route**: no route change — overlay on whatever page is behind it
**Component**: Vaul Drawer (right side, 640px wide on desktop)
**Entry**: `Open Detail →` link in task row · ⋯ → View Full Detail · blocked task pill in Mission Control banner

**Contents**:
- Header: task ID (mono amber) · title · status badge (editable dropdown) · DAEMON sprite (expression matches task status)
- Three tabs: `OVERVIEW` · `ATTEMPTS` · `CHANGES`

**OVERVIEW tab**:
- Task description (markdown rendered)
- Dependencies: linked pills — click pill → closes current drawer, opens that task's drawer (stays on same page)
- Architecture decisions that reference this task
- If blocked: red panel + DAEMON blocked + reason text + textarea + `[RETRY WITH CONTEXT]` button
- If failed: orange panel + error + `[RETRY]` button

**ATTEMPTS tab**:
- List of attempts newest-first (collapsible rows)
- Each expanded attempt: xterm.js terminal panel with ANSI log, scanline overlay

**CHANGES tab**:
- Shiki diff viewer for this task's file changes
- Empty state (DAEMON idle) if no changes yet

**Footer actions** (context-sensitive):
- `[RE-RUN]` · `[MARK BLOCKED]` · `[MARK DONE]`

**Navigation out**:
| Trigger | Destination |
|---|---|
| Escape / close button | Closes drawer, returns to page behind it |
| Dependency pill click | Closes drawer → opens that task's drawer (same page) |
| Task ID in CHANGES linked task | Closes drawer → opens that task's drawer |

---

## 1.8 P6 — Sessions [Status: Verified Specification / Implementation Pending]

**Route**: `/sessions`
**Nav link**: "Sessions" in sidebar

**Contents**:
- Filter bar: search · status filter · spec dropdown · date range
- Timeline list grouped by date (TODAY / YESTERDAY / THIS WEEK)
- Each session row: status dot · session ID · spec name (linked) · time range · task count · ⋯
- Click row → inline expand: per-task event log + live xterm.js tail (if running)
- ⋯ → Cancel Session (if running) → confirmation Dialog

**Navigation out**:
| Trigger | Destination |
|---|---|
| Spec name link in row | P5 Spec Detail (ACTIVITY tab) |
| Sidebar links | Any top-level page |

---

## 1.9 P7 — Settings [Status: Verified Specification / Implementation Pending]

**Route**: `/settings`
**Nav link**: "Settings" in sidebar

**Contents**:
- Left sub-nav within page: `Project` · `Agent` · `Danger Zone`
- **Project section**: name · repo URL · branch · description · `Save Changes`
- **Agent section**: sliders + toggles for concurrent tasks, timeout, retries, approval gate, auto-plan
- **Danger Zone section**: destructive actions with confirmation dialogs

**Navigation out**:
| Trigger | Destination |
|---|---|
| Sidebar links | Any top-level page |
| `Delete Project` confirmed | P2 Projects |

---

## 1.10 P8 — 404 / Error

**Route**: any unmatched route
**Contents**: DAEMON error expression (large) + `"404: Page not found."` + `"Go to Mission Control"` link

---

## 1.11 Global Overlays

| Overlay | Trigger | Dismissal |
|---|---|---|
| **Task Drawer** | `Open Detail →` / blocked pill click | Escape · close button |
| **New Project Dialog** | `+ New Project` button on P2 | Escape · Cancel |
| **Approve & Execute Dialog** | `[APPROVE & EXECUTE]` on PLAN tab | Escape · `[CANCEL]` |
| **Danger Zone Confirm Dialog** | Any danger zone action | Escape · `[CANCEL]` |
| **Command Palette** | `Cmd+K` from anywhere | Escape · click outside |
| **Keyboard Shortcut Help** | `?` from anywhere | Escape |
| **Approval Gate Disable Dialog** | Toggling off approval in Settings | Escape · `[CANCEL]` |

---

## 1.12 Complete Navigation Flow Diagram

```
[Sidebar: Mission Control] ──────────────────────────────► P1 Mission Control
                                                              │
                                                              ├─ View all → ──────────────► P6 Sessions
                                                              └─ Blocked pill → ──────────► Task Drawer (overlay)

[Sidebar: Specifications] ────────────────────────────────► P3 Specifications
                                                              │
                                                              ├─ Row click ──────────────► P5 Spec Detail
                                                              │                               │
                                                              │                               ├─ Edit ──────────► P4 Spec Editor
                                                              │                               ├─ Generate Plan ─► (stays, PLAN tab)
                                                              │                               ├─ Approve ───────► (dialog → executing)
                                                              │                               ├─ Task row ──────► Task Drawer (overlay)
                                                              │                               ├─ Session link ──► P6 Sessions
                                                              │                               └─ Breadcrumb ────► P3 Specifications
                                                              │
                                                              └─ + New Spec ─────────────► P4 Spec Editor (new)
                                                                                              │
                                                                                              ├─ Save Draft ────► P5 Spec Detail (SPEC tab)
                                                                                              └─ Save & Plan ───► P5 Spec Detail (PLAN tab)

[Sidebar: Sessions] ─────────────────────────────────────► P6 Sessions
                                                              └─ Spec name link ─────────► P5 Spec Detail (ACTIVITY tab)

[Sidebar: Settings] ─────────────────────────────────────► P7 Settings
                                                              └─ Delete Project ─────────► P2 Projects

[Project Switcher (sidebar)] ─────────────────────────────► P2 Projects

[Cmd+K anywhere] ─────────────────────────────────────────► Command Palette (overlay)
                                                              └─ Any nav item ───────────► Respective page

[Task Drawer — dep pill] ─────────────────────────────────► Closes → opens dep task's Drawer (same page)
```

---

## 1.13 Default Tab States

When navigating to P5 Spec Detail, which tab is active depends on how you arrived:

| Entry trigger | Default tab |
|---|---|
| Row click from P3 | SPEC |
| `Save Draft` from P4 | SPEC |
| `Save & Generate Plan` from P4 | PLAN |
| `Review Plan →` button | PLAN |
| `▶ SES-xxxx` link | ACTIVITY |
| Direct URL `/specs/[id]` | SPEC |
| `/specs/[id]?tab=plan` | PLAN |
| `/specs/[id]?tab=tasks` | TASKS |

All tabs are deep-linkable via `?tab=` query param.

---

## 1.14 Shared Component Inventory

These components appear across multiple pages and must be consistent:

| Component | Used on |
|---|---|
| DAEMON sprite (all expressions) | Sidebar, all empty states, all toasts, Task Drawer header, all dialogs |
| Task row (collapsed + expanded) | P5 TASKS tab, P1 Mission Control blocked pills |
| Event log row (mono, color-coded) | P1 Event feed, P5 ACTIVITY tab, P6 Sessions expanded |
| xterm.js terminal panel | P1 live log, P5-OVERLAY ATTEMPTS tab, P6 inline expand |
| Shiki diff viewer | P5 CHANGES tab, P5-OVERLAY CHANGES tab |
| ASCII progress bar (`▓▒`) | P3 Specifications table, P5 header summary |
| Session row | P6 Sessions, P1 (compact version) |
| Status indicator (retro char) | All task rows, all spec rows, all session rows |
| Amber ID badge (mono) | All task IDs (T-042), spec IDs (SPEC-003), session IDs (SES-0091) |

---

# Part 2 — Interaction Flows

Every click, what happens on screen, and what data changes. Use this to make all interactive elements functional.

Each flow follows this structure:
- **Trigger**: the exact element the user clicks
- **Immediate UI**: what happens on screen within 0–100ms (before any server response)
- **Data operation**: what is written/read from the backend
- **Success UI**: what the screen looks like after success
- **Error UI**: what the screen looks like if the operation fails

All mutations use **Server Actions**. All loading states use **skeleton rows or button spinners**, never full-page spinners.

---

## 2.1 FLOW 1 — Create a New Project

**Trigger**: `+ New Project` button on `/projects`

**Immediate UI**:
- New Project Dialog opens (shadcn Dialog, centered modal)
- Fields: Project Name (text, required) · Repository URL (text, required, placeholder `https://github.com/org/repo`) · Branch (text, default `main`) · Description (textarea, optional)
- `[Initialize Project]` button is disabled until Name + Repository URL are non-empty

**On `[Initialize Project]` click**:
- Button shows spinner + label changes to `Initializing...`
- All form fields disabled

**Data operation**:
```ts
// INSERT into projects
{ name, repositoryUrl, repositoryBranch: branch, description, status: 'active' }
// Returns: new project with generated ID (PROJ-001)
```

**Success UI**:
- Dialog closes
- New project row appears at top of projects table (optimistic insert — row fades in)
- Project switcher in sidebar updates to show new project as active (`org/repo-name`)
- Sonner toast (bottom-right): DAEMON success sprite (16px) + `"Project initialized."`

**Error UI**:
- Button returns to `[Initialize Project]`, enabled
- Inline error below Repository URL field: `"Could not reach repository. Check the URL."`
- Fields remain filled — user does not lose their input

---

## 2.2 FLOW 2 — Switch Active Project

**Trigger**: Project switcher dropdown in sidebar

**Immediate UI**:
- Dropdown opens (shadcn DropdownMenu)
- Shows list of all projects (max 10, scrollable) with current project marked with checkmark

**On project selection**:
- Dropdown closes
- `[Switching...]` appears in sidebar status bar (with spinner)

**Data operation**:
```ts
// UPDATE activeProjectId in user's session
// No other data changes — just sets the active project in the session cookie
// All subsequent queries filter on activeProjectId
```

**Success UI**:
- Entire page reloads (Next.js router refresh) with new project's data
- All tables and pages now show data scoped to newly selected project
- Sidebar status bar returns to showing DAEMON expression (not loading text)
- No toast — action is lightweight

**Error UI**:
- Inline error banner (amber) at top of page: `"Could not switch project. Try again."`
- Sidebar status bar returns to normal
- Project dropdown reopens showing previous project still selected

---

## 2.3 FLOW 3 — Create a New Specification

**Trigger**: `+ New Spec` button on `/specs`

**Immediate UI**:
- Navigates immediately to `/specs/new` — no loading spinner
- Full-page editor loads (P4)
- Spec Editor starts with empty name field + default markdown template:
  ```markdown
  # Specification

  **Goal**: (what you want DAEMON to build)

  **Requirements**:
  - requirement 1
  - requirement 2
  - ...
  ```

**Data operation**: None — no data is written yet. The spec is front-end-only until the user explicitly saves.

**Success UI**:
- Clean P4 with empty state fields and template content
- Cursor blinks in Markdown editor (upper-left of left pane)

**Error UI**: None — this is a pure navigation; no failure case (except network disconnect, handled by browser offline UI)

---

## 2.4 FLOW 4 — Save Spec and Generate Plan

**Trigger**: `[Save & Generate Plan]` button on `/specs/new` or `/specs/[id]/edit`

**Immediate UI**:
- While typing/editing: Button shows count of unsaved changes (e.g., "[3 changes]")
- On click: Button shows spinner + label changes to `Saving...`
- Both editor and preview panes become disabled (gray overlay, no pointer events)
- Plan generation is async — progress shown in new banner that appears

**Data operation**:
```ts
// STEP 1: Save spec
INSERT INTO spec_versions (specId, markdownContent, versionNumber)
// Or UPDATE currentVersion

// STEP 2: Generate plan (async operation — starts immediately)
POST /api/plan/generate
// Body: { specId: 'spec_001', specVersionId: 'sv_123' }
// This is a long-running op (15–60 seconds). Returns: { planId, status: 'generating' }
```

**Success UI**:
- Plan appears in PLAN tab of P5 (Spec Detail)
- SPEC tab stays as-is
- TASKS tab populates with generated tasks (dependency-ordered)
- CHANGES tab empty (no files yet)
- Banner appears on PLAN tab: `"Plan generated successfully."` + DAEMON success sprite

**Error UI**:
- Button returns to `[Save & Generate Plan]` (enabled)
- Editor and preview re-enabled
- Toast (error): DAEMON error sprite + `"Plan generation failed. Check the logs."`
- Log panel auto-expands showing error from DAEMON's attempt

---

## 2.5 FLOW 5 — Approve Plan and Start Execution ⭐ (the main flow)

**Trigger**: `[APPROVE & EXECUTE]` button on P5 Spec Detail → PLAN tab (only when `plan.status === 'pending_approval'`)

**Immediate UI**:
- Button shows spinner + label changes to `Confirming...`
- Approval gate Dialog opens (same time as button spinner):
  - Header: DAEMON working (32px) + `"Approve and Execute Plan"`
  - Body: `"Plan with 22 tasks will be executed on main branch of butteredstardust/specdrivr. All tasks will run autonomously. Tasks can pause, retry, and wait for your input if blocked. "`
  - Buttons: `[CANCEL]` (muted outline) · `[CONFIRM EXECUTION]` (violet)

**On `[CONFIRM EXECUTION]` click in Dialog**:
- Dialog button shows spinner
- Dialog stays open (no instant dismissal)

**Data operation**:
```ts
// STEP 1: Approve plan
UPDATE plans SET status = 'approved', approvedAt = NOW(), approvedBy = userId
INSERT INTO plan_reviews (planId, userId, action = 'approved', notes = null)

// STEP 2: Start session
INSERT INTO agent_sessions (specId, planId, status = 'running', startedBy = userId)
// Returns: ses_001

// STEP 3: Update spec status
UPDATE specs SET status = 'executing' WHERE id = specId

// STEP 4: Insert tasks (already generated in plan)
INSERT INTO tasks (planId, specId, title, description, executionOrder, dependencyIds)
```

**Success UI**:
- Dialog closes
- P5 page refreshes (router.refresh())
- PLAN tab now shows: `"Plan approved by Alex Rivera on Jan 12"` (read-only)
- TASKS tab populates with all tasks (status = `todo`)
- AGENT SESSION BEGINS: Mission Control (P1) live panel appears
- Sidebar DAEMON status updates: `DAEMON · SES-0091 (running)` (animated working sprite)
- Toast: DAEMON success + `"Execution started. 22 tasks queued."`

**Error UI**:
- Dialog button returns to `[CONFIRM EXECUTION]` (enabled)
- Dialog stays open
- Toast: error + `"Could not start execution. Check logs."`
- If the error is transient, user can click `[CONFIRM EXECUTION]` again — idempotent.

---

## 2.6 FLOW 6 — Pause a Running Session

**Trigger**: `[PAUSE]` button (appears on P5 when session running, also in sidebar if session running)

**Immediate UI**:
- Button label changes to `PAUSING...`
- Button disabled
- Sidebar DAEMON status: `"DAEMON · PAUSING..."` (spinner)

**Data operation**:
```ts
// Update session
UPDATE agent_sessions SET status = 'paused', lastHeartbeatAt = NOW()

// Log event
INSERT INTO agent_events (sessionId, eventType = 'SESSION_PAUSED')
```

**Success UI**:
- Button changes to `[RESUME]` (purple outline → primary)
- Sidebar DAEMON status: `DAEMON · PAUSED` (neutral, not animating)
- P5 TASKS tab: current running task shows `"Paused"` inline
- P6 Sessions: session row now shows paused state
- Toast: amber + `"Session paused."` (not error, but state change)

**Error UI**:
- Button returns to `[PAUSE]` (enabled)
- Toast: error + `"Could not pause session."`

---

## 2.7 FLOW 7 — Resume a Paused Session

**Trigger**: `[RESUME]` button (replaces PAUSE when session paused)

**Immediate UI**:
- Button label changes to `RESUMING...`
- Button disabled
- Sidebar DAEMON status: `"DAEMON · RESUMING..."`

**Data operation**:
```ts
UPDATE agent_sessions SET status = 'running', lastHeartbeatAt = NOW()
INSERT INTO agent_events (sessionId, eventType = 'SESSION_RESUMED')
```

**Success UI**:
- Button changes to `[PAUSE]`
- Sidebar DAEMON status: `DAEMON · SESSION-ID (running)` + animated working sprite
- P5 TASKS tab: task that was paused resumes (status = `in_progress`)
- Toast: `"Session resumed."`

**Error UI**:
- Button returns to `[RESUME]` (enabled)
- Toast: `"Could not resume session."`

---

## 2.8 FLOW 8 — Cancel a Running Session

**Trigger**: `[CANCEL]` button (on P5 when session running)

**Immediate UI**:
- Button label changes to `CANCELLING...`
- Button disabled
- Sidebar DAEMON status: `"DAEMON · CANCELLING..."`
- Warning Dialog opens: `"Cancel this execution session?"` + `"All incomplete tasks will be marked failed."` + `[Cancel]` (muted) + `[Confirm Cancel]` (red)

**On `[Confirm Cancel]` click in Dialog**:
- Dialog closes
- Session rolls back to `cancelled` state (terminal)

**Data operation**:
```ts
UPDATE agent_sessions SET status = 'cancelled', endedAt = NOW()
UPDATE specs SET status = 'stalled'

// Mark all non-done tasks as failed
UPDATE tasks SET status = 'failed' WHERE sessionId = sesId AND status NOT IN ('done', 'failed')

// Insert cancel event
INSERT INTO agent_events (sessionId, eventType = 'SESSION_CANCELLED')
```

**Success UI**:
- P1 live panel disappears → idle state shown
- P5 status updates to `stalled` or `drafting` depending on plan status
- All task rows in TASKS tab update to `failed` or `done`
- Sidebar DAEMON status: `DAEMON · READY` (idle)
- P6 Sessions row updates status to `cancelled`
- Toast: red + `"Session cancelled."`

**Error UI**:
- Dialog returns (on error)
- Toast: `"Could not cancel session."`

---

## 2.9 FLOW 9 — Unblock a Task

**Trigger**: `[RETRY WITH CONTEXT]` button on Task Drawer → OVERVIEW tab (only shown when `task.status === 'blocked'`)

**Immediate UI**:
- Submit button shows spinner
- Context textarea value cannot be edited while submitting

**Data operation**:
```ts
// Update task
UPDATE tasks SET
  status = 'in_progress',
  humanContext = userSubmittedText,
  blockedReason = null

// Log unblock event
INSERT INTO agent_events (sessionId, specId, taskId, eventType = 'TASK_UNBLOCKED')

// Trigger task re-run (backend enqueues job)
POST /api/agent/retry-task { taskId }
```

**Success UI**:
- Drawer closes
- P5 TASKS tab: task row status updates to `in_progress` (blinking ▶, violet)
- P5 TASKS tab summary strip: blocked count decreases by one
- P1 Mission Control: Needs Attention banner updates (removes this task)
- Toast: DAEMON success + `"Task unblocked."`

**Error UI**:
- Button returns to enabled state
- Context textarea stays filled (user keeps their text)
- Toast: `"Could not unblock task."`

---

## 2.10 FLOW 10 — Manually Mark a Task Done

**Trigger**: `[MARK DONE]` button in Task Drawer footer (only when `task.status !== 'done'` and `session.status !== 'running'`)

**Immediate UI**:
- Button label changes to `MARKING DONE...`
- Button disabled

**Data operation**:
```ts
UPDATE tasks SET
  status = 'done',
  completedAt = NOW(),
  forcedDone = true

INSERT INTO agent_events (sessionId, specId, taskId, eventType = 'TASK_FORCE_DONE', actorUserId)
```

**Success UI**:
- Task row in P5 TASKS tab updates to `done` (✓ emerald)
- All dependent task pills update (blockers removed)
- Toast: `"Task marked done."`

---

## 2.11 FLOW 11 — Manually Mark a Task Blocked

**Trigger**: `[MARK BLOCKED]` button in Task Drawer footer (only when `task.status !== 'blocked'`)

**Immediate UI**:
- Button label changes to `MARKING BLOCKED...`
- Button disabled

**Data operation**:
```ts
UPDATE tasks SET
  status = 'blocked',
  blockedReason = 'Manually marked blocked':

INSERT INTO agent_events (sessionId, specId, taskId, eventType = 'TASK_FORCE_BLOCKED', actorUserId)
```

**Success UI**:
- Task row updates to blocked state (⚠ amber, red left border)
- P5 blocked task count increases
- If no other blocked tasks exist, amber "Needs Attention" banner appears on P1
- Toast: amber + `"Task marked blocked."`

---

## 2.12 FLOW 12 — Re-run a Task

**Trigger**: `[RE-RUN]` button in Task Drawer footer (only when `task.status === 'failed'` or `task.status === 'done'`)

**Immediate UI**:
- If running: prompt `"Run this task again?"` + `"Original output will be preserved in attempt history."`
- Button label changes to `RE-RUNNING...`
- Button disabled

**Data operation**:
```ts
UPDATE tasks SET
  status = 'todo',
  attemptCount = attemptCount + 1

INSERT INTO task_attempts (taskId, attemptNumber, status, startedAt)

POST /api/agent/run-task { taskId } // Enqueue backend job

INSERT INTO agent_events (sessionId, specId, taskId, eventType = 'TASK_RETRIED')
```

**Success UI**:
- Drawer closes
- P5 TASKS tab: task moves back to `todo` (○), or enters `in_progress` immediately if dependencies cleared
- Toast: `"Task re-queued."`

---

## 2.13 FLOW 13 — Edit an Existing Spec

**Trigger**: `Edit` button on P5 Spec Detail, or ⋯ → Edit on P3 or P5

**Immediate UI**:
- Navigates to `/specs/[id]/edit`
- CodeMirror editor loads spec markdown content → shows in left pane
- Preview renders current version → shows in right pane
- `Save & Generate Plan` button changes to `[Update Spec]` (removes "Generate Plan" if plan already exists)
- If plan exists: amber banner appears (sticky): `"You are editing a spec with an active plan."

**On `[Update Spec]` click**:
- Button shows `Saving...`
- Creates new version: increments `versionNumber`
- Old version is preserved for history
- If existing plan was pending approval: auto-updates plan status to `changes_requested` (in-app, no Dialog)

**Success UI**:
- Navigates back to P5 (SPEC tab)
- Version pill strip updates: `v1 → v2 → v3 (current)`
- If plan was pending approval: amber banner with DAEMON blocked appears: `"Plan was based on v2. A new plan must be generated."` + `[Generate New Plan]` button appears

---

## 2.14 FLOW 14 — View a Previous Spec Version

**Trigger**: Click version pill in version history strip (on P5 SPEC tab)

**Immediate UI**:
- Spec body loads inline (skeleton placeholder → replaces content)
- No navigation → stays in P5 SPEC tab
- Version history pills update: clicked version becomes `active` (violet pill), current version remains with `(current)` label

**Data operation**:
```ts
SELECT markdownContent FROM spec_versions WHERE specId = 'spec_001' AND versionNumber = 2
```

**Success UI**:
- Spec body shows selected version's content
- Small banner above spec body: `"Viewing v2 (Jan 8)"` + button `[Back to Current Version]`

---

## 2.15 FLOW 15 — Inline Task Row Expand / Collapse

**Trigger**: Click task row in P5 TASKS tab (not `Open Detail →` link)

**Immediate UI**:
- Row expands (height animates from 36px → ~120px)
- Disclosure chevron rotates 90°
- Shows: description (first 3 lines) + dependencies + last log line + `Open Detail →` link
- All in-page — no Drawer, no navigation

**Data operation**: None (pure UI)

**Success UI**:
- Expanded state persists on re-render (store expandedTaskIds in URL query ?expand=T-042,T-043)
- Click again → collapses (chevron returns, row height 36px)

---

## 2.16 FLOW 16 — Open Task Drawer

**Trigger**: `Open Detail →` link in expanded task row, or ⋯ → View Full Detail (in any task context menu)

**Immediate UI** (desktop):
- Vaul Drawer slides in from right (640px wide)
- Backdrop darkens
- Page behind remains interactive (scrollable, dimmed)
- Task content loads: Tabs render with skeleton, then populate

**Immediate UI** (mobile):
- Drawer slides up from bottom (90% height, rounded top corner)
- Native feel: can be dismissed with gesture or tap backdrop

**Success UI**:
- Drawer fully open after 300ms spring animation
- OVERVIEW tab shows: description, dependencies, blocked/failed panels if applicable
- Footer actions render contextually based on status

**Dismissal**:
- Escape key: Drawer animates out, returns to calling page
- Click backdrop: same
- Swipe gesture (mobile): same

---

## 2.17 FLOW 17 — Approve Plan (from header button shortcut)

**Trigger**: `Review Plan →` button in P5 header (only when `spec.status === 'pending_approval'`)

**Immediate UI**:
- Button shows spinner for 150ms (feedback)
- Page smooth-scrolls to PLAN tab (Motion spring, 300ms)
- PLAN tab activates (if not already)
- Plan details are revealed (skeleton fades in)

**Success UI**:
- Same as FLOW 5 (Approve Plan) from this point forward

---

## 2.18 FLOW 18 — Abandon a Plan

**Trigger**: `[ABANDON]` button on PLAN tab (only when `plan.status === 'pending_approval'`)

**Immediate UI**:
- Button label changes to `ABANDONING...`
- Confirmation Dialog: `"Abandon this plan?"` + `"The spec will return to drafting. You can generate a new plan later."`
- `[Cancel]` (muted) vs `[Abandon Plan]` (red)

**Data operation**:
```ts
UPDATE plans SET status = 'abandoned' WHERE id = planId
UPDATE specs SET status = 'drafting' WHERE id = specId

INSERT INTO plan_reviews (planId, userId, action = 'abandoned', notes = null)
```

**Success UI**:
- Dialog closes
- P5 auto-navigates to SPEC tab
- Spec status badge updates to `drafting`
- Header contextual action: `Generate Plan →` appears
- All tasks from abandoned plan disappear from TASKS tab (empty state)
- Toast: `"Plan abandoned."`

---

## 2.19 FLOW 19 — Generate Plan (from empty PLAN tab)

**Trigger**: `[Generate Plan]` button on PLAN tab (when no plan exists yet)

**Immediate UI**:
- Button shows spinner
- PLAN tab content area shows `"Generating plan..."` (skeleton UI: 3 placeholder architecture decision rows, 5 placeholder task rows)
- No Dialog — same-page generation flow

**Data operation**: Same as FLOW 4 (Save & Generate Plan) but without spec save (spec already saved)

**Success UI**:
- Same as FLOW 4 success

---

## 2.20 FLOW 20 — View File Diff

**Trigger**: Click file row in file tree on P5 CHANGES tab

**Immediate UI**:
- File path header highlights (violet background)
- Diff viewer updates (skeleton → rendered diff)
- Side-by-side (unified) diff, Shiki syntax highlighting
- Line numbers, green/red line highlights

**Success UI**:
- Full diff rendered (takes 200–500ms for large files)
- Hover over line → shows copy button (copies diff lines)

---

## 2.21 FLOW 21 — Submit Context to Unblock via Mission Control

**Trigger**: Click blocked task pill in P1 "Needs Attention" banner (amber banner)

**Immediate UI**:
- Navigates to P5 Spec Detail → TASKS tab
- Task row auto-expands inline
- 300ms later: Task Drawer opens (vaul) on that task → OVERVIEW tab
- Context textarea is auto-focused with blinking cursor

**Success UI**:
- See FLOW 9 (same from this point)

---

## 2.22 FLOW 22 — Session Row Expand (Sessions Page)

**Trigger**: Click session row on P6 Sessions

**Immediate UI**:
- Row expands (full width, 200px height)
- Shows timeline of task events (mono, color-coded brackets)
- Shows xterm.js terminal panel (if session running or completed)

**Success UI**:
- Terminal panel scrolls to end (if running)
- Click task ID in event → opens Task Drawer (overlay from P6)

---

## 2.23 FLOW 23 — Command Palette Actions

**Trigger**: `Cmd+K` → opens Command Palette (floating search + actions)

**Immediate UI**:
- Modal appears, backdrop darkens
- Search input focused at top
- Sections: Navigation, Create, Agent, Recent

**On navigation item select** (e.g., "Specifications"):
- Closes palette → navigates immediately
- No spinner (Next.js route prefetching)

**On "Approve pending plan" select** (only if plan pending approval):
- Closes palette
- Navigates to P5 Spec Detail
- Smooth scrolls to PLAN tab
- See FLOW 5 from this point

**On "New Specification" select**:
- Closes palette
- Navigates to `/specs/new` (P4)

---

## 2.24 FLOW 24 — Toggle Dev Mode

**Trigger**: `Ctrl+\`` (global, from any page)

**Immediate UI**:
- Amber `[DEV]` badge appears in sidebar (fade in)
- All hidden IDs reveal (animate opacity 0 → 100% over 200ms)
- Hover tooltip on all entity rows (shows last 200 chars of JSON)
- Top bar shows: `[DEV] Latency: 42ms` (muted, mono)

**Success UI**:
- Dev mode persists in localStorage (survives reload)
- All IDs remain visible

**Toggle off**:
- Same UI in reverse—badge disappears, IDs hide
- Tooltip no longer appears on hover

---

## 2.25 FLOW 25 — Settings: Save Agent Configuration

**Trigger**: `[Save Changes]` button in P7 Settings → Agent section

**Immediate UI**:
- Button shows `Saving...` (spinner)
- All sliders and toggles disabled

**Data operation**:
```ts
UPDATE agent_config SET
  maxConcurrentTasks = value,
  taskTimeoutSeconds = value,
  maxRetriesPerTask = value,
  requireApproval = boolean,
  autoGeneratePlan = boolean
WHERE projectId = currentProject
```

**Success UI**:
- Button reverts to `[Save Changes]`
- All inputs re-enable
- Toast: `"Settings saved."`

---

## 2.26 FLOW 26 — Danger Zone: Delete Project

**Trigger**: `[DELETE PROJECT]` button in P7 Settings → Danger Zone

**Immediate UI**:
- Confirmation Dialog opens:
  - Title: `"Delete Project"` (red)
  - Body: `"This action cannot be undone. All specs, plans, tasks, sessions, and settings will be permanently removed."`
  - Input: `"Type butteredstardust/specdrivr to confirm"` (must match slug exactly)
  - Buttons: `[Cancel]` (muted) · `[Delete Project]` (red, disabled until slug typed)

**Data operation**:
```ts
// CASCADE DELETES
DELETE FROM projects WHERE id = projectId
// → cascades to all specs, plans, tasks, sessions, events, configs
```

**Success UI**:
- Dialog closes
- Redirects to P2 Projects (shows empty state)
- Project switcher updates (project removed)
- Toast: red + `"Project deleted."`

---

# Part 3 — State Machines & Conditional UI

## 3.1 Spec Status Machine

```
                    ┌─────────────┐
                    │   drafting  │ ◄──────────────────────────────────┐
                    └──────┬──────┘                                     │
                           │ [Save & Generate Plan] clicked              │
                           ▼                                             │
                    ┌─────────────┐                                     │
                    │ pending_plan│  (plan is being generated — async)  │
                    └──────┬──────┘                                     │
                           │ plan generation succeeds                    │
                           ▼                                             │
                    ┌──────────────────┐                                │
                    │ pending_approval  │ ◄── THIS IS THE KEY STATE ──  │
                    └──────┬───────────┘     Buttons appear here        │
                           │                                             │
               ┌───────────┼──────────────┐                             │
               │           │              │                             │
        [Approve]   [Request Changes]  [Reject]                        │
               │           │              │                             │
               ▼           ▼              ▼                             │
          ┌─────────┐  ┌─────────┐  ┌─────────┐                       │
          │executing│  │ stalled │  │ stalled │                        │
          └────┬────┘  └─────────┘  └─────────┘──────────────────────►┘
               │         (edit spec to re-enter drafting)
               │ all tasks complete
               ▼
          ┌──────────┐
          │ complete │
          └──────────┘
               │ [Re-run] clicked
               ▼
          (back to pending_plan → pending_approval cycle)
```

**Critical**: `pending_approval` is NOT a transient state. A plan can sit in `pending_approval` for days while a team reviews it. The UI must be fully functional in this state — not a loading screen, not a skeleton — a complete, interactive review surface.

---

## 3.2 Plan Status Machine

```
(none)  →  pending_approval  →  approved  →  executing  →  complete
                          ↘  rejected     (terminal)
                          ↘  abandoned    (terminal — spec was edited)
                          ↘  changes_requested → (spec edited → new plan generated → back to pending_approval)
```

A plan in `pending_approval` is the ONLY state where `[APPROVE & EXECUTE]`, `[Request Changes]`, and `[Reject Plan]` buttons exist. These buttons must not appear in any other state.

---

## 3.3 Task Status Machine

```
todo  →  in_progress  →  done         (terminal ✓)
                      ↘  failed       →  todo (on retry)
                      ↘  blocked      →  in_progress (on retry with context)
```

Tasks only exist after a plan is approved. No tasks exist during `pending_approval`.

---

## 3.4 Session Status Machine

```
running  →  completed    (terminal)
         ↘  paused       →  running (on resume)
         ↘  failed       (terminal)
         ↘  cancelled    (terminal)
```

---

## 3.5 Required Mock / Seed Data

The following seed data must be present in development and demo environments. Every spec status must be represented so every UI state is testable without touching the backend.

### Projects (seed 2)

```ts
[
  {
    id: 'proj_001',
    name: 'Specdrivr Core',
    repositoryUrl: 'https://github.com/butteredstardust/specdrivr',
    repositoryBranch: 'main',
    description: 'The core Specdrivr platform and agent runtime.',
    status: 'active',
  },
  {
    id: 'proj_002',
    name: 'Marketing Site',
    repositoryUrl: 'https://github.com/butteredstardust/marketing',
    repositoryBranch: 'main',
    description: 'Public marketing website.',
    status: 'active',
  }
]
```

Active project on load: `proj_001`.

### Users (seed 3)

```ts
[
  { id: 'user_001', name: 'Alex Rivera',  email: 'alex@example.com',  role: 'admin'  },
  { id: 'user_002', name: 'Sam Okafor',   email: 'sam@example.com',   role: 'member' },
  { id: 'user_003', name: 'Jordan Chen',  email: 'jordan@example.com', role: 'viewer' },
]
```

Logged-in user on load: `user_001` (Alex Rivera, Admin). This matters because approval buttons are only enabled to Admin — seeding a non-admin as the current user would hide the buttons.

### Specifications (seed 6 — one per meaningful status)

```ts
[
  {
    id: 'spec_001',
    projectId: 'proj_001',
    name: 'Authentication & Session Management',
    status: 'pending_approval',   // ← THE PRIMARY DEMO SPEC. Plan exists, awaiting review.
    currentVersion: 2,
    planStatus: 'pending_approval',
  },
  {
    id: 'spec_002',
    projectId: 'proj_001',
    name: 'PostgreSQL Schema Migration',
    status: 'executing',          // ← Active session running right now
    currentVersion: 1,
    planStatus: 'approved',
    activeSessionId: 'ses_001',
  },
  {
    id: 'spec_003',
    projectId: 'proj_001',
    name: 'REST API Rate Limiting',
    status: 'complete',           // ← Finished. All tasks done.
    currentVersion: 1,
    planStatus: 'complete',
  },
  {
    id: 'spec_004',
    projectId: 'proj_001',
    name: 'Real-time Notification System',
    status: 'drafting',           // ← Just created, no plan yet
    currentVersion: 1,
    planStatus: null,
  },
  {
    id: 'spec_005',
    projectId: 'proj_001',
    name: 'File Upload Pipeline',
    status: 'stalled',            // ← Plan was rejected, needs rework
    currentVersion: 3,
    planStatus: 'rejected',
  },
  {
    id: 'spec_006',
    projectId: 'proj_001',
    name: 'Admin Dashboard',
    status: 'pending_plan',       // ← Plan generation in progress right now
    currentVersion: 1,
    planStatus: null,
  },
]
```

### Plans (seed 6 — match specs)

The `spec_001` plan must have status: `pending_approval` and `approvedAt: null`. This is the primary demonstration of the product's core approval flow and must NOT be pre-approved.

### Tasks (12+ tasks across specs — mix of statuses)

Task IDs use `T-###` format (not sequential). Include:
- 2 `todo` tasks in `spec_002` (session executing)
- 1 `in_progress` task in `spec_002` (T-018)
- 1 `blocked` task in `spec_002` (T-019) — this triggers the Needs Attention banner on P1
- 3 `done` tasks in `spec_002`
- 1 `failed` task in `spec_002`
- Various `done` tasks in `spec_003`

These create visual variety in the TASKS tab during `executing` state.

---

## 3.6 Conditional Rendering Truth Tables

### Spec Detail Header Button State

| (spec.status, plan.status) | Action button shown | Destination |
|---|---|---|---|
| (drafting, null) | `Generate Plan →` (primary) | (stays on P5 PLAN tab, triggers gen) |
| (stalled, rejected) | `[Re-run]` + `Edit` (both outline) | (stays on P5 PLAN tab, re-uses existing plan if any) |
| (stalled, changes_requested) | `Generate New Plan` (primary) | (stays on P5 PLAN tab, triggers gen) |
| (pending_plan, null) | Disabled `Plan generating...`(spinner) | While loading |
| (pending_approval, pending_approval) | `Review Plan →` (amber, prominent) | Scrolls to P5 PLAN tab |
| (executing, approved) | `▶ SES-0091` (violet link) + `[PAUSE]` | Link to P6, stays on P5 |
| (complete, complete) | `[Re-run]` + `Edit` (both outline) | Re-run = reuse plan, Edit =P4 |

### PLAN Tab Content by Plan Status

```
pending_approval: [Architecture Decisions] + [Task Preview List] + [ABANDON] [APPROVE & EXECUTE]
approved: [Read-only display] + [Approve timestamp] + [no buttons]
abandoned: Empty state "Plan abandoned" + DAEMON idle + CTA
rejected: Empty state "Plan rejected" + DAEMON blocked + [Generate New Plan] button in SPEC tab
changes_requested: Same as "rejected"
(loading): Skeleton 3 decision rows + 5 task rows
```

### TASKS Tab Interactivity by Spec Status

```
spec.status: drafting       → TASKS tab disabled. Skeleton or empty state only.
spec.status: pending_plan   → TASKS tab shows empty state "Plan generating, tasks will appear soon."
spec.status: pending_approval → TASKS tab read-only (no expand, no menu, no buttons)
spec.status: executing      → TASKS tab fully interactive (expand, Drawer, actions)
spec.status: complete       → TASKS tab read-only (for history)
spec.status: stalled       → Same as drafting (can't run, but can view historical tasks)
```

TASKS tab must NEVER be interactive during `pending_approval`. This is the critical UI rule that makes the review phase real.

### Sidebar DAEMON Status by Global State

```
If any session.status === 'running' && any task.status === 'blocked':
  DAEMON sprite = blocked (amber, animated)
  Text = "DAEMON · N BLOCKED"
  Click → opens P5 TASKS tab, filtered to blocked

Else If any session.status === 'running':
  DAEMON sprite = working (animated scan lines)
  Text = "DAEMON · T-(currentTaskId)"
  Every 15s lastHeartbeatAt updates → animate antenna persist

Else If any session.status === 'failed':
  DAEMON sprite = error (X_X, smoke)
  Text = "DAEMON · SESSION FAILED"
  Pulsing red badge on sidebar

Else:
  DAEMON sprite = idle (neutral face, upright antenna)
  Text = "DAEMON · READY"
```

---

## 3.7 Plan Review Panel DOM Structure

When `plan.status === 'pending_approval'`, the PLAN tab renders this exact structure:

```tsx
// PLAN tab top banner
<Banner color="amber" icon={DAEMON_idle}>
  <Text>Plan ready for review. Approve to begin execution.</Text>
</Banner>

// Architecture Decisions
<Card>
  <CardHeader>
    <Text>Architecture Decisions</Text>
    <Text muted>3 decisions affecting 8 tasks</Text>
  </CardHeader>
  <Accordion type="multiple" defaultOpen={[]}>
    {decisions.map(d => (
      <AccordionItem key={d.id}>
        <AccordionTrigger>{d.title}</AccordionTrigger>
        <AccordionContent>
          <Markdown>{d.rationale}</Markdown>
          <PillRow>
            {d.affectedTaskIds.map(tid => <TaskPill>{tid}</TaskPill>)}
          </PillRow>
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
</Card>

// Task Preview List (non-interactive)
<Card>
  <CardHeader>
    <Text>Execution Plan Preview</Text>
    <Text muted>22 tasks in dependency order</Text>
  </CardHeader>
  <List>
    {tasks.map(t => (
      <ListItem>
        <StatusIndicator status={t.status} />
        <Mono>{t.id}</Mono>
        <Text>{t.title}</Text>
        <EstimatedTime>{t.estimatedMinutes}</EstimatedTime>
      </ListItem>
    ))}
  </List>
</Card>

// Action buttons
<ButtonGroup>
  <Button variant="outline" muted>[ABANDON]</Button>
  <Button variant="primary" size="lg">[APPROVE & EXECUTE]</Button>
</ButtonGroup>
```

---

## 3.8 Anti-Patterns to Avoid

The top 10 mistakes Lovable makes and must not:

### 1. Seeding spec as already approved
**❌ WRONG**: `spec_001` has `status: 'executing'` and `plan.status: 'approved'` — approval flow is hidden.

**✅ CORRECT**: `spec_001` has `status: 'pending_approval', plan: 'pending_approval'` — approval buttons are visible and active.

### 2. Rendering `pending_approval` as loading/skeleton
**❌ WRONG**: PLAN tab shows spinner + "Loading plan..." while pending_approval.

**✅ CORRECT**: PLAN tab shows full, interactive UI with decisions, task list, and approval buttons. This is the main product demonstration state.

### 3. Putting `[Approve & Execute]` in the header
**❌ WRONG**: Header shows `[Approve]` button that triggers approval immediately.

**✅ CORRECT**: Header shows `[Review Plan →]` button that scrolls to PLAN tab. Approval only happens in PLAN tab after reviewing decisions.

### 4. Making TASKS tab interactive during `pending_approval`
**❌ WRONG**: Task rows are clickable, show menus, can be marked done during pending_approval.

**✅ CORRECT**: TASKS tab is read-only. Rows do not expand, no menus, no actions. Only view the preview list.

### 5. Showing DAEMON status without checking global state
**❌ WRONG**: DAEMON always shows `working` animation if any session exists, even if complete.

**✅ CORRECT**: DAEMON status runs the priority check: blocked > running > failed > idle.

### 6. Using optimistic UI that hides the plan approval state
**❌ WRONG**: Clicking `[Save & Generate Plan]` auto-approves and starts execution.

**✅ CORRECT**: After plan generation, spec enters `pending_approval` and stops. User must explicitly review and approve before any execution.

### 7. Not persisting expanded/collapsed state in URL
**❌ WRONG**: Refresh page → all expanded rows collapse.

**✅ CORRECT**: URL query tracks `?expand=T-042,T-043` so state survives reloads and can be shared.

### 8. Making destructive actions non-confirmable
**❌ WRONG**: `[DELETE PROJECT]` deletes immediately with single click.

**✅ CORRECT**: Must type project slug to confirm. All danger zone actions are impossible to trigger accidentally.

### 9. Not linking related entities
**❌ WRONG**: Session ID on P1 is plain text — can't click to view session.

**✅ CORRECT**: Every ID (task, spec, session) is a link that navigates to detail view, or opens drawer.

### 10. Blocking the UI on async actions
**❌ WRONG**: Plan generation spins full-page overlay, can't navigate away.

**✅ CORRECT**: Plan generation runs async — user can navigate elsewhere, check other specs, etc. Progress shows in banner when they return.

---

## 3.9 Simulated Async Flows in Mock Mode

When running in mock/demo mode (no real agent), simulate these timings:

- Plan generation: 2000ms
- Task execution (each): 800ms + random(0, 600ms)
- File change write: 300ms
- Session heartbeat: every 250ms (updates lastHeartbeatAt)

These create realistic delays so the UI doesn't feel instant (which breaks the illusion).

---

## 3.10 First Load State Checklist

On initial load (e.g., after `pnpm dev`), verify:

1. ✅ P1 Mission Control shows amber "Needs Attention" banner (from T-019 blocked)
2. ✅ P5 Spec Detail (spec_001) shows PLAN tab with `[APPROVE & EXECUTE]` button active
3. ✅ Click `[APPROVE & EXECUTE]` → Dialog → Confirm → Session starts
4. ✅ P1 live panel appears with running session + log tail
5. ✅ P5 TASKS tab shows mixed statuses (todo, in_progress, done, blocked, failed)
6. ✅ P5 CHANGES tab shows Shiki diffs (some files created/modified)
7. ✅ P6 Sessions shows running session (row pulsing, expandable)
8. ✅ Sidebar DAEMON animated (working expression, session ID)
9. ✅ `[DEV]` badge shows on Ctrl+` (not default)
10. ✅ Role dropdown (Dev Mode) shows current user as Alex (Admin)

---

## 3.11 Role-Switching Test

The Dev Mode role switcher must work end-to-end:

1. Dropdown shows: Alex (Admin), Sam (Member), Jordan (Viewer)
2. Switch to Sam → P5 approve button becomes disabled (visible but not clickable)
3. Switch to Jordan → P5 approve button disappears entirely
4. Switch back to Alex → approve button re-enables

Verify three distinct permission levels:
- **Admin**: Can approve plans, access all settings, run danger zone actions
- **Member**: Can view approval button (disabled), cannot approve
- **Viewer**: Cannot see approval button, read-only access to all pages

---

## Document Information

- Version: 1.0
- Status: Confidential
- Last Updated: 2026-03-08
- Audience: Frontend Engineers, Product Managers
- Purpose: Complete user interface specification including screens, interactions, state machines, and conditional rendering rules


## Development Gaps & Technical Debt

- **UI Components:** App shell, navigation, and core feature pages (Projects, Specs, Sessions) are currently stubbed or missing, though base `shadcn/ui` components are present.
- **Mascot Integration:** DAEMON Mascot component exists but is not wired into the global state across pages.
