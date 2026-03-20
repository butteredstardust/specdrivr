**SPECDRIVR**

Master Product Specification - Product Features

Version 1.0 · Confidential

Spec-driven autonomous code execution for engineering teams

---

[Status: GROUND TRUTH]

## Table of Contents

**Part 1 — Authentication & Authorization**

- 1.1 Login Page
- 1.2 Forgot Password
- 1.3 Reset Password
- 1.4 Accept Invite

**Part 2 — User Management & RBAC**

- 2.1 Roles & Permissions
- 2.2 Team Management
- 2.3 Member Profile

**Part 3 — Plan Review & Rejection**

- 3.1 Plan Review Actions
- 3.2 Audit Trail

**Part 4 — Onboarding**

- 4.1 Onboarding Flow

**Part 5 — Notifications**

- 5.1 Notification Bell
- 5.2 Notifications Page

**Part 6 — Settings**

- 6.1 Profile Settings
- 6.2 Security Settings
- 6.3 Notification Preferences
- 6.4 General Project Settings
- 6.5 Integrations
- 6.6 Agent Configuration
- 6.7 Audit Log
- 6.8 Danger Zone

**Part 7 — User Profile Menu**

**Part 8 — Empty States**

**Part 9 — Edge Cases & Micro-Interactions**

---

# Part 1 — Authentication & Authorization

## 1.1 Login Page (`/login`)

**Route**: `/login`
**Shell**: No sidebar. No top bar. Full-page centered layout.
**Redirect rule**: Any unauthenticated request to any route redirects to `/login?next=[original-path]`. After login, redirect to `next` or `/` if absent.

### Layout

- Background: `#0a0a0b` (same as app)
- Centered card (400px wide, `bg-[#111113]`, `border border-[#1e1e21]`, `rounded-xl`, `p-8`)
- Top of card: DAEMON `idle` sprite (48px) + `"SPECDRIVR"` wordmark (mono, `text-xl`)
- Tagline below wordmark: `"Spec-driven development."` (muted, `text-sm`)

### Form Fields

- Email (`type="email"`, label: `EMAIL`, mono uppercase label style, autofocus)
- Password (`type="password"`, label: `PASSWORD`)
- `[Sign In]` button (primary violet, full width)
- `Forgot password?` link (right-aligned below password field, muted, small)

### Validation

- Email: must be valid email format — inline error on blur: `"Enter a valid email address."`
- Password: required — inline error on submit: `"Password is required."`
- `[Sign In]` disabled only while request is in-flight (not while fields are empty — let the server validate)

### On `[Sign In]` Click

- Button: spinner + `"Signing in..."`

### Data Operation

```ts
// POST /api/auth/sign-in
// { email, password }
// Handled by BetterAuth catch-all at /api/auth/[...auth]
// Uses BetterAuth credentials provider
// Returns: session token set as httpOnly cookie, session cached in Redis via ioredis
```

### Success

Redirect to `next` param or `/`

### Error UI

- `[Sign In]` re-enables
- Red banner below the button (NOT inline on fields — never indicate which field is wrong for security):
  `"Invalid email or password."` — no DAEMON here, this is a security surface, keep it sterile
- Password field cleared, email field retains value

### Bottom of Card

- `"Don't have an account? Contact your administrator."` (muted, `text-xs`, centered)
- No self-signup. Accounts are admin-provisioned only (developer tool, not a SaaS).

### Demo Login Shortcut (development mode only)

Shown when `NODE_ENV !== 'production'`:

- Dashed border section below the card: `"DEMO ACCESS"` (mono, amber, uppercase)
- `[Sign in as Admin]` · `[Sign in as Member]` — one-click demo login with seeded credentials
- This section is completely hidden in production

---

## 1.2 Forgot Password (`/forgot-password`)

**Layout**: Same shell as login. Simpler card.

**Form**: Email field only. `[Send Reset Link]` button.

**Data operation**:

```ts
// POST /api/auth/forgot-password { email }
// Always returns success — never confirm if email exists (security)
```

**Success UI** (always shown, regardless of whether email exists):

- Form replaced by: DAEMON `success` (32px) + `"Check your email."` + `"If that address is registered, a reset link is on its way."` + `[Back to Sign In]` link

---

## 1.3 Reset Password (`/reset-password?token=[token]`)

**Layout**: Same shell. Card with two password fields.

**Form**: New Password · Confirm New Password. `[Set New Password]` button.

### Validation

