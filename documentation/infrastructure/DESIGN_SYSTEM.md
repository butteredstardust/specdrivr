**SPECDRIVR**

Master Product Specification

Version 1.0 · Confidential

_Spec-driven autonomous code execution for engineering teams_

---

[Status: GROUND TRUTH]

# **8\. Design System**

## **8.1 Design Philosophy**

The aesthetic is developer-native: precision, information density, and honest interfaces. The retro-computing accents (phosphor terminals, monospace IDs, scanline overlays) are applied surgically to agent-facing surfaces only. The base layout is clean and Linear-precise.

Simple by default, powerful on demand: default views hide complexity behind progressive disclosure. Power users unlock depth via keyboard shortcuts, not navigation changes.

## **8.2 Colour Tokens**

| **Token**             | **Hex** | **Usage**                                              |
| --------------------- | ------- | ------------------------------------------------------ |
| \--bg-base            | #0a0a0b | Page background. Never use pure black.                 |
| \--bg-surface         | #111113 | Cards, panels, sidebar, dialogs.                       |
| \--bg-elevated        | #18181b | Hover states, dropdowns, tooltips.                     |
| \--border-default     | #1e1e21 | All borders in layout chrome.                          |
| \--border-muted       | #27272a | Separator lines within surfaces.                       |
| \--text-primary       | #f4f4f5 | Primary text.                                          |
| \--text-secondary     | #a1a1aa | Secondary labels, descriptions.                        |
| \--text-muted         | #52525b | Timestamps, IDs when dev mode off, captions.           |
| \--accent-violet      | #7c5cfc | Primary action, current nav item, running sessions.    |
| \--accent-violet-dim  | #5b3fd4 | Hover state of violet elements.                        |
| \--phosphor-amber     | #ffb300 | Terminal surfaces, retro IDs, blocked state, warnings. |
| \--phosphor-amber-dim | #b45309 | Text on amber surfaces.                                |
| \--status-emerald     | #059669 | Success, done, complete states.                        |
| \--status-red         | #dc2626 | Error, failed, rejected, danger zone.                  |
| \--status-orange      | #d97706 | Failed task attempts, degraded state.                  |
| \--terminal-bg        | #0d0d0a | xterm.js container background.                         |
| \--terminal-green     | #39ff14 | Success lines in terminal output.                      |

## **8.3 Typography**

| **Usage**                               | **Font**                                | **Size**      | **Weight**                  |
| --------------------------------------- | --------------------------------------- | ------------- | --------------------------- |
| Body text                               | Inter                                   | 14px (22 DXA) | Regular 400                 |
| Labels / captions                       | Inter                                   | 12px          | 400 / 500                   |
| Monospace IDs (T-042, SES-001)          | Berkeley Mono / Fira Code / Courier New | 12px          | 400                         |
| Terminal output                         | Berkeley Mono / Fira Code / Courier New | 13px          | 400                         |
| Retro uppercase labels (SPECIFICATIONS) | Inter mono                              | 11px          | 600, letter-spacing: 0.08em |
| Spec editor                             | @uiw/react-codemirror (CodeMirror 6)    | 14px          | 400                         |

## **8.4 Retro Aesthetic System**

Retro elements are applied selectively. The layout chrome (sidebar, top bar, page structure) is clean and modern. Retro accents appear exclusively on terminal/agent-facing surfaces.

- Scanline overlay (.terminal-surface): CSS ::after pseudo-element with repeating-linear-gradient of 0.15 opacity horizontal lines on 4px pitch. Applied to xterm.js containers and agent log panels.
- ASCII progress bars: ▓ for filled segments, ▒ for empty. Monospace font. Used in specs table Tasks column.
- Status characters: ▶ (in_progress, blinking), ✓ (done, emerald), ⚠ (blocked, amber), ✕ (failed, red), ○ (todo, muted).
- Monospace ID badges: T-042, SPEC-003, SES-0091 - code element with amber text, amber-950/30 background, rounded-sm.
- Retro uppercase section labels: uppercase, monospace, letter-spaced, muted - used for section headers like SPECIFICATIONS, EVENT LOG.
- Phosphor palette: amber #ffb300 and green #39ff14 used only within .terminal-surface elements. Never in layout chrome.

