# UI Specification — Shell & Pages

**Status:** Canonical for layout and behaviour.
**Companion:** [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) defines tokens, primitives, and visual rules.

This document defines screen content and behaviour. `DESIGN_SYSTEM.md` defines visual design.
When this document names a colour or component, use its defined token or primitive. Do not use raw values.

> Do not use a DAEMON mascot, scanline overlays, amber IDs, ASCII progress bars, or typewriter boot sequences.

---

## 1. Application shell

Keep the sidebar and top bar mounted during navigation. Update only the main content area.
Use `src/app/(app)/layout.tsx`.

### 1.1 Left sidebar (240px fixed)

- **Top:** brand mark (24px) + `specdrivr` wordmark.
- **Project switcher:** Show the active project as `org/repo`. Open a popover with all projects.
  Set `active-project-id` on switch. Update all scoped data.
- **Nav links** (icon + label, in order): Mission Control · Specifications · Sessions · Projects ·
  Notifications · Settings.
  > Use six items.
- **Active item:** Use `bg-accent-subtle` + `text-accent`. **Inactive:** Use `text-fg-secondary` and `bg-surface-inset` on hover.
- **Bottom:** Show the agent status glyph and text (see §1.4). Make it a Mission Control button when blocked.
  Show the version tag (`text-2xs text-fg-muted`) and a `DEV` badge in dev mode.

### 1.2 Top bar (56px)

- **Left:** page title (`text-lg`, weight 600) + breadcrumb for nested pages (`text-sm
  text-fg-muted`, `/` separated).
- **Right, always:** notification bell with unread count · user avatar (28px initials circle) +
  dropdown.
- **Right, contextual:** Show primary action buttons for the current page and state.

### 1.3 User avatar dropdown

Name + email (read-only header) · Profile Settings · Security · Notification Preferences ·
Keyboard Shortcuts · Sign Out.

Sign Out has no confirmation. Clear the session cookie. Redirect to `/login`.

### 1.4 Agent status line

Replaces the DAEMON status bar. Glyph + label, using the §8.4 status vocabulary:

| Condition | Glyph | Colour | Label |
|---|---|---|---|
| Session running | pulsing dot | `info` | `Running · {n}/{total}` |
| Tasks blocked | `AlertTriangle` | `warning` | `{n} blocked` |
| Session failed | `X` | `danger` | `Session failed` |
| Idle | `Circle` | `fg-muted` | `Idle` |

### 1.5 Global overlays

| Overlay | Trigger | Dismissal |
|---|---|---|
| Task Drawer | *Open detail* in a task row, or a blocked task pill | Escape / close button |
| New Project Dialog | **New Project** on `/projects` | Escape / Cancel |
| Approve & Execute Dialog | **Approve & Execute** on the Plan tab | Escape / Cancel |
| Danger Zone Confirm | Any Danger Zone action | Escape / Cancel |
| Command Palette | `Cmd+K` | Escape / click outside |
| Keyboard Shortcut Help | `?` (outside an input) | Escape |
| Notification Panel | Bell icon | Click outside / Escape |
| Member Profile Sheet | *View Profile* in the Team table | Escape / close |

Use `bg-surface-overlay` + `shadow-overlay` for dialogs and drawers. Use `shadow-popover` for popovers and dropdowns.
Move focus into an overlay on open. Return it to the trigger on close.

### 1.6 Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+K` | Command palette |
| `N` | New specification (outside a text input) |
| `G` `M` | Mission Control |
| `G` `S` | Specifications |
| `G` `A` | Sessions |
| `?` | Keyboard shortcut reference |
| `Escape` | Close drawer / dialog / panel |
| `↑` / `↓` | Move focus between task rows |
| `Enter` / `Space` | Expand / collapse focused task row |
| `O` | Open Task Drawer for focused row |

> Use `Ctrl+\`` (Toggle Dev Mode) only when dev mode is available. Check this during Phase 4.