- Password min 12 characters — inline strength indicator (4 segments: weak/fair/good/strong) using color only (red/amber/amber/emerald). No text labels on strength bar.
- Passwords must match — inline error on second field blur: `"Passwords don't match."`
- Token validation: if token is invalid or expired, show full-card error on page load: DAEMON `error` + `"This link has expired."` + `[Request a new link]` → `/forgot-password`

**Data operation**:

```ts
// POST /api/auth/reset-password { token, newPassword }
```

**Success**: Redirect to `/login` with Sonner toast (pre-set, shown on login page load): `"Password updated. Sign in with your new password."`

---

## 1.4 Accept Invite (`/invite?token=[token]`)

**Layout**: Same shell.

**On page load**: Token is validated server-side. If valid, pre-fill email (read-only, greyed out). If invalid: DAEMON error + `"This invite link has expired or already been used."` + `[Contact your administrator]` (mailto link).

**Form**: Name (text, required) · Password · Confirm Password. `[Accept Invite & Sign In]` button.

**Data operation**:

```ts
// POST /api/auth/accept-invite { token, name, password }
// Creates user record, sets role from invite, invalidates token
// Auto-signs in after success
```

**Success**: Redirect to `/` (Mission Control). Onboarding flow triggers (see Part 4).

---

# Part 2 — User Management & RBAC

## 2.1 Roles & Permissions

Three roles. Role is **per-project**, not global (a user can be Admin on Project A and Member on Project B, except for the Owner role which is global).

| Role       | Capabilities                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| **Owner**  | Everything. Can delete the organisation. Only one Owner per account. Can transfer ownership.                 |
| **Admin**  | All project actions. Invite/remove users. Change roles (up to Admin). Cannot delete the org or change Owner. |
| **Member** | Create specs, generate plans, view all data. Cannot approve plans, invite users, or change settings.         |
| **Viewer** | Read-only. Can view specs, plans, tasks, sessions, changes. Cannot create or modify anything.                |

**Approval gate rule**: Only `Admin` and `Owner` roles can approve a plan. `Member` sees the `[APPROVE & EXECUTE]` button but it is disabled with a Tooltip: `"Only Admins can approve execution."` — never hide the button entirely, always show the affordance.

---

## 2.2 Team Management (`/settings/team`)

**Access**: Admin and Owner only. Members/Viewers see this nav item but clicking shows a 403 state (DAEMON `blocked` + `"You need Admin access to manage the team."`).

**Route**: `/settings/team` (sub-page within Settings, appears in Settings left sub-nav as `Team`)

### Members Table

Full-width table.
Columns: `Avatar + Name` · `Email` · `Role` (editable dropdown, see below) · `Status` (badge: `active` / `invited` / `suspended`) · `Last Active` (relative) · `⋯` menu

### Role Dropdown

Inline, per row:

- Clicking role cell opens a small popover with role options
- Cannot set a role higher than your own (Admin cannot create another Owner)
- Cannot change your own role
- Changes save immediately on selection (no separate Save button):
  ```ts
  // UPDATE project_members SET role = newRole WHERE userId = id AND projectId = activeProject
  ```
- Sonner toast: `"Role updated for [Name]."`

### Member Menu Options

- `View Profile` → opens Member Profile Sheet (see below)
- `Resend Invite` (only if status = `invited`) → resends invite email → toast: `"Invite resent to [email]."`
- `Suspend` (only if status = `active`) → opens AlertDialog: `"Suspend [Name]? They will lose access immediately."` → on confirm: status → `suspended`, session invalidated
- `Reactivate` (only if status = `suspended`) → immediate, no dialog
- `Remove from Project` → AlertDialog: `"Remove [Name] from [Project]? Their work will not be deleted."` → on confirm: removes member

### Invite Section

`INVITE TEAM MEMBER` section header (mono, muted).

- Email input + Role dropdown (Member / Admin / Viewer) + `[Send Invite]` button (same row)
- Sending invite:
  ```ts
  // INSERT into invites: { projectId, email, role, token: uuid(), expiresAt: +7 days }
  // Sends invite email with /invite?token=[token] link
  ```
- Success: new row appears at bottom of table with status `invited`, email shown, role set, `Last Active` = `"Never"`
- Error (email already a member): inline error below email input: `"This email is already on the team."`
- Error (email already invited): `"An invite is already pending for this email."` + `[Resend?]` link inline

---

## 2.3 Member Profile Sheet

**Trigger**: `View Profile` in ⋯ menu, or clicking member's name/avatar in table
**Component**: shadcn Sheet, right side, 400px