## **8.5 Component Rules**

- Buttons: rounded-md everywhere. Never rounded-full. Primary = violet fill. Outline = transparent with border. Destructive = red fill.
- Lists: dense table rows, not card grids. Row height: 36px for task rows, 40px for session rows, 48px for notification rows.
- Loading states: shadcn Skeleton rows. Never spinners on page-level. Button-level operations use button spinner only.
- Toasts: Sonner, bottom-right, max 3 simultaneous. Success auto-close 3s. Error auto-close 6s. Destructive: persist until dismissed.
- Dialogs: shadcn Dialog (full modal) for destructive confirms, onboarding. shadcn AlertDialog (compact) for quick confirms.
- Drawers: Vaul for Task Detail - slides from right, 640px wide on desktop, snap points at 50% and 95% height.

# **9\. DAEMON Mascot Specification**

## **9.1 Identity**

DAEMON (Data-Autonomous Execution Machine - Operational Node) is the app's agent mascot. A small, friendly retro robot rendered as an SVG component. It communicates agent state visually at every level: sidebar (16px), toast (16px), drawers (20-24px), dialogs and empty states (32-64px).

Design lineage: inspired by CRT-era robot aesthetics applied to modern flat SVG style. No outlines - fill only. Amber eyes are the primary emotional indicator. Antenna is the secondary state indicator visible even at 16px.

## **9.2 Physical Design (viewBox: 0 0 34 40)**

| **Part**    | **Specification**                                                                      |
| ----------- | -------------------------------------------------------------------------------------- |
| Body        | Rounded-rect, violet gradient #9b7ffd → #5b3fd4. Slight vertical taper (wider at top). |
| Head/screen | Inset dark panel #1a1025 → #0d0a1a with subtle radial glow from centre.                |
| Eyes        | Amber #ffb300 ellipses. The only warm colour - all emotional focus here.               |
| Antenna     | Thin violet wire from top of body + amber dot tip. Primary 16px state indicator.       |
| Feet        | Two small rounded rects at base of body. Same violet as body.                          |
| Mouth       | Simple arc or flat line. Visible at 32px+. Hidden at 16px.                             |

## **9.3 Expressions**

| **Expression** | **Eyes**                              | **Mouth**            | **Antenna**                       | **Use case**                                      |
| -------------- | ------------------------------------- | -------------------- | --------------------------------- | ------------------------------------------------- |
| idle           | Round amber ellipses                  | Flat line (neutral)  | Upright, slow pulse               | Ready state, empty states, plan approval wait     |
| working        | Horizontal scan-bar (CRT scan effect) | Hidden               | Upright, tip pulses amber         | Active session, plan generation, async operations |
| success        | Wider ellipses (^\_^ shape)           | Upward arc (smile)   | Tips forward slightly, fast pulse | Session complete, task done, approval confirmed   |
| blocked        | Narrowed ellipses (>\_< shape)        | Downward arc (frown) | Droops to -34°                    | Task blocked, needs attention banner              |
| error          | X shape (✕ amber)                     | Deeper downward arc  | Droops to -18°, no pulse          | Session failed, plan rejected, 404 page           |

## **9.4 Usage Sizes & Rules**

| **Size** | **Context**                        | **Visible parts**                     |
| -------- | ---------------------------------- | ------------------------------------- |
| 16px     | Sidebar status bar, toasts         | Body silhouette + antenna angle only  |
| 20-24px  | Plan review banner, blocked banner | Body + eyes (simplified) + antenna    |
| 32px     | Dialog headers, plan states        | Full design - all expressions legible |
| 48-64px  | Empty states, Mission Control idle | Full design with animation            |
| 120px+   | Onboarding, 404 page               | Full design with full animation       |

## **9.5 Microcopy Voice**

DAEMON speaks in first person. Always one sentence. No exclamation marks. No ellipsis. Sparse and purposeful - fewer appearances means more impact.