---

## 2. Authentication pages

Do not show the shell. Use a full-page centred `bg-surface-base` layout.

**Card:** 400px, `bg-surface-raised border border-line rounded-xl p-8`. Brand mark (32px) +
`Specdrivr` wordmark + tagline.

### Login (`/login`)
- Fields: Email (autofocus) · Password · **Sign In** (accent, full width) · *Forgot password?* link.
- Disable **Sign In** only while the request runs. Do not disable it for empty fields. The server validates.
- Show a `danger` banner below the button for errors: "Invalid email or password." Do not show field-level errors.
- Demo bar (dev only): dashed border, *Sign in as Admin* / *Sign in as Member*.
- Redirect: unauthenticated access to any route → `/login?next={path}`; after login → `next` or `/`.

### Forgot Password (`/forgot-password`)
Single email field + **Send Reset Link**. Always shows the success state regardless of whether the
email exists.

### Reset Password (`/reset-password?token=`)
Validate the token on load. For an invalid or expired token, show "This link has expired." + **Request a new link**.
Show two password fields and a 4-segment strength indicator. Require a match and 12 characters.

> Include a text label in the strength indicator (§10, "never colour-only").

### Accept Invite (`/invite?token=`)
Validate the token on load. For a valid token, pre-fill a read-only email plus Name, Password, Confirm, and **Accept Invite & Sign In**.
On success, create and sign in the user. Redirect to `/` and show onboarding on the first run.

---

## 3. Mission Control (`/`)

### Needs Attention banner (only when blocked tasks exist)
Show a full-width `warning` banner: `AlertTriangle` + "{N} tasks need your input".
Show inline blocked task pills (`T-019`, `T-033`…). Open the Task Drawer from each pill.
**Dismiss** applies only to the session. Show the banner on the next load while tasks remain blocked.

### Live Execution panel (left 60%)
- **Running:** header with a pulsing `info` dot + `LIVE`, session ID (mono, `text-fg-secondary`),
  elapsed timer. Progress bar `N / N tasks`. Current task line. Log tail (200px, `bg-log-bg`,
  auto-scroll, `aria-live="polite"`). Footer: **Pause** · **Cancel**.
- **Paused:** same layout, timer frozen, **Resume**, `warning` paused indicator.
- **Just completed (< 60s):** `Check` (`success`) + "Execution complete." + "N/N tasks succeeded." +
  **View Changes →**. Auto-clears to idle after 60s.
- **Idle:** empty state — icon, "No active session.", link to `/specs`.

> Use the `Progress` primitive. Start log streaming immediately.
> Do not use ASCII progress, blinking `▶`, an xterm scanline overlay, or an 800ms typewriter boot sequence.

### Event Log feed (right 40%)
Use the `EVENT LOG` header (`text-2xs uppercase text-fg-muted`). Show the last 30 events.
Each row has a mono timestamp, colour-coded glyph event type, entity ID, and description. Show a pulsing dot on the newest row during an active session.
Link **View all →** to `/sessions`.

Colour coding: `TASK_DONE` → `success` · `BLOCKED` → `warning` · `ERROR` → `danger` · `PLAN_*` →
`info`.

---

## 4. Projects (`/projects`)

Use a table with ID (mono), Name, Repository (mono `org/repo`), Branch (mono), Specs, Last Run, Status, and overflow menu.

**New Project** → dialog: Name · Repository URL · Branch (default `main`) · Description →
**Initialize Project**.

Set the active project on row click. Navigate to `/specs`.

Empty state: "No projects yet." + "Point Specdrivr at a repository to get started." +
**Initialize First Project**.

---

## 5. Specifications (`/specs`)

Use a table with ID (mono), Name, Status badge, Version (mono, muted), Tasks (`Progress` bar + `n/m`), Plan badge, Last Run, and overflow menu.

