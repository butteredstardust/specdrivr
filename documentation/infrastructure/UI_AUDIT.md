# UI Audit — 2026-09-04

> **Historical snapshot — pre-rebuild.** This audit records the UI as it existed before decision
> D1 and the 2026-09-04 UI overhaul. It is retained as provenance, not current guidance. For the
> shipped system, use [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) and
> [`UI_SPEC.md`](./UI_SPEC.md).

Scope: `src/app/globals.css`, `src/components/ui/**` (37 files), `src/components/**` (78 `.tsx` files
total), `src/app/(app)/**` and `src/app/(auth)/**`, `package.json` UI deps, `components.json`,
`documentation/infrastructure/DESIGN_SYSTEM.md` (576 lines). Read-only audit; no source files were
modified. All findings below are cited `file:line`.

---

## 1. Inventory — `src/components/ui/*`

37 files, all function/forwardRef components, **none use `"use client"` at top-of-file except 24 of
them** (interactive/stateful primitives — dialogs, popovers, selects, calendar, terminal widgets).
13 are server-renderable (button, badge, card, table, alert, avatar, breadcrumb, input, textarea,
page-header, brand-mark, skeleton, diff-viewer).

Only **1 of 37** files (`calendar.tsx`) uses the modern shadcn `data-slot` attribute convention; the
other 36 use the older `React.forwardRef` + `displayName` pattern (21 files call `forwardRef`
explicitly). This means the primitives were generated from/forked at an older shadcn "new-york"
template vintage and have since been hand-edited — they are **not** what `shadcn add` would emit
today, so re-running the CLI would clobber local customizations (extra variants, custom tokens).

| File | Purpose | Source | LOC | Notes |
|---|---|---|---|---|
| `alert-dialog.tsx` | Confirm dialogs | shadcn (Radix `alert-dialog`) | 117 | forwardRef pattern |
| `alert.tsx` | Inline alert banner | shadcn (cva) | 49 | **Unused file per knip** (`Unused files`); also listed in `knip.json` ignore list — the ignore is masking dead code |
| `avatar.tsx` | User avatar | shadcn (Radix `avatar`) | 47 | |
| `badge.tsx` | Status badge | shadcn (cva) | 32 | **Unused file per knip** (`Unused files`) — superseded by custom `pixel-badge.tsx` everywhere; not deleted |
| `brand-mark.tsx` | Specdrivr logo mark + wordmark | Custom | 61 | Not shadcn; product-specific |
| `breadcrumb.tsx` | Breadcrumb nav | shadcn | 101 | |
| `button.tsx` | Button | shadcn (cva) forked | 53 | Adds 2 custom variants not in stock shadcn: `phosphor` and `blue` (`src/components/ui/button.tsx:18-19`) — retro/mono uppercase treatments baked into the primitive |
| `calendar.tsx` | Date grid (react-day-picker) | shadcn | 177 | Only file using `data-slot` (`src/components/ui/calendar.tsx`, grep hit) |
| `card.tsx` | Card | shadcn | 58 | Adds custom `surface-dual-border animate-entrance` classes into the base recipe (`src/components/ui/card.tsx:10`) — every Card entrance-animates, no opt-out |
| `checkbox.tsx` | Checkbox | shadcn (Radix) | 28 | |
| `collapsible.tsx` | Collapsible | shadcn (Radix), passthrough | 11 | Pure re-export, no styling |
| `daemon-mascot.tsx` | Animated SVG mascot | Custom | 142 | Matches `DESIGN_SYSTEM.md` §9 spec closely (viewBox, size tiers, expressions) |
| `date-picker.tsx` | Date picker (popover+calendar) | Custom composition | 45 | |
| `dialog.tsx` | Modal dialog | shadcn (Radix) | 104 | |
| `diff-viewer.tsx` | Code diff display | Custom | 145 | Not shadcn; uses `--bg-diff-added`/`--bg-diff-deleted` tokens |
| `dropdown-menu.tsx` | Dropdown menu | shadcn (Radix) | 188 | |
| `input.tsx` | Text input | shadcn | 22 | |
| `keyboard-shortcuts-modal.tsx` | Shortcut cheat-sheet dialog | Custom | 137 | |
| `label.tsx` | Form label | shadcn (Radix) | 21 | |
| `live-terminal.tsx` | xterm.js wrapper | Custom | 187 | Wraps `@xterm/xterm`; dynamically imported (`next/dynamic`) in consumers |
| `matrix-screensaver.tsx` | Canvas "Ghost in the Machine" rain animation | Custom, experimental | 211 | **Not documented anywhere in `DESIGN_SYSTEM.md`** (zero hits) — a whole visual concept shipped in `dashboard-client.tsx:199` with no spec sign-off, comment calls it "Concept #5" (`src/components/ui/matrix-screensaver.tsx:14`) |
| `page-header.tsx` | Page title/breadcrumb header | Custom | 30 | |
| `pixel-badge.tsx` | Retro badge (superset of `badge.tsx`) | Custom (cva) | 59 | Hardcoded `rgba()` arbitrary shadow values, see §2 |
| `popover.tsx` | Popover | shadcn (Radix) | 33 | |
| `progress.tsx` | Progress bar | shadcn (Radix) | 51 | |
| `select.tsx` | Select | shadcn (Radix) | 153 | |
| `separator.tsx` | Divider | shadcn (Radix) | 26 | **Unused file per knip**; `@radix-ui/react-separator` is also an unused dependency |
| `skeleton.tsx` | Loading skeleton | shadcn | 7 | |
| `slider.tsx` | Slider | shadcn (Radix) | 25 | |
| `switch.tsx` | Toggle switch | shadcn (Radix) | 29 | |
| `table.tsx` | Table primitives | shadcn | 94 | |
| `tabs.tsx` | Tabs | shadcn (Radix) | 55 | |
| `task-row.tsx` | Dense task list row (ASCII progress, status glyphs) | Custom | 231 | Implements `DESIGN_SYSTEM.md` §8.4 ASCII bar/status-character spec |
| `terminal-log.tsx` | Static scrollback log viewer | Custom | 80 | |
| `textarea.tsx` | Textarea | shadcn | 21 | |
| `theme-toggle.tsx` | Light/dark/system toggle | shadcn pattern + `next-themes` | 33 | |
| `tooltip.tsx` | Tooltip | shadcn (Radix) | 32 | |