| **Context**                   | **Copy**                                                |
| ----------------------------- | ------------------------------------------------------- |
| Idle, no specs                | "No specs yet. I'm ready to build something."           |
| Plan ready for approval       | "Ready when you are."                                   |
| Blocked                       | "I hit a wall on T-042. I need your input to continue." |
| Session complete              | "All tasks complete. Ship it."                          |
| Plan generating               | "Working on your plan."                                 |
| Empty sessions                | "No sessions yet. Approve a plan to begin."             |
| All caught up (notifications) | "Nothing to report."                                    |

# **10\. Application Shell**

## **10.1 Persistent Shell (all pages except Spec Editor)**

The app shell is a fixed layout - sidebar and top bar never unmount during navigation. Only the main content area changes.

### **Left Sidebar (240px fixed width)**

- Top: DAEMON sprite (24px) + "SPECDRIVR" wordmark in monospace - logo area.
- Below logo: Project switcher dropdown. Displays current project as org/repo. Clicking opens a popover listing all projects. Switching sets activeProjectId in session and triggers re-fetch of all scoped data.
- Nav links (icon + label, in order): Mission Control · Specifications · Sessions · Settings.
- Active nav item: violet left border + violet text. Inactive: muted text, no border.
- Bottom section: DAEMON status bar (16px animated sprite + status text). See priority table in Section 12. Clicking when state is "N BLOCKED" navigates to Mission Control.
- Below status: version tag (v0.1.0, muted, tiny). Dev Mode badge \[DEV\] in amber monospace when active.

### **Top Bar (per-page, 56px height)**

- Left: page title (bold, 18px) + breadcrumb for nested pages (muted, separated by / ).
- Right (always present): notification bell with unread count badge · user avatar (32px initials circle) + dropdown menu.
- Right (per-page contextual): primary action button(s) that change based on the current page and state.

### **User Avatar Dropdown**

- Shows: name + email (read-only header) · Profile Settings · Security · Notification Preferences · Keyboard Shortcuts · Sign Out.
- Sign Out: immediate, no confirm. Clears session cookie. Redirects to /login.

## **10.2 Global Overlays**

| **Overlay**                | **Trigger**                                          | **Dismissal**          |
| -------------------------- | ---------------------------------------------------- | ---------------------- |
| Task Drawer (Vaul)         | Open Detail → link in task row, or blocked task pill | Escape / close button  |
| New Project Dialog         | \+ New Project button on /projects                   | Escape / Cancel        |
| Approve & Execute Dialog   | \[APPROVE & EXECUTE\] button on PLAN tab             | Escape / \[CANCEL\]    |
| Danger Zone Confirm Dialog | Any Danger Zone action button                        | Escape / \[CANCEL\]    |
| Command Palette            | Cmd+K from anywhere                                  | Escape / click outside |
| Keyboard Shortcut Help     | ? key from anywhere (not in input)                   | Escape                 |
| Notification Panel         | Bell icon click                                      | Click outside / Escape |
| Member Profile Sheet       | View Profile in Team table                           | Escape / close         |

## **10.3 Keyboard Shortcuts**

