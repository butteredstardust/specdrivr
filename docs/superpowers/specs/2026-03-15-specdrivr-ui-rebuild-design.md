# Design Doc: Specdrivr UI Greenfield Rebuild

**Date:** 2026-03-15
**Branch:** `refactor/architecture-compliance`
**Status:** Pending spec review approval

---

## 1. Overview

Complete greenfield rebuild of the Specdrivr frontend. The backend is fully operational — all API routes, repositories, server actions, auth, and database schema are in place. The UI layer was deliberately purged (commit `6c4c64e`) and will be rebuilt from scratch according to this spec.

**Scope:** Only touch `src/app/` (UI pages), `src/components/`, `src/hooks/`, and `src/lib/logger-client.ts`. Everything else is off-limits.

**⚠ Pre-requisite backend route (C1):** The EventLog component requires `GET /api/v1/sessions/{id}/events?limit=30`. This route does not exist yet — the `agentEvents` table is in the schema but has no API endpoint. This route must be created before or alongside the Mission Control page. It is the only backend change needed.

---

## 2. Tech Stack

| Layer | Package | Version |
|---|---|---|
| Framework | Next.js App Router | 16.1.6 |
| UI Runtime | React | 19.2.4 |
| Types | TypeScript strict | 5.9.3 |
| Styling | Tailwind CSS | 4.2.1 |
| Components | shadcn/ui (install as needed via `npx shadcn@latest add`) | latest |
| Icons | lucide-react (already installed) | 0.577.0 |
| Theme | next-themes with `forcedTheme="dark"` (already installed) | 0.4.6 |
| Auth | BetterAuth client | 1.5.5 |
| Toasts | sonner | 2.0.7 |
| Drawer | vaul | **to be added** |
| Spec Editor | @uiw/react-codemirror + @codemirror/lang-markdown | **to be added** |
| Markdown Render | react-markdown | **to be added** |
| ANSI parsing | ansi-to-html | 0.7.2 |
| Syntax highlight | shiki | 4.0.2 |

**Package changes required:**
- Remove: `@uiw/react-md-editor`, `@pxlkit/core`, `@pxlkit/effects`, `@pxlkit/feedback`, `@pxlkit/gamification`, `@pxlkit/social`, `@pxlkit/ui`, `@pxlkit/ui-kit`
- Add: `@uiw/react-codemirror`, `@codemirror/lang-markdown`, `react-markdown`, `vaul`
- Keep: `next-themes` — wrap root layout with `<ThemeProvider forcedTheme="dark">`, add `class="dark"` to `<html>`
- Do NOT use `@radix-ui/react-icons` — use `lucide-react` exclusively for all icons

---

## 3. Design System

### Theme (dark-only)

Wrap root layout with `<ThemeProvider forcedTheme="dark">` from `next-themes`. Set `class="dark"` on `<html>`. No light mode or system theme.

Specdrivr custom shadcn CSS variable overrides in `src/app/globals.css`:

```css
--background: 0 0% 4%;          /* #0a0a0b */
--foreground: 240 5% 96%;       /* #f4f4f5 */
--primary: 255 96% 67%;         /* #7c5cfc violet */
--destructive: 0 72% 51%;       /* #dc2626 */
--radius: 0.375rem;
```