**Missing wrapper:** `vaul`'s `Drawer` is imported raw (`import { Drawer } from 'vaul'`) directly in
`src/components/tasks/task-drawer.tsx:5` instead of through a `src/components/ui/drawer.tsx`
primitive. Every other headless-UI dependency (Radix, react-day-picker) gets a wrapped primitive in
`components/ui/`; vaul does not, breaking the "one wrapper per primitive" convention the rest of the
directory follows.

**`components.json` drift:** `components.json:8` (`"config": "tailwind.config.mjs"`) points at a
file that **does not exist** in the repo (`find` confirms no `tailwind.config.*`). This is expected
and correct for Tailwind v4's CSS-first config (`src/app/globals.css:1` — `@import 'tailwindcss'`,
plus `@theme inline { ... }` at `src/app/globals.css:141-186`), but the `shadcn` CLI's own manifest
still references the v3-style config path. Running `shadcn add` today would likely warn/fail to
resolve config, or silently ignore the dangling pointer — this should be updated to point at
`globals.css` only, or the CLI's Tailwind v4 detection re-verified.

---

## 2. Design tokens (`src/app/globals.css`, 527 lines)

**Two parallel token systems coexist:**

1. **shadcn/Tailwind semantic tokens** (HSL triplets, consumed via `hsl(var(--x))` in the `@theme
   inline` block, `globals.css:141-163`): `--background`, `--foreground`, `--card`,
   `--card-foreground`, `--popover(-foreground)`, `--primary(-foreground)`, `--secondary(-foreground)`,
   `--muted(-foreground)`, `--accent(-foreground)`, `--destructive(-foreground)`, `--border`,
   `--input`, `--ring`, `--radius` (`globals.css:14-30` light, `:65-81` dark). Single radius value
   (`0.375rem`) — no scale (no sm/lg/xl radius tokens), so `rounded-*` utilities on components fall
   back to Tailwind's own scale, not a design token.

2. **Custom "Specdrivr" hex-based tokens** (`globals.css:33-50` light / `:84-101` dark), fully
   duplicated between the two color-scheme blocks rather than derived: `--brand-navy`, `--brand-blue`,
   `--brand-cyan` (identical in both modes — intentional, brand marks are mode-invariant per
   `DESIGN_SYSTEM.md:24`), `--bg-base`, `--bg-surface`, `--bg-elevated`, `--border-default`,
   `--border-muted`, `--text-primary`, `--text-secondary`, `--text-muted`, `--accent-blue`,
   `--accent-blue-dim`, `--phosphor-amber`, `--phosphor-amber-dim`, `--status-emerald`,
   `--status-red`, `--status-orange`, `--bg-diff-added`, `--bg-diff-deleted`, `--terminal-bg`,
   `--terminal-text`, `--terminal-green`, plus `--shadow-sm`, `--shadow-md`, `--shadow-glow`.

Both systems are re-exposed as Tailwind utilities in the same `@theme inline` block
(`globals.css:104-186`), so `bg-primary` (system 1) and `bg-bg-surface` (system 2) are both valid
and both used throughout the codebase — there is no single source of truth for "what is a
background token" and a new contributor has to know both vocabularies.

**Dark mode strategy:** class-based (`.dark` selector, `next-themes attribute="class"` in
`src/app/layout.tsx:42`), `color-scheme: dark` set explicitly (`globals.css:107`). No `data-theme`
attribute, single dark variant (no additional retro/amber theme wired to CSS despite `.theme-amber`
scrollbar rules existing at `globals.css:499-504` — dead selector, no component sets
`class="theme-amber"` anywhere: `grep -r theme-amber src/components` returns nothing outside
`globals.css`).

**Typography:** two font families via `next/font/google` — Source Sans 3 (`--font-source-sans`,
body) and Fira Code (`--font-fira-code`, monospace/machine content) declared in
`src/app/layout.tsx:8-18`, consumed as CSS vars in `@theme inline` (`globals.css:105-106`) and
`body`/`.font-mono` rules (`globals.css:189-203`). Base body size is a hardcoded `15px`
(`globals.css:191`) — not expressed as a Tailwind/rem token, so it can't be scaled via `text-base`
overrides without touching this file. No formal type scale block (no `--text-xs`…`--text-4xl`
custom properties); components use raw Tailwind size utilities (`text-sm`, `text-xs`) plus **numerous
arbitrary pixel values** (see below), so the doc's typography table (§3 doc drift) isn't structurally
enforced anywhere.

**Spacing/radii:** no custom spacing scale; relies on Tailwind defaults. Single `--radius: 0.375rem`
token, referenced nowhere else in `globals.css` besides the two `:root`/`.dark` declarations —
`rounded-md` elsewhere in components does not read this variable (Tailwind v4 default `rounded-md`
is a fixed value, not wired to `--radius`), so **changing `--radius` would not change actual border
radii on primitives** — the token is decorative/unused.

**Shadows:** `--shadow-sm`, `--shadow-md` (real `box-shadow` values, light/dark variants) and
`--shadow-glow` (`transparent` in light, a `color-mix` ring in dark, `globals.css:60-61` /
`:112-113`) — used via custom classes `.surface-raised`, `.cyber-glow`, `.cyber-glow-added`
(`globals.css:295-330`) rather than Tailwind `shadow-*` utilities.

**Animations:** 8 custom `@keyframes` blocks (`blink`, `fade-in-up`, `daemon-float`,
`daemon-breath`, `terminal-flicker`, `daemon-bounce`, `daemon-think`) plus 5 stagger-delay utility
classes (`.stagger-1`…`.stagger-5`, `globals.css:378-392`). A single global
`prefers-reduced-motion` block (`globals.css:459-467`) zeroes all animation/transition durations —
this is the **only** reduced-motion handling in the codebase; no component-level
`useReducedMotion`/`matchMedia` checks exist (`grep -rl "prefers-reduced-motion" src/components`
returns nothing — canvas-based `matrix-screensaver.tsx` and `daemon-mascot.tsx`'s `requestAnimationFrame`-free
CSS animations are covered by the global rule, but `live-terminal.tsx`'s xterm cursor blink and any
JS-driven interval animations are not, since the global rule only zeroes CSS transition/animation
durations, not JS timers).

**Hardcoded values bypassing tokens:**
- `src/components/ui/pixel-badge.tsx:12,15,16` — three arbitrary `shadow-[0_0_8px_rgba(...)]`
  utilities duplicating colors that already exist as tokens (`--phosphor-amber`, `--status-emerald`,
  `--status-red`) instead of referencing them.
- 133 occurrences of arbitrary-bracket Tailwind values (`text-[10px]`, `text-[9px]`, `text-[11px]`,
  `w-[150px]`, etc.) across `src/components/**` — heaviest concentration in
  `src/components/sessions/task-timeline.tsx` (9 hits), `src/components/mission-control/session-panel.tsx`
  (6 hits), `src/components/mission-control/activity-feed.tsx`, `needs-attention-banner.tsx`,
  `recent-sessions.tsx`, `onboarding-wizard.tsx`, `notification-panel.tsx`. These are almost all
  sub-`text-xs` font sizes (9px/10px/11px) that should be a `text-2xs`/`text-3xs` token or a shared
  `.font-mono-label` utility class instead of copy-pasted arbitrary values — direct contradiction of
  `DESIGN_SYSTEM.md:87` ("Avoid interface text below 11px") given 9px/10px appear ~90+ times.
- Whole-repo (`src`, not just components) hex-literal count outside `globals.css`: 21 occurrences —
  low, most color usage correctly goes through CSS vars/Tailwind tokens; the exceptions are
  concentrated in the same `pixel-badge.tsx` shadow values plus a few inline SVG `fill`/`stroke`
  colors in `daemon-mascot.tsx` (which correctly use `var(--token)` strings rather than literal hex,
  so those don't count as violations — only the 3 pixel-badge lines are literal hardcoded rgba).

---

## 3. Component architecture

- **Variant handling:** `class-variance-authority` (`cva`) is used in exactly 5 of 37 primitives —
  `alert.tsx`, `badge.tsx`, `button.tsx`, `label.tsx`, `pixel-badge.tsx`. Everything else (dialogs,
  selects, cards, table, etc.) uses inline `cn(...)` string concatenation with conditional
  expressions instead of a variants object, e.g. `src/components/ui/card.tsx:10` — a single fixed
  class string, no variants at all despite the component clearly having "raised/flat/interactive"
  states used ad hoc by callers via `className` overrides (see `.interactive-card` utility class in
  `globals.css:400-402` applied externally rather than as a Card prop).
- **`forwardRef`** used in 21/37 files; the rest (mostly the custom, non-shadcn components —
  `daemon-mascot`, `matrix-screensaver`, `pixel-badge`, `task-row`, `terminal-log`, `theme-toggle`,
  `page-header`, `brand-mark`, `diff-viewer`, `keyboard-shortcuts-modal`, `live-terminal`,
  `date-picker`, `calendar`, `collapsible`, `skeleton`, `badge`) are plain function components with
  no ref forwarding — acceptable for leaf/presentational components but means none of the custom
  primitives compose with Radix `asChild`/`Slot` patterns the way `button.tsx` does
  (`src/components/ui/button.tsx:2,36-45` uses `@radix-ui/react-slot`).
- **`cn()` className merging** (`tailwind-merge` + `clsx`, `src/lib/utils`) is used in 44 files
  across `src/components` — consistently applied as the merge mechanism, no raw template-literal
  class concatenation found in the primitives layer.
- **Feature component size:** several feature components are large single files mixing data-fetch
  triggers, local state, and heavy JSX: `src/components/settings/integrations-section.tsx` (1167
  LOC), `src/components/settings/agent-config-form.tsx` (873 LOC), `src/components/specs/plan-tab.tsx`
  (690 LOC), `src/components/mission-control/session-panel.tsx` (368 LOC),
  `src/components/tasks/task-drawer.tsx` (504 LOC). These are candidates for decomposition in a
  rebuild — none currently split into sub-components the way `task-drawer.tsx` at least partially
  does (`task-drawer-overview.tsx`, `task-drawer-attempts.tsx`, `task-drawer-changes.tsx` are pulled
  out, `src/components/tasks/task-drawer.tsx:37-39`), but `integrations-section.tsx` and
  `agent-config-form.tsx` have no sibling decomposition at all.
- **Prop patterns:** feature components generally accept typed props interfaces (not `any`), pass
  server-fetched data down from page-level Server Components into client leaf components — e.g.
  `src/app/(app)/dashboard-client.tsx` is a client component fed by a server `page.tsx` (standard
  RSC boundary pattern), consistent across the `(app)` routes.

---

## 4. Layout & shell

- **App shell:** `src/components/shell/sidebar.tsx` (386 LOC, `'use client'`) — fixed sidebar,
  collapsible (`localStorage` key `sidebar-collapsed`, `src/components/shell/sidebar.tsx:26`),
  contains `DaemonMascot`, `BrandLockup`/`BrandMark`, project switcher (`Select`), and 6 nav items:
  Mission Control, Projects, Specs, Sessions, Notifications, Settings
  (`src/components/shell/sidebar.tsx:33-39`) — **this contradicts `DESIGN_SYSTEM.md:174`**, which
  documents only 4 nav links (Mission Control · Specifications · Sessions · Settings); Projects and
  Notifications exist in code but are undocumented.
- `src/components/shell/top-bar.tsx` (233 LOC), `src/components/shell/shell-context.tsx` (173 LOC,
  React context for shell-wide state), `src/components/shell/task-drawer-context.tsx` (36 LOC),
  `src/components/shell/active-jobs-overlay.tsx` (17 LOC).
- **Breadcrumbs:** `src/components/ui/breadcrumb.tsx` (shadcn primitive) + `page-header.tsx`
  composition; used in spec detail/edit pages per `DESIGN_SYSTEM.md:300-309`.
- **Responsive breakpoints actually used** in `src/components` + `src/app` (`sm:`/`md:`/`lg:`/`xl:`
  prefix count): `sm:` 26 uses, `md:` 25 uses, `lg:` 10 uses, `xl:` 1 use, `2xl:` 0 uses. The app is
  overwhelmingly designed for a single desktop breakpoint with light `sm`/`md` touch-ups — no
  evidence of a deliberate mobile-first or tablet strategy; `xl:`/`2xl:` are essentially unused,
  meaning large/ultra-wide viewports get no layout treatment beyond whatever `md:`/`lg:` set.

---

## 5. Accessibility state

- `aria-*` attribute usage is thin and concentrated: only 16 files in `src/components` reference
  `aria-` at all (`grep -rc aria- src/components --include=*.tsx | grep -v :0 | wc -l`); within
  `src/components/ui`, only 5 files use it (`brand-mark.tsx` 2, `breadcrumb.tsx` 5, `calendar.tsx` 3,
  `daemon-mascot.tsx` 1 — correctly `aria-hidden="true"` on a decorative SVG, `task-row.tsx` 1).
  Radix-based primitives (dialog, select, dropdown, tooltip, popover, tabs, switch, checkbox) get
  their ARIA roles/states for free from Radix internals, which covers a lot, but custom components
  (`task-row.tsx`, `pixel-badge.tsx`, `matrix-screensaver.tsx`, `live-terminal.tsx`, `terminal-log.tsx`,
  `diff-viewer.tsx`) largely have no explicit `role`/`aria-live`/`aria-label` despite communicating
  live status (session progress, terminal output, task state) — a real risk for screen-reader users
  since these are exactly the "what changed" surfaces.
- Total `focus-visible|focus:outline|tabIndex|role=` hits across `src/components`: 32 — low relative
  to 78 component files; most focus styling instead relies on the global `.phosphor-focus` utility
  (`globals.css:404-414`, `:focus-within`/`:focus` box-shadow ring) and Tailwind's
  `focus-visible:ring-2` baked into `button.tsx`'s cva recipe — good where applied, but not
  universally applied to custom interactive elements outside the primitives layer.
- **Reduced motion:** only the single blanket CSS rule (`globals.css:459-467`); no per-component JS
  opt-outs, so canvas/JS-driven effects (`matrix-screensaver.tsx`'s `requestAnimationFrame` loop,
  `live-terminal.tsx`'s xterm cursor) keep running under `prefers-reduced-motion: reduce` even though
  CSS-keyframe animations correctly stop.
- **Color contrast risk:** `--text-muted` (`#6c7889` light / `#6f7c91` dark, `globals.css:41`/`:92`)
  against `--bg-base` (`#f5f8fb`/`#0c0d13`) is in the ~3.8:1–4:1 range depending on exact background —
  borderline for WCAG AA (4.5:1) body text; used extensively for timestamps/captions/IDs, which is
  exactly the "dev-mode-off" content class the design doc calls out (`DESIGN_SYSTEM.md:39`). Amber
  status colors (`--phosphor-amber` `#d97706` light) on `--phosphor-amber` tinted backgrounds
  (`bg-phosphor-amber/10`) used across badges/buttons should be spot-checked; no contrast audit
  artifacts exist in the repo.

---

## 6. Theming

- **Mechanism:** `next-themes` (`attribute="class"`, `defaultTheme="system"`, `enableSystem`,
  `src/app/layout.tsx:42`) + `suppressHydrationWarning` on both `<html>` and `<body>`
  (`src/app/layout.tsx:37,40`) — this is the standard, correct pattern to avoid flash-of-wrong-theme;
  `next-themes` injects a blocking inline script before hydration, so **FOUC risk is low** as
  implemented.
- **Toggle:** `src/components/ui/theme-toggle.tsx` — dropdown with Light/Dark/System, icon
  cross-fade via `dark:` variants on stacked Sun/Moon icons (lines 21-22) — standard shadcn pattern,
  correctly implemented.
- **Visual identity — "developer-native retro-terminal":** the product deliberately layers a
  phosphor-terminal/CRT aesthetic on top of an otherwise clean SaaS shell, exactly as
  `DESIGN_SYSTEM.md:17` states ("retro-computing accents ... applied surgically to agent-facing
  surfaces only"). Evidence in code:
  - `pixel-badge.tsx` — monospace uppercase tracked badges with glow shadows for status pills.
  - `daemon-mascot.tsx` — a small blue/amber CRT-robot SVG mascot with 5 expression states, floating/
    breathing/thinking CSS animations (`globals.css:333-376`).
  - `matrix-screensaver.tsx` — a canvas rain-animation idle state ("Ghost in the Machine": black
    falling glyphs on white, half-speed classic Matrix effect) — **undocumented** anywhere in the
    design system doc, shown in Mission Control's idle live-execution panel
    (`src/app/(app)/dashboard-client.tsx:199`).
  - `live-terminal.tsx` / `terminal-log.tsx` — real xterm.js panel and a static log viewer, both
    styled via `.terminal-surface` (scanline `::after` overlay, CRT vignette in dark mode,
    `globals.css:213-254`) and `.scanline-overlay`, `.cyber-glow*` utility classes.
  - `task-row.tsx` — ASCII-style progress bars (`▓`/`▒`) and status glyphs (`▶ ✓ ⚠ ✕ ○`) per
    `DESIGN_SYSTEM.md:96-97`.
  - Two brand-adjacent but separate identities coexist by design: the **BrandMark** (navy/blue/cyan
    isometric logo, mode-invariant) for product chrome, and **DAEMON** (blue/amber robot) for agent
    state — `DESIGN_SYSTEM.md:24-26` explicitly forbids DAEMON replacing the brand mark, and the code
    respects that separation (`brand-mark.tsx` vs `daemon-mascot.tsx` are never used interchangeably
    in `sidebar.tsx`).
  - Net effect: this is **not** a generic shadcn/Linear clone — it has a genuine, consistent
    "developer console" visual signature (monospace IDs, scanlines, phosphor amber, ASCII bars,
    CRT-robot mascot) layered onto an otherwise conventional sidebar+topbar SaaS shell. That
    signature is worth preserving in a rebuild; it's the app's actual differentiation.

---

## 7. Inconsistencies & tech debt (ranked)

1. **Duplicated badge primitives.** `badge.tsx` (stock shadcn) is dead — confirmed by `knip`
   (`Unused files`) — while `pixel-badge.tsx` (custom, retro-styled) is used everywhere in practice.
   `badge.tsx` should be deleted, not kept in `knip.json`'s ignore list masking the dead-code signal
   (`knip.json` ignore entry for `src/components/ui/alert.tsx` and `src/components/ui/badge.tsx`... —
   actually `badge.tsx` isn't in the ignore list, meaning knip's "Unused files" finding for it is a
   **live, unsuppressed signal**; `alert.tsx` and `separator.tsx` *are* suppressed in
   `knip.json`'s `ignore` array, which is actively hiding two more dead UI primitives from CI).
2. **Duplicate dependency surface.** `@base-ui/react` (`package.json` dependency) has **zero
   imports anywhere in `src`** — fully dead, yet explicitly protected in
   `knip.json`'s `ignoreDependencies` list, so it will never surface as unused in CI. Meanwhile
   `@radix-ui/*` (17 packages) is the actual primitive foundation in active use. This is the
   "coexistence" flagged in the task brief: it's not really coexistence, it's an abandoned migration/
   experiment (`@base-ui/react`) left installed and CI-silenced.
3. **Unused Radix package.** `@radix-ui/react-separator` is flagged unused by `knip`, matching the
   dead `separator.tsx` primitive (§1). `tw-animate-css` is also flagged unused despite being a
   dependency clearly intended to support the animation-heavy retro aesthetic — worth checking
   whether `tw-animate-css`'s utilities were meant to replace the hand-rolled `@keyframes` blocks in
   `globals.css` (in which case the custom keyframes are the actual duplication) or whether the
   package is simply vestigial.
4. **`lint-staged` unused per knip**, yet `package.json:138` still declares a `lint-staged` config
   block and it's a devDependency — the actual pre-commit enforcement runs through
   `.husky/pre-commit` → `scripts/hooks/precommit.sh` (a custom modular hook system), so
   `lint-staged` may be fully superseded and safe to remove, or knip is missing a dynamic-require
   edge — needs a manual check before deleting.
5. **`components.json` points at a nonexistent `tailwind.config.mjs`** (§1) — low runtime impact
   (Tailwind v4 CSS-first config still works via `globals.css`) but will misdirect anyone running
   `pnpm dlx shadcn add <component>` or `shadcn diff`, and misleads new contributors reading the
   manifest as documentation.
6. **Two parallel token vocabularies** in `globals.css` (shadcn semantic HSL tokens vs. custom hex
   Specdrivr tokens, §2) with no documented rule for which to use where — in practice components mix
   both (`bg-primary` and `bg-bg-surface` both appear across the codebase), so a rebuild should
   collapse to one vocabulary or make the split explicit (e.g., semantic tokens for shadcn primitives
   only, custom tokens for retro/brand surfaces only) and enforce it via lint.
7. **`--radius` design token is decorative** — not actually wired to any `rounded-*` utility
   (§2) — changing it in `globals.css` would have zero visual effect, contradicting its apparent
   purpose as a single source of truth for corner radius.
8. **133 arbitrary-bracket Tailwind values**, concentrated in mission-control/session/notification
   surfaces, almost all sub-11px font sizes that directly violate `DESIGN_SYSTEM.md:87`'s own stated
   minimum ("Avoid interface text below 11px") — the doc anticipates a "10px reserved for compact
   numeric badges" exception, but the actual code uses `text-[9px]`/`text-[10px]` far more broadly
   than "compact numeric badges" (session panels, activity feeds, banners, timelines, onboarding).
9. **`pixel-badge.tsx` hardcodes rgba shadow colors** instead of referencing the `--status-*` /
   `--phosphor-amber` tokens it otherwise correctly uses for `bg-*`/`text-*`/`border-*` in the same
   variant block (§2) — an easy, contained fix.
10. **Inconsistent variant strategy.** Only 5/37 primitives use `cva`; the rest hand-roll conditional
    `cn()` strings with no formal variants API, making it hard to know from a component's exports
    which visual states are "supported" versus ad hoc `className` overrides from call sites (e.g.
    `.interactive-card` applied externally rather than as a `Card` prop, §3).
11. **`vaul`'s `Drawer` is unwrapped**, breaking the "every headless dependency gets a `components/ui`
    wrapper" convention that Radix and react-day-picker both follow (§1).
12. **Settings nav has a duplicate route.** `src/components/settings/settings-nav.tsx:29` (Security,
    under "Account") and `:44` (API Tokens, under "Developer") both point to `href: '/settings/security'`
    — either a copy-paste bug (API Tokens should route to a dedicated page) or an intentional
    same-page-different-anchor pattern that isn't expressed in the data structure; worth verifying
    against `src/app/(app)/settings/security/page.tsx`.
13. **Mixed icon libraries.** `lucide-react` is the primary icon set (34 files import from it) but
    `@radix-ui/react-icons` is also imported in 2 files — a small but real inconsistency a rebuild
    should collapse to one library.
14. **Large monolithic feature files** (§3): `integrations-section.tsx` 1167 LOC,
    `agent-config-form.tsx` 873 LOC, `plan-tab.tsx` 690 LOC — these will be the highest-risk/highest-
    value decomposition targets in a rebuild.
15. **`matrix-screensaver.tsx` is a shipped, undocumented visual concept** ("Concept #5" per its own
    code comment) — either promote it into `DESIGN_SYSTEM.md` as a sanctioned idle-state treatment or
    treat it as a spike that needs a product decision before the rebuild carries it forward.
16. **13 unused source files flagged by `knip`** beyond the UI layer (`db/seed-enhanced.ts`,
    several `src/queries/*.ts`, `src/repositories/api-request-log-repository.ts`, etc.) — out of
    strict UI scope but relevant context: the query layer has more dead code than the component
    layer, suggesting incomplete refactors elsewhere in the stack too.

---

## 8. Page-by-page catalog

| Route | File(s) | Renders | Complexity | Grade | Justification |
|---|---|---|---|---|---|
| `/` (Mission Control) | `src/app/(app)/page.tsx` → `dashboard-client.tsx` (224 LOC) | Needs-attention banner, live execution panel (LiveTerminal or MatrixScreensaver idle state), event log feed, recent sessions | High | B | Rich, on-brand, matches `DESIGN_SYSTEM.md` §11.2 closely; MatrixScreensaver is undocumented scope creep (see §7.15) |
| `/projects` | `src/app/(app)/projects/page.tsx` (189 LOC, client) | Project list/switcher, create-project dialog | Medium | B | Functional but undocumented in DESIGN_SYSTEM.md nav (§4) |
| `/specs` | `src/app/(app)/specs/page.tsx` (50 LOC, server) | Spec table | Low | B+ | Thin server page delegating to table components; clean RSC boundary |
| `/specs/new` | `.../specs/new/page.tsx` + `layout.tsx` | Spec creation form, CodeMirror editor | Medium | B | Dedicated layout suggests intentional full-bleed editor chrome |
| `/specs/[id]` | `.../specs/[id]/page.tsx` (267 LOC, client) | Tabbed spec detail (SPEC/PLAN/TASKS/CHANGES/ACTIVITY) via `plan-tab.tsx` (690 LOC), `tasks-tab.tsx`, etc. | Very high | C+ | Matches doc's §11.6 spec closely, but `plan-tab.tsx` at 690 LOC is a decomposition risk |
| `/specs/[id]/edit` | `.../edit/page.tsx` (131 LOC) + `layout.tsx` | Spec editor (CodeMirror) | Medium | B | |
| `/sessions` | `.../sessions/page.tsx` (102 LOC, client) | Session list | Low-Medium | B+ | Simple, consistent with dense-table pattern from design doc |
| `/sessions/[id]` | `.../sessions/[id]/page.tsx` (258 LOC, client) | Session detail, task timeline (`task-timeline.tsx` 277 LOC) | High | B | Heavy use of arbitrary `text-[9px]/[10px]` values (§2) |
| `/notifications` | `.../notifications/page.tsx` (246 LOC, client) | Notification panel/list | Medium | B | |
| `/settings` | `.../settings/page.tsx` (5 LOC, redirect/index) | Redirects into sub-nav | Trivial | A | Correctly thin |
| `/settings/profile` … `/webhooks` (11 sub-pages) | Each 17–45 LOC, server components | Thin pages delegating to `*-section.tsx`/`*-form.tsx` components | Low (per page) / High (delegated) | B | Consistent thin-page/fat-component pattern; but delegated components vary wildly in size (54–1167 LOC) with no shared complexity budget |
| `/settings` layout | `settings/layout.tsx` (40 LOC) | Two-column: `SettingsNav` + content | Low | B | Duplicate route bug in nav data (§7.12) |
| `/login` | `(auth)/login/page.tsx` (193 LOC, client) | Auth form | Medium | B | |
| `/forgot-password` | `(auth)/forgot-password/page.tsx` (115 LOC, client) | Auth form | Low | B | |
| `/reset-password` | `(auth)/reset-password/page.tsx` (161 LOC, client) | Auth form | Low | B | |
| `/invite` | `(auth)/invite/page.tsx` (154 LOC, client) | Invite acceptance form | Low | B | |
| `(auth)` layout | `(auth)/layout.tsx` (22 LOC) | Minimal centered auth shell | Trivial | A | |
| `(app)` layout | `(app)/layout.tsx` (112 LOC) | Sidebar + top bar shell, provides shell context | High (structural) | B+ | Central shell; carries the nav-doc-drift issue (§4) |

Grading is relative to internal consistency and doc alignment, not absolute visual polish (not
independently screenshotted in this audit — no browser tooling was used; grades are code-review-based).

---

## 9. Doc drift (`documentation/infrastructure/DESIGN_SYSTEM.md`, 576 lines)

| Doc claim | Reality |
|---|---|
| `DESIGN_SYSTEM.md:174` — sidebar nav is "Mission Control · Specifications · Sessions · Settings" (4 items) | `src/components/shell/sidebar.tsx:33-39` has 6 items: Mission Control, **Projects**, Specs, Sessions, **Notifications**, Settings |
| Entire doc (576 lines, §8–§11) never mentions "Matrix," "screensaver," or "Ghost in the Machine" | `src/components/ui/matrix-screensaver.tsx` is a fully-built, shipped component used live in `dashboard-client.tsx:199` |
| `DESIGN_SYSTEM.md:87` — "Avoid interface text below 11px; 10px is reserved for compact numeric badges" | 9px/10px `text-[Npx]` arbitrary values appear ~90+ times across mission-control, sessions, notifications, onboarding components — far beyond "compact numeric badges" (§2, §7.8) |
| `components.json:8` implies a Tailwind v3-style `tailwind.config.mjs` | File does not exist; project is Tailwind v4 CSS-first (`@theme inline` in `globals.css`) — the doc file itself doesn't claim this, but `components.json` (which is part of the design-system tooling chain) is stale relative to the actual v4 setup |
| `DESIGN_SYSTEM.md:32-55` Colour Tokens table lists **dark-mode hex only** with no light-mode column, presented as if there's one canonical value set | `globals.css` defines fully independent light (`:root`) and dark (`.dark`) values for every custom token (e.g. `--bg-base` is `#f5f8fb` light vs `#0c0d13` dark) — the doc's single-column table underspecifies the light theme entirely, which could explain why light-mode contrast wasn't separately verified (§5) |
| `DESIGN_SYSTEM.md:107` — "Toasts: Sonner, bottom-right, max 3 simultaneous. Success auto-close 3s. Error auto-close 6s." | `src/app/layout.tsx:45-51` configures `<Toaster position="bottom-right">` with only a `className` override — no `visibleToasts={3}`, no per-type `duration` props are set in the root, meaning the 3s/6s/persist-until-dismissed timing rules are either defaulted by Sonner (unlikely to match exactly) or enforced ad hoc at each `toast()` call site, not centrally — unverified without auditing every `toast(...)` call, but the root config alone does not implement the documented behavior |
| `DESIGN_SYSTEM.md:105` — "Drawers: Vaul for Task Detail - slides from right, 640px wide on desktop" | Confirmed present (`task-drawer.tsx` imports `vaul`), consistent with doc — one of the better-aligned claims |
| `DESIGN_SYSTEM.md` §9 DAEMON spec (expressions, sizes, viewBox) | Matches `daemon-mascot.tsx` closely — good alignment, one of the few areas where doc and code are in sync |

---

## Summary of method

Findings were gathered via direct file reads (`globals.css`, `layout.tsx`, `theme-toggle.tsx`,
`daemon-mascot.tsx`, `matrix-screensaver.tsx`, `sidebar.tsx`, `settings-nav.tsx`, `card.tsx`,
`button.tsx`, `pixel-badge.tsx`, `task-drawer.tsx`, `DESIGN_SYSTEM.md` in full), `wc -l`/`grep -c`
sweeps for LOC, `"use client"` boundaries, `forwardRef`/`data-slot`/`cva` usage, icon-library
imports, breakpoint prefixes, aria attributes, hex/arbitrary-value counts, and a live `knip` run
(`pnpm dlx knip --no-progress`) for unused files/dependencies. No component was modified; no dev
server was started; no screenshots were taken.
