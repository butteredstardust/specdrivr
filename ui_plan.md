# Spec-Drivr UI Specification

**Last Updated:** March 2026
**Scope:** Every page, panel, and component in the application. Defines layout, content, interactions, empty states, error states, and loading states. This document is the source of truth for frontend implementation and E2E test assertions.

---

## Global Layout

Every authenticated page uses the same shell:

```
┌─────────────────────────────────────────────────────┐
│ SIDEBAR (240px fixed, collapsible to 56px icon rail) │
│  Logo + "Spec-Drivr"                                 │
│  ─────────────────                                   │
│  [Project list — scrollable]                         │
│    • Project A  [● running]                          │
│    • Project B  [○ idle]                             │
│    • Project C  [⚠ stale]                            │
│  ─────────────────                                   │
│  + New Project                                       │
│  ─────────────────                                   │
│  [Bottom: user avatar, name, role badge, logout]     │
├─────────────────────────────────────────────────────┤
│ MAIN CONTENT (fills remaining width)                 │
│  [Page-specific content]                             │
└─────────────────────────────────────────────────────┘
```

**Sidebar project list item:**
- Project name (truncated at 180px with tooltip on hover)
- Agent status dot: green (running), grey (idle), amber (stale/unresponsive), red (error)
- Active project highlighted with accent background
- Clicking a project navigates to `/projects/[id]`

**User section (sidebar bottom):**
- Avatar (initial fallback if no image)
- Username
- Role badge: "admin" (purple), "developer" (blue), "viewer" (grey)
- Logout button (icon only, tooltip on hover)

**Offline banner (global, above all content):**
- Appears when `navigator.onLine = false`
- Yellow bar: "You're offline — changes won't save until connection is restored"
- Dismissible per session, but reappears if offline state recurs

**Unauthenticated shell:** No sidebar. Full-width centred layout used only for `/auth/login`.

---

## Page: Login (`/auth/login`)

**Purpose:** Credentials entry. The only page accessible without a session.

```
┌──────────────────────────────────┐
│                                  │
│         [Spec-Drivr logo]        │
│       Spec-Drivr                 │
│  Build software with AI agents   │
│                                  │
│  ┌────────────────────────────┐  │
│  │ Username                   │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ Password              [👁] │  │
│  └────────────────────────────┘  │
│                                  │
│  [      Sign in      ]           │
│                                  │
│  ⚠ Invalid username or password  │  ← inline, only on failure
│                                  │
└──────────────────────────────────┘
```

**Behaviour:**
- Submit on Enter key
- "Sign in" button shows spinner + disabled state while request is in flight
- On success: redirect to the page the user was trying to access (or `/` if direct)
- On failure: show error message inline below the form — never clear the username field, clear the password field only
- No "forgot password" link for MVP (single-user or admin-managed)
- No registration page — accounts created by admin only

---

## Page: Homepage / Dashboard (`/`)

**Purpose:** Overview of all projects the current user has access to. First page after login.