Status badges: `Draft` (muted) · `Generating` (info, pulsing) · `Review` (warning) · `Running`
(info, pulsing) · `Stalled` (danger) · `Done` (success).

Navigate **New Spec** to `/specs/new`. Do not use a dialog.

Empty state: "No specifications." + "Describe what you want built. Specdrivr plans the how." +
**Write First Spec**.

---

## 6. Spec Editor (`/specs/new`, `/specs/[id]/edit`)

Use a full page with the sidebar hidden. Show only a top bar: back arrow, spec name (large mono input), **Save Draft**, and **Save & Generate Plan**.

- **Save Draft** enabled when the name is non-empty.
- **Save & Generate Plan** enabled when the name is filled **and** content ≥ 50 characters.
- Use two panes with a drag handle and a 50/50 default split. Put CodeMirror 6 on the left and rendered Markdown on the right.
- Show word count, line count, and version in the footer strip.
- Show the sticky `warning`: "This spec has an active plan (vN). Saving creates vN+1 and abandons the current plan."
- Show a sticky `warning` that quotes changes requested.
- Show the `warning`: "{Name} is currently editing this spec."

---

## 7. Specification Detail (`/specs/[id]`)

### Header
`SPEC-003` (mono, `text-fg-secondary`) above the spec name. Status indicator + plan status badge.

Show this contextual action on the right:

| Spec status | Action |
|---|---|
| `drafting` / `stalled` | **Generate Plan →** (accent) |
| `pending_approval` | **Review Plan →** (outline) — scrolls to the Plan tab |
| `executing` | **SES-0091** (link) + **Pause** (outline) |
| `complete` | **Re-run** + **Edit** (both outline) |

Show Edit, Duplicate, and Delete in the overflow menu when the status allows it.

### Tab: Spec
Render Markdown for the current version. Show clickable history pills (`v1 → v2 → v3 (current)`).
When viewing an old version, show "Viewing v1 · Not current" and **Back to current**.

### Tab: Plan

| Plan state | Content |
|---|---|
| none | Empty state + **Generate Plan** |
| `pending_approval` | `warning` review banner + three actions → Architecture Decisions accordion → read-only task list → Review History (collapsed) |
| `changes_requested` | `warning` banner quoting the note + **Edit Spec →**. Plan visible but de-emphasised, no actions |
| `rejected` | `danger` banner quoting the reason + **Generate New Plan** + collapsible **View Rejected Plan** |
| `approved` / `executing` / `complete` | Read-only plan + approval timestamp, no actions |

**Review actions** (`pending_approval` only):
- **Request Changes** (warning outline) opens a slide-down panel with a required textarea. Set the plan to `changes_requested`. Notify the spec author.
- **Reject Plan** (danger outline) opens a slide-down panel with a required reason and warning. Set the plan to `rejected`. Set the specification to `drafting`.
- **Approve & Execute** (accent) opens a confirmation dialog. Allow Admin/Owner only. Show Members a disabled button with an explanatory tooltip.
  Show repo/branch, task count, and optional notes in the dialog.

### Tab: Tasks
- For `pending_approval`, show a read-only preview and "Tasks begin executing after plan approval."
- Otherwise, show filter pills, search, and a summary strip of colour-coded counts.
- Use 36px task rows with status glyph, `T-042` (mono), title, muted right duration, and overflow.
- Use `border-l-2 border-danger-border`, `AlertTriangle`, and a 60-character reason for blocked rows.
- Expand the row on click. Show three description lines, dependency pills, last log line, attempt count above 1, and **Open Detail →**.
- Do not open the drawer on row click. Open it only from **Open Detail →** or overflow.

### Tab: Changes
Show `FILE CHANGES` + `+142 −38` (mono, success/danger). Use two panes.
Use a 200px file tree (`+`/`~`/`-` prefix). Use `diff-added` / `diff-removed` tokens in the diff viewer.

### Tab: Activity
Show the specification event log grouped by session. Use collapsible session headers.

---