Semantic custom tokens (used directly in className with `bg-[--token]` syntax):
- `--bg-base`, `--bg-surface`, `--bg-elevated`
- `--border-default`, `--border-muted`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--accent-violet`, `--accent-violet-dim`
- `--phosphor-amber`, `--phosphor-amber-dim`
- `--status-emerald`, `--status-red`, `--status-orange`
- `--terminal-bg`, `--terminal-green`

### Aesthetic rules
- **Retro** (amber, scanlines, mono IDs, ASCII chars): agent-facing surfaces only — terminals, event logs, task status, session panels
- **Clean/modern**: layout chrome — sidebar, top bar, nav, cards
- Mono IDs: `font-mono text-xs text-[--phosphor-amber] bg-[--phosphor-amber]/10 px-1.5 py-0.5 rounded-sm`
- Retro headers: `text-xs font-mono font-semibold uppercase tracking-widest text-[--text-muted]`
- Status chars: `○` todo · `▶` in_progress (blink, violet) · `⚠` blocked (amber) · `✓` done (emerald) · `✕` failed (red) · `-` skipped (muted dim)

### RBAC rule (critical)
Permission-gated buttons are **never hidden**. Always render disabled with a shadcn `Tooltip` explaining required role. Use `<Button disabled={!canDo}>` + tooltip, never `{canDo && <Button>}`.

---

## 4. Route Structure

```
src/app/
  (auth)/
    layout.tsx               ← no shell, centered full-page
    login/page.tsx
    forgot-password/page.tsx
    reset-password/page.tsx
    invite/page.tsx
  (app)/
    layout.tsx               ← shell: Sidebar + TopBar + main, auth guard
    page.tsx                 ← Mission Control
    projects/page.tsx
    specs/
      page.tsx               ← specs list
      new/
        layout.tsx           ← suppresses shell (editor-only)
        page.tsx
      [id]/
        page.tsx             ← spec detail
        edit/
          layout.tsx         ← suppresses shell (editor-only)
          page.tsx
    sessions/page.tsx
    settings/page.tsx
```

---

## 5. Architecture

### App Shell

`(app)/layout.tsx` is a **Server Component** that:
1. Calls `const session = await auth()` — redirects to `/login` if null.
   - Import: `import { auth } from '@/lib/auth'`
   - The exported `auth` is an async function: `const session = await auth()` (NOT `auth.api.getSession()`).
   - `session.user.onboardingStep` is available (configured as `additionalFields` in BetterAuth).
2. If `session.user.onboardingStep === 0`, renders `<OnboardingWizard>` alongside shell.

Shell layout: `flex h-screen overflow-hidden`
- `<Sidebar />` — 240px fixed
- Flex-col: `<TopBar />` (56px) + `<main>` (scrollable)

### ShellContext (client provider)
Wraps `(app)` children. Provides:
- `activeProjectId` — persisted to `localStorage:specdrivr:activeProjectId`
- `devMode` — persisted to `localStorage:specdrivr:devMode`
- `user` — from server-fetched session, passed as prop to provider
- Keyboard shortcuts: `?` shortcuts modal, `Ctrl+`` devMode toggle, `g+m/s/a` navigation, `Escape` close modal

### Auth pattern
- **Server components**: `import { auth } from '@/lib/auth'`, call `const session = await auth()`
- **Client components**: `import { authClient } from '@/lib/auth-client'`
- All client fetches to auth'd endpoints: `{ credentials: 'include' }`

### Logging
- Client: `import { clientLogger } from '@/lib/logger-client'` — no `console.*`
- No server logging in UI files (API routes already have it)

---

## 6. Components to Build

### Foundation (build first)
1. **`src/components/ui/daemon-mascot.tsx`** — SVG robot, 5 expressions, 3 size tiers
2. **`src/hooks/use-polling.ts`** — Verify existing hook satisfies spec; update only if needed. Required interface: `url: string | null`, 5-error circuit breaker, `stopWhen`, `clearInterval` cleanup, first fetch on mount.

### UI Primitives
3. **`src/components/ui/terminal-log.tsx`** — ANSI-to-HTML, scanlines, auto-scroll pause
4. **`src/components/ui/diff-viewer.tsx`** — Shiki unified diff viewer, file tree left pane
5. **`src/components/ui/task-row.tsx`** — Collapsible row, status chars, DropdownMenu

### Shell
6. **`src/components/shell/sidebar.tsx`** — Nav, project switcher, bottom status, DAEMON
7. **`src/components/shell/top-bar.tsx`** — Breadcrumbs, notifications, user dropdown
8. **`src/components/shell/shell-context.tsx`** — Client provider with localStorage + keyboard shortcuts
9. **`src/components/onboarding-wizard.tsx`** — 3-step Dialog, non-dismissable

### Auth Pages
10. Login, ForgotPassword, ResetPassword, AcceptInvite

### App Pages
11. Mission Control (`/`) — SessionPanel + EventLog two-column
12. Projects (`/projects`) — Table + CreateProjectForm dialog
13. Specs List (`/specs`) — Polling table + tabs + search
14. Spec Editor (`/specs/new`, `/specs/[id]/edit`) — Split-pane CodeMirror + preview
15. Spec Detail (`/specs/[id]`) — 5 tabs: SPEC, PLAN, TASKS, CHANGES, ACTIVITY
16. Sessions (`/sessions`)
17. Settings (`/settings`)

---

## 7. Key Behavioral Specs

### usePolling

Interface:
```ts
interface UsePollingOptions<T> {
  url: string | null    // null = pause
  interval?: number     // default 3000ms
  enabled?: boolean     // default true
  stopWhen?: (data: T) => boolean
  onError?: (err: Error) => void
}
```

Behavior:
- First fetch fires immediately on mount
- `credentials: 'include'` on every fetch
- Response envelope: `{ data: T }`
- 5 consecutive errors → stop permanently + call `onError()`
- `stopWhen(data)` returns true → stop permanently
- `url: null` or `enabled: false` → pause polling (resume when changed)
- Cleanup: `clearInterval` (NOT `clearTimeout`)

### TerminalLog
- `ansi-to-html` with `escapeXML: true`
- Auto-scroll pauses when `scrollTop < scrollHeight - clientHeight - 20`
- Level colours: `ERROR` → status-red, `WARN` → phosphor-amber, else text-secondary

### DiffViewer
- Shiki `github-dark` theme, module-scope singleton highlighter promise
- `+` lines: `bg-green-950/40 text-green-400`; `-` lines: `bg-red-950/40 text-red-400`

### DAEMON Mascot
- SVG `viewBox="0 0 34 40"`, violet gradient body, amber eyes, antenna
- Size tiers: ≤16 silhouette only, ≤24 simplified, ≥32 full
- Expressions affect eyes/mouth/antenna: `idle`, `working`, `success`, `blocked`, `error`

### Spec Editor
- `@uiw/react-codemirror` left pane + `react-markdown` right pane
- `Ctrl+Enter` saves draft; `beforeunload` guard when dirty
- Warning banners for: active plan, changes_requested, concurrent edit

### Plan Review (Spec Detail → PLAN tab)

The "plan generating" state is driven by `spec.status === 'pending_plan'`, NOT by a plan status value. When `spec.status === 'pending_plan'`, the plan tab shows the DAEMON working animation and polls every 3s for status change. Once a plan record exists, its own `planStatus` drives the review UI.

- `spec.status === 'pending_plan'`: polls spec every 3s; 30s → timeout message; 2min → DAEMON error state
- `plan.status === 'pending_approval'`: shows review UI with approve/reject/request-changes buttons
- Approval button never hidden — disabled + Tooltip for non-admin/owner roles
- Slide-down panels for Request Changes / Reject (required Textarea before submit)

### Mission Control
- NeedsAttentionBanner: amber strip, clickable task pills, session-dismiss only
- SessionPanel: `idle` (UI concept — no active session) / `running` / `paused` / `completed` / `failed` / `cancelled` states mapped from `session.status`
- EventLog: polls every 5s, `GET /api/v1/sessions/{id}/events?limit=30`
  - **Note:** This route must be created as part of the build (see §1 pre-requisite)

### Session status → UI state mapping
```ts
// session.status DB values: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
// SessionPanel adds a UI-only 'idle' state when no active session record exists
const sessionPanelState =
  !session                           ? 'idle'
  : session.status === 'running'     ? 'running'
  : session.status === 'paused'      ? 'paused'
  : session.status === 'completed'   ? 'completed'
  : session.status === 'failed'      ? 'failed'
  : /* cancelled */                    'cancelled'
```

SessionPanel rendering per state:
- **`idle`**: DAEMON `idle` 48px + "SYSTEM READY" + "No active session." + link to /specs
- **`running`**: pulsing dot + LIVE label + elapsed timer + progress + TerminalLog + Pause/Cancel buttons
- **`paused`**: same layout but timer frozen + amber ⏸ PAUSED label + Resume button
- **`completed`**: DAEMON `success` 48px + "Execution complete." + task counts + View Changes link (auto-clears after 60s)
- **`failed`**: DAEMON `error` 48px + destructive Alert + `session.errorMessage` (if present) + "View last logs" collapsible + Retry/Dismiss buttons
- **`cancelled`**: DAEMON `idle` 48px + muted "Session cancelled." + link to /specs

### Onboarding
- 3-step Dialog, `onPointerDownOutside` + `onEscapeKeyDown` both call `e.preventDefault()`
- Step 3 creates project → `PATCH /api/v1/users/me { onboardingStep: 3 }` on success
- `onboardingStep` is available directly on `session.user` (BetterAuth `additionalFields`)

---

## 8. Enum Values (exact — from DB schema)

```ts
// From specStatusEnum
type SpecStatus = 'drafting' | 'pending_plan' | 'pending_approval' | 'executing' | 'completed' | 'stalled' | 'archived'

// From planStatusEnum — note: 'pending_plan' is NOT a plan status, it's a spec status
type PlanStatus = 'pending_approval' | 'changes_requested' | 'rejected' | 'executing' | 'completed' | 'abandoned'

// From taskStatusEnum — includes 'skipped'
type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'failed' | 'skipped'

// From sessionStatusEnum — 'idle' is a UI concept only (no active session), not a DB value
type SessionStatus = 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'

// No agentStatusEnum in DB — DAEMON expressions are UI-only
type DaemonExpression = 'idle' | 'working' | 'success' | 'blocked' | 'error'
```

---

## 9. Verification Checklist

Before marking any implementation complete, run:

```bash
# No wrong token classes in custom components
grep -rn "bg-background\b\|bg-card\b\|text-foreground\b\|text-muted-foreground\b" \
  src/components/ui/daemon-mascot.tsx src/components/ui/terminal-log.tsx \
  src/components/ui/task-row.tsx src/components/shell/ --include="*.tsx"

# No console calls
grep -rn "console\.\(log\|error\|warn\)" \
  src/app/\(auth\)/ src/app/\(app\)/ src/components/ src/hooks/ \
  --include="*.tsx" --include="*.ts" | grep -v "logger-client.ts"

# All fetches have credentials
grep -rn "fetch(" src/components/ src/hooks/ src/app/\(auth\)/ src/app/\(app\)/ \
  --include="*.tsx" --include="*.ts" | grep -v "credentials\|server\|import"

# No pxlkit imports
grep -rn "@pxlkit" src/ --include="*.tsx" --include="*.ts"

# No @radix-ui/react-icons imports (use lucide-react only)
grep -rn "@radix-ui/react-icons" src/ --include="*.tsx" --include="*.ts"

# Editor layouts suppress shell — expect zero results
grep -rn "Sidebar\|TopBar\|ShellProvider" \
  src/app/\(app\)/specs/new/layout.tsx \
  src/app/\(app\)/specs/\[id\]/edit/layout.tsx

# Approve button never conditionally hidden
grep -rn "canApprove &&\|userCanApprove &&\|isAdmin &&" \
  src/components/specs/ --include="*.tsx"

# clearInterval used in polling (not clearTimeout)
grep -n "clearTimeout\|clearInterval" src/hooks/use-polling.ts

# url accepts null in usePolling
grep -n "url:" src/hooks/use-polling.ts

# Typecheck, build, test
pnpm typecheck 2>&1 | tail -10
pnpm build 2>&1 | tail -10
pnpm test 2>&1 | tail -15
```

Expected: checks 1–8 produce zero results, check 9 shows `string | null`, checks 10–12 pass.

---

## 10. Build Order

Phased to enable incremental testing. Auth pages are built before the shell to avoid 404s during development:

1. **Setup** — globals.css tokens, package changes (remove pxlkit/md-editor, add codemirror/vaul/react-markdown), root layout with ThemeProvider + `class="dark"`
2. **Foundation** — DaemonMascot, verify/update usePolling
3. **UI Primitives** — TerminalLog, DiffViewer, TaskRow
4. **Auth Pages** — Login, ForgotPassword, ResetPassword, Invite (build before shell so redirects don't 404)
5. **Shell** — ShellContext, Sidebar, TopBar, `(app)/layout.tsx` with auth guard
6. **Onboarding** — OnboardingWizard
7. **Mission Control** — NeedsAttentionBanner, SessionPanel, EventLog + create `GET /api/v1/sessions/{id}/events` route
8. **Projects Page**
9. **Specs List**
10. **Spec Editor** — new + edit layouts, SpecEditor component
11. **Spec Detail** — all 5 tabs
12. **Sessions + Settings pages**
13. **Verification** — run all checks, typecheck, build, test
