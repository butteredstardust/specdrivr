# Specdrivr UI Rebuild Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the entire Specdrivr frontend from scratch following the design spec.

**Architecture:** Next.js 16 App Router with Server Components by default, `'use client'` only where needed. Dark-only shadcn/ui theme with custom Specdrivr tokens. Repository Pattern — never import `db` in components.

**Tech Stack:** Next.js 16.1.6, React 19.2.4, TypeScript 5.9.3 (strict), Tailwind CSS 4.2.1, shadcn/ui, lucide-react, BetterAuth 1.5.5, sonner, vaul, @uiw/react-codemirror, react-markdown, ansi-to-html, shiki

---

## Reference

- **Design spec:** `docs/superpowers/specs/2026-03-15-specdrivr-ui-rebuild-design.md`
- **RBAC permissions:** `src/lib/rbac.ts` — roles: `viewer < member < admin < owner`
- **Auth pattern (server):** `import { auth } from '@/lib/auth'` → `const session = await auth()`
- **Auth pattern (client):** `import { authClient } from '@/lib/auth-client'`
- **Logging (client):** `import { clientLogger } from '@/lib/logger-client'` — `clientLogger.error()` / `clientLogger.warn()` only
- **All client fetches:** must include `{ credentials: 'include' }`
- **Icons:** `lucide-react` only — never `@radix-ui/react-icons`
- **Test runner:** `pnpm test:unit` (Vitest, jsdom, tests in `tests/` directory)
- **shadcn installs:** `npx shadcn@latest add <name>`

---

## Chunk 1: Setup

### Task 1: Package Changes

**Files:**
- Modify: `package.json`

- [ ] Step 1: Remove deprecated/replaced packages
  ```bash
  pnpm remove @uiw/react-md-editor @pxlkit/core @pxlkit/effects @pxlkit/feedback @pxlkit/gamification @pxlkit/social @pxlkit/ui @pxlkit/ui-kit @pxlkit/weather
  ```

- [ ] Step 2: Add required new packages
  ```bash
  pnpm add vaul @uiw/react-codemirror @codemirror/lang-markdown react-markdown
  ```

- [ ] Step 3: Verify installs — confirm no peer dependency errors
  ```bash
  pnpm install
  pnpm typecheck 2>&1 | tail -5
  ```

- [ ] Step 4: Commit
  ```bash
  git add package.json pnpm-lock.yaml
  git commit -m "chore: swap md-editor and pxlkit for codemirror, react-markdown, vaul"
  ```

---

### Task 2: globals.css — Design System Tokens

**Files:**
- Modify: `src/app/globals.css`

- [ ] Step 1: Replace the entire file with the Specdrivr design system. The file currently has placeholder oklch values — replace completely:

  ```css
  @import "tailwindcss";

  @layer base {
    :root {
      --background: 0 0% 4%;
      --foreground: 240 5% 96%;
      --card: 240 4% 7%;
      --card-foreground: 240 5% 96%;
      --popover: 240 3% 10%;
      --popover-foreground: 240 5% 96%;
      --primary: 255 96% 67%;
      --primary-foreground: 0 0% 100%;
      --secondary: 240 3% 10%;
      --secondary-foreground: 240 4% 63%;
      --muted: 240 3% 10%;
      --muted-foreground: 240 4% 33%;
      --accent: 240 3% 10%;
      --accent-foreground: 240 5% 96%;
      --destructive: 0 72% 51%;
      --destructive-foreground: 0 0% 100%;
      --border: 240 3% 13%;
      --input: 240 3% 13%;
      --ring: 255 96% 67%;
      --radius: 0.375rem;
      --bg-base: #0a0a0b;
      --bg-surface: #111113;
      --bg-elevated: #18181b;
      --border-default: #1e1e21;
      --border-muted: #27272a;
      --text-primary: #f4f4f5;
      --text-secondary: #a1a1aa;
      --text-muted: #52525b;
      --accent-violet: #7c5cfc;
      --accent-violet-dim: #5b3fd4;
      --phosphor-amber: #ffb300;
      --phosphor-amber-dim: #b45309;
      --status-emerald: #059669;
      --status-red: #dc2626;
      --status-orange: #d97706;
      --terminal-bg: #0d0d0a;
      --terminal-green: #39ff14;
    }
  }

  html { color-scheme: dark; }
  body { background: var(--bg-base); color: var(--text-primary); }

  .terminal-surface {
    position: relative;
  }
  .terminal-surface::after {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 3px,
      rgba(0,0,0,0.15) 3px,
      rgba(0,0,0,0.15) 4px
    );
    pointer-events: none;
    z-index: 1;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  .animate-blink { animation: blink 1s step-end infinite; }
  ```

- [ ] Step 2: Commit
  ```bash
  git add src/app/globals.css
  git commit -m "feat: add Specdrivr dark design system tokens to globals.css"
  ```

---

### Task 3: Root Layout with ThemeProvider

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] Step 1: Install next-themes (already installed per spec — verify)
  ```bash
  pnpm list next-themes
  ```

- [ ] Step 2: Update root layout to enforce dark theme:

  ```tsx
  import type { Metadata } from 'next';
  import { ThemeProvider } from 'next-themes';
  import './globals.css';

  export const metadata: Metadata = {
    title: 'Specdrivr',
    description: 'AI-native orchestration platform',
  };

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="en" className="dark" suppressHydrationWarning>
        <body>
          <ThemeProvider attribute="class" forcedTheme="dark" disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </body>
      </html>
    );
  }
  ```

- [ ] Step 3: Commit
  ```bash
  git add src/app/layout.tsx
  git commit -m "feat: enforce dark-only theme via ThemeProvider forcedTheme"
  ```

---

## Chunk 2: Foundation

### Task 4: DaemonMascot Component

**Files:**
- Create: `src/components/ui/daemon-mascot.tsx`
- Create: `tests/daemon-mascot.test.tsx`

**Props interface:**
```ts
type DaemonExpression = 'idle' | 'working' | 'success' | 'blocked' | 'error';

interface DaemonMascotProps {
  expression?: DaemonExpression; // default: 'idle'
  size?: number;                  // px, default: 32
  className?: string;
}
```

**Key behaviors:**
- `size <= 16`: silhouette only (single violet fill shape, no detail)
- `size <= 24`: simplified (body + amber eye dots only)
- `size >= 32`: full render (gradient body, amber eyes, antenna, expression-driven mouth/brow/antenna animation)
- SVG `viewBox="0 0 34 40"` always; `width` and `height` set from `size` prop
- Violet gradient body: `linearGradient` from `#7c5cfc` to `#5b3fd4`
- Amber eyes: `fill="#ffb300"`
- Expression → eye/mouth/antenna variants:
  - `idle`: normal round eyes, neutral line mouth, antenna straight
  - `working`: eyes with animated `animate-blink` class on one eye, mouth slightly open, antenna with pulsing dot
  - `success`: eyes curved up (happy arcs), wide smile arc, antenna dot green
  - `blocked`: eyes as horizontal lines (flat), flat mouth, antenna drooped
  - `error`: eyes as X shapes, downward mouth arc, antenna red dot
- No `console.*` — use `clientLogger` if any logging needed

- [ ] Step 1: Write the test first (TDD)

  `tests/daemon-mascot.test.tsx`:
  ```tsx
  import { render, screen } from '@testing-library/react';
  import { expect, test, describe } from 'vitest';
  import { DaemonMascot } from '@/components/ui/daemon-mascot';

  describe('DaemonMascot', () => {
    test('renders SVG element', () => {
      const { container } = render(<DaemonMascot />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    test('uses correct viewBox', () => {
      const { container } = render(<DaemonMascot />);
      expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 34 40');
    });

    test('applies size prop to width and height', () => {
      const { container } = render(<DaemonMascot size={48} />);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('width')).toBe('48');
      expect(svg?.getAttribute('height')).toBe('48');
    });

    test('renders silhouette only at size <= 16', () => {
      const { container } = render(<DaemonMascot size={16} />);
      expect(container.querySelector('[data-tier="silhouette"]')).toBeInTheDocument();
      expect(container.querySelector('[data-tier="full"]')).not.toBeInTheDocument();
    });

    test('renders full detail at size >= 32', () => {
      const { container } = render(<DaemonMascot size={32} />);
      expect(container.querySelector('[data-tier="full"]')).toBeInTheDocument();
    });

    test('accepts all valid expressions without error', () => {
      const expressions: Array<'idle' | 'working' | 'success' | 'blocked' | 'error'> = [
        'idle', 'working', 'success', 'blocked', 'error',
      ];
      for (const expression of expressions) {
        const { container } = render(<DaemonMascot expression={expression} size={32} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      }
    });
  });
  ```

- [ ] Step 2: Run test to see it fail
  ```bash
  pnpm test:unit -- daemon-mascot
  ```

- [ ] Step 3: Implement `src/components/ui/daemon-mascot.tsx` — SVG component with three rendering tiers (silhouette, simplified, full) controlled by `size` prop, expression variants as described above. Export named `DaemonMascot`.

- [ ] Step 4: Run test to see it pass
  ```bash
  pnpm test:unit -- daemon-mascot
  ```

- [ ] Step 5: Commit
  ```bash
  git add src/components/ui/daemon-mascot.tsx tests/daemon-mascot.test.tsx
  git commit -m "feat: add DaemonMascot SVG component with 5 expressions and 3 size tiers"
  ```

---

### Task 5: usePolling Hook — Add `url: string | null`

**Files:**
- Modify: `src/hooks/use-polling.ts`
- Create: `tests/use-polling.test.ts`

**Required change:** `url: string` → `url: string | null`. When `url` is `null`, polling must pause (same as `enabled: false`). The hook already uses `clearInterval` correctly and has `credentials: 'include'` — only the null-url guard needs adding.

- [ ] Step 1: Write the test first (TDD)

  `tests/use-polling.test.ts`:
  ```ts
  import { renderHook, waitFor, act } from '@testing-library/react';
  import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest';
  import { usePolling } from '@/hooks/use-polling';

  describe('usePolling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    test('does not fetch when url is null', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      renderHook(() => usePolling({ url: null }));
      await act(() => vi.advanceTimersByTimeAsync(5000));
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    test('resumes polling when url changes from null to a string', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ data: { ok: true } }), { status: 200 })
      );

      const { rerender } = renderHook(
        ({ url }: { url: string | null }) => usePolling({ url }),
        { initialProps: { url: null } }
      );
      await act(() => vi.advanceTimersByTimeAsync(1000));
      expect(fetchSpy).not.toHaveBeenCalled();

      rerender({ url: '/api/v1/test' });
      await act(() => vi.advanceTimersByTimeAsync(100));
      expect(fetchSpy).toHaveBeenCalledWith('/api/v1/test', { credentials: 'include' });
    });

    test('stops after 5 consecutive errors', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
      const onError = vi.fn();
      const { result } = renderHook(() =>
        usePolling({ url: '/api/v1/test', interval: 100, onError })
      );
      // Advance through 5 errors (initial + 4 interval ticks)
      for (let i = 0; i < 5; i++) {
        await act(() => vi.advanceTimersByTimeAsync(200));
      }
      await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
      expect(result.current.error).not.toBeNull();
    });

    test('uses clearInterval for cleanup (not clearTimeout)', () => {
      // Verify implementation uses setInterval by checking the interval cleanup path
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ data: {} }), { status: 200 })
      );
      const { unmount } = renderHook(() =>
        usePolling({ url: '/api/v1/test', interval: 1000 })
      );
      unmount();
      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    test('stopWhen stops polling when predicate returns true', async () => {
      let callCount = 0;
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        callCount++;
        return new Response(JSON.stringify({ data: { done: callCount >= 2 } }), { status: 200 });
      });
      const { result } = renderHook(() =>
        usePolling<{ done: boolean }>({
          url: '/api/v1/test',
          interval: 100,
          stopWhen: (d) => d.done,
        })
      );
      await act(() => vi.advanceTimersByTimeAsync(500));
      await waitFor(() => expect(result.current.data?.done).toBe(true));
      const countAfterStop = callCount;
      await act(() => vi.advanceTimersByTimeAsync(500));
      expect(callCount).toBe(countAfterStop); // no more calls after stop
    });
  });
  ```

- [ ] Step 2: Run test to see null-url test fail
  ```bash
  pnpm test:unit -- use-polling
  ```

- [ ] Step 3: Modify `src/hooks/use-polling.ts`:
  - Change `url: string` to `url: string | null` in `UsePollingOptions<T>`
  - Add null guard at top of `useEffect`: if `!url`, return early (skip fetch + interval)
  - Add `url` null check before `fetch(url, ...)` call for TypeScript safety

- [ ] Step 4: Run tests to see all pass
  ```bash
  pnpm test:unit -- use-polling
  ```

- [ ] Step 5: Commit
  ```bash
  git add src/hooks/use-polling.ts tests/use-polling.test.ts
  git commit -m "feat: support url: string | null in usePolling to pause polling"
  ```

---

## Chunk 3: UI Primitives

### Task 6: TerminalLog Component

**Files:**
- Create: `src/components/ui/terminal-log.tsx`
- Create: `tests/terminal-log.test.tsx`

**Props interface:**
```ts
interface TerminalLogProps {
  lines: string[];        // raw strings, may contain ANSI codes
  className?: string;
  maxHeight?: string;     // default '400px'
  autoScroll?: boolean;   // default true
}
```

**Key behaviors:**
- `'use client'` directive required
- Convert each line with `ansi-to-html` (`new Ansi({ escapeXML: true })`) — render via `dangerouslySetInnerHTML`
- Auto-scroll: `useEffect` on `lines` — if `scrollTop >= scrollHeight - clientHeight - 20`, scroll to bottom
- Auto-scroll pauses when user scrolls up past the 20px threshold (track with `onScroll` handler + `isUserScrolled` ref)
- `terminal-surface` class on container (triggers CSS scanlines)
- Background: `bg-[--terminal-bg]`
- Text: default `text-[--text-secondary]`; lines containing `ERROR` → `text-[--status-red]`; `WARN` → `text-[--phosphor-amber]`
- Font: `font-mono text-xs leading-relaxed`
- Install: no new shadcn components needed

- [ ] Step 1: Write test

  `tests/terminal-log.test.tsx`:
  ```tsx
  import { render, screen } from '@testing-library/react';
  import { expect, test, describe } from 'vitest';
  import { TerminalLog } from '@/components/ui/terminal-log';

  describe('TerminalLog', () => {
    test('renders lines as terminal output', () => {
      render(<TerminalLog lines={['Hello world', 'Second line']} />);
      expect(screen.getByText(/Hello world/)).toBeInTheDocument();
    });

    test('applies terminal-surface class for scanlines', () => {
      const { container } = render(<TerminalLog lines={[]} />);
      expect(container.firstChild).toHaveClass('terminal-surface');
    });

    test('renders empty state without error', () => {
      const { container } = render(<TerminalLog lines={[]} />);
      expect(container).toBeInTheDocument();
    });
  });
  ```

- [ ] Step 2: Run test to fail
  ```bash
  pnpm test:unit -- terminal-log
  ```

- [ ] Step 3: Implement `src/components/ui/terminal-log.tsx` with `'use client'`, `ansi-to-html` conversion, auto-scroll logic, scanlines wrapper, and level-based text coloring.

- [ ] Step 4: Run test to pass
  ```bash
  pnpm test:unit -- terminal-log
  ```

- [ ] Step 5: Commit
  ```bash
  git add src/components/ui/terminal-log.tsx tests/terminal-log.test.tsx
  git commit -m "feat: add TerminalLog component with ANSI rendering and scanline effect"
  ```

---

### Task 7: DiffViewer Component

**Files:**
- Create: `src/components/ui/diff-viewer.tsx`

**Props interface:**
```ts
interface DiffFile {
  filename: string;
  patch: string;     // unified diff format
  additions: number;
  deletions: number;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
}

interface DiffViewerProps {
  files: DiffFile[];
  className?: string;
}
```

**Key behaviors:**
- `'use client'` directive required
- Two-pane layout: left file tree (selectable, `w-56 shrink-0`), right diff content
- Shiki highlighter: `github-dark` theme, module-scope singleton (`let highlighterPromise: Promise<...> | null = null`)
- `+` lines: `bg-green-950/40 text-green-400`; `-` lines: `bg-red-950/40 text-red-400`; `@@` chunk headers: `text-[--text-muted]`
- File tree shows filename, badge with `+N -N` in appropriate colors
- `useEffect` to load shiki and highlight selected file patch on selection change
- `useState` for `selectedFile: string | null` (default first file)
- No new shadcn installs needed for this component

- [ ] Step 1: Implement `src/components/ui/diff-viewer.tsx`. No TDD required for this component (Shiki async setup makes unit testing unreliable in jsdom).

- [ ] Step 2: Commit
  ```bash
  git add src/components/ui/diff-viewer.tsx
  git commit -m "feat: add DiffViewer component with Shiki syntax highlighting"
  ```

---

### Task 8: TaskRow Component

**Files:**
- Create: `src/components/ui/task-row.tsx`

**Props interface:**
```ts
type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'failed' | 'skipped';
type UserRole = 'viewer' | 'member' | 'admin' | 'owner';

interface TaskRowProps {
  task: {
    id: number;
    title: string;
    status: TaskStatus;
    description?: string | null;
    errorMessage?: string | null;
    orderIndex: number;
  };
  userRole: UserRole;
  onUnblock?: (taskId: number) => void;
  onOverride?: (taskId: number, newStatus: TaskStatus) => void;
  className?: string;
}
```

**Key behaviors:**
- `'use client'` directive required
- Install shadcn components (first use):
  ```bash
  npx shadcn@latest add collapsible tooltip dropdown-menu
  ```
- Status character map:
  - `todo` → `○` (text-muted)
  - `in_progress` → `▶` (text-[--accent-violet] + `animate-blink`)
  - `blocked` → `⚠` (text-[--phosphor-amber])
  - `done` → `✓` (text-[--status-emerald])
  - `failed` → `✕` (text-[--status-red])
  - `skipped` → `-` (text-muted dim)
- Collapsible: click row to expand description/error
- `DropdownMenu` for actions: "Unblock" (requires `member` role), "Override Status" (requires `admin` role)
- RBAC rule: never hide buttons — disabled + `Tooltip` explaining required role if insufficient
- `onUnblock` only callable if `userRole` is `member` or higher
- `onOverride` only callable if `userRole` is `admin` or higher

- [ ] Step 1: Install shadcn components
  ```bash
  npx shadcn@latest add collapsible tooltip dropdown-menu
  ```

- [ ] Step 2: Implement `src/components/ui/task-row.tsx`

- [ ] Step 3: Commit
  ```bash
  git add src/components/ui/task-row.tsx
  git commit -m "feat: add TaskRow with collapsible detail, status chars, and RBAC actions"
  ```

---

## Chunk 4: Auth Pages

### Task 9: Auth Layout

**Files:**
- Create: `src/app/(auth)/layout.tsx`

**Key behaviors:**
- Server Component (no `'use client'`)
- No shell — just a full-page centered container
- Check if already authenticated: `const session = await auth()` — if session exists, redirect to `/`

```tsx
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session) redirect('/');
  return (
    <div className="min-h-screen flex items-center justify-center bg-[--bg-base]">
      {children}
    </div>
  );
}
```

- [ ] Step 1: Create `src/app/(auth)/layout.tsx` as above

- [ ] Step 2: Commit
  ```bash
  git add src/app/\(auth\)/layout.tsx
  git commit -m "feat: add auth layout with redirect for authenticated users"
  ```

---

### Task 10: Login Page

**Files:**
- Create: `src/app/(auth)/login/page.tsx`

**Key behaviors:**
- `'use client'`
- Install shadcn:
  ```bash
  npx shadcn@latest add card input button label
  ```
- Form fields: `email`, `password`
- `authClient.signIn.email({ email, password })` — from `@/lib/auth-client`
- On success: `router.push('/')`
- On error: show inline error with sonner `toast.error()`
- Link to `/forgot-password`
- DaemonMascot `size={48}` at top of card (`expression="idle"`, changes to `"working"` during submit)
- Violet primary button: "Sign In"
- No `console.*` — errors only via `clientLogger.error()`

- [ ] Step 1: Install shadcn components (if not already from Task 8)
  ```bash
  npx shadcn@latest add card input button label
  ```

- [ ] Step 2: Install sonner toast (already in deps — just verify)
  ```bash
  pnpm list sonner
  ```

- [ ] Step 3: Implement `src/app/(auth)/login/page.tsx` — client component with `authClient.signIn.email()`, DaemonMascot, error handling via `clientLogger` and sonner toast

- [ ] Step 4: Commit
  ```bash
  git add src/app/\(auth\)/login/page.tsx
  git commit -m "feat: add login page with BetterAuth sign-in and DAEMON mascot"
  ```

---

### Task 11: ForgotPassword Page

**Files:**
- Create: `src/app/(auth)/forgot-password/page.tsx`

**Key behaviors:**
- `'use client'`
- Single email field
- `authClient.forgetPassword({ email, redirectTo: '/reset-password' })`
- On success: show confirmation message ("Check your email for a reset link")
- On error: `clientLogger.error()` + sonner `toast.error()`
- Link back to `/login`

- [ ] Step 1: Implement `src/app/(auth)/forgot-password/page.tsx`

- [ ] Step 2: Commit
  ```bash
  git add src/app/\(auth\)/forgot-password/page.tsx
  git commit -m "feat: add forgot password page"
  ```

---

### Task 12: ResetPassword Page

**Files:**
- Create: `src/app/(auth)/reset-password/page.tsx`

**Key behaviors:**
- `'use client'`
- Read `token` from URL search params via `useSearchParams()`
- Fields: `newPassword`, `confirmPassword`
- Validate passwords match before submit
- `authClient.resetPassword({ newPassword, token })`
- On success: `router.push('/login')` + sonner `toast.success('Password updated')`
- On error: `clientLogger.error()` + sonner `toast.error()`
- If no token in URL: show error state ("Invalid or expired reset link")

- [ ] Step 1: Implement `src/app/(auth)/reset-password/page.tsx`

- [ ] Step 2: Commit
  ```bash
  git add src/app/\(auth\)/reset-password/page.tsx
  git commit -m "feat: add reset password page with token validation"
  ```

---

### Task 13: Invite / AcceptInvite Page

**Files:**
- Create: `src/app/(auth)/invite/page.tsx`

**Key behaviors:**
- `'use client'`
- Read `token` from URL search params via `useSearchParams()`
- If user not logged in: show register/login choice with invite context
- `authClient.organization.acceptInvitation({ invitationId: token })` — or use the project invite endpoint from `POST /api/v1/projects/{id}/invite/accept`
- Check `/api/v1/invites/validate?token=<token>` (if available) to show invitation context (project name, inviter)
- On success: `router.push('/')` + sonner `toast.success('Welcome to the project!')`
- On invalid token: show "Invitation expired or invalid" state with DaemonMascot `expression="error"`

- [ ] Step 1: Implement `src/app/(auth)/invite/page.tsx`

- [ ] Step 2: Commit
  ```bash
  git add src/app/\(auth\)/invite/page.tsx
  git commit -m "feat: add invite accept page with token validation"
  ```

---

## Chunk 5: Shell

### Task 14: ShellContext Provider

**Files:**
- Create: `src/components/shell/shell-context.tsx`
- Create: `tests/shell-context.test.tsx`

**Props interface:**
```ts
interface ShellContextValue {
  activeProjectId: number | null;
  setActiveProjectId: (id: number | null) => void;
  devMode: boolean;
  setDevMode: (v: boolean) => void;
  user: { id: string; name: string; email: string; role?: string; onboardingStep?: number };
  shortcutsOpen: boolean;
  setShortcutsOpen: (v: boolean) => void;
}

interface ShellProviderProps {
  user: ShellContextValue['user'];
  children: React.ReactNode;
}
```

**Key behaviors:**
- `'use client'` directive
- `activeProjectId` persisted to `localStorage:specdrivr:activeProjectId` (parse as int)
- `devMode` persisted to `localStorage:specdrivr:devMode` (parse as boolean string)
- Keyboard shortcuts registered in `useEffect`:
  - `?` → open shortcuts modal
  - `` Ctrl+` `` → toggle devMode
  - `g` then `m` (within 500ms) → `router.push('/')`
  - `g` then `s` (within 500ms) → `router.push('/specs')`
  - `g` then `a` (within 500ms) → `router.push('/sessions')`
  - `Escape` → close shortcuts modal
- Export: `ShellProvider`, `useShell` hook

- [ ] Step 1: Write tests

  `tests/shell-context.test.tsx`:
  ```tsx
  import { render, screen, act } from '@testing-library/react';
  import userEvent from '@testing-library/user-event';
  import { expect, test, describe, beforeEach } from 'vitest';
  import { ShellProvider, useShell } from '@/components/shell/shell-context';

  const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };

  function TestConsumer() {
    const { activeProjectId, setActiveProjectId, devMode } = useShell();
    return (
      <div>
        <span data-testid="project-id">{activeProjectId ?? 'null'}</span>
        <span data-testid="dev-mode">{devMode ? 'true' : 'false'}</span>
        <button onClick={() => setActiveProjectId(42)}>set project</button>
      </div>
    );
  }

  describe('ShellContext', () => {
    beforeEach(() => localStorage.clear());

    test('provides default null activeProjectId', () => {
      render(<ShellProvider user={mockUser}><TestConsumer /></ShellProvider>);
      expect(screen.getByTestId('project-id').textContent).toBe('null');
    });

    test('persists activeProjectId to localStorage', async () => {
      const user = userEvent.setup();
      render(<ShellProvider user={mockUser}><TestConsumer /></ShellProvider>);
      await user.click(screen.getByText('set project'));
      expect(localStorage.getItem('specdrivr:activeProjectId')).toBe('42');
    });

    test('throws if useShell called outside provider', () => {
      // Suppress error output
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<TestConsumer />)).toThrow();
      spy.mockRestore();
    });
  });
  ```

- [ ] Step 2: Run test to fail
  ```bash
  pnpm test:unit -- shell-context
  ```

- [ ] Step 3: Implement `src/components/shell/shell-context.tsx`

- [ ] Step 4: Run test to pass
  ```bash
  pnpm test:unit -- shell-context
  ```

- [ ] Step 5: Commit
  ```bash
  git add src/components/shell/shell-context.tsx tests/shell-context.test.tsx
  git commit -m "feat: add ShellContext with localStorage persistence and keyboard shortcuts"
  ```

---

### Task 15: Sidebar Component

**Files:**
- Create: `src/components/shell/sidebar.tsx`

**Props interface:**
```ts
interface SidebarProps {
  projects: Array<{ id: number; name: string; slug: string }>;
  userRole: UserRole;
}
```

**Key behaviors:**
- `'use client'` — uses `useShell()`, `usePathname()`, `router`
- Install shadcn:
  ```bash
  npx shadcn@latest add select separator badge
  ```
- Layout: `w-60 flex-col border-r border-[--border-default] bg-[--bg-surface] h-full`
- Top: Specdrivr logo/wordmark + project switcher (`Select` component, synced to `activeProjectId` in ShellContext)
- Nav items with lucide-react icons:
  - `LayoutDashboard` → Mission Control (`/`)
  - `FolderKanban` → Projects (`/projects`)
  - `FileText` → Specs (`/specs`)
  - `Terminal` → Sessions (`/sessions`)
  - `Settings` → Settings (`/settings`)
- Active state: `bg-[--accent-violet]/10 text-[--accent-violet]`
- Bottom section:
  - DAEMON mascot `size={24}` with `expression` driven by last session status (idle if none)
  - Mono status text: retro header style
  - Dev mode indicator badge (if devMode on): amber `DEV` badge

- [ ] Step 1: Install shadcn components
  ```bash
  npx shadcn@latest add select separator badge
  ```

- [ ] Step 2: Implement `src/components/shell/sidebar.tsx`

- [ ] Step 3: Commit
  ```bash
  git add src/components/shell/sidebar.tsx
  git commit -m "feat: add Sidebar with project switcher, nav, and DAEMON status"
  ```

---

### Task 16: TopBar Component

**Files:**
- Create: `src/components/shell/top-bar.tsx`

**Props interface:**
```ts
interface TopBarProps {
  breadcrumbs?: Array<{ label: string; href?: string }>;
}
```

**Key behaviors:**
- `'use client'` — uses `useShell()`, `authClient`
- Install shadcn:
  ```bash
  npx shadcn@latest add breadcrumb avatar
  ```
- Height: `h-14 border-b border-[--border-default] bg-[--bg-surface]`
- Left: breadcrumb trail from `breadcrumbs` prop (auto-built from `usePathname()` if not provided)
- Right: notification bell (`Bell` from lucide-react) with unread count badge, user avatar + `DropdownMenu`
- User dropdown: "Profile", "Settings" link, separator, "Sign out" (`authClient.signOut()`)
- Notification count: polls `GET /api/v1/notifications?unreadOnly=true&limit=1` every 30s via `usePolling`
- Keyboard shortcut `?` chip in far right corner to open ShellContext shortcuts modal

- [ ] Step 1: Install shadcn components
  ```bash
  npx shadcn@latest add breadcrumb avatar
  ```

- [ ] Step 2: Implement `src/components/shell/top-bar.tsx` with notification polling and user dropdown

- [ ] Step 3: Commit
  ```bash
  git add src/components/shell/top-bar.tsx
  git commit -m "feat: add TopBar with breadcrumbs, notification polling, and user dropdown"
  ```

---

### Task 17: App Shell Layout with Auth Guard

**Files:**
- Create: `src/app/(app)/layout.tsx`

**Key behaviors:**
- Server Component
- `const session = await auth()` — if null, `redirect('/login')`
- If `session.user.onboardingStep === 0`, pass `showOnboarding={true}` to client wrapper
- Fetches user's projects server-side via repository (use `projectRepository.getByUserId(session.user.id)`)
- Wraps children in `<ShellProvider user={session.user}>`
- Shell layout: `<div className="flex h-screen overflow-hidden">`
  - `<Sidebar projects={projects} userRole={userRole} />`
  - `<div className="flex flex-col flex-1 overflow-hidden">`
    - `<TopBar />`
    - `<main className="flex-1 overflow-y-auto p-6">{children}</main>`
- If `showOnboarding`: render `<OnboardingWizard user={session.user} />` inside the shell (overlays as Dialog)

```tsx
// src/app/(app)/layout.tsx (Server Component, no 'use client')
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { projectRepository } from '@/repositories/project-repository';
import { getProjectRole } from '@/lib/rbac';
import { ShellProvider } from '@/components/shell/shell-context';
import { Sidebar } from '@/components/shell/sidebar';
import { TopBar } from '@/components/shell/top-bar';
import { OnboardingWizard } from '@/components/onboarding-wizard';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const projects = await projectRepository.getByUserId(session.user.id);
  const showOnboarding = session.user.onboardingStep === 0;

  return (
    <ShellProvider user={session.user}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar projects={projects} userRole="member" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
      {showOnboarding && <OnboardingWizard user={session.user} />}
    </ShellProvider>
  );
}
```

- [ ] Step 1: Implement `src/app/(app)/layout.tsx` as above

- [ ] Step 2: Commit
  ```bash
  git add src/app/\(app\)/layout.tsx
  git commit -m "feat: add app shell layout with auth guard and onboarding check"
  ```

---

## Chunk 6: Onboarding + Mission Control

### Task 18: OnboardingWizard Component

**Files:**
- Create: `src/components/onboarding-wizard.tsx`

**Props interface:**
```ts
interface OnboardingWizardProps {
  user: {
    id: string;
    name: string;
    onboardingStep?: number;
  };
}
```

**Key behaviors:**
- `'use client'`
- Install shadcn:
  ```bash
  npx shadcn@latest add dialog progress
  ```
- 3-step Dialog — non-dismissable:
  - `onPointerDownOutside={(e) => e.preventDefault()}`
  - `onEscapeKeyDown={(e) => e.preventDefault()}`
- Step 1: Welcome — DaemonMascot `size={64}` `expression="idle"`, welcome copy
- Step 2: Set display name — Input for name, `PATCH /api/v1/users/me { name }` with `credentials: 'include'`
- Step 3: Create first project — Input for project name, `POST /api/v1/projects` with `credentials: 'include'`; on success: `PATCH /api/v1/users/me { onboardingStep: 3 }`, then `router.refresh()`
- Progress bar at top showing step N of 3
- `useState` for `step: 1 | 2 | 3` and `isSubmitting: boolean`
- Error display: inline below form field with `clientLogger.error()` on failure
- After step 3 success: `router.refresh()` to reload layout (server will see onboardingStep=3, hide wizard)

- [ ] Step 1: Install shadcn components
  ```bash
  npx shadcn@latest add dialog progress
  ```

- [ ] Step 2: Implement `src/components/onboarding-wizard.tsx`

- [ ] Step 3: Commit
  ```bash
  git add src/components/onboarding-wizard.tsx
  git commit -m "feat: add OnboardingWizard 3-step non-dismissable dialog"
  ```

---

### Task 19: Create `GET /api/v1/sessions/[id]/events` Route

**Files:**
- Create: `src/app/api/v1/sessions/[id]/events/route.ts`

**Key behaviors:**
- This is the **only missing backend route** — all other API routes are complete
- `GET /api/v1/sessions/{id}/events?limit=30`
- Auth: `const session = await auth()` — 401 if null
- Fetch session, check project membership via `requireMember()`
- Query `agentEvents` table via `agentSessionRepository` (add `getEvents(sessionId, limit)` method) or query inline
- Response envelope: `{ data: AgentEventSelect[] }`
- Sorted by `createdAt` ascending (chronological order for log display)

```ts
// src/app/api/v1/sessions/[id]/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { agentSessionRepository } from '@/repositories/agent-session-repository';
import { handleApiError } from '@/lib/error-handler';
import { NotFoundError } from '@/lib/errors';
import { requireMember } from '@/lib/rbac';
import { db } from '@/db';
import { agentEvents } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { id } = await params;
    const sessionId = parseInt(id, 10);

    const agentSession = await agentSessionRepository.getById(sessionId);
    if (!agentSession) throw new NotFoundError(`Session ${sessionId} not found`);

    const { allowed } = await requireMember(session.user.id, agentSession.projectId);
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 30;

    const events = await db
      .select()
      .from(agentEvents)
      .where(eq(agentEvents.sessionId, sessionId))
      .orderBy(desc(agentEvents.createdAt))
      .limit(limit);

    return NextResponse.json({ data: events.reverse() });
  } catch (error) {
    return handleApiError(error);
  }
}
```

- [ ] Step 1: Create the directory and implement the route

- [ ] Step 2: Commit
  ```bash
  git add src/app/api/v1/sessions/
  git commit -m "feat: add GET /api/v1/sessions/[id]/events endpoint"
  ```

---

### Task 20: NeedsAttentionBanner Component

**Files:**
- Create: `src/components/mission-control/needs-attention-banner.tsx`

**Props interface:**
```ts
interface BlockedTask {
  id: number;
  title: string;
  specId: number;
}

interface NeedsAttentionBannerProps {
  blockedTasks: BlockedTask[];
  onDismiss: () => void;  // session-level dismiss only
}
```

**Key behaviors:**
- `'use client'`
- Amber strip: `bg-[--phosphor-amber]/10 border border-[--phosphor-amber]/20`
- Left: `⚠` icon + "NEEDS ATTENTION" retro header label
- Center: scrollable row of clickable task pills — each pill navigates to `/specs/{specId}?tab=tasks`
- Right: dismiss button (X icon, `onDismiss` called) — session-dismiss only (does NOT persist across page reload)
- Hidden if `blockedTasks.length === 0`

- [ ] Step 1: Implement `src/components/mission-control/needs-attention-banner.tsx`

- [ ] Step 2: Commit
  ```bash
  git add src/components/mission-control/needs-attention-banner.tsx
  git commit -m "feat: add NeedsAttentionBanner for blocked task alerts"
  ```

---

### Task 21: SessionPanel Component

**Files:**
- Create: `src/components/mission-control/session-panel.tsx`

**Props interface:**
```ts
type SessionPanelState = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

interface AgentSession {
  id: number;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  tasksExecuted: number;
  tasksSucceeded: number;
  tasksFailed: number;
  errorMessage?: string | null;
  specId?: number | null;
}

interface SessionPanelProps {
  session: AgentSession | null;  // null = idle state
  userRole: UserRole;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  onDismiss?: () => void;
}
```

**Key behaviors:**
- `'use client'`
- Install shadcn:
  ```bash
  npx shadcn@latest add alert
  ```
- State mapping:
  ```ts
  const panelState: SessionPanelState =
    !session                           ? 'idle'
    : session.status === 'running'     ? 'running'
    : session.status === 'paused'      ? 'paused'
    : session.status === 'completed'   ? 'completed'
    : session.status === 'failed'      ? 'failed'
    : /* cancelled */                    'cancelled';
  ```
- `idle`: DaemonMascot `size={48}` `expression="idle"` + "SYSTEM READY" + "No active session." + link to /specs
- `running`: pulsing green dot + "● LIVE" label + elapsed timer (`useEffect` interval, formatted `mm:ss`) + task progress counts + Pause/Cancel buttons (RBAC: requires `admin` role, disabled + Tooltip if insufficient)
- `paused`: same as running but timer frozen, amber "⏸ PAUSED", Resume button (requires `admin`)
- `completed`: DaemonMascot `size={48}` `expression="success"` + "Execution complete." + task counts + "View Changes" link to spec → auto-clears after 60s via `useEffect` timeout calling `onDismiss`
- `failed`: DaemonMascot `size={48}` `expression="error"` + destructive `Alert` + `session.errorMessage` if present + collapsible "View last logs" + Retry/Dismiss buttons
- `cancelled`: DaemonMascot `size={48}` `expression="idle"` + muted "Session cancelled." + link to /specs
- Elapsed timer: `setInterval(1000)` in `useEffect`, cleared on unmount

- [ ] Step 1: Install shadcn components
  ```bash
  npx shadcn@latest add alert
  ```

- [ ] Step 2: Implement `src/components/mission-control/session-panel.tsx`

- [ ] Step 3: Commit
  ```bash
  git add src/components/mission-control/session-panel.tsx
  git commit -m "feat: add SessionPanel with 6-state rendering and RBAC controls"
  ```

---

### Task 22: EventLog Component

**Files:**
- Create: `src/components/mission-control/event-log.tsx`

**Props interface:**
```ts
interface EventLogProps {
  sessionId: number | null;  // null = no active session, polling paused
  className?: string;
}
```

**Key behaviors:**
- `'use client'`
- Uses `usePolling<AgentEventSelect[]>({ url: sessionId ? \`/api/v1/sessions/${sessionId}/events?limit=30\` : null, interval: 5000 })`
- Renders as retro terminal surface using `TerminalLog` component
- Each event formatted as: `[HH:MM:SS] [EVENT_TYPE] message`
- `isLoading` state: show skeleton or "Connecting…" in terminal style
- Empty state: "No events yet." in muted mono text
- Retro header: "EVENT LOG" in `text-xs font-mono uppercase tracking-widest text-[--text-muted]`

- [ ] Step 1: Implement `src/components/mission-control/event-log.tsx`

- [ ] Step 2: Commit
  ```bash
  git add src/components/mission-control/event-log.tsx
  git commit -m "feat: add EventLog component polling session events every 5s"
  ```

---

### Task 23: Mission Control Page

**Files:**
- Create: `src/app/(app)/page.tsx`

**Key behaviors:**
- Server Component — fetches initial data, passes to client components
- `const session = await auth()` (layout already guards, but call for user data)
- Fetch active session: `agentSessionRepository.getLatestByProjectId(activeProjectId)` — need to pass `activeProjectId` from ShellContext (use `searchParams` or cookie for SSR, or make client component)
  - **Note:** Because `activeProjectId` lives in ShellContext (client-only), make this page a `'use client'` component that reads `useShell()` and fetches via hooks
- Fetch blocked tasks: `GET /api/v1/tasks?status=blocked&projectId={activeProjectId}` — poll every 30s
- Layout: `flex flex-col gap-6`
  - `<NeedsAttentionBanner>` (if blockedTasks.length > 0)
  - Page title: "MISSION CONTROL" in retro header style
  - Two-column: `grid grid-cols-1 lg:grid-cols-2 gap-6`
    - Left: `<SessionPanel session={activeSession} userRole={userRole} ...handlers />`
    - Right: `<EventLog sessionId={activeSession?.id ?? null} />`
- Session control handlers call `PATCH /api/v1/sessions/{id}` with `{ credentials: 'include' }`

- [ ] Step 1: Install shadcn components:
  ```bash
  npx shadcn@latest add skeleton
  ```

- [ ] Step 2: Implement `src/app/(app)/page.tsx` as client component using `useShell()`, `usePolling` for session and blocked tasks

- [ ] Step 3: Commit
  ```bash
  git add src/app/\(app\)/page.tsx
  git commit -m "feat: add Mission Control page with SessionPanel and EventLog"
  ```

---

## Chunk 7: Projects + Specs List

### Task 24: Projects Page

**Files:**
- Create: `src/app/(app)/projects/page.tsx`
- Create: `src/components/projects/create-project-dialog.tsx`

**Key behaviors:**

**`page.tsx`** — Server Component:
- Fetches projects via `projectRepository.getByUserId(session.user.id)`
- Renders `<ProjectsTable projects={projects} userRole={userRole} />`

**`create-project-dialog.tsx`** — `'use client'`:
- `Dialog` trigger: "New Project" button (requires `admin` role — disabled + Tooltip if not)
- Fields: `name` (required), `description` (optional), `githubRepo` (optional, format: `owner/repo`)
- `POST /api/v1/projects { name, description, githubRepo }` with `credentials: 'include'`
- On success: `router.refresh()` + `toast.success('Project created')`
- On error: `clientLogger.error()` + `toast.error()`

**Projects Table** (inline or separate component):
- Install shadcn:
  ```bash
  npx shadcn@latest add table
  ```
- Columns: Name, Description, Created, Members, Actions
- Actions: "View Specs" → `/specs?projectId={id}`, "Settings" → `/settings?projectId={id}`
- Empty state: DaemonMascot `size={48}` `expression="idle"` + "No projects yet." + "Create your first project" button

- [ ] Step 1: Install shadcn components
  ```bash
  npx shadcn@latest add table
  ```

- [ ] Step 2: Implement `src/app/(app)/projects/page.tsx` and `src/components/projects/create-project-dialog.tsx`

- [ ] Step 3: Commit
  ```bash
  git add src/app/\(app\)/projects/page.tsx src/components/projects/
  git commit -m "feat: add Projects page with table and create project dialog"
  ```

---

### Task 25: Specs List Page

**Files:**
- Create: `src/app/(app)/specs/page.tsx`

**Key behaviors:**
- `'use client'` (needs polling + ShellContext)
- Install shadcn:
  ```bash
  npx shadcn@latest add tabs input
  ```
- Polls `GET /api/v1/specs?projectId={activeProjectId}` every 5s via `usePolling`
- Tabs: All | drafting | pending_plan | pending_approval | executing | completed | stalled | archived
- Search: `Input` filtering by spec title client-side
- Table columns: Title, Status badge (color-coded), Created, Updated, Actions
- Status badge colors:
  - `drafting` → `text-[--text-muted]`
  - `pending_plan` → `text-[--phosphor-amber]` + animate-blink
  - `pending_approval` → `text-[--phosphor-amber]`
  - `executing` → `text-[--accent-violet]` + animate-blink
  - `completed` → `text-[--status-emerald]`
  - `stalled` → `text-[--status-orange]`
  - `archived` → `text-[--text-muted]` dim
- Row click → `/specs/{id}`
- "New Spec" button → `/specs/new` (requires `member` role)
- Empty state: DaemonMascot `size={48}` `expression="idle"` + "No specs yet."
- Polling stops (via `stopWhen`) only if manually stopped; default continuous poll

- [ ] Step 1: Install shadcn components
  ```bash
  npx shadcn@latest add tabs input
  ```

- [ ] Step 2: Implement `src/app/(app)/specs/page.tsx`

- [ ] Step 3: Commit
  ```bash
  git add src/app/\(app\)/specs/page.tsx
  git commit -m "feat: add Specs list page with polling, tabs, and search"
  ```

---

## Chunk 8: Spec Editor

### Task 26: SpecEditor Shared Component

**Files:**
- Create: `src/components/specs/spec-editor.tsx`

**Props interface:**
```ts
interface SpecEditorProps {
  initialContent?: string;
  specId?: number;          // undefined = new spec
  specStatus?: SpecStatus;
  onSave: (content: string) => Promise<{ success: boolean; error?: string }>;
  onPublish?: () => void;   // optional: for new spec publish
  className?: string;
}
```

**Key behaviors:**
- `'use client'`
- Split-pane layout: `grid grid-cols-2 h-screen` — CodeMirror left, react-markdown right
- `@uiw/react-codemirror` with `@codemirror/lang-markdown` extension, dark theme
- `react-markdown` for right-pane preview
- `isDirty`: tracks whether content differs from `initialContent`
- `Ctrl+Enter` keyboard shortcut → calls `onSave(content)`
- `beforeunload` event guard: `if (isDirty) event.preventDefault()` — browser will show confirmation dialog
- Warning banners (amber Alert) shown at top when:
  - `specStatus === 'executing'`: "This spec has an active execution session — edits may cause conflicts."
  - `specStatus === 'pending_approval'` (i.e., plan is in changes_requested): "Plan changes have been requested — address feedback before editing."
- Save button shows spinner while saving; sonner `toast.success('Saved')` on success
- Header: spec title input (editable inline), Save button, Back link
- Handles `specStatus === 'pending_plan'` by showing read-only mode with amber notice

- [ ] Step 1: Implement `src/components/specs/spec-editor.tsx`

- [ ] Step 2: Commit
  ```bash
  git add src/components/specs/spec-editor.tsx
  git commit -m "feat: add SpecEditor split-pane CodeMirror + Markdown preview component"
  ```

---

### Task 27: /specs/new — Layout + Page

**Files:**
- Create: `src/app/(app)/specs/new/layout.tsx`
- Create: `src/app/(app)/specs/new/page.tsx`

**Key behaviors:**

**`layout.tsx`** — Server Component, suppresses shell:
- No `<Sidebar>`, `<TopBar>`, or `<ShellProvider>` — editor-only chrome
- Simple wrapper: `<div className="h-screen bg-[--bg-base]">{children}</div>`
- Note: This layout overrides the `(app)/layout.tsx` shell for this route segment

**`page.tsx`** — `'use client'`:
- `onSave` handler: `POST /api/v1/specs { title, content, projectId }` with `credentials: 'include'`
- On first save: `router.replace('/specs/{newId}/edit')` so URL updates without navigation stack entry
- Renders `<SpecEditor onSave={handleSave} />`

- [ ] Step 1: Implement both files

- [ ] Step 2: Verify shell is suppressed (spec §9 check):
  ```bash
  grep -n "Sidebar\|TopBar\|ShellProvider" src/app/\(app\)/specs/new/layout.tsx
  ```
  Expected: zero results

- [ ] Step 3: Commit
  ```bash
  git add src/app/\(app\)/specs/new/
  git commit -m "feat: add /specs/new editor layout (shell-suppressed) and page"
  ```

---

### Task 28: /specs/[id]/edit — Layout + Page

**Files:**
- Create: `src/app/(app)/specs/[id]/edit/layout.tsx`
- Create: `src/app/(app)/specs/[id]/edit/page.tsx`

**Key behaviors:**

**`layout.tsx`** — Server Component, suppresses shell (same pattern as new):
- `<div className="h-screen bg-[--bg-base]">{children}</div>`

**`page.tsx`** — Server Component:
- `const session = await auth()` — redirect to `/login` if null
- Fetches spec: `specificationRepository.getById(specId)` — 404 if not found or user lacks access
- Verifies user has `member` role on project
- Passes `initialContent` and `specStatus` to `<SpecEditor>`
- `onSave` server action: `PATCH /api/v1/specs/{id}` with `credentials: 'include'`

- [ ] Step 1: Implement both files

- [ ] Step 2: Verify shell is suppressed:
  ```bash
  grep -n "Sidebar\|TopBar\|ShellProvider" src/app/\(app\)/specs/\[id\]/edit/layout.tsx
  ```
  Expected: zero results

- [ ] Step 3: Commit
  ```bash
  git add src/app/\(app\)/specs/\[id\]/edit/
  git commit -m "feat: add /specs/[id]/edit editor layout (shell-suppressed) and page"
  ```

---

## Chunk 9: Spec Detail

### Task 29: Spec Detail Page — Scaffold + Tabs Routing

**Files:**
- Create: `src/app/(app)/specs/[id]/page.tsx`

**Key behaviors:**
- `'use client'` (needs tab state + polling)
- Install shadcn:
  ```bash
  npx shadcn@latest add tabs
  ```
  (may already be installed from Task 25)
- URL-driven tab state: `?tab=spec|plan|tasks|changes|activity` (default: `spec`)
- Tab navigation uses `router.push` to update URL without full reload
- Polls spec status every 3s when `spec.status === 'pending_plan'`
- Fetches spec on mount via `GET /api/v1/specs/{id}` with `credentials: 'include'`
- Tab list: SPEC | PLAN | TASKS | CHANGES | ACTIVITY
- Each tab renders the corresponding component (Tasks 30–34)
- Header: spec title (large), status badge, "Edit" button (→ `/specs/{id}/edit`, requires `member`), breadcrumb

- [ ] Step 1: Implement `src/app/(app)/specs/[id]/page.tsx` scaffold with tab routing and spec fetch

- [ ] Step 2: Commit
  ```bash
  git add src/app/\(app\)/specs/\[id\]/page.tsx
  git commit -m "feat: add Spec Detail page scaffold with URL-driven tab routing"
  ```

---

### Task 30: SPEC Tab

**Files:**
- Create: `src/components/specs/spec-tab.tsx`

**Props interface:**
```ts
interface SpecTabProps {
  spec: {
    id: number;
    content: string;
    status: SpecStatus;
    title: string;
    createdAt: string;
    updatedAt: string;
  };
}
```

**Key behaviors:**
- Read-only rendered Markdown of `spec.content` via `react-markdown`
- Prose styling: `prose prose-invert max-w-none`
- Metadata sidebar: created date, updated date, status, word count
- "Edit Spec" button link (→ `/specs/{id}/edit`) disabled + Tooltip for `viewer` role

- [ ] Step 1: Implement `src/components/specs/spec-tab.tsx`

- [ ] Step 2: Commit
  ```bash
  git add src/components/specs/spec-tab.tsx
  git commit -m "feat: add SPEC tab with markdown render and metadata"
  ```

---

### Task 31: PLAN Tab (including Plan Review Flow)

**Files:**
- Create: `src/components/specs/plan-tab.tsx`

**Props interface:**
```ts
interface PlanTabProps {
  spec: { id: number; status: SpecStatus };
  userRole: UserRole;
}
```

**Key behaviors:**
- `'use client'`
- **State 1 — `spec.status === 'pending_plan'`:**
  - Polls spec every 3s via `usePolling`
  - `stopWhen: (s) => s.status !== 'pending_plan'` (stops when plan appears)
  - 30s elapsed: show "This is taking longer than expected…" amber notice
  - 2min elapsed: change DaemonMascot to `expression="error"`, show timeout message
  - Display: centered DaemonMascot `size={48}` `expression="working"` + "Generating plan…" + elapsed time

- **State 2 — Plan exists, `plan.status === 'pending_approval'`:**
  - Shows plan content (rendered markdown)
  - Three action buttons (always rendered, never hidden per RBAC rule):
    - "Approve Plan" (requires `admin`): `POST /api/v1/plans/{id}/approve` — disabled + Tooltip if insufficient role
    - "Request Changes" (requires `admin`): toggles slide-down panel with required `Textarea` before `POST /api/v1/plans/{id}/request-changes { feedback }`
    - "Reject Plan" (requires `admin`): toggles slide-down panel with required `Textarea` before `POST /api/v1/plans/{id}/reject { reason }`
  - Slide-down panels: `useRef` for animation, submit disabled until textarea has content

- **State 3 — `plan.status === 'changes_requested'`:**
  - Shows feedback from reviewer in amber blockquote
  - Shows plan content
  - "Re-generate Plan" button (requires `member`)

- **State 4 — `plan.status === 'executing' | 'completed'`:**
  - Read-only plan view with status badge

- **State 5 — `plan.status === 'rejected' | 'abandoned'`:**
  - DAEMON `expression="blocked"`, muted state message, "Re-generate" option

- [ ] Step 1: Implement `src/components/specs/plan-tab.tsx` with all states

- [ ] Step 2: Verify approve button is never conditionally hidden:
  ```bash
  grep -n "canApprove &&\|userCanApprove &&\|isAdmin &&" src/components/specs/plan-tab.tsx
  ```
  Expected: zero results

- [ ] Step 3: Commit
  ```bash
  git add src/components/specs/plan-tab.tsx
  git commit -m "feat: add PLAN tab with full review flow and RBAC-gated actions"
  ```

---

### Task 32: TASKS Tab

**Files:**
- Create: `src/components/specs/tasks-tab.tsx`

**Props interface:**
```ts
interface TasksTabProps {
  specId: number;
  userRole: UserRole;
}
```

**Key behaviors:**
- `'use client'`
- Polls `GET /api/v1/tasks?specId={specId}` every 5s via `usePolling`
- `stopWhen: (tasks) => tasks.every(t => ['done','failed','skipped'].includes(t.status))` — stops when all terminal
- Renders list of `<TaskRow>` components
- Summary header: total count, done count, failed count, in-progress count
- `onUnblock`: `PATCH /api/v1/tasks/{id} { status: 'todo' }` with `credentials: 'include'`
- `onOverride`: `PATCH /api/v1/tasks/{id} { status: newStatus }` with `credentials: 'include'`
- Empty state: "No tasks yet. Approve the plan to begin execution."

- [ ] Step 1: Implement `src/components/specs/tasks-tab.tsx`

- [ ] Step 2: Commit
  ```bash
  git add src/components/specs/tasks-tab.tsx
  git commit -m "feat: add TASKS tab with polling TaskRows and RBAC actions"
  ```

---

### Task 33: CHANGES Tab

**Files:**
- Create: `src/components/specs/changes-tab.tsx`

**Props interface:**
```ts
interface ChangesTabProps {
  specId: number;
}
```

**Key behaviors:**
- `'use client'`
- Fetches `GET /api/v1/specs/{id}/changes` (or GitHub PR diff if configured)
- Renders `<DiffViewer files={diffFiles} />` for file-by-file diff view
- If no changes: "No changes recorded yet." muted state
- Summary: total files changed, insertions (+), deletions (-)

- [ ] Step 1: Implement `src/components/specs/changes-tab.tsx`

- [ ] Step 2: Commit
  ```bash
  git add src/components/specs/changes-tab.tsx
  git commit -m "feat: add CHANGES tab with DiffViewer"
  ```

---

### Task 34: ACTIVITY Tab

**Files:**
- Create: `src/components/specs/activity-tab.tsx`

**Props interface:**
```ts
interface ActivityTabProps {
  specId: number;
}
```

**Key behaviors:**
- `'use client'`
- Fetches `GET /api/v1/specs/{id}/events` (or uses `agentEvents` filtered by `specId`)
- Timeline list of events sorted newest first
- Each event: timestamp, event type (mono badge), message
- Event type color coding:
  - `PLAN_*` → phosphor-amber
  - `TASK_*` → accent-violet
  - `SESSION_*` → text-secondary
- Polls every 10s when spec is `executing`; static otherwise
- Empty state: "No activity yet."

- [ ] Step 1: Implement `src/components/specs/activity-tab.tsx`

- [ ] Step 2: Commit
  ```bash
  git add src/components/specs/activity-tab.tsx
  git commit -m "feat: add ACTIVITY tab with event timeline"
  ```

---

## Chunk 10: Sessions, Settings + Verification

### Task 35: Sessions Page

**Files:**
- Create: `src/app/(app)/sessions/page.tsx`

**Key behaviors:**
- `'use client'`
- Polls `GET /api/v1/sessions?projectId={activeProjectId}` every 5s
- Table columns: ID (mono), Status (color-coded), Spec title, Started, Duration, Tasks (done/total)
- Status badges using same color mapping as SessionPanel states
- Row click → expands inline to show `<EventLog sessionId={session.id} />` in a collapsible
- Running sessions: stop polling `stopWhen` only when all sessions are terminal
- "No sessions" empty state with DaemonMascot

- [ ] Step 1: Implement `src/app/(app)/sessions/page.tsx`

- [ ] Step 2: Commit
  ```bash
  git add src/app/\(app\)/sessions/page.tsx
  git commit -m "feat: add Sessions page with polling table and inline EventLog"
  ```

---

### Task 36: Settings Page

**Files:**
- Create: `src/app/(app)/settings/page.tsx`
- Create: `src/components/settings/` (sub-components as needed)

**Key behaviors:**
- Server Component for initial data fetch, client sub-components for forms
- Sections (use shadcn `Tabs` or `Separator`-divided sections):
  1. **Profile** — Update name, email (`PATCH /api/v1/users/me`)
  2. **Project Settings** — Project name, description, GitHub integration (`PATCH /api/v1/projects/{id}`)
  3. **Members** — List members table, invite form (`POST /api/v1/projects/{id}/invites`), role change (`PATCH /api/v1/projects/{id}/members/{userId}`), remove member — all require `admin`
  4. **Danger Zone** — Delete project (requires `owner` role) — always rendered, disabled + Tooltip if insufficient
- All write operations require `admin` or `owner` per `PERMISSIONS` in `src/lib/rbac.ts`
- RBAC: never hide buttons — disabled + Tooltip with role requirement

- [ ] Step 1: Implement `src/app/(app)/settings/page.tsx` and necessary sub-components

- [ ] Step 2: Commit
  ```bash
  git add src/app/\(app\)/settings/page.tsx src/components/settings/
  git commit -m "feat: add Settings page with profile, project, members, and danger zone"
  ```

---

### Task 37: Final Verification

**Files:** None (verification only)

Run all checks from spec §9 in order:

- [ ] Step 1: Check for wrong token class names in custom components
  ```bash
  grep -rn "bg-background\b\|bg-card\b\|text-foreground\b\|text-muted-foreground\b" \
    src/components/ui/daemon-mascot.tsx src/components/ui/terminal-log.tsx \
    src/components/ui/task-row.tsx src/components/shell/ --include="*.tsx"
  ```
  Expected: zero results

- [ ] Step 2: Check for console calls
  ```bash
  grep -rn "console\.\(log\|error\|warn\)" \
    "src/app/(auth)/" "src/app/(app)/" src/components/ src/hooks/ \
    --include="*.tsx" --include="*.ts" | grep -v "logger-client.ts"
  ```
  Expected: zero results

- [ ] Step 3: Check all client fetches include credentials
  ```bash
  grep -rn "fetch(" src/components/ src/hooks/ "src/app/(auth)/" "src/app/(app)/" \
    --include="*.tsx" --include="*.ts" | grep -v "credentials\|server\|import"
  ```
  Expected: zero results

- [ ] Step 4: Check for pxlkit imports
  ```bash
  grep -rn "@pxlkit" src/ --include="*.tsx" --include="*.ts"
  ```
  Expected: zero results

- [ ] Step 5: Check for radix icons imports
  ```bash
  grep -rn "@radix-ui/react-icons" src/ --include="*.tsx" --include="*.ts"
  ```
  Expected: zero results

- [ ] Step 6: Verify editor layouts suppress shell
  ```bash
  grep -rn "Sidebar\|TopBar\|ShellProvider" \
    "src/app/(app)/specs/new/layout.tsx" \
    "src/app/(app)/specs/[id]/edit/layout.tsx"
  ```
  Expected: zero results

- [ ] Step 7: Verify approve button never conditionally hidden
  ```bash
  grep -rn "canApprove &&\|userCanApprove &&\|isAdmin &&" \
    src/components/specs/ --include="*.tsx"
  ```
  Expected: zero results

- [ ] Step 8: Verify usePolling uses clearInterval
  ```bash
  grep -n "clearTimeout\|clearInterval" src/hooks/use-polling.ts
  ```
  Expected: only `clearInterval` — no `clearTimeout`

- [ ] Step 9: Verify url accepts null in usePolling
  ```bash
  grep -n "url:" src/hooks/use-polling.ts
  ```
  Expected: `url: string | null`

- [ ] Step 10: Typecheck
  ```bash
  pnpm typecheck 2>&1 | tail -10
  ```
  Expected: zero errors

- [ ] Step 11: Build
  ```bash
  pnpm build 2>&1 | tail -10
  ```
  Expected: successful build, zero errors

- [ ] Step 12: Unit tests
  ```bash
  pnpm test:unit 2>&1 | tail -15
  ```
  Expected: all tests pass

- [ ] Step 13: Final commit (if any stray changes)
  ```bash
  git status
  # commit anything uncommitted
  git add -A
  git commit -m "chore: final verification pass — all checks green"
  ```

---

## Summary of New Files

| Path | Type | Notes |
|---|---|---|
| `src/app/globals.css` | Modified | Full design token replacement |
| `src/app/layout.tsx` | Modified | ThemeProvider + dark class |
| `src/app/(auth)/layout.tsx` | Created | Auth group layout |
| `src/app/(auth)/login/page.tsx` | Created | |
| `src/app/(auth)/forgot-password/page.tsx` | Created | |
| `src/app/(auth)/reset-password/page.tsx` | Created | |
| `src/app/(auth)/invite/page.tsx` | Created | |
| `src/app/(app)/layout.tsx` | Created | Shell with auth guard |
| `src/app/(app)/page.tsx` | Created | Mission Control |
| `src/app/(app)/projects/page.tsx` | Created | |
| `src/app/(app)/specs/page.tsx` | Created | Specs list |
| `src/app/(app)/specs/new/layout.tsx` | Created | Shell-suppressed |
| `src/app/(app)/specs/new/page.tsx` | Created | |
| `src/app/(app)/specs/[id]/page.tsx` | Created | Spec detail + tabs |
| `src/app/(app)/specs/[id]/edit/layout.tsx` | Created | Shell-suppressed |
| `src/app/(app)/specs/[id]/edit/page.tsx` | Created | |
| `src/app/(app)/sessions/page.tsx` | Created | |
| `src/app/(app)/settings/page.tsx` | Created | |
| `src/app/api/v1/sessions/[id]/events/route.ts` | **Created** | Only missing backend route |
| `src/components/ui/daemon-mascot.tsx` | Created | SVG mascot |
| `src/components/ui/terminal-log.tsx` | Created | ANSI log viewer |
| `src/components/ui/diff-viewer.tsx` | Created | Shiki diff viewer |
| `src/components/ui/task-row.tsx` | Created | Collapsible task row |
| `src/components/shell/shell-context.tsx` | Created | Client provider |
| `src/components/shell/sidebar.tsx` | Created | |
| `src/components/shell/top-bar.tsx` | Created | |
| `src/components/onboarding-wizard.tsx` | Created | 3-step dialog |
| `src/components/mission-control/needs-attention-banner.tsx` | Created | |
| `src/components/mission-control/session-panel.tsx` | Created | |
| `src/components/mission-control/event-log.tsx` | Created | |
| `src/components/projects/create-project-dialog.tsx` | Created | |
| `src/components/specs/spec-editor.tsx` | Created | |
| `src/components/specs/spec-tab.tsx` | Created | |
| `src/components/specs/plan-tab.tsx` | Created | Full review flow |
| `src/components/specs/tasks-tab.tsx` | Created | |
| `src/components/specs/changes-tab.tsx` | Created | |
| `src/components/specs/activity-tab.tsx` | Created | |
| `src/hooks/use-polling.ts` | Modified | `url: string \| null` |
| `tests/daemon-mascot.test.tsx` | Created | |
| `tests/use-polling.test.ts` | Created | |
| `tests/terminal-log.test.tsx` | Created | |
| `tests/shell-context.test.tsx` | Created | |