```
┌─────────────────────────────────────────────────────────┐
│ Dashboard                           [+ New Project]     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  SUMMARY ROW                                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ 4        │  │ 2        │  │ 12       │             │
│  │ Projects │  │ Agents   │  │ Tasks    │             │
│  │          │  │ Running  │  │ Done     │             │
│  └──────────┘  └──────────┘  │ Today    │             │
│                               └──────────┘             │
│                                                         │
│  ─────────────────────────────────────────────────     │
│  All Projects                [Search: ____________]     │
│  ─────────────────────────────────────────────────     │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ● Project Alpha                                  │  │
│  │   Next.js · PostgreSQL · TypeScript              │  │
│  │   ████████░░  8/10 tasks done  •  Agent running  │  │
│  │   Last activity: 2 min ago                       │  │
│  │   Active plan: Phase 2 — Auth Milestone          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ○ Project Beta                                   │  │
│  │   Python · FastAPI · Redis                       │  │
│  │   ██████████  5/5 tasks done  •  Agent idle      │  │
│  │   Last activity: 1 hour ago                      │  │
│  │   Active plan: Phase 1 — Core API                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  EMPTY STATE (no projects):                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │  [robot icon]                                    │  │
│  │  No projects yet                                 │  │
│  │  Create your first project to get started        │  │
│  │  [+ New Project]                                 │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Project card content:**
- Agent status dot (green/grey/amber/red) + project name (h3, links to `/projects/[id]`)
- Tech stack tags (up to 4 shown, "+N more" if overflow)
- Task progress bar: filled proportion = done/total; label "X/Y tasks done"; grey bar if 0 tasks
- Agent status text: "Agent running", "Agent idle", "Agent paused", "Agent unresponsive — last seen Xm ago" (amber text for stale)
- Last activity: relative timestamp ("2 min ago", "1 hour ago", "3 days ago")
- Active plan label: `plans.phase_label` of the current active plan, or "No active plan" (muted)

**Summary row:**
- "Projects" count = total accessible projects
- "Agents Running" count = projects where `agent_status = 'running'` and not stale
- "Tasks Done Today" count = tasks with `completed_at >= today 00:00 local`

**Search:**
- Client-side filter on project name and tech stack tags
- Instant (no debounce needed — list is small)

**"+ New Project" button:** Opens `CreateProjectDialog` (modal, see component specs below).

**Loading state:** Show 3 `ProjectCardSkeleton` components (shimmer placeholders matching card height).

**Viewer role:** "New Project" button hidden. Cards are still clickable.

---

## Page: Project Detail (`/projects/[id]`)

This is the primary working page. It has a persistent header and six tabs.

### Project Header (always visible)

```
┌──────────────────────────────────────────────────────────────────┐
│ < Dashboard                                                       │
│                                                                   │
│ Project Alpha                     [● Agent Running]  [▶][⏸][⏹] │
│ Next.js · PostgreSQL · TypeScript                                 │
│ /home/user/projects/alpha            Last synced: 12s ago  [↻]  │
│                                                                   │
│ [Kanban] [Spec] [Plan] [Commits] [Logs] [Settings]               │
└──────────────────────────────────────────────────────────────────┘
```

**Header elements:**
- Back breadcrumb: "< Dashboard" links to `/`
- Project name (h1)
- Agent status badge: pill with coloured dot + text. States:
  - `● Agent Running` (green)
  - `○ Agent Idle` (grey)
  - `⏸ Agent Paused` (blue)
  - `⚠ Agent Unresponsive` (amber) — tooltip: "Last heartbeat: X min ago"
  - `✕ Agent Error` (red) — tooltip shows last error from agent_logs
- Agent control buttons (developer/admin only; hidden for viewer):
  - ▶ Start (disabled when running or no active plan)
  - ⏸ Pause (disabled when idle)
  - ⏹ Stop (disabled when idle)
  - Each triggers a confirmation popover before firing
- Tech stack tags
- `base_path` shown in muted text (truncated, full path on hover tooltip)
- "Last synced: Xs ago" + manual refresh icon (triggers immediate poll of all panels)

**Tab bar:** Always visible. Active tab underlined. Tab labels show badge counts where relevant:
- **Kanban** — no badge
- **Spec** — no badge
- **Plan** — no badge
- **Commits** — badge: total commit count for this project (e.g. "Commits 24")
- **Logs** — badge: unread error/warn log count since last visit (e.g. "Logs ⚠3")
- **Settings** — no badge

---

### Tab: Kanban (`/projects/[id]` default tab)

```
┌──────────────────────────────────────────────────────────────────┐
│ [Filter: All Plans ▾]  [+ Create Task]  [⚡ Quick Task]          │
│                                                                   │
│  TODO          IN PROGRESS    PAUSED       BLOCKED               │
│  ──────────    ───────────    ──────────   ──────────            │
│  [Task card]   [Task card]    [Task card]  [Task card]           │
│  [Task card]   [Task card]                                       │
│  [Task card]                                                     │
│                                                                   │
│  DONE          SKIPPED        AD HOC                             │
│  ──────────    ───────────    ──────────                         │
│  [Task card]   [Task card]    [Task card]                        │
│  [Task card]                  [Task card]                        │
└──────────────────────────────────────────────────────────────────┘
```

**Columns:** Todo, In Progress, Paused, Blocked, Done, Skipped, Ad Hoc (quick tasks with `plan_id = NULL`)

**Plan filter dropdown:** "All Plans" shows all tasks. Selecting a plan filters to that plan's tasks only. Ad Hoc column always visible regardless of filter.

**"+ Create Task" button:** Opens `CreateTaskDialog` with plan pre-selected from current filter.

**"⚡ Quick Task" button:** Opens `CreateTaskDialog` with quick mode toggle pre-enabled.

**Task card:**
```
┌──────────────────────────────────────┐
│ P2  Implement login endpoint    [🤖] │  ← priority badge, description, agent/human icon
│     Phase 2 — Auth Milestone         │  ← plan label (muted, small)
│     ──────────────────────────       │
│     📁 src/app/api/auth/login/route  │  ← first file (truncated), +N more tooltip
│     ──────────────────────────       │
│     ✓ 2hr est.   ● Passed   🔀 3    │  ← estimate, test result badge, commit count
└──────────────────────────────────────┘
```

**Task card elements:**
- Priority badge: P1 (red), P2 (orange), P3 (yellow), P4/P5 (grey)
- Description: truncated to 2 lines
- Agent/human icon: robot icon if `created_by_user_id = null` (agent-created), user avatar if human-created
- Plan label: `phase_label` in muted small text. "Ad Hoc" for quick tasks
- First file in `files_involved`, truncated; tooltip shows full list if >1 file
- Estimate: "Xhr est." if `estimate_hours` set; hidden otherwise
- Test result badge: ✓ green "Passed", ✗ red "Failed", — grey "No results" (from latest test_result row)
- Commit count: 🔀 icon + count if task has git_commits; hidden if 0
- Paused tasks: amber "Paused" badge in top-right corner
- Blocked tasks: `dependency_task_id` shown as "Blocked by: [task description snippet]"

**Drag-and-drop:**
- Tasks draggable between columns
- Dropping into a column triggers `PATCH /api/agent/tasks/:id` with new status
- Invalid transitions (e.g. todo → done directly) rejected: card animates back to source column with a tooltip "Cannot move directly from Todo to Done"
- While drag is in flight: card shows at 60% opacity in source; destination column highlights

**Click on task card:** Opens `TaskDetailModal` (see component specs).

**Empty state per column:** Muted dashed border, text "No tasks" — not a distracting empty state since most columns will legitimately be empty.

**Loading state:** 3 `TaskCardSkeleton` components in Todo column only; other columns empty.

**Polling:** Kanban re-fetches every 15 seconds. If task set changes (hash comparison), update in place. No full re-render — use optimistic updates to keep user's scroll position.

---

### Tab: Spec (`/projects/[id]/spec`)

```
┌──────────────────────────────────────────────────────────────┐
│ Specification                    [Edit]  [Version history ▾] │
│ Version 3  •  Saved 14 min ago by @agent                     │
├─────────────────────────┬────────────────────────────────────┤
│ EDITOR (when editing)   │  PREVIEW                           │
│                         │                                    │
│ # Project Alpha         │  Project Alpha                     │
│                         │  ───────────                       │
│ ## Goal                 │  Goal                              │
│ Build an auth system... │  Build an auth system...           │
│                         │                                    │
│                         │                                    │
├─────────────────────────┴────────────────────────────────────┤
│ [Cancel]                              [Save new version]      │
└──────────────────────────────────────────────────────────────┘
```

**View mode (default):**
- Rendered markdown in full width
- "Version 3 • Saved 14 min ago by @agent" — version number, relative timestamp, creator (username or "agent")
- "Edit" button (developer/admin only) — switches to edit mode
- "Version history ▾" dropdown button — expands version history panel below

**Edit mode:**
- Split pane: markdown editor (left) + live rendered preview (right)
- Editor: `@uiw/react-md-editor` with toolbar (bold, italic, heading, code, link, list)
- "Save new version" button: active only when content has changed from current version
- "Cancel" button: reverts to view mode, no save
- Conflict: if `updated_at` mismatch on save, full-width amber banner appears:
  ```
  ⚠ Conflict detected — this spec was updated by @agent while you were editing.
  [View their changes]   [Keep mine and save anyway]   [Discard my changes]
  ```
  "View their changes" opens a diff modal (side-by-side: "Their version" vs "Your version").

**Version history panel (expandable, below spec):**
```
  Version 3  •  Mar 5, 14:22  •  @agent          +340 / -12 words  [View]
  Version 2  •  Mar 5, 11:04  •  @sarah           +89 / -5 words   [View]
  Version 1  •  Mar 4, 09:30  •  @sarah (created) —                [View]