**Contents**:

- Avatar (initials-based, generated: first letter of first + last name, coloured by hash of name) + full name + email
- Role badge
- Status badge
- `Member since` date
- `Last active` relative timestamp
- **Activity section**: last 10 agent events attributed to this user (read-only event log, mono rows)
- **Specs section**: list of specs this user created (linked)
- Footer (Admin/Owner only): `[Suspend]` · `[Remove from Project]` buttons

---

# Part 3 — Plan Review & Rejection

The existing approval flow (FLOW 5) is a binary approve/cancel. Real-world plan review needs rejection with feedback, partial review, and an audit trail.

## 3.1 Plan Review Actions

When `plan.status === 'pending_approval'`, the PLAN tab renders a full review panel:

### Plan Review Header

Amber surface: `bg-amber-950/20 border border-amber-900/40 rounded-lg p-4`:

- Left: DAEMON `idle` (20px) + `"Plan ready for review"` (bold) + `"Generated [time ago] · v[N] · [N] tasks · [N] architecture decisions"`
- Right: Three action buttons (right-aligned):
  - `[Request Changes]` (outline amber)
  - `[Reject Plan]` (outline red)
  - `[Approve & Execute]` (primary violet — disabled for Members, tooltip: `"Only Admins can approve"`)

### Request Changes

**Data operation**:

```ts
// UPDATE plans SET status = 'changes_requested'
// INSERT into plan_reviews: { planId, userId, action: 'changes_requested', notes: textareaValue, createdAt: now() }
// UPDATE specs SET status = 'stalled'
// Notify spec creator via notification
```

**Success UI**:

- Review panel closes
- Amber banner replaced by a `"Changes Requested"` banner (amber outline):
  - `"[Your Name] requested changes [time ago]"`
  - Quoted note text (muted, italic, indented)
  - `[Edit Spec →]` button — navigates to Spec Editor with the review note visible as a sticky banner inside the editor
- Spec status badge: `stalled`
- Sonner toast: `"Changes requested. The spec author will be notified."`

**Inside Spec Editor after "Changes Requested"**:

- Amber sticky banner at top of editor (above CodeMirror):
  ```
  CHANGES REQUESTED by [Reviewer Name] · [time ago]
  "[reviewer's note text]"
  [Dismiss]
  ```
- After user edits and saves: spec creates new version → plan is abandoned → status returns to `drafting` → user must regenerate plan

### Reject Plan

**Data operation**:

```ts
// UPDATE plans SET status = 'rejected'
// INSERT into plan_reviews: { planId, userId, action: 'rejected', notes, createdAt: now() }
// UPDATE specs SET status = 'drafting'
```

**Success UI**:

- PLAN tab switches to a `rejected` state (different from the empty state):
  - DAEMON `error` (32px)
  - `"Plan rejected"` (bold)
  - `"[Reviewer Name] rejected this plan [time ago]:"`
  - Quoted rejection reason (red surface, italic)
  - `[Generate New Plan]` button (primary) — triggers plan generation from the same spec version
  - `[View Rejected Plan]` toggle (muted, small) — clicking reveals the rejected plan content below (collapsed by default, so the screen isn't cluttered)
- Spec status badge: `drafting`
- Sonner toast (red): `"Plan rejected."`

### Approve with Notes (Optional)

When clicking `[Approve & Execute]`, the confirmation dialog gains an optional notes field:

```
[DAEMON working sprite]
Starting execution on main branch of org/repo
22 tasks will run autonomously.

Add a note for this approval (optional):
[                                    ]

[Cancel]          [Confirm Execution]
```

Notes are stored in `plan_reviews` with `action: 'approved'`. Shown in Review History.

---

## 3.2 Audit Trail [Status: Implementation Pending - See FUTURE_SPECIFICATIONS.md]

Audit trail for plan reviews is planned for a future update.

---

# Part 4 — Onboarding

## Onboarding Flow

First-time experience for new users. Triggered after invite acceptance or first login with a fresh account.

**Trigger**: `onboardingComplete = false` on user record after first login.
**Component**: A modal overlay that covers the full app, but the app is dimly visible behind it (backdrop blur). Not a separate route — the user is technically on `/` but can't interact with it yet.

### Step 1 of 3 — Welcome

```
[DAEMON idle, 64px]

Welcome to Specdrivr, [Name].

I'm DAEMON. I'll execute your specifications as code.
Here's how we work together.

                              [Get Started →]
```

No skip button. Three steps take 30 seconds total.

### Step 2 of 3 — The Flow

Visual flow diagram (built with divs, not a library):

```
  [Write Spec]  →  [I Generate a Plan]  →  [You Approve]  →  [I Build It]
```

Each step has a small icon + two-line description. The two human steps (`Write Spec`, `You Approve`) are highlighted in violet. The two DAEMON steps are in amber (DAEMON's color). This communicates the human/agent division of labour visually.

Short description below: `"You stay in control. I never execute without your approval."`

`[← Back]` · `[Next →]`

### Step 3 of 3 — Create your first project

Inline mini-form (inside the modal, not navigating away):

- Project name (text, required)
- Repository URL (text, required)
- Branch (default `main`)
- `[Create Project & Start]` button

On success: overlay closes, user lands on `/specs` (empty state with DAEMON + CTA to create first spec). The modal never shows again (`onboardingComplete = true`).

**Returning user shortcut**: If user has been here before and dismissed accidentally, they can re-open onboarding from: `Settings → General → [Restart Onboarding Tour]` link (muted, small, at bottom of General section).

---

# Part 5 — Notifications

## 5.1 Notification Bell

Add a bell icon to the top bar (right side, left of any user avatar). Shows an amber numeric badge when unread notifications exist (max displayed: `9+`).

**Click**: opens a Notification Panel — a Popover (shadcn Popover) anchored to the bell, 380px wide, max 480px tall, scrollable.

**Notification Panel**:

- Header: `NOTIFICATIONS` (mono, muted, uppercase, small) + `[Mark all read]` link (right)
- List of notifications, newest first (no grouping by date in this panel — keep it simple)
- Footer: `[View all notifications →]` → `/notifications` page

**Each notification row** (48px, hover bg tint):

- Unread: violet left border + slightly brighter text
- Read: no border
- Avatar (16px initials circle, or DAEMON sprite for system events) + text description + relative timestamp
- Click: marks as read + navigates to relevant page

**Notification types and their destinations**:

| Event                        | Notification text                                                     | Destination                            |
| ---------------------------- | --------------------------------------------------------------------- | -------------------------------------- |
| Plan generated (for my spec) | `"DAEMON generated a plan for [Spec Name]. Review before executing."` | `/specs/[id]?tab=plan`                 |
| Plan approved (I'm member)   | `"[Admin] approved the plan for [Spec Name]. Execution has started."` | `/specs/[id]?tab=tasks`                |
| Plan rejected (my spec)      | `"[Admin] rejected the plan for [Spec Name]."`                        | `/specs/[id]?tab=plan`                 |
| Changes requested (my spec)  | `"[Admin] requested changes to the plan for [Spec Name]."`            | `/specs/[id]/edit`                     |
| Session complete             | `"Execution of [Spec Name] is complete. [22/22] tasks succeeded."`    | `/specs/[id]?tab=changes`              |
| Task blocked (I'm watcher)   | `"DAEMON is blocked on [T-042] in [Spec Name]. Input needed."`        | `/specs/[id]?tab=tasks` → opens drawer |
| Session failed               | `"Execution of [Spec Name] failed on [T-019]."`                       | `/specs/[id]?tab=activity`             |
| Invited to project           | `"[Admin] invited you to [Project Name]."`                            | `/projects`                            |
| Role changed                 | `"Your role in [Project Name] was changed to [Role]."`                | `/settings/team`                       |

**Data model**:

```ts
interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl: string;
  readAt: Date | null;
  createdAt: Date;
  actorUserId: string | null; // null for system (DAEMON) events
}
```

---

## 5.2 Notifications Page (`/notifications`)

**Route**: `/notifications`
**Nav**: Not in sidebar. Accessed only from `View all →` in the bell panel.

**Contents**:

- Filter tabs: `All` · `Unread` · `Mentions` (mono uppercase, pill style)
- Full-width list, same row format as the panel but with more whitespace (56px rows)
- `[Mark all read]` button (top right)
- Infinite scroll (load 50 at a time)
- Empty state: DAEMON `idle` + `"All caught up."` + `"No notifications. DAEMON has nothing to report."`

---

# Part 6 — Settings

Settings sub-nav (left column, 200px):

```
ACCOUNT
  Profile
  Security
  Notifications

PROJECT
  General
  Team               ← (Admin/Owner only — greyed for others)
  Integrations
  Agent
  Audit Log

DANGER ZONE
```

---

## 6.1 Profile Settings (`/settings/profile`)

**Avatar section**:

- Large initials avatar (64px, same deterministic colour as member table)
- `"Avatar is generated from your name. Custom avatars are not supported."` (muted, `text-xs`)

**Form fields**:

- Display Name (text, required)
- Email (text, read-only, greyed — cannot change email without support)
  - Small note: `"To change your email, contact your administrator."`
- `[Save Profile]` button

**Data operation**:

```ts
// UPDATE users SET name = displayName WHERE id = currentUser.id
// Recalculates avatarInitials and avatarColor
```

---

## 6.2 Security Settings (`/settings/security`)

### Change Password Section

- Current Password (required)
- New Password (required, same strength indicator as reset flow)
- Confirm New Password (required)
- `[Update Password]` button

### Active Sessions Section

Header: `ACTIVE SESSIONS` (mono, muted)

Table: Device/Browser · Location (IP-based, e.g. `London, UK`) · Last active · `[Revoke]` button per row

Current session row: highlighted with `(this session)` label — no Revoke button for current session.

`[Revoke all other sessions]` link below table (red, muted) → AlertDialog → on confirm: invalidates all other sessions.

### API Tokens Section

Header: `API TOKENS` (mono, muted)
Description: `"Use tokens to authenticate the DAEMON agent or external integrations."`

Table: Token name · Prefix (e.g. `sdk_...`) · Created · Last used · Expires · `[Revoke]`

`[+ Generate Token]` button → Dialog:

- Token Name (text, required, e.g. `"CI Pipeline"`)
- Expiry: radio group — `30 days` / `90 days` / `1 year` / `Never` (default: 90 days)
- `[Generate]` button

After generation: **one-time reveal dialog** (cannot be shown again):

```
[DAEMON success sprite]
Your new API token:

sdk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxx

[Copy Token]

⚠ This token will not be shown again. Copy it now.
[I've copied it — Close]
```

`[I've copied it — Close]` closes dialog. Token appears in table with a masked prefix only.

---

## 6.3 Notification Preferences (`/settings/notifications`)

**Description**: `"Choose when DAEMON notifies you."`

Two columns: Email · In-app (toggles)

| Event                        | Email          | In-app         |
| ---------------------------- | -------------- | -------------- |
| Plan generated for my spec   | ○              | ● (default on) |
| Plan approved                | ○              | ●              |
| Plan rejected                | ● (default on) | ●              |
| Changes requested on my spec | ●              | ●              |
| Session complete             | ○              | ●              |
| Task blocked (specs I own)   | ●              | ●              |
| Session failed               | ●              | ●              |
| Team invitation sent         | ●              | ●              |
| Role changed                 | ●              | ●              |

Each row: event name (left) · email toggle (shadcn Switch) · in-app toggle

`[Save Preferences]` button at bottom (saves all at once, not per-toggle)

---

## 6.4 General Project Settings (`/settings/general`)

**Fields**:

- Project Name (text, required)
- Project Description (textarea, 3 rows)
- Repository URL (text, with `[Verify Connection]` button inline — pings the repo and returns ✓ or ✕ + error)
- Default Branch (text, default `main`)
- Timezone (searchable select — used for displaying dates in the UI and scheduling)
- `[Save Changes]` button

### Repository Verification

Inline, triggered by `[Verify Connection]`:

- Button: spinner + `"Checking..."`
- Success: green checkmark + `"Connected · [N] commits ahead on main"` (muted)
- Failure: red ✕ + `"Could not connect. Check the URL and your AGENT_TOKEN permissions."`

---

## 6.5 Integrations (`/settings/integrations`)

**Layout**: Card grid (3 columns, 320px cards). Each card: integration logo (SVG icon) + name + status badge + description + action button.

### GitHub Integration Card

- Status: `Connected` (emerald) or `Not connected` (muted)
- Description: `"Sync repository events and enable webhook triggers."`
- If connected: shows `"Connected as [github-username]"` + `[Disconnect]` link (red, muted)
- If not connected: `[Connect GitHub]` button → OAuth flow (redirect to GitHub, return to `/settings/integrations?connected=github`)
- After connect: card updates to `Connected` state, webhook URL revealed:
  ```
  Webhook URL (read-only, copy button):
  https://specdrivr.app/api/webhooks/github/[projectId]
  ```

### Webhook Events Section

Below cards, only shown if GitHub connected:

Checkboxes for which events trigger notifications:

- `push` to watched branch → `"Notify me when commits are pushed to [branch]"`
- `pull_request` opened → `"Notify when PRs reference my specs"`

### Slack Integration Card

- Status: `Not connected`
- Description: `"Send DAEMON status updates to a Slack channel."`
- `[Connect Slack]` → OAuth flow
- After connect: channel selector dropdown (fetches user's Slack channels)
- Toggle: `"Notify channel when session starts"` / `"Notify channel when session completes"` / `"Notify channel when tasks are blocked"`

### Generic Webhook Card

- Status: always `Available`
- Description: `"POST session events to any HTTP endpoint."`
- `[+ Add Webhook]` → Dialog:
  - Endpoint URL (text, `https://...`)
  - Secret (text, optional — used to sign payloads, HMAC-SHA256)
  - Events (checkboxes: session.started / session.completed / task.blocked / plan.approved)
  - `[Save Webhook]`

---

## 6.6 Agent Configuration (`/settings/agent`)

### Execution Section

- `Max concurrent tasks` — shadcn Slider (1–10, default 3). Label shows current value right of slider: `"3 tasks"`. Description: `"Higher values speed up execution but increase the chance of merge conflicts."`
- `Task execution timeout` — number input with `seconds` suffix + a human-readable preview below: `"Tasks will be killed after 5 minutes."` (updates live as user types)
- `Max retries per task` — Slider (0–5, default 2). Description: `"DAEMON will retry failed tasks before marking them blocked."`
- `Task retry delay` — Select: `Immediately` / `30 seconds` / `1 minute` / `5 minutes` (default: `30 seconds`)

### Planning Section

- `Require plan approval before execution` — shadcn Switch (default ON). If toggled OFF: AlertDialog (see FLOW 25 in previous doc).
- `Auto-generate plan on spec save` — Switch (default OFF). Description: `"Automatically triggers plan generation when you save a spec. You still need to approve before execution."`
- `Plan expiry` — Select: `Never` / `24 hours` / `7 days` / `30 days`. Description: `"Plans older than this are marked stale and must be regenerated before execution."`

### Agent Token Section

- Read-only display of the active `AGENT_TOKEN` (masked: `sdk_...xxxx`)
- `"This token is set via environment variable. Rotate it in your infrastructure, then update AGENT_TOKEN."` (muted, `text-xs`)
- Link: `[How to rotate the agent token →]` (opens docs in new tab)

`[Save Agent Settings]` button at bottom.

---

## 6.7 Audit Log (`/settings/audit`)

**Access**: Admin and Owner only.

**Description**: `"A complete record of administrative actions taken in this project."`

**Filter bar**: Search · Actor (user dropdown) · Action type dropdown · Date range

**Table** (newest first):
Columns: `Timestamp` (mono, full datetime) · `Actor` (avatar + name) · `Action` (mono badge) · `Target` · `Details`

**Action types** (mono, coloured badges):

- `PLAN_APPROVED` (emerald)
- `PLAN_REJECTED` (red)
- `CHANGES_REQUESTED` (amber)
- `MEMBER_INVITED` (violet)
- `MEMBER_REMOVED` (red)
- `ROLE_CHANGED` (amber)
- `PROJECT_SETTINGS_CHANGED` (muted)
- `AGENT_SETTINGS_CHANGED` (muted)
- `SESSION_CANCELLED` (amber)
- `API_TOKEN_CREATED` (violet)
- `API_TOKEN_REVOKED` (red)

**Each row expands** on click to show full detail JSON (mono, dark bg — same `.terminal-surface` treatment as log panels) — this is Dev-facing detail and should feel technical.

**Export**: `[Export CSV]` button (top right) — downloads filtered results as CSV.

---

## 6.8 Danger Zone

**Restructured with explicit confirmation patterns per action**:

```
DANGER ZONE
─────────────────────────────────────────────────
These actions are irreversible. Proceed carefully.
```

### 1. Abandon All Running Sessions

- Description: `"Immediately stop all running agent sessions. In-progress tasks will be marked failed."`
- Button: `[Abandon All Sessions]` (outline amber)
- Confirmation: AlertDialog — `"Abandon [N] running sessions?"` · `[Keep Running]` · `[Abandon All]` (amber)
- No type-to-confirm needed (recoverable — specs/plans are preserved)

### 2. Reset All Agent Settings to Defaults

- Description: `"Resets timeouts, retries, concurrency, and approval settings to factory defaults."`
- Button: `[Reset Agent Settings]` (outline amber)
- Confirmation: AlertDialog — simple confirm, no type-to-confirm

### 3. Delete All Specs & Plans

- Description: `"Permanently deletes all specifications, plans, tasks, and session history for this project. The project itself and team members are preserved."`
- Button: `[Delete All Specs & Plans]` (outline red)
- Confirmation: type project name to confirm (same pattern as FLOW 26)

### 4. Delete Project

- Description: `"Permanently deletes this project and everything in it. This cannot be undone."`
- Button: `[Delete Project]` (solid red, `bg-red-600`)
- Confirmation: two-step:
  - Step 1: AlertDialog — `"Are you sure? This will delete [N] specs, [N] tasks, and [N] sessions."` · `[Cancel]` · `[Yes, delete project]`
  - Step 2 (after confirming step 1): Dialog with type-to-confirm input — must type exact project name. Only then does the `[Permanently Delete]` button enable.

---

# Part 7 — User Profile Menu

Add a user avatar/menu to the top-right of the top bar (persistent across all app pages).

**Component**: shadcn DropdownMenu anchored to an initials avatar (32px circle).

**Menu items**:

```
[Avatar + Name + email]  ← read-only header, not clickable
────────────────────────
Profile Settings          → /settings/profile
Security                  → /settings/security
Notifications             → /settings/notifications
────────────────────────
Keyboard Shortcuts        → opens ? shortcut dialog
────────────────────────
Sign Out
```

**Sign Out**:

- No confirmation dialog — sign out immediately
- Clear session cookie
- Redirect to `/login`
- Sonner toast pre-set to appear on login page: `"You've been signed out."`

---

# Part 8 — Empty States

Every empty state must have unique copy, a DAEMON expression, and a primary CTA. Never reuse copy across contexts.

| Page / Context                   | DAEMON expression | Heading                   | Subtext                                                                       | CTA                          |
| -------------------------------- | ----------------- | ------------------------- | ----------------------------------------------------------------------------- | ---------------------------- |
| `/projects` (no projects)        | `idle`            | `"No projects yet."`      | `"Point me at a repository and I'll get to work."`                            | `[Initialize First Project]` |
| `/specs` (no specs)              | `idle`            | `"No specifications."`    | `"Write what you want to build. I'll figure out the how."`                    | `[Write First Spec]`         |
| PLAN tab (no plan)               | `idle`            | `"No plan generated."`    | `"Run me on this spec and I'll produce an architecture and execution plan."`  | `[Generate Plan]`            |
| PLAN tab (rejected)              | `error`           | `"Plan rejected."`        | `"[Reviewer] rejected this plan. Generate a new one or edit the spec first."` | `[Generate New Plan]`        |
| TASKS tab (no tasks)             | `idle`            | `"No tasks yet."`         | `"Tasks are created when a plan is approved."`                                | `[Go to Plan →]`             |
| CHANGES tab (no changes)         | `idle`            | `"No file changes."`      | `"Changes will appear here once DAEMON starts executing tasks."`              | `[View Tasks →]`             |
| ACTIVITY tab (no activity)       | `idle`            | `"No sessions yet."`      | `"Approve a plan to start the first execution session."`                      | `[Go to Plan →]`             |
| Task Drawer CHANGES (no changes) | `idle`            | `"No changes yet."`       | `"DAEMON hasn't modified any files for this task."`                           | none                         |
| `/sessions` (no sessions)        | `idle`            | `"No sessions recorded."` | `"Sessions appear here once execution begins."`                               | none                         |
| `/notifications` (empty)         | `idle`            | `"All caught up."`        | `"No notifications. DAEMON has nothing to report."`                           | none                         |
| `/settings/audit` (no entries)   | `idle`            | `"No audit entries."`     | `"Administrative actions will be logged here."`                               | none                         |
| Team page (no members)           | `idle`            | `"Just you."`             | `"Invite your team to collaborate on specs and review plans."`                | `[Invite Someone]`           |
| 404                              | `error`           | `"404 — Not found."`      | `"This page doesn't exist or you don't have access."`                         | `[Go to Mission Control]`    |

---

# Part 9 — Edge Cases & Micro-Interactions

## Spec Name Collision

If a user tries to save a spec with the same name as an existing spec in the project:

- Server returns a 409
- Inline error below the name field: `"A spec named '[name]' already exists in this project."`
- Suggestion: `"Try '[name] v2' or '[name] — [date]'

## Session Auto-Recovery

If a running session's server process dies unexpectedly (e.g. deployment, crash):

- On next app load or poll: session status is detected as `running` but `lastHeartbeatAt` is > 60 seconds ago
- A yellow banner appears on Mission Control and Spec Detail:
  ```
  ⚠ Session SES-0091 may have lost connection. Last heartbeat 3 minutes ago.
  [Check Status]  [Abandon Session]
  ```
- `[Check Status]` → pings session health endpoint → if dead: marks session `failed` + shows DAEMON error state
- `[Abandon Session]` → same as cancel flow

## Concurrent Edit Warning

If two users open the same Spec Editor simultaneously:

- On second user's page load: amber banner in editor: `"[Name] is currently editing this spec. Your changes may conflict."`
- No locking — both can edit, but the warning prevents confusion
- On save: if `currentVersionId` has changed since the editor opened: server returns 409
  - Error banner in editor (red): `"This spec was updated by [Name] while you were editing. [View their changes] or [Save anyway and create a new version]"

## Task Dependency Violation (UI Guard)

If a user manually tries to mark a task `done` when its dependencies are not yet done:

- `[MARK DONE]` click → server returns 422
- AlertDialog (not a toast): `"T-042 depends on T-038 and T-039 which are not complete. Mark it done anyway?"`
- `[Cancel]` · `[Force Mark Done]` — if forced, proceeds with `verificationPassed: true` and a `forced` flag on the task record

## Long-Running Plan Generation (> 30 seconds)

If plan generation takes longer than 30 seconds:

- The Plan generation is an asynchronous background process (via Upstash QStash).
- The DAEMON `working` animation on the PLAN tab continues.
- After 30s: a subtle text update below the animation: `"Still working... complex specs take a moment."` (no panic, just reassurance).
- The UI polls `GET /api/v1/specs/:id/plan` every 3 seconds.
- After 2 minutes with no response: show DAEMON `error` + `"Plan generation is taking longer than expected."` + `[Check again]` button (re-polls) + `[Cancel generation]` link.

## Plan Approval by Non-Admin (UI State)

Members who cannot approve see the `[APPROVE & EXECUTE]` button rendered but disabled:

- Tooltip on hover: `"Only Admins can approve execution. Contact [Admin Name] to proceed."`
- `[Admin Name]` is the name of an actual Admin on the project (pulled from team list)
- `[Request Approval]` secondary button (outline, enabled for Members): sends a notification to all Admins: `"[Member] is requesting approval for the plan on [Spec Name]."` → Admins receive in-app + email notification → clicking routes to the PLAN tab

## First Login After Invite (RBAC context)

If user signs in for the first time as a `viewer`:

- Onboarding flow (Part 4) still runs, but Step 2 of the flow is adapted: `"You have Viewer access. You can review specs, plans, and agent output but cannot create or approve."` — no deception about capabilities.

## Session Limit Warning

If `maxConcurrentTasks` is set to 1 and a task is already running, attempting to re-run another task via Task Drawer shows:

- `[RE-RUN]` button: clicking shows an inline note (not a toast): `"Max concurrent tasks (1) reached. This task will queue and start when the current task completes."` + `[Queue Anyway]` · `[Cancel]`

## Notification Badge Update on New Event

The bell icon badge updates in real time (3-second poll — same interval as session polling). No WebSocket required.

- If the user has the notification panel open when a new notification arrives: it slides into the top of the list with a subtle fade-in (Motion), no panel close/reopen needed.

## Keyboard Navigation in Task List

The task list in TASKS tab is keyboard navigable:

- `↑` / `↓`: move focus between rows (visible focus ring, violet)
- `Enter` or `Space`: expand/collapse the focused row
- `O`: open Task Drawer for focused row (mnemonic: **O**pen detail)
- `Escape`: collapse all rows / close Drawer
- These shortcuts only activate when focus is inside the task list (not globally)

## Copy-to-Clipboard Pattern (Used Throughout)

Any mono ID (`T-042`, `SPEC-003`, `SES-0091`), file path, or token uses a consistent copy interaction:

- Hover: a copy icon (`Copy` from Lucide) fades in to the right of the value
- Click: icon becomes a checkmark for 1.5 seconds, then reverts
- No toast for copy actions — the inline checkmark is sufficient feedback
- Never show both copy icon and tooltip on the same element simultaneously

---

## Document Information

- Version: 1.0
- Status: Confidential
- Last Updated: 2026-03-08
- Audience: Product Managers, Engineers
- Purpose: Complete product feature specification including authentication, RBAC, notifications, settings, and edge cases