| **Shortcut**                 | **Action**                                 |
| ---------------------------- | ------------------------------------------ |
| Cmd+K                        | Open command palette                       |
| N                            | New specification (when not in text input) |
| G M                          | Go to Mission Control                      |
| G S                          | Go to Specifications                       |
| G A                          | Go to Sessions (Activity)                  |
| Ctrl+\`                      | Toggle Dev Mode                            |
| ?                            | Show keyboard shortcut reference dialog    |
| Escape                       | Close drawer / dialog / panel              |
| ↑ / ↓ (in task list)         | Move focus between task rows               |
| Enter / Space (in task list) | Expand / collapse focused task row         |
| O (in task list)             | Open Task Drawer for focused row           |

# **11\. Pages - Detailed Specification**

## **11.1 Authentication Pages**

### **Login (/login)**

- Shell: none. Full-page centered layout on #0a0a0b background.
- Card: 400px wide, bg-surface, border, rounded-xl, p-8. Contains: DAEMON idle (48px) + SPECDRIVR wordmark + tagline.
- Fields: EMAIL (text, autofocus) · PASSWORD (password type) · \[Sign In\] (primary violet, full width) · Forgot password? link.
- \[Sign In\] disabled only while request in-flight. Never disabled due to empty fields - server validates.
- Error state: red banner below button ("Invalid email or password."). Never field-level errors - security principle.
- Demo bar (dev only): below card, dashed border, \[Sign in as Admin\] and \[Sign in as Member\] buttons.
- Redirect: unauthenticated access to any route → /login?next={path}. After login → next param or /.

### **Forgot Password (/forgot-password)**

- Single email field. \[Send Reset Link\] button.
- Always shows success state regardless of whether email exists: DAEMON success + "Check your email."

### **Reset Password (/reset-password?token={token})**

- Token validated on page load. Invalid/expired token: DAEMON error + "This link has expired." + \[Request a new link\].
- Two password fields + 4-segment strength indicator (colour only, no text labels).
- Passwords must match. Minimum 12 characters.

### **Accept Invite (/invite?token={token})**

- Token validated on page load. Invalid token: DAEMON error + "This invite link has expired."
- Valid token: email pre-filled (read-only). Fields: Name + Password + Confirm. \[Accept Invite & Sign In\].
- On success: user created, auto-signed in, redirected to / with onboarding overlay (if first time).

## **11.2 Mission Control (/)**

### **Needs Attention Banner (conditional - only when blocked tasks exist)**

- Amber full-width banner. DAEMON blocked (20px) + "I need your help with {N} tasks".
- Blocked task pills inline: T-019 T-033 T-041 - each clickable, opens Task Drawer.
- \[Dismiss\] button right-aligned. Dismissal is session-only - banner re-appears on next load if tasks still blocked.

### **Live Execution Panel (left 60%)**

- Session running: header with ● LIVE badge (pulsing violet) + Session ID (mono amber) + elapsed timer. Progress bar: N / N tasks. Current task line: ▶ T-019 · Scaffold auth middleware (blinking ▶). xterm.js log tail (200px height, last ~20 lines, ANSI colours, scanline overlay, auto-scroll). Footer: \[PAUSE\] · \[CANCEL\] buttons.
- Session paused: same layout but timer frozen, \[RESUME\] instead of \[PAUSE\], amber ⏸ PAUSED indicator, terminal shows > SESSION PAUSED line.
- Session just completed (< 60s): DAEMON success (48px) + "Execution complete." + "N/N tasks succeeded." + \[View Changes →\] link. Auto-clears to idle after 60 seconds.
- No active session: DAEMON idle (48px, centred) + "SYSTEM READY" (mono, muted) + "No active session." + link to /specs.
- Boot sequence: when a new session starts, 800ms typewriter animation in terminal before real log lines begin.

### **Event Log Feed (right 40%)**

- Header: EVENT LOG (mono, muted, uppercase, small). Last 30 agent events.
- Row format: timestamp (mono) · \[EVENT_TYPE\] (colour-coded) · entity ID · description.
- Colour coding: \[TASK*DONE\] emerald · \[BLOCKED\] amber · \[ERROR\] red · \[PLAN*\*\] violet.
- Newest row has pulsing dot if session active. View all → link to /sessions.

## **11.3 Projects (/projects)**

- Table columns: ID (mono amber) · Name · Repository (mono, org/repo) · Branch (mono) · Specs count · Last Run · Status · ⋯ menu.
- \+ New Project (top bar) → New Project Dialog: Name · Repository URL · Branch (default: main) · Description. \[Initialize Project\] button.
- Row click → sets active project → navigates to /specs.
- Empty state: DAEMON idle + "No projects yet." + "Point me at a repository and I'll get to work." + \[Initialize First Project\].

## **11.4 Specifications (/specs)**

- Table columns: ID (mono amber) · Name · Status badge · Version (mono, muted) · Tasks (ASCII progress bar ▓▒) · Plan badge · Last Run · ⋯ menu.
- Status badges: DRAFT (muted) · GENERATING (violet, pulsing) · REVIEW (amber) · RUNNING (violet, pulsing) · STALLED (red) · DONE (emerald).
- \+ New Spec → navigates to /specs/new (not a dialog).
- Empty state: DAEMON idle + "No specifications." + "Write what you want to build. I'll figure out the how." + \[Write First Spec\].

## **11.5 Spec Editor (/specs/new, /specs/\[id\]/edit)**

- Full-page. Sidebar hidden. Top bar only: back arrow · spec name (large input, mono font) · \[Save Draft\] · \[Save & Generate Plan\].
- \[Save Draft\]: enabled when name is non-empty. \[Save & Generate Plan\]: enabled when name filled AND content ≥ 50 characters.
- Layout: two-pane split with drag handle, default 50/50. Left: CodeMirror 6 editor (line numbers, active line highlight, wrap on). Right: live preview (Markdown rendered, prose styles).
- Footer strip: word count · line count · version indicator (v3 if editing).
- If editing a spec with an active plan: amber sticky banner - "⚠ This spec has an active plan (vN). Saving will create vN+1 and abandon the current plan."
- If Changes Requested by reviewer: amber sticky banner quoting the reviewer's note.
- Concurrent edit warning: if another user has the editor open, amber banner - "\[Name\] is currently editing this spec."

## **11.6 Specification Detail (/specs/\[id\])**

### **Page Header**

- SPEC-003 badge (mono amber) above spec name h1. Status indicator + plan status badge.
- Contextual action button (right):
  - drafting / stalled → \[Generate Plan →\] (primary violet)
  - pending_approval → \[Review Plan →\] (amber outline) - scrolls to PLAN tab
  - executing → \[▶ SES-0091\] (violet link) + \[PAUSE\] (outline)
  - complete → \[Re-run\] + \[Edit\] (both outline)
- ⋯ menu: Edit · Duplicate · Delete (contextual based on status).

### **Tab: SPEC**

- Rendered Markdown of current version.
- Version history strip: v1 Jan 3 → v2 Jan 8 → v3 Jan 12 (current) - clickable pills. Clicking shows that version's content inline with a "Viewing v1 · Not current" banner. \[Back to current\] link.

### **Tab: PLAN**

- No plan: DAEMON idle + "No plan generated." + \[Generate Plan\] button.
- pending_approval: amber review banner (DAEMON idle 20px + summary + three action buttons) → Architecture Decisions accordion → Execution plan (task list, read-only, all tasks show ○) → Review History (collapsed).
- changes_requested: amber banner with quoted note + \[Edit Spec →\]. Plan content visible but greyed. No action buttons.
- rejected: red banner with quoted reason + \[Generate New Plan\] + \[View Rejected Plan ▾\] collapsible.
- approved / executing / complete: plan content read-only + approval timestamp. No action buttons.

### **Plan Review Action Buttons (pending_approval only)**

- \[Request Changes\] (amber outline): slide-down panel with required textarea. On submit: plan → changes_requested, spec author notified.
- \[Reject Plan\] (red outline): slide-down panel with required reason textarea + warning text. On confirm: plan → rejected, spec → drafting.
- \[Approve & Execute\] (primary violet): opens Approval Confirmation Dialog. Admin/Owner only. Member sees disabled button with Tooltip.
- Approval Confirmation Dialog: DAEMON working (32px) + repo/branch + task count + optional notes field. \[CANCEL\] · \[CONFIRM EXECUTION\].

### **Tab: TASKS**

- pending_approval state: task list visible (read-only preview, no click handlers) + amber notice strip: "Tasks will begin executing after plan approval."
- Other states: full interactive list. Filter pills (ALL · TODO · RUNNING · BLOCKED · DONE · FAILED) + search. Summary strip with colour-coded counts.
- Task row (36px): status char · T-042 (mono amber) · title · duration (muted, right) · ⋯ menu.
- Blocked rows: red left border · ⚠ · blockedReason truncated inline (60 chars).
- Click row (not ⋯): inline expand - description (3 lines) · dependency pills · last log line · attempt count if > 1 · \[Open Detail →\] link.
- \[Open Detail →\] or ⋯ → View Full Detail → opens Task Drawer. Row click never opens drawer directly.

### **Tab: CHANGES**

- Header: FILE CHANGES (mono) + +142 −38 summary (green/red, mono).
- Two-pane: file tree (200px, +/~/- prefix, file path mono, line counts) + Shiki diff viewer (line numbers, green additions, red deletions, via T-019 task link).

### **Tab: ACTIVITY**

- Event log scoped to this spec, grouped by session. Session headers collapsible. Links to /sessions filtered to that session.

## **11.7 Task Drawer (Vaul Overlay)**

- Entry: \[Open Detail →\] in expanded task row, or ⋯ → View Full Detail, or blocked task pill in Mission Control.
- Header: T-042 (mono amber, large) · title · status badge (editable inline dropdown) · DAEMON sprite (expression = task status).

### **Tab: OVERVIEW**

- Description (Markdown rendered). Dependencies (↳ linked pills - click navigates to that task's drawer). Architecture decisions referencing this task.
- Blocked state: red surface panel · DAEMON blocked (24px) · blockedReason text · Context textarea ("Provide context for DAEMON") · \[RETRY WITH CONTEXT\] button (violet, disabled until textarea non-empty).
- Failed state: orange panel · last error message · \[RETRY\] button.

### **Tab: ATTEMPTS**

- List newest-first. Each row header: Attempt N · status · duration · timestamp (collapsible).
- Expanded: xterm.js terminal panel (320px, ANSI colours, scanline overlay, scrollable).
- In-progress attempt: auto-scroll + blinking cursor.

### **Tab: CHANGES**

- Shiki diff viewer scoped to this task. Empty state: DAEMON idle + "No file changes yet." if task not complete.

### **Footer Actions (context-sensitive)**

- \[RE-RUN\] · \[MARK BLOCKED\] · \[MARK DONE\] - shown only when contextually valid. Never shown for done tasks in terminal state.

## **11.8 Sessions (/sessions)**

- Filter bar: search · status filter · spec dropdown · date range.
- Timeline grouped by date: TODAY / YESTERDAY / THIS WEEK (mono uppercase group headers).
- Session row (40px): status dot (pulsing violet if running) · session ID (mono amber) · spec name (linked) · time range · task count + status char · ⋯ menu.
- Click row: inline expand with per-task event log (mono, colour-coded). Running session: mini xterm.js panel (120px) at bottom of expanded row.

## **11.9 Notifications (/notifications)**

- Filter tabs: All · Unread · Mentions. Full-width list, 56px rows.
- \[Mark all read\] button (top right). Infinite scroll (50 per page).
- Bell icon in top bar: amber numeric badge (max: 9+). Click → Notification Panel (Popover, 380px wide, 480px max).

## **11.10 Settings (/settings)**

### **Sub-navigation (200px left column)**

- ACCOUNT: Profile · Security · Notifications
- PROJECT: General · Team · Integrations · Agent · Audit Log
- DANGER ZONE

### **Profile**

- Initials avatar (64px, deterministic colour from name hash). Name field (editable). Email (read-only, with note).

### **Security**

- Change password: Current · New · Confirm. Same strength indicator as reset flow.
- Active sessions table: Device · Location · Last active · \[Revoke\]. Current session highlighted "(this session)", no revoke. \[Revoke all other sessions\] link.
- API tokens table: Name · Prefix · Created · Last used · Expires · \[Revoke\]. \[+ Generate Token\] → Dialog (name + expiry radio) → one-time reveal dialog on creation.

### **Notifications**

- Two-column toggle grid: event type (left) · Email switch · In-app switch. \[Save Preferences\] at bottom.

### **General (Project)**

- Name · Description · Repository URL (with \[Verify Connection\] inline) · Default Branch · Timezone. \[Save Changes\].

### **Team**

- Invite section: email + role dropdown + \[Send Invite\] in one row.
- Members table: Avatar+Name · Email · Role (inline editable popover) · Status · Last Active · ⋯ menu.
- ⋯ menu: View Profile · Resend Invite (if invited) · Suspend (if active) · Reactivate (if suspended) · Remove from Project.

### **Integrations**

- Card grid (3 columns). GitHub: OAuth connect, webhook URL after connect, event checkboxes. Slack: OAuth connect, channel selector, event toggles. Generic Webhook: endpoint URL + HMAC secret + event checkboxes.

### **Agent**

- Max concurrent tasks (Slider 1-10). Task timeout (number input, live human-readable preview). Max retries (Slider 0-5). Retry delay (Select). Require approval (Switch, default ON, disabling requires AlertDialog). Auto-generate plan (Switch). Plan expiry (Select).
- Agent Token section: masked token display + rotation instructions. Never editable here - set via environment variable.

### **Audit Log**

- Admin/Owner only. Filter bar: search · actor · action type · date range. Full-width table. Row expand shows raw JSON detail (.terminal-surface). \[Export CSV\].

### **Danger Zone**

- \[Abandon All Sessions\] → AlertDialog (no type-to-confirm needed).
- \[Reset Agent Settings to Defaults\] → AlertDialog.
- \[Delete All Specs & Plans\] → type project name to confirm.
- \[Delete Project\] → two-step: AlertDialog first, then type-to-confirm dialog. Success → navigates to /projects.

# **12\. State Machines**

## **12.1 Spec Status**

| **Transition**                  | **Trigger**                     | **Side effects**                                                          |
| ------------------------------- | ------------------------------- | ------------------------------------------------------------------------- |
| (none) → drafting               | Spec created (Save Draft)       | Creates spec + version 1                                                  |
| drafting → pending_plan         | Save & Generate Plan clicked    | Creates new version if editing; triggers async plan generation            |
| pending_plan → pending_approval | Plan generation succeeds        | Plan record created with all tasks and arch decisions; notifications sent |
| pending_plan → stalled          | Plan generation fails           | Plan record with error; DAEMON error state; notification sent             |
| pending_approval → executing    | Plan approved                   | Plan status → approved; agent_session created; first task queued          |
| pending_approval → stalled      | Plan rejected                   | Plan status → rejected; notification to spec creator                      |
| pending_approval → stalled      | Changes requested               | Plan status → changes_requested; notification to spec creator             |
| executing → complete            | All tasks reach done            | Session completed; notifications sent; confetti on Mission Control        |
| executing → stalled             | Session cancelled               | In-progress tasks → failed; DAEMON idle                                   |
| any → drafting                  | Spec edited (new version saved) | New spec_version; active non-complete plan → abandoned                    |
| complete → pending_plan         | Re-run triggered                | New plan generation cycle begins                                          |

## **12.2 Plan Status**

| **Status**        | **Meaning**                                                            | **Next valid statuses**                          |
| ----------------- | ---------------------------------------------------------------------- | ------------------------------------------------ |
| pending_approval  | Plan generated, awaiting review. Approval buttons visible.             | approved, rejected, changes_requested, abandoned |
| approved          | Admin approved. Session starting/running.                              | complete (via executing implicitly)              |
| rejected          | Rejected by reviewer. Cannot be recovered - must generate new plan.    | (terminal)                                       |
| changes_requested | Reviewer wants spec changes first. Cannot approve until spec re-saved. | (terminal for this plan - new plan needed)       |
| abandoned         | Spec was edited while plan was active. Auto-set.                       | (terminal)                                       |
| complete          | All tasks done.                                                        | (terminal)                                       |

## **12.3 Task Status**

| **Status**  | **Character** | **Colour** | **Can transition to**               |
| ----------- | ------------- | ---------- | ----------------------------------- |
| todo        | ○             | Muted      | in_progress                         |
| in_progress | ▶ (blink)     | Violet     | done, failed, blocked               |
| blocked     | ⚠             | Amber      | in_progress (on retry with context) |
| done        | ✓             | Emerald    | todo (on re-run, manual override)   |
| failed      | ✕             | Red        | todo (on retry)                     |

## **12.4 Session Status**

| **Status** | **Panel state on Mission Control**                       | **DAEMON sidebar**                             |
| ---------- | -------------------------------------------------------- | ---------------------------------------------- |
| running    | Live panel with log stream, timer, progress              | working · T-{taskId} (violet)                  |
| paused     | Same panel, timer frozen, \[RESUME\] button, ⏸ indicator | idle · PAUSED (amber)                          |
| completed  | DAEMON success + summary (auto-clears after 60s)         | success · COMPLETE (brief), then READY         |
| failed     | DAEMON error + \[View Session →\] + \[Retry →\]          | error · SESSION FAILED (red, highest priority) |
| cancelled  | Returns to idle state immediately                        | idle · READY                                   |

## **12.5 Sidebar DAEMON Priority**

| **Priority** | **Condition**         | **Expression** | **Text**                       | **Colour** |
| ------------ | --------------------- | -------------- | ------------------------------ | ---------- |
| 1 (highest)  | Any session failed    | error          | DAEMON · SESSION FAILED        | Red        |
| 2            | Any task blocked      | blocked        | DAEMON · N BLOCKED (clickable) | Amber      |
| 3            | Any session running   | working        | DAEMON · T-{taskId}            | Violet     |
| 4            | Any session paused    | idle           | DAEMON · PAUSED                | Amber      |
| 5            | Plan pending approval | idle           | DAEMON · PLAN READY            | Amber      |
| 6 (lowest)   | None of above         | idle           | DAEMON · READY                 | Muted      |

# **15\. Notification System**

## **15.1 Delivery Channels**

- In-app: Notification Panel (bell icon popover) + /notifications page. Polled every 3 seconds (same interval as session polling).
- Email: transactional via Resend. Templates are plain-text-first, minimal HTML. Never send more than one email per event per user.

## **15.2 Notification Events & Defaults**

| **Event**         | **Trigger**                                          | **Email default** | **In-app default** |
| ----------------- | ---------------------------------------------------- | ----------------- | ------------------ |
| plan_generated    | Plan generation complete for a spec the user created | Off               | On                 |
| plan_approved     | Plan approved (notify spec creator and team members) | Off               | On                 |
| plan_rejected     | Plan rejected (notify spec creator)                  | On                | On                 |
| changes_requested | Changes requested (notify spec creator)              | On                | On                 |
| session_complete  | Execution session completed                          | Off               | On                 |
| session_failed    | Execution session failed                             | On                | On                 |
| task_blocked      | Task blocked - for specs the user owns               | On                | On                 |
| member_invited    | User invited to a project                            | On                | On                 |
| role_changed      | User's role in a project changed                     | On                | On                 |

## **15.3 Notification Panel Behaviour**

- Bell badge: amber background, white text, max displayed "9+". Updates via 3-second poll on GET /api/v1/notifications?unread=true&count=true.
- Click notification row: marks as read (PATCH /api/v1/notifications/{id}) + navigates to linkUrl. Single action, no separate mark-read step.
- \[Mark all read\]: POST /api/v1/notifications/read-all. Badge clears immediately (optimistic).

---

# **16. Navigation Flow Diagram**

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
```

# **17. Shared Component Inventory**

| Component                         | Used on                                                                |
| --------------------------------- | ---------------------------------------------------------------------- |
| DAEMON sprite (all expressions)   | Sidebar, all empty states, all toasts, Task Drawer header, all dialogs |
| Task row (collapsed + expanded)   | P5 TASKS tab, P1 Mission Control blocked pills                         |
| Event log row (mono, color-coded) | P1 Event feed, P5 ACTIVITY tab, P6 Sessions expanded                   |
| xterm.js terminal panel           | P1 live log, P5-OVERLAY ATTEMPTS tab, P6 inline expand                 |
| Shiki diff viewer                 | P5 CHANGES tab, P5-OVERLAY CHANGES tab                                 |
| ASCII progress bar (`▓▒`)         | P3 Specifications table, P5 header summary                             |
| Session row                       | P6 Sessions, P1 (compact version)                                      |
| Status indicator (retro char)     | All task rows, all spec rows, all session rows                         |
| Amber ID badge (mono)             | All task IDs (T-042), spec IDs (SPEC-003), session IDs (SES-0091)      |

