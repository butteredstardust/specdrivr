# UI Specification — Shell & Pages

**Status:** Canonical for layout and behaviour.
**Last rewritten:** 2026-09-04 (UI overhaul, branch `feat/ui-overhaul`)
**Companion:** [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — tokens, primitives, and visual rules.

This document describes **what each screen contains and how it behaves**. `DESIGN_SYSTEM.md`
describes **how it looks**. When this document names a colour or a component, it is naming a token
or primitive defined there — never a raw value.

> **Provenance.** This is the surviving §10–§11 and §15–§17 of the pre-overhaul `DESIGN_SYSTEM.md`,
> retargeted to the rebuilt system. The layout and behavioural spec was sound and is preserved; the
> retro visual instructions (DAEMON mascot, scanline overlays, amber IDs, ASCII progress bars,
> typewriter boot sequences) are removed per the overhaul decision record in `todo.md`.

---

## 1. Application shell

The shell is fixed — sidebar and top bar never unmount during navigation. Only the main content
area changes. Implemented in `src/app/(app)/layout.tsx`.

### 1.1 Left sidebar (240px fixed)

- **Top:** brand mark (24px) + `specdrivr` wordmark.
- **Project switcher:** shows the active project as `org/repo`. Click opens a popover listing all
  projects. Switching sets `active-project-id` and re-fetches all scoped data.
- **Nav links** (icon + label, in order): Mission Control · Specifications · Sessions · Projects ·
  Notifications · Settings.
  > Six items. The pre-overhaul doc claimed four; Projects and Notifications had been added to the
  > code without the doc following. Six is correct.
- **Active item:** `bg-accent-subtle` + `text-accent`. **Inactive:** `text-fg-secondary`, hover
  `bg-surface-inset`. The old blue-left-border treatment is replaced by the subtle fill.
- **Bottom:** agent status line — status glyph + text (see §1.4). When blocked, it is a button that
  navigates to Mission Control. Below it: version tag (`text-2xs text-fg-muted`) and a `DEV` badge
  when dev mode is active.

### 1.2 Top bar (56px)

- **Left:** page title (`text-lg`, weight 600) + breadcrumb for nested pages (`text-sm
  text-fg-muted`, `/` separated).
- **Right, always:** notification bell with unread count · user avatar (28px initials circle) +
  dropdown.
- **Right, contextual:** primary action button(s) for the current page and state.

### 1.3 User avatar dropdown

Name + email (read-only header) · Profile Settings · Security · Notification Preferences ·
Keyboard Shortcuts · Sign Out.

Sign Out is immediate with no confirm; clears the session cookie and redirects to `/login`.

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

All overlays use `bg-surface-overlay` + `shadow-overlay` (dialogs, drawers) or `shadow-popover`
(popovers, dropdowns), move focus in on open, and return focus to the trigger on close.

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

> `Ctrl+\`` (Toggle Dev Mode) is retained only if dev mode survives the overhaul; confirm during
> Phase 4 and delete this line if not.

---

## 2. Authentication pages

No shell. Full-page centred layout on `bg-surface-base`.

**Card:** 400px, `bg-surface-raised border border-line rounded-xl p-8`. Brand mark (32px) +
`Specdrivr` wordmark + tagline.

### Login (`/login`)
- Fields: Email (autofocus) · Password · **Sign In** (accent, full width) · *Forgot password?* link.
- **Sign In** is disabled only while the request is in flight — never because fields are empty. The
  server validates.
- Error state: a `danger` banner below the button — "Invalid email or password." **Never field-level
  errors**; that would confirm which accounts exist.
- Demo bar (dev only): dashed border, *Sign in as Admin* / *Sign in as Member*.
- Redirect: unauthenticated access to any route → `/login?next={path}`; after login → `next` or `/`.

### Forgot Password (`/forgot-password`)
Single email field + **Send Reset Link**. Always shows the success state regardless of whether the
email exists.

### Reset Password (`/reset-password?token=`)
Token validated on load. Invalid/expired → "This link has expired." + **Request a new link**.
Two password fields + a 4-segment strength indicator. Must match; minimum 12 characters.

> The strength indicator was previously colour-only. It now carries a text label as well (§10,
> "never colour-only").

### Accept Invite (`/invite?token=`)
Token validated on load. Valid → email pre-filled read-only, plus Name, Password, Confirm, and
**Accept Invite & Sign In**. On success: user created, auto-signed-in, redirected to `/` with the
onboarding overlay on first run.

---

## 3. Mission Control (`/`)

### Needs Attention banner (only when blocked tasks exist)
Full-width `warning` banner: `AlertTriangle` + "{N} tasks need your input". Blocked task pills
inline (`T-019`, `T-033`…), each opening the Task Drawer. **Dismiss** is session-only; the banner
returns on next load while tasks remain blocked.

### Live Execution panel (left 60%)
- **Running:** header with a pulsing `info` dot + `LIVE`, session ID (mono, `text-fg-secondary`),
  elapsed timer. Progress bar `N / N tasks`. Current task line. Log tail (200px, `bg-log-bg`,
  auto-scroll, `aria-live="polite"`). Footer: **Pause** · **Cancel**.
- **Paused:** same layout, timer frozen, **Resume**, `warning` paused indicator.
- **Just completed (< 60s):** `Check` (`success`) + "Execution complete." + "N/N tasks succeeded." +
  **View Changes →**. Auto-clears to idle after 60s.
- **Idle:** empty state — icon, "No active session.", link to `/specs`.

> Removed: ASCII progress bar, blinking `▶`, xterm scanline overlay, and the 800ms typewriter boot
> sequence. Progress uses the `Progress` primitive; the log starts streaming immediately.

### Event Log feed (right 40%)
Header `EVENT LOG` (`text-2xs uppercase text-fg-muted`). Last 30 events. Row: timestamp (mono) ·
event type (colour-coded + glyph) · entity ID · description. Newest row carries a pulsing dot while
a session is active. **View all →** links to `/sessions`.

Colour coding: `TASK_DONE` → `success` · `BLOCKED` → `warning` · `ERROR` → `danger` · `PLAN_*` →
`info`.

---

## 4. Projects (`/projects`)

Table: ID (mono) · Name · Repository (mono `org/repo`) · Branch (mono) · Specs · Last Run · Status ·
overflow menu.

**New Project** → dialog: Name · Repository URL · Branch (default `main`) · Description →
**Initialize Project**.

Row click sets the active project and navigates to `/specs`.

Empty state: "No projects yet." + "Point Specdrivr at a repository to get started." +
**Initialize First Project**.

---

## 5. Specifications (`/specs`)

Table: ID (mono) · Name · Status badge · Version (mono, muted) · Tasks (`Progress` bar + `n/m`) ·
Plan badge · Last Run · overflow menu.

Status badges: `Draft` (muted) · `Generating` (info, pulsing) · `Review` (warning) · `Running`
(info, pulsing) · `Stalled` (danger) · `Done` (success).

**New Spec** navigates to `/specs/new` — not a dialog.

Empty state: "No specifications." + "Describe what you want built. Specdrivr plans the how." +
**Write First Spec**.

---

## 6. Spec Editor (`/specs/new`, `/specs/[id]/edit`)

Full-page; sidebar hidden. Top bar only: back arrow · spec name (large mono input) · **Save Draft** ·
**Save & Generate Plan**.

- **Save Draft** enabled when the name is non-empty.
- **Save & Generate Plan** enabled when the name is filled **and** content ≥ 50 characters.
- Layout: two-pane split with a drag handle, default 50/50. Left: CodeMirror 6 (line numbers, active
  line highlight, wrap on). Right: rendered Markdown preview.
- Footer strip: word count · line count · version indicator.
- **Active plan warning** (`warning`, sticky): "This spec has an active plan (vN). Saving creates
  vN+1 and abandons the current plan."
- **Changes requested** (`warning`, sticky): quotes the reviewer's note.
- **Concurrent edit** (`warning`): "{Name} is currently editing this spec."

---

## 7. Specification Detail (`/specs/[id]`)

### Header
`SPEC-003` (mono, `text-fg-secondary`) above the spec name. Status indicator + plan status badge.

Contextual action (right):

| Spec status | Action |
|---|---|
| `drafting` / `stalled` | **Generate Plan →** (accent) |
| `pending_approval` | **Review Plan →** (outline) — scrolls to the Plan tab |
| `executing` | **SES-0091** (link) + **Pause** (outline) |
| `complete` | **Re-run** + **Edit** (both outline) |

Overflow menu: Edit · Duplicate · Delete, contextual on status.

### Tab: Spec
Rendered Markdown of the current version. Version history strip of clickable pills
(`v1 → v2 → v3 (current)`). Viewing an old version shows a "Viewing v1 · Not current" banner +
**Back to current**.

### Tab: Plan

| Plan state | Content |
|---|---|
| none | Empty state + **Generate Plan** |
| `pending_approval` | `warning` review banner + three actions → Architecture Decisions accordion → read-only task list → Review History (collapsed) |
| `changes_requested` | `warning` banner quoting the note + **Edit Spec →**. Plan visible but de-emphasised, no actions |
| `rejected` | `danger` banner quoting the reason + **Generate New Plan** + collapsible **View Rejected Plan** |
| `approved` / `executing` / `complete` | Read-only plan + approval timestamp, no actions |

**Review actions** (`pending_approval` only):
- **Request Changes** (warning outline) → slide-down panel, required textarea. Submitting sets the
  plan to `changes_requested` and notifies the spec author.
- **Reject Plan** (danger outline) → slide-down panel, required reason + warning. Confirming sets the
  plan to `rejected` and the spec to `drafting`.
- **Approve & Execute** (accent) → confirmation dialog. Admin/Owner only; Members see a disabled
  button with an explanatory tooltip. Dialog shows repo/branch + task count + optional notes.

### Tab: Tasks
- `pending_approval`: read-only preview + notice — "Tasks begin executing after plan approval."
- Otherwise: filter pills (All · Todo · Running · Blocked · Done · Failed) + search + a summary strip
  of colour-coded counts.
- **Task row** (36px): status glyph · `T-042` (mono) · title · duration (muted, right) · overflow.
- Blocked rows: `border-l-2 border-danger-border` + `AlertTriangle` + truncated reason (60 chars).
- Row click expands inline: description (3 lines) · dependency pills · last log line · attempt count
  if > 1 · **Open Detail →**.
- **Row click never opens the drawer directly** — only **Open Detail →** or the overflow menu do.

### Tab: Changes
Header `FILE CHANGES` + `+142 −38` (mono, success/danger). Two panes: file tree (200px, `+`/`~`/`-`
prefix) + diff viewer using `diff-added` / `diff-removed` tokens.

### Tab: Activity
Event log scoped to this spec, grouped by session, with collapsible session headers.

---

## 8. Task Drawer

**Entry:** **Open Detail →** in an expanded task row, the overflow menu, or a blocked task pill in
Mission Control.

**Header:** `T-042` (mono, `text-lg`) · title · status badge (inline editable dropdown).
*(The DAEMON sprite that previously mirrored task status is removed; the badge carries the status.)*

- **Overview:** description (Markdown) · dependency pills (click navigates to that task's drawer) ·
  related architecture decisions.
  - *Blocked:* `danger` panel with the reason, a context textarea, and **Retry with context**
    (disabled until non-empty).
  - *Failed:* `warning` panel with the last error and **Retry**.
- **Attempts:** newest first. Row header: `Attempt N` · status · duration · timestamp (collapsible).
  Expanded: log panel (320px, `bg-log-bg`, scrollable). In-progress attempts auto-scroll.
- **Changes:** diff viewer scoped to this task. Empty state when the task is incomplete.
- **Footer:** **Re-run** · **Mark Blocked** · **Mark Done**, shown only when contextually valid and
  never for tasks in a terminal state.

---

## 9. Sessions (`/sessions`)

Filter bar: search · status · spec · date range.

Timeline grouped by date (`TODAY` / `YESTERDAY` / `THIS WEEK`, `text-2xs uppercase text-fg-muted`).

Session row (40px): status dot (pulsing `info` when running) · session ID (mono) · spec name (link) ·
time range · task count + status glyph · overflow menu.

Row click expands inline with a per-task event log; running sessions get a compact log panel (120px)
at the bottom of the expanded row.

---

## 10. Notifications (`/notifications`)

Filter tabs: All · Unread · Mentions. Full-width list, 56px rows. **Mark all read** top-right.
Infinite scroll, 50 per page.

Bell icon in the top bar: numeric badge (max `9+`) in `accent`, click opens the Notification Panel
(popover, 380px wide, 480px max height).

> The badge was amber; amber is no longer an accent. It is now `accent`, consistent with every other
> interactive indicator.

### Delivery channels
- **In-app:** Notification Panel + `/notifications`, polled every 3s (same interval as session polling).
- **Email:** transactional via Resend, plain-text-first. Never more than one email per event per user.

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
- Badge updates via the 3s poll on `GET /api/v1/notifications?unread=true&count=true`.
- Clicking a row marks it read (`PATCH /api/v1/notifications/{id}`) **and** navigates to `linkUrl` —
  one action, no separate mark-read step.
- **Mark all read** → `POST /api/v1/notifications/read-all`, badge clears optimistically.

---

## 11. Settings (`/settings`)

**Sub-navigation** (200px left column):
- **Account:** Profile · Security · Notifications
- **Project:** General · Team · Integrations · Agent · Audit Log
- **Danger Zone**

> `settings-nav.tsx` currently has two entries pointing at `/settings/security` — a copy-paste bug.
> Fixed in Phase 5.

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

> Removed from this inventory: the DAEMON sprite (all expressions), the ASCII progress bar (`▓▒`),
> the retro status character set (`▶✓⚠✕○`), and the amber ID badge. Their replacements are listed
> above.

---

## 14. State machines

Spec, plan, task, and session state machines are specified in
[`STATE_MACHINES.md`](./STATE_MACHINES.md). They are behavioural contracts, not UI, and are
unaffected by this overhaul. This document only specifies how each state is *rendered*.