## 8. Task Drawer

Open from **Open Detail →**, the overflow menu, or a blocked Mission Control task pill.

**Header:** `T-042` (mono, `text-lg`) · title · status badge (inline editable dropdown).
*The status badge shows task status.*

- **Overview:** Show Markdown description, dependency pills that open the related drawer, and architecture decisions.
  - *Blocked:* `danger` panel with the reason, a context textarea, and **Retry with context**
    (disabled until non-empty).
  - *Failed:* `warning` panel with the last error and **Retry**.
- **Attempts:** Show newest first. Use a collapsible `Attempt N`, status, duration, and timestamp header.
  Show a 320px scrollable `bg-log-bg` panel when expanded. Auto-scroll in-progress attempts.
- **Changes:** Show the task diff viewer. Show an empty state for an incomplete task.
- **Footer:** Show **Re-run**, **Mark Blocked**, and **Mark Done** only when valid. Never show them for terminal tasks.

---

## 9. Sessions (`/sessions`)

Use a filter bar with search, status, specification, and date range.

Group the timeline by date (`TODAY` / `YESTERDAY` / `THIS WEEK`, `text-2xs uppercase text-fg-muted`).

Session row (40px): status dot (pulsing `info` when running) · session ID (mono) · spec name (link) ·
time range · task count + status glyph · overflow menu.

Expand the row on click with a per-task event log. Show a 120px compact log panel for running sessions.

---

## 10. Notifications (`/notifications`)

Use All, Unread, and Mentions filter tabs. Use a full-width list with 56px rows. Put **Mark all read** top-right.
Use infinite scroll with 50 items per page.

Bell icon in the top bar: numeric badge (max `9+`) in `accent`, click opens the Notification Panel
(popover, 380px wide, 480px max height).

> Use `accent` for the badge.

### Delivery channels
- **In-app:** Use Notification Panel + `/notifications`. Poll every 3s.
- **Email:** Use transactional Resend email with plain text first. Send no more than one email per event per user.

### Events & defaults

| Event | Trigger | Email | In-app |
|---|---|---|---|
| `plan_generated` | Plan generation complete for a spec the user created | Off | On |
| `plan_approved` | Plan approved (spec creator + team) | Off | On |
| `plan_rejected` | Plan rejected (spec creator) | On | On |
| `changes_requested` | Changes requested (spec creator) | On | On |
| `session_complete` | Execution session completed | Off | On |
| `session_failed` | Execution session failed | On | On |
| `task_blocked` | Task blocked on a spec the user owns | On | On |
| `member_invited` | User invited to a project | On | On |
| `role_changed` | User's project role changed | On | On |

### Panel behaviour
- Update the badge through the 3s poll on `GET /api/v1/notifications?unread=true&count=true`.
- Mark a clicked row read with `PATCH /api/v1/notifications/{id}`. Navigate to `linkUrl` in the same action.
- Use `POST /api/v1/notifications/read-all` for **Mark all read**. Clear the badge optimistically.

---

## 11. Settings (`/settings`)

**Sub-navigation** (200px left column):
- **Account:** Profile · Security · Notifications
- **Project:** General · Team · Integrations · Agent · Audit Log
- **Danger Zone**

> `settings-nav.tsx` has a Security entry and an API tokens entry under `/settings/security`.