```
Each row: version number, absolute timestamp, creator, word count delta, "View" button (opens read-only modal with rendered markdown).

**Empty state (no spec):** Centred message "No specification yet. Write one to give the agent its mission." + "Create Specification" button (opens edit mode on an empty document).

**Loading state:** Full-width `SpecSkeleton` — two heading skeletons + 4 paragraph skeletons.

---

### Tab: Plan (`/projects/[id]/plan`)

```
┌──────────────────────────────────────────────────────────────┐
│ Phase 2 — Auth Milestone                [active]  [+ New Plan]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  INTENT                                                      │
│  ─────────────────────────────────────────────────────────  │
│  "I want credentials-based auth, no OAuth for now.          │
│   httpOnly cookies, no JWT in localStorage. Keep the        │
│   login page minimal — no social login buttons."            │
│                                                              │
│  ARCHITECTURE DECISIONS                                      │
│  ─────────────────────────────────────────────────────────  │
│  Auth Library       next-auth@^5 credentials provider       │
│  Session Storage    httpOnly cookie, 7-day expiry           │
│  Password Hashing   bcrypt, 12 rounds                       │
│  Protected Routes   Next.js middleware on /projects/*       │
│  User Model         existing users table, no changes        │
│                                                              │
│  PLANS IN THIS PROJECT                                       │
│  ─────────────────────────────────────────────────────────  │
│  Phase 2 — Auth Milestone    [active]   8/10 tasks done     │
│  Phase 1 — Core API          [complete] 5/5 tasks done      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Active plan section:**
- Phase label as h2
- Status badge: active (green), draft (grey), completed (blue), archived (muted)
- "Intent" block: verbatim text from `plans.intent`; muted italic if not set ("No intent recorded — add one to guide the agent")
- "Architecture Decisions" table: key-value pairs from `plans.architecture_decisions` JSON, rendered as a clean two-column table (key left, value right). If value is a nested object, render as indented sub-rows
- "Edit Plan" button (developer/admin only) — opens `EditPlanDialog`

**"+ New Plan" button:** Opens `CreatePlanDialog` (see component specs).

**All plans list:** Collapsible section at bottom. Shows all plans for this project with phase label, status badge, and task progress "X/Y tasks done".

**Empty state (no plans):** "No plan yet. Create a plan to define the architecture before the agent starts." + "Create Plan" button.

**Loading state:** Heading skeleton + 4 row skeletons for architecture decisions table.

---

### Tab: Commits (`/projects/[id]/commits`)

```
┌──────────────────────────────────────────────────────────────┐
│ Commits  (24 total)                                          │
│ [Filter: All Plans ▾]  [Branch: all ▾]  [Date: ─────────]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Mar 5, 2026                                                 │
│  ─────────────────────────────────────────────────────────  │
│  🔀  feat(2-14): implement bcrypt password hashing           │
│      abc1234  •  main  •  14:22  •  🤖 claude-agent-1       │
│      Task: Implement password hashing  →  ✓ Passed          │
│      +45 / -3 lines  •  2 files changed                     │
│                                                              │
│  🔀  feat(2-13): add users table migration                   │
│      def5678  •  main  •  13:55  •  🤖 claude-agent-1       │
│      Task: Create database migration for auth tables  →  —  │
│      +28 / -0 lines  •  1 file changed                      │
│                                                              │
│  Mar 4, 2026                                                 │
│  ─────────────────────────────────────────────────────────  │
│  🔀  chore(1-5): update dependencies                         │
│      ghi9012  •  main  •  16:30  •  👤 sarah                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Commit row elements:**
- Commit message (full)
- SHA (first 7 chars): links to `{repo_url}/commit/{sha}` in new tab if `git_config.repo_url` is set; plain text if not
- Branch name
- Relative timestamp (absolute on hover)
- Author: robot icon + token name for agent commits, user avatar + username for human-triggered commits
- Task link: "Task: [description snippet]" → opens `TaskDetailModal` for that task. Omitted if no `task_id`
- Test result for that task: ✓ Passed, ✗ Failed, or — (no results)
- Lines added/removed + files changed (from `metadata`)

**Filters:**
- "All Plans" dropdown: filter commits by `plan_id`
- "Branch" dropdown: all distinct branches in `git_commits` for this project
- Date range: two date inputs (from / to); defaults to last 30 days

**No commits + git not configured:**
```
  [git icon]
  Git integration not configured
  Connect a repository to track commits automatically.
  [Configure Git →]    ← links to Settings tab, git section
```

**No commits + git configured:**
```
  No commits yet.
  Your agent will push commits here after completing tasks.
```

**Loading state:** 5 `CommitRowSkeleton` shimmer rows.

**Polling:** Refreshes every 20 seconds.

---

### Tab: Logs (`/projects/[id]/logs`)

```
┌──────────────────────────────────────────────────────────────┐
│ Agent Logs                              [+ Add Log Entry]    │
│ [All ▾] [Level: ☑info ☑warn ☑error ☑debug] [Task: all ▾]  │
│                                                              │
│  14:23:01  INFO    Task 14 started: implement bcrypt         │
│  14:22:58  DEBUG   Reading file: src/lib/auth.ts             │
│  14:20:12  WARN    Retrying task 13: test failed on attempt 1│
│  14:18:44  ERROR   Task 11: missing env variable JWT_SECRET  │
│  14:18:44  INFO    [internal] Human note: checked env vars — │
│                    JWT_SECRET confirmed missing from .env    │
│                                                              │
│                         [Load more (50 of 234)]              │
└──────────────────────────────────────────────────────────────┘
```

**Log row:**
- Timestamp (HH:MM:SS, absolute; date shown on hover)
- Level badge: INFO (blue), WARN (amber), ERROR (red), DEBUG (grey/muted)
- Message (full text; long messages truncated to 3 lines with "expand" inline link)
- `[internal]` prefix in muted text for `is_internal = true` rows
- Task link: if `task_id` is set, message is prefixed with "Task X:" as a clickable link to `TaskDetailModal`

**Filters:**
- Source toggle: "All" | "Agent" (is_internal=false) | "Internal" (is_internal=true)
- Level checkboxes: all checked by default; uncheck to hide levels
- Task dropdown: filter to logs for a specific task

**Unread error/warn count:** The "Logs" tab badge resets to 0 when user opens this tab. Count resumes from the timestamp of last visit.

**"+ Add Log Entry" button:** Opens `AddLogDialog` (developer/admin only; hidden for viewer).

**Pagination:** 50 logs per page. "Load more (X of Y)" button at bottom.

**Empty state:** "No agent logs yet. Logs appear here when the agent starts working."

**Loading state:** 6 `LogRowSkeleton` shimmer rows.

**Polling:** Refreshes every 10 seconds. New rows are prepended (most recent at top); no disruptive scroll jump if user is scrolled down (append silently, notify "X new logs" banner at top instead).

---

### Tab: Settings (`/projects/[id]/settings`)

```
┌──────────────────────────────────────────────────────────────┐
│ Project Settings                                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  GENERAL                                                     │
│  Name         [Project Alpha                            ]   │
│  Mission      [Build an autonomous development platform ]   │
│  Description  [textarea                                 ]   │
│  Tech Stack   [Next.js] [PostgreSQL] [TypeScript] [+ add]   │
│  Base Path    [/home/user/projects/alpha                ]   │
│  Instructions [textarea: agent-specific guidance        ]   │
│                                          [Save Changes]     │
│                                                              │
│  GIT INTEGRATION                                             │
│  ─────────────────────────────────────────────────────────  │
│  Enable git integration          [toggle: OFF]              │
│  (when ON, fields expand)                                   │
│   Provider        [GitHub ▾]                               │
│   Repository URL  [https://github.com/org/repo          ]   │
│   Default branch  [main                                 ]   │
│   Branching       (●) None  ( ) Per-phase  ( ) Per-milestone│
│   Commit template [{type}({plan_id}-{task_id}): {desc}  ]   │
│   Webhook URL     https://app.specdriver.io/api/webhooks/   │
│                   git  [Copy]                               │
│                                          [Save Git Config]  │
│                                                              │
│  AGENT TOKENS                                                │
│  ─────────────────────────────────────────────────────────  │
│  Name              Created       Last used    Model         │
│  claude-agent-1    Mar 4, 09:30  2 min ago    sonnet  [✕]  │
│  claude-agent-2    Mar 5, 11:00  never        opus    [✕]  │
│                                                             │
│  [+ Generate New Token]                                     │
│                                                             │
│  API USAGE (last 7 days)                                    │
│  ─────────────────────────────────────────────────────────  │
│  Endpoint                    Requests  Avg latency  Errors  │
│  GET /api/agent/mission          234        45ms       0    │
│  PATCH /api/agent/tasks/:id      189        62ms       2    │
│  POST /api/agent/logs            891        38ms       0    │
│  POST /api/webhooks/git          189        55ms       0    │
│                                                             │
│  DANGER ZONE                                                 │
│  ─────────────────────────────────────────────────────────  │
│  [Archive Project]  ← requires typing project name to confirm│
│                                                             │
└──────────────────────────────────────────────────────────────┘
```

**General section:**
- Inline editing for all fields
- Tech stack: tag input (add/remove individual tags)
- "Save Changes" button active only when any field has changed
- Saves via `PATCH /api/agent/projects/:id`

**Git Integration:**
- Toggle collapses/expands all git fields
- When enabled: shows webhook URL (read-only) with "Copy" button
- Webhook URL is the absolute URL the agent must configure — always shown even before repo URL is set
- Commit template: editable text with variable hint text below: "Variables: {type}, {plan_id}, {task_id}, {description}, {phase_label}"
- Branching strategy: radio buttons with one-line descriptions:
  - None — commits go to default branch directly
  - Per-phase — creates a branch per plan, merges on phase complete
  - Per-milestone — one branch across all phases, merges when milestone archived

**Agent Tokens:**
- Table: name, created date, last_used_at (relative), preferred_model, revoke button (✕)
- Revoking: confirmation popover "Revoke this token? The agent using it will immediately lose access."
- "Generate New Token" button: opens `GenerateTokenDialog`
  - Fields: name (required), preferred_model (select: haiku/sonnet/opus)
  - On submit: shows raw token once in a copy-able code block with warning "This token will not be shown again. Copy it now."
- Viewer role: tokens section hidden entirely

**API Usage table:**
- Aggregated from `api_request_logs` for this project, last 7 days
- Shows only endpoints that have been called

**Danger Zone:**
- "Archive Project" button (admin only)
- Clicking opens a confirmation dialog: "Type the project name to confirm" text input + "Archive" button (red, disabled until name matches exactly)
- Archiving sets `projects.status = 'archived'`; project disappears from sidebar and dashboard but data is preserved

---

## Page: Admin — User Management (`/admin/users`)

**Access:** Admin role only. Attempting to access as developer or viewer returns a 403 page.

```
┌──────────────────────────────────────────────────────────────┐
│ User Management                              [+ Invite User] │
├──────────────────────────────────────────────────────────────┤
│ [Search: ______________]                                     │
│                                                              │
│  Avatar  Username      Role           Last login    Actions │
│  ──────  ──────────    ──────────     ──────────    ─────── │
│  [S]     sarah         admin          2 min ago            │
│  [J]     james         developer      1 hour ago   [Edit]  │
│  [A]     anna          viewer         3 days ago   [Edit]  │
│  [?]     bot-account   developer      never        [Edit]  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Table columns:** Avatar (initial fallback), Username, Role badge, Last login (relative; "never" if null), Edit button (admin cannot edit their own role)

**Edit user (inline popover on click):**
- Change role: dropdown (admin/developer/viewer)
- Deactivate account toggle (prevents login but preserves attribution history)
- "Save" + "Cancel" buttons

**"+ Invite User" button:** Opens `InviteUserDialog`:
- Fields: username (required, unique), password (required, min 8 chars), role (required)
- On submit: creates user; shows success toast "User [username] created"
- No email invite for MVP — admin shares credentials directly

**Search:** Client-side filter on username (instant).

**Empty state:** Not reachable — every installation has at least the admin user.

**403 page (non-admin access):**
```
  You don't have permission to access this page.
  [← Go back]
```

---

## Modal / Dialog Components

### CreateProjectDialog

Triggered by: "+ New Project" button on dashboard or sidebar.

```
┌──────────────────────────────────────────────────────┐
│ Create New Project                              [✕]  │
├──────────────────────────────────────────────────────┤
│ Name *          [_________________________________]  │
│ Mission *       [One sentence purpose             ]  │
│ Description     [textarea: more detail            ]  │
│ Tech Stack      [Next.js] [+ add tag              ]  │
│ Base Path       [/absolute/path/to/codebase       ]  │
│                  ℹ If set, a codebase analysis     │
│                    task will be auto-created        │
│ Instructions    [textarea: agent guidance         ]  │
│                                                      │
│ Git Integration [toggle: OFF]                        │
│ (expands to repo URL + branch if ON)                 │
│                                                      │
│         [Cancel]       [Create Project]              │
└──────────────────────────────────────────────────────┘
```

- All fields except Name and Mission are optional
- "Create Project" shows spinner while in flight
- On success: closes dialog, navigates to `/projects/[new_id]`, shows success toast
- Inline validation: Name required (highlight on blur), Mission required

---

### CreateTaskDialog

Triggered by: "+ Create Task" or "⚡ Quick Task" buttons.

```
┌──────────────────────────────────────────────────────┐
│ Create Task                                     [✕]  │
├──────────────────────────────────────────────────────┤
│ [toggle] Quick task (no plan)                        │
│                                                      │
│ Plan *           [Phase 2 — Auth Milestone ▾]        │  ← hidden when quick mode
│ Description *    [textarea                  ]        │
│ Priority *       [● P1] [○ P2] [○ P3] [○ P4] [○ P5] │
│ Files involved   [src/app/api/auth/login.ts] [✕]    │
│                  [+ Add file]                        │
│ Depends on       [Search tasks...           ▾]       │
│ Estimate (hrs)   [___]                               │
│ Model hint       [● Sonnet] [○ Haiku] [○ Opus]       │
│                                                      │
│ Verification (optional) ▾                            │
│  Verify command  [curl ... | grep 200              ] │
│  Done criteria   [textarea: success definition     ] │
│                                                      │
│         [Cancel]           [Create Task]             │
└──────────────────────────────────────────────────────┘
```

- Quick mode toggle: when ON, Plan field disappears, task will have `plan_id = NULL`
- "Depends on" shows only tasks within the selected plan (or all project tasks in quick mode)
- "Verification" section is collapsible (closed by default to reduce visual noise)
- Inline errors below each invalid field (not toast-only)

---

### CreatePlanDialog (3-step)

**Step 1 — Intent:**
```
┌──────────────────────────────────────────────────────┐
│ Create Plan  (1 of 3 — Intent)                 [✕]  │
├──────────────────────────────────────────────────────┤
│ Phase label  [Phase 2 — Auth Milestone          ]   │
│                                                      │
│ How do you want this built?                          │
│ [textarea: describe your preferences, constraints,   │
│  and any implementation decisions you've already     │
│  made. The agent will follow this guidance.]         │
│                                                      │
│  e.g. "Use httpOnly cookies, no JWT in localStorage. │
│  Keep the login page minimal."                       │
│                                                      │
│                [Skip]       [Next: Architecture →]  │
└──────────────────────────────────────────────────────┘
```

**Step 2 — Architecture:**
```
┌──────────────────────────────────────────────────────┐
│ Create Plan  (2 of 3 — Architecture)           [✕]  │
├──────────────────────────────────────────────────────┤
│ Architecture decisions                               │
│ ┌────────────────────────────────────────────────┐  │
│ │ {                                              │  │
│ │   "Auth Library": "next-auth@^5",              │  │
│ │   "Session": "httpOnly cookie, 7-day expiry"   │  │
│ │ }                                              │  │
│ └────────────────────────────────────────────────┘  │
│  ⚠ Invalid JSON — check line 3                       │  ← inline validator
│                                                      │
│  [← Back]                [Next: Review →]           │
└──────────────────────────────────────────────────────┘
```

**Step 3 — Review:**
```
┌──────────────────────────────────────────────────────┐
│ Create Plan  (3 of 3 — Review)                 [✕]  │
├──────────────────────────────────────────────────────┤
│ Phase 2 — Auth Milestone                             │
│                                                      │
│ Intent                                               │
│ "Use httpOnly cookies, no JWT in localStorage..."    │
│                                                      │
│ Architecture                                         │
│ Auth Library    next-auth@^5                         │
│ Session         httpOnly cookie, 7-day expiry        │
│                                                      │
│  [← Back]              [Create Plan]                 │
└──────────────────────────────────────────────────────┘
```

---

### TaskDetailModal

Triggered by: clicking any task card in Kanban.

```
┌──────────────────────────────────────────────────────────────┐
│ Implement bcrypt password hashing             [✕]           │
│ P2 · Phase 2 — Auth Milestone · Sonnet hint · 2hr est.      │
├──────────────────────────────────────────────────────────────┤
│ STATUS:  [in_progress ▾]    ← dropdown (developer/admin)    │
│ CREATED: Mar 5, 14:20 by 🤖 claude-agent-1                   │
│                                                              │
│ FILES INVOLVED                                               │
│ • src/lib/auth.ts                                            │
│ • src/app/api/auth/login/route.ts                            │
│                                                              │
│ DEPENDS ON                                                   │
│ • Task 13: Create database migration  [✓ Done]               │
│                                                              │
│ VERIFY COMMAND                                               │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ curl -s -o /dev/null -w '%{http_code}'               │ [⎘]│
│ │   http://localhost:3000/api/auth/login               │    │
│ │   -X POST -d '{"username":"test","password":"test"}' │    │
│ │   | grep 200                                         │    │
│ └──────────────────────────────────────────────────────┘    │
│ DONE CRITERIA                                                │
│ Valid credentials return 200 + Set-Cookie header.            │
│ Invalid credentials return 401.                              │
│                                                              │
│ RESUME CONTEXT  (visible only when status = paused)          │
│ Completed: Created schema, added bcrypt dependency           │
│ Remaining: Wire up hashing in login route handler            │
│ Files modified: package.json, src/lib/db/schema.ts           │
│                                                              │
│ TEST RESULTS                       [+ Log Test Result]       │
│ ✓ Mar 5, 14:22  Pass  "curl returned 200, cookie set"       │
│ ✗ Mar 5, 14:15  Fail  "401 returned for valid creds"        │
│                                                              │
│ COMMITS                                                      │
│ 🔀 abc1234  feat(2-14): implement bcrypt hashing  14:22     │
│                                                              │
│ AGENT LOGS (last 10)                                         │
│ 14:22  INFO   Task completed, test passed                    │
│ 14:21  DEBUG  Running verify command...                      │
│ 14:18  INFO   Writing bcrypt logic to auth.ts                │
│                                                              │
│                  [Retry Task]  [Skip Task]                   │
└──────────────────────────────────────────────────────────────┘
```

**Status dropdown:** Shows all valid transitions from current status; invalid transitions disabled with tooltip explaining why.

**Resume context block:** Only shown when `status = 'paused'` and `resume_context` is not null. Read-only.

**"+ Log Test Result":** Opens `LogTestResultDialog` pre-filled with this task_id.

**"Retry Task":** Sets status `todo`, increments `retry_count`. Confirmation popover: "Reset this task to Todo? retry_count will increment to X."

**"Skip Task":** Sets status `skipped`. Confirmation: "Skip this task? It will be excluded from future agent waves."

**Commit SHA links:** Link to external repo if `git_config.repo_url` is set.

---

### LogTestResultDialog

```
┌──────────────────────────────────────────────────┐
│ Log Test Result                             [✕]  │
├──────────────────────────────────────────────────┤
│ Task: Implement bcrypt password hashing           │
│                                                  │
│ Verify command (for reference):                  │
│ curl ... | grep 200              [Copy command]  │
│                                                  │
│ Result    [✓ Pass]   [✗ Fail]                   │
│                                                  │
│ Notes     [textarea: what happened, output, etc] │
│                                                  │
│         [Cancel]     [Save Result]               │
└──────────────────────────────────────────────────┘
```

---

### AddLogDialog

```
┌──────────────────────────────────────────────────┐
│ Add Log Entry                               [✕]  │
├──────────────────────────────────────────────────┤
│ Level    [● INFO] [○ WARN] [○ ERROR] [○ DEBUG]  │
│ Task     [Search tasks...                    ▾]  │
│ Message  [textarea *                          ]  │
│ Context  [JSON textarea (optional)            ]  │
│           ⚠ Invalid JSON                         │  ← inline if invalid
│                                                  │
│         [Cancel]        [Add Entry]              │
└──────────────────────────────────────────────────┘
```

---

### GenerateTokenDialog

```
┌──────────────────────────────────────────────────┐
│ Generate Agent Token                        [✕]  │
├──────────────────────────────────────────────────┤
│ Name *         [claude-agent-3              ]    │
│ Model hint     [● Sonnet] [○ Haiku] [○ Opus]    │
│                                                  │
│         [Cancel]     [Generate Token]            │
├──────────────────────────────────────────────────┤
│ (after generation)                               │
│ ⚠ Copy this token — it will not be shown again  │
│ ┌────────────────────────────────────────────┐  │
│ │ sk-spec-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   │  │
│ └────────────────────────────────────────────┘  │
│                       [Copy]      [Done]         │
└──────────────────────────────────────────────────┘
```

---

## Empty States Summary

| Context                                 | Message                                                                           | Action               |
| --------------------------------------- | --------------------------------------------------------------------------------- | -------------------- |
| Dashboard, no projects                  | "No projects yet. Create your first project to get started."                      | + New Project        |
| Kanban, no tasks in column              | "No tasks" (muted, dashed border)                                                 | —                    |
| Kanban, no tasks at all                 | "No tasks yet. Create a task or start the agent to generate tasks automatically." | + Create Task        |
| Spec tab, no spec                       | "No specification yet. Write one to give the agent its mission."                  | Create Specification |
| Plan tab, no plans                      | "No plan yet. Create a plan to define the architecture before the agent starts."  | Create Plan          |
| Commits tab, git not configured         | "Git integration not configured. Connect a repository to track commits."          | Configure Git →      |
| Commits tab, git configured, no commits | "No commits yet. Your agent will push commits here after completing tasks."       | —                    |
| Logs tab, no logs                       | "No agent logs yet. Logs appear here when the agent starts working."              | —                    |
| Admin users, no users                   | Not reachable (always at least 1 admin)                                           | —                    |

---

## Error States Summary

| Trigger                                  | Treatment                                                                                                                    |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Server action fails (e.g. create task)   | Inline error below form field if field-specific; toast if general                                                            |
| API returns 409 conflict (spec edit)     | Full-width amber banner with diff view and resolution choices                                                                |
| API returns 429 rate limited             | Toast: "Too many requests — try again in Xs"                                                                                 |
| API returns 500                          | Toast: "Something went wrong. If this persists, check the logs." + error logged to console                                   |
| Invalid state transition (drag-and-drop) | Card animates back to source; tooltip explains the invalid transition                                                        |
| Session expired mid-session              | Sticky banner: "Your session has expired. [Sign in again]" — does not hard-redirect (preserves unsaved draft in spec editor) |
| Agent token revoked mid-session (agent)  | Agent's next API call gets 401; Spec-Drivr UI shows agent status as error                                                    |

---

## Route Map

| Route                     | Page                          | Auth required | Min role  |
| ------------------------- | ----------------------------- | ------------- | --------- |
| `/auth/login`             | Login                         | No            | —         |
| `/`                       | Dashboard                     | Yes           | viewer    |
| `/projects/[id]`          | Project Detail (Kanban tab)   | Yes           | viewer    |
| `/projects/[id]/spec`     | Project Detail (Spec tab)     | Yes           | viewer    |
| `/projects/[id]/plan`     | Project Detail (Plan tab)     | Yes           | viewer    |
| `/projects/[id]/commits`  | Project Detail (Commits tab)  | Yes           | viewer    |
| `/projects/[id]/logs`     | Project Detail (Logs tab)     | Yes           | viewer    |
| `/projects/[id]/settings` | Project Detail (Settings tab) | Yes           | developer |
| `/admin/users`            | User Management               | Yes           | admin     |
| `/api/agent/*`            | Agent API endpoints           | Token         | —         |
| `/api/webhooks/git`       | Git webhook receiver          | Token         | —         |