# Design Doc: Specdrivr UI Greenfield Rebuild

**Date:** 2026-03-15
**Branch:** `refactor/architecture-compliance`
**Status:** Approved for implementation

---

## 1. Overview

Complete greenfield rebuild of the Specdrivr frontend. The backend is fully operational — all API routes, repositories, server actions, auth, and database schema are in place. The UI layer was deliberately purged (commit `6c4c64e`) and will be rebuilt from scratch according to this spec.

**Scope:** Only touch `src/app/` (UI pages), `src/components/`, `src/hooks/`, and `src/lib/logger-client.ts`. Everything else is off-limits.

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
| Auth | BetterAuth client | 1.5.5 |
| Toasts | sonner | 2.0.7 |
| Drawer | vaul | **to be added** |
| Spec Editor | @uiw/react-codemirror + @codemirror/lang-markdown | **to be added** |
| Markdown Render | react-markdown | **to be added** |
| ANSI parsing | ansi-to-html | 0.7.2 |
| Syntax highlight | shiki | 4.0.2 |

**Package changes required:**
- Remove: `@uiw/react-md-editor`
- Add: `@uiw/react-codemirror`, `@codemirror/lang-markdown`, `react-markdown`, `vaul`

---

## 3. Design System

### Theme (dark-only, set `class="dark"` on `<html>`)

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
- Status chars: `○` todo · `▶` in_progress (blink, violet) · `⚠` blocked (amber) · `✓` done (emerald) · `✕` failed (red)

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
1. Calls `auth.api.getSession({ headers: await headers() })` — redirects to `/login` if null
2. Fetches `onboardingStep` from session user
3. If `onboardingStep === 0`, renders `<OnboardingWizard>` alongside shell

Shell layout: `flex h-screen overflow-hidden`
- `<Sidebar />` — 240px fixed
- Flex-col: `<TopBar />` (56px) + `<main>` (scrollable)

### ShellContext (client provider)
Wraps `(app)` children. Provides:
- `activeProjectId` — persisted to `localStorage:specdrivr:activeProjectId`
- `devMode` — persisted to `localStorage:specdrivr:devMode`
- `user` — from server-fetched session
- Keyboard shortcuts: `?` shortcuts modal, `Ctrl+`` devMode toggle, `g+m/s/a` navigation, `Escape` close modal

### Auth pattern
- Server: `import { auth } from '@/lib/auth'` + `auth.api.getSession()`
- Client: `import { authClient } from '@/lib/auth-client'`
- All client fetches to auth'd endpoints: `{ credentials: 'include' }`

### Logging
- Client: `import { clientLogger } from '@/lib/logger-client'` — no `console.*`
- No server logging in UI files (API routes already have it)

---

## 6. Components to Build

### Foundation (build first)
1. **`src/components/ui/daemon-mascot.tsx`** — SVG robot, 5 expressions, 3 size tiers
2. **`src/hooks/use-polling.ts`** — Generic polling hook (replace existing), 5-error circuit breaker, `stopWhen`, `clearInterval` cleanup

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
- First fetch fires immediately on mount
- `credentials: 'include'` on every fetch
- Response envelope: `{ data: T }`
- 5 consecutive errors → stop + `onError()`
- `stopWhen(data)` → permanent stop
- `url: null` or `enabled: false` → pause
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
- Expressions affect eyes/mouth/antenna: idle, working, success, blocked, error

### Spec Editor
- `@uiw/react-codemirror` left pane + `react-markdown` right pane
- `Ctrl+Enter` saves draft; `beforeunload` guard when dirty
- Warning banners for: active plan, changes_requested, concurrent edit

### Plan Review (Spec Detail → PLAN tab)
- `pending_plan`: polls every 3s; 30s timeout message; 2min error state
- Approval button never hidden — disabled + Tooltip for non-admin roles
- Slide-down panels for Request Changes / Reject (required Textarea before submit)

### Mission Control
- NeedsAttentionBanner: amber strip, clickable task pills, session-dismiss only
- SessionPanel: idle/running/paused/completed/boot-sequence states
- EventLog: polls every 5s, `GET /api/v1/sessions/{id}/events?limit=30`

### Onboarding
- 3-step Dialog, `onPointerDownOutside` + `onEscapeKeyDown` both call `e.preventDefault()`
- Step 3 creates project → `PATCH /api/v1/users/me { onboardingStep: 3 }` on success

---

## 8. Enum Values (exact — do not invent)

```ts
type SpecStatus = 'drafting' | 'pending_plan' | 'pending_approval' | 'executing' | 'completed' | 'stalled' | 'archived'
type PlanStatus = 'pending_plan' | 'pending_approval' | 'changes_requested' | 'rejected' | 'executing' | 'completed' | 'abandoned'
type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'failed'
type AgentStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'error'
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

# Editor layouts suppress shell
grep -rn "Sidebar\|TopBar\|ShellProvider" \
  src/app/\(app\)/specs/new/layout.tsx \
  src/app/\(app\)/specs/\[id\]/edit/layout.tsx 2>/dev/null

# Approve button never conditionally hidden
grep -rn "canApprove &&\|userCanApprove &&\|isAdmin &&" \
  src/components/specs/ --include="*.tsx"

# clearInterval used in polling (not clearTimeout)
grep -n "clearTimeout\|clearInterval" src/hooks/use-polling.ts

# Typecheck, build, test
pnpm typecheck 2>&1 | tail -10
pnpm build 2>&1 | tail -10
pnpm test 2>&1 | tail -15
```

---

## 10. Build Order

Phased to enable incremental testing:

1. **Setup** — globals.css tokens, package changes, root layout `class="dark"`
2. **Foundation** — DaemonMascot, usePolling
3. **UI Primitives** — TerminalLog, DiffViewer, TaskRow
4. **Shell** — ShellContext, Sidebar, TopBar, (app)/layout.tsx
5. **Auth Pages** — Login, ForgotPassword, ResetPassword, Invite
6. **Onboarding** — OnboardingWizard
7. **Mission Control** — NeedsAttentionBanner, SessionPanel, EventLog
8. **Projects Page**
9. **Specs List**
10. **Spec Editor** — new + edit layouts, SpecEditor component
11. **Spec Detail** — all 5 tabs
12. **Sessions + Settings pages**
13. **Verification** — run all checks, typecheck, build, test