| Section | Contents |
|---|---|
| **Profile** | Initials avatar (64px, deterministic colour from a name hash). Editable name. Read-only email. |
| **Security** | Change password (Current · New · Confirm, with the strength indicator). Active sessions table (Device · Location · Last active · Revoke); the current session is highlighted and cannot be revoked; **Revoke all other sessions**. API tokens table (Name · Prefix · Created · Last used · Expires · Revoke); **Generate Token** → dialog (name + expiry) → one-time reveal. |
| **Notifications** | Two-column toggle grid: event type · Email switch · In-app switch. **Save Preferences**. |
| **General** | Name · Description · Repository URL (with inline **Verify Connection**) · Default Branch · Timezone. |
| **Team** | Invite row (email + role + **Send Invite**). Members table (Avatar+Name · Email · Role (inline editable) · Status · Last Active · overflow). Overflow: View Profile · Resend Invite · Suspend · Reactivate · Remove. |
| **Integrations** | Card grid (3 col). GitHub (OAuth, webhook URL, event checkboxes) · Slack (OAuth, channel selector, event toggles) · Generic Webhook (endpoint + HMAC secret + events). |
| **Agent** | Max concurrent tasks (Slider 1–10) · Task timeout (number + live human-readable preview) · Max retries (Slider 0–5) · Retry delay (Select) · Require approval (Switch, default on; disabling requires an AlertDialog) · Auto-generate plan (Switch) · Plan expiry (Select). Agent token: masked display + rotation instructions, never editable here. |
| **Audit Log** | Admin/Owner only. Filter bar (search · actor · action type · date range). Row expand reveals raw JSON in a `bg-log-bg` panel. **Export CSV**. |
| **Danger Zone** | **Abandon All Sessions** → AlertDialog. **Reset Agent Settings** → AlertDialog. **Delete All Specs & Plans** → type project name to confirm. **Delete Project** → AlertDialog, then type-to-confirm; success navigates to `/projects`. |

---

## 12. Navigation flow

```
Sidebar: Mission Control ──► Mission Control (/)
                               ├─ View all ──────────────► Sessions
                               └─ Blocked pill ──────────► Task Drawer (overlay)

Sidebar: Specifications ───► Specifications (/specs)
                               ├─ Row click ─────────────► Spec Detail
                               │                             ├─ Edit ───────────► Spec Editor
                               │                             ├─ Generate Plan ──► (stays, Plan tab)
                               │                             ├─ Approve ────────► (dialog → executing)
                               │                             ├─ Task row ───────► Task Drawer (overlay)
                               │                             ├─ Session link ───► Sessions
                               │                             └─ Breadcrumb ─────► Specifications
                               └─ New Spec ──────────────► Spec Editor (new)
                                                             ├─ Save Draft ─────► Spec Detail (Spec tab)
                                                             └─ Save & Plan ────► Spec Detail (Plan tab)

Sidebar: Sessions ─────────► Sessions (/sessions)
                               └─ Spec name link ────────► Spec Detail (Activity tab)

Sidebar: Settings ─────────► Settings (/settings)
                               └─ Delete Project ────────► Projects

Project switcher ──────────► Projects (/projects)

Cmd+K anywhere ────────────► Command Palette (overlay)
                               └─ Any nav item ──────────► Respective page
```

---

## 13. Shared component inventory

| Component | Used on |
|---|---|
| Brand mark | Sidebar, auth pages, onboarding, metadata, error pages |
| Status indicator (glyph + colour) | All task, spec, and session rows; sidebar agent status |
| Entity ID (mono, `text-fg-secondary`) | Task IDs (`T-042`), spec IDs (`SPEC-003`), session IDs (`SES-0091`) |
| Task row (collapsed + expanded) | Spec Detail → Tasks tab; Mission Control blocked pills |
| Event log row | Mission Control feed; Spec Detail → Activity; Sessions expanded |
| Log panel | Mission Control live log; Task Drawer → Attempts; Sessions inline expand |
| Diff viewer | Spec Detail → Changes; Task Drawer → Changes |
| Progress bar | Specifications table; Spec Detail header; Mission Control |
| Session row | Sessions; Mission Control (compact) |

> Do not use the DAEMON sprite, ASCII progress bar (`▓▒`), retro status character set (`▶✓⚠✕○`), or amber ID badge.

---

## 14. State machines

[`STATE_MACHINES.md`](./STATE_MACHINES.md) specifies spec, plan, task, and session state machines.
They are behavioural contracts. This document specifies their rendered state.
