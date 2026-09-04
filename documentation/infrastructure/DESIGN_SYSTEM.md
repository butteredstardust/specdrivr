# Design System

**Status:** Canonical. This document is the specification; `src/app/globals.css` is its implementation.
**Last rewritten:** 2026-09-04 (UI overhaul, branch `feat/ui-overhaul`)
**Companion docs:** [`UI_SPEC.md`](./UI_SPEC.md) (per-page layout spec) · [`UI_AUDIT.md`](./UI_AUDIT.md) (historical, superseded)

> **Rule of precedence.** If this document and the code disagree, that is a bug in one of them —
> open it and fix it. Do not work around the gap. Every token named here exists in `globals.css`,
> and every token in `globals.css` is named here. That one-to-one property is load-bearing; the
> previous system lost it and accumulated two parallel vocabularies, 133 arbitrary values, and a
> design doc that documented only dark mode.

---

## 1. Philosophy

Specdrivr is a dense, professional tool for people who watch agents work. The interface should
disappear into the task.

**Five principles, in priority order:**

1. **Borders over shadows.** Elevation is communicated by a hairline border and a surface step, not
   by a drop shadow. Shadows are reserved for things that genuinely float above the page — dialogs,
   popovers, dropdowns.
2. **One accent.** Blue means "interactive or selected". It never means "decorative". Status colours
   are a separate, semantically-reserved axis and are never used for emphasis.
3. **Density with air.** Rows are compact; the space *between* groups is generous. Cramming happens
   inside a group, never between them.
4. **Motion confirms, never entertains.** Two durations, two easings. Animation exists to make a
   state change legible. Nothing loops purely for decoration.
5. **Monospace carries meaning.** Mono is reserved for content that is literally machine text —
   identifiers, logs, diffs, paths, timestamps, code. It is not a stylistic choice.

**Explicit non-goals.** No CRT chrome, scanlines, phosphor glow, flicker, vignettes, pixel art, or
mascots. These were removed in the overhaul. If a future direction wants them back, that is a
deliberate product decision, not a component-level liberty.

---

## 2. Colour tokens

Two layers. **Raw tokens** are declared in `:root` / `.dark` as hex. **Bridge tokens** in
`@theme inline` expose them as Tailwind utilities. Components only ever touch the utilities.

> Tailwind v4 shares a single `--color-*` namespace across `bg-`, `text-`, and `border-`. That is
> why borders are prefixed `line-` and text is prefixed `fg-` — so `border-line-strong` and
> `text-fg-muted` can coexist without collision. Do not add a `--color-*` token whose name could be
> read as belonging to a different axis.

### 2.1 Surfaces

| Utility | Token | Light | Dark | Use |
|---|---|---|---|---|
| `bg-surface-base` | `--surface-base` | `#f7f8fa` | `#0b0d11` | Page background. The floor. |
| `bg-surface-raised` | `--surface-raised` | `#ffffff` | `#14171d` | Cards, tables, panels, sidebar, top bar. |
| `bg-surface-overlay` | `--surface-overlay` | `#ffffff` | `#1a1e26` | Dialogs, popovers, dropdowns, drawers. |
| `bg-surface-sunken` | `--surface-sunken` | `#f0f2f5` | `#0f1116` | Wells recessed below their parent. |
| `bg-surface-inset` | `--surface-inset` | `#eceff3` | `#1a1e26` | Inputs, hover fills, inline code. |

**Stacking rule:** `base → raised → overlay`. Never nest a `raised` directly inside a `raised`
without a border between them; use `sunken` for the inner region instead.

### 2.2 Borders

| Utility | Token | Light | Dark | Use |
|---|---|---|---|---|
| `border-line-subtle` | `--border-subtle` | `#eceff3` | `#1c212a` | Row dividers, internal separators. |
| `border-line` | `--border-default` | `#e0e4ea` | `#262c37` | **Default.** Card, input, panel edges. |
| `border-line-strong` | `--border-strong` | `#c9d0da` | `#38404e` | Hover state, emphasis, scrollbar thumb. |

`--border-default` is also applied as the global `border-color` in `@layer base`, so
`border` alone yields the correct colour without a `border-line` class.

### 2.3 Text

| Utility | Token | Light | Dark | Use |
|---|---|---|---|---|
| `text-fg` | `--text-primary` | `#14161a` | `#f2f4f7` | Headings, primary body, values. |
| `text-fg-secondary` | `--text-secondary` | `#4a5260` | `#a6b0be` | Supporting body, entity IDs, descriptions. |
| `text-fg-muted` | `--text-muted` | `#767f8e` | `#737d8c` | Labels, timestamps, placeholders, captions. |
| `text-fg-inverse` | `--text-inverse` | `#ffffff` | `#0b0d11` | Text on a solid accent or inverted fill. |

Three levels of text, and only three. If something needs a fourth, it needs a different size or
weight, not a fourth colour.

### 2.4 Accent

| Utility | Token | Light | Dark | Use |
|---|---|---|---|---|
| `bg-accent` / `text-accent` | `--accent` | `#2563eb` | `#4d8dfa` | Primary buttons, links, active nav, focus ring. |
| `bg-accent-hover` | `--accent-hover` | `#1d4ed8` | `#6ba1fb` | Hover on a solid accent fill. |
| `bg-accent-active` | `--accent-active` | `#1e40af` | `#85b2fc` | Active/pressed on a solid accent fill. |
| `bg-accent-subtle` | `--accent-subtle` | `#eff4ff` | `#10203a` | Selected row, active nav background, soft chip. |
| `border-accent-border` | `--accent-border` | `#c3d6fd` | `#1e3a60` | Border paired with `accent-subtle`. |
| `text-accent-fg` | `--accent-fg` | `#ffffff` | `#0b0d11` | Text on a solid accent fill. |

Note the dark ramp inverts: `hover` and `active` get **lighter**, because the fill sits on a dark
ground. Do not "fix" this to match light mode.

### 2.5 Status

Four statuses, each a triple of foreground / background / border. Never use these for emphasis.

| Status | `text-*` | `bg-*-bg` | `border-*-border` | Meaning |
|---|---|---|---|---|
| `success` | `#067647` / `#47cd89` | `#ecfdf3` / `#0c1f16` | `#abefc6` / `#17452f` | Completed, passing, connected. |
| `warning` | `#b54708` / `#f5b544` | `#fffaeb` / `#241a08` | `#fedf89` / `#4e3a11` | Blocked, needs review, degraded. |
| `danger` | `#b42318` / `#f97066` | `#fef3f2` / `#2a1210` | `#fecdca` / `#5a2721` | Failed, error, destructive. |
| `info` | `#175cd3` / `#6ba1fb` | `#eff8ff` / `#10203a` | `#b2ddff` / `#1e3a60` | Running, in progress, neutral notice. |

*(Format: light / dark.)*

**Status is never colour-only.** Every status must also carry a glyph, a label, or both — see §8.

### 2.6 Diff and log

| Utility | Use |
|---|---|
| `bg-diff-added-bg`, `border-diff-added-border` | Added lines in a diff. |
| `bg-diff-removed-bg`, `border-diff-removed-border` | Removed lines in a diff. |
| `bg-log-bg`, `text-log-text`, `text-log-muted` | Log and terminal-output surfaces. |

The log surface is a plain recessed panel with mono text. It has no scanline, no vignette, no
flicker, and no glow. The content is the terminal; the chrome is not.

---

## 3. Typography

**Sans:** Source Sans 3 (`--font-sans`) — all interface text.
**Mono:** Fira Code (`--font-mono`) — identifiers, logs, diffs, paths, timestamps, code.

### 3.1 Scale

| Utility | Size | Line height | Use |
|---|---|---|---|
| `text-2xs` | 11px | 16px | **Floor.** Dense metadata, table sub-labels. |
| `text-xs` | 12px | 18px | Badges, timestamps, captions. |
| `text-sm` | 13px | 20px | Secondary body, table cells. |
| `text-base` | 14px | 22px | **Default body.** |
| `text-md` | 15px | 24px | Emphasised body, card lead text. |
| `text-lg` | 17px | 24px | Card and section titles. |
| `text-xl` | 21px | 28px | Page titles. |
| `text-2xl` | 26px | 32px | Display, empty-state headings. |

**11px is a hard floor.** The pre-overhaul code had 133 arbitrary bracket values, mostly
`text-[9px]` and `text-[10px]`, concentrated in mission-control and session components. Anything
below 11px fails legibility at normal viewing distance. If a layout only fits at 10px, the layout
is wrong.

### 3.2 Weights

`400` body · `500` emphasis and labels · `600` headings and buttons. Nothing heavier. Never `700`.

### 3.3 Mono rules

- Uppercase mono gets `letter-spacing: 0.05em` automatically (handled globally in `globals.css`).
- Entity IDs (`SPEC-003`, `T-042`, `SES-0091`) render mono at `text-fg-secondary` — **not** accent,
  and no longer amber. They are reference data, not calls to action.
- Ligatures (`calt`, `liga`) are on. Leave them on; they are why Fira Code was chosen.

---

## 4. Spacing

A 4px base grid. Use Tailwind's default scale; the meaningful part is *which* step applies where.

| Context | Step |
|---|---|
| Icon-to-label, inline chip padding | `gap-1.5` / `gap-2` (6–8px) |
| Inside a form field, table cell padding | `px-3 py-2` (12/8px) |
| Card interior padding | `p-4` compact · `p-6` standard |
| Between related elements in a group | `space-y-3` (12px) |
| Between groups within a section | `space-y-6` (24px) |
| Between page sections | `space-y-8` (32px) |
| Page gutter | `px-6 py-6` mobile · `px-8 py-8` desktop |

**Never invent a one-off gutter.** The pre-overhaul shell used `px-8 py-8 md:px-10`, a value that
appeared nowhere else. Page padding is set once in `src/app/(app)/layout.tsx` and inherited.

---

## 5. Radii

`--radius` is `0.375rem` (6px) and is **load-bearing** — every other step is `calc()`'d from it, so
changing that one value rescales the whole system. In the previous system `--radius` was declared
and read by nothing.

| Utility | Value | Use |
|---|---|---|
| `rounded-sm` | 4px | Chips, badges, small inline marks. |
| `rounded-md` | 6px | **Default.** Buttons, inputs, selects. |
| `rounded-lg` | 8px | Cards, panels. |
| `rounded-xl` | 12px | Dialogs, drawers, large containers. |
| `rounded-full` | — | Avatars, status dots, pills. |

---

## 6. Elevation

Elevation is expressed as **surface step + border**, in this order of preference:

1. Change the surface token (`base` → `raised` → `overlay`).
2. Add `border border-line`.
3. Only if it genuinely floats: add a shadow.

| Utility | Use |
|---|---|
| `shadow-popover` | Popovers, dropdowns, tooltips, selects. |
| `shadow-overlay` | Dialogs, drawers, command palette. |

Two shadows exist. There is no `shadow-sm`, no `shadow-md`, and no glow. Cards do not get shadows —
cards get borders.

---

## 7. Motion

| Token | Value | Use |
|---|---|---|
| `--animate-duration-fast` | `120ms` | Hover, focus, colour and border transitions. |
| `--animate-duration-base` | `200ms` | Enter/exit, expand/collapse, overlays. |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Everything entering or moving. |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Things leaving. |

Three animations exist: `animate-fade-in`, `animate-fade-in-up`, `animate-pulse-subtle`.
`pulse-subtle` is the **only** looping animation, reserved for genuine live-activity indicators.

`prefers-reduced-motion: reduce` collapses all animation and transition durations globally. **CSS
cover is not sufficient** — JS-driven animation (canvas, xterm, timers) must check the media query
itself.

---

## 8. Component conventions

Every primitive in `src/components/ui/` follows all of these. No exceptions.

### 8.1 Structure

- **`data-slot` attribute** on every rendered part, matching the modern shadcn convention. Enables
  styling and testing without brittle class selectors. *(Pre-overhaul: 1 of 37 primitives did this.)*
- **`cva` for variants.** Any primitive with more than one visual variant declares them with
  `class-variance-authority`, exports its `VariantProps`, and never hand-rolls conditional `cn()`
  strings. *(Pre-overhaul: 5 of 37.)*
- **`cn()` for merging**, and `className` is always accepted and merged last so callers can override.
- **Radix is the headless foundation.** Every headless dependency is wrapped in `src/components/ui/`
  and imported from there — never imported raw into a feature component.

### 8.2 Required states

Every interactive primitive implements all five:

| State | Treatment |
|---|---|
| Default | Per variant. |
| Hover | Surface or border step up. Never a size or position change. |
| Focus-visible | `outline: 2px solid var(--focus-ring); outline-offset: 2px`. Set globally; do not override per component. |
| Disabled | `opacity-50 pointer-events-none`, plus a real `disabled` / `aria-disabled` attribute. |
| Invalid | `border-danger-border` + `aria-invalid`, with the message linked by `aria-describedby`. |

### 8.3 Icons

`lucide-react` only. No `@radix-ui/react-icons`. Default `size={16}`; `14` in dense rows.
Every icon-only control needs an accessible name.

### 8.4 Status display

Status is never conveyed by colour alone. Use colour **plus** a glyph or label:

| Status | Glyph | Colour |
|---|---|---|
| Done / success | `Check` | `success` |
| Running | `Loader` (spin) or pulsing dot | `info` |
| Blocked / needs review | `AlertTriangle` | `warning` |
| Failed | `X` | `danger` |
| Todo / idle | `Circle` | `fg-muted` |

---

## 9. Composition patterns

**Page.** `PageHeader` (title, optional breadcrumb, optional description, right-aligned actions) →
`space-y-6` content sections.

**Card.** `bg-surface-raised border border-line rounded-lg p-6`. No shadow.

**Table.** `bg-surface-raised` container, `border border-line rounded-lg overflow-hidden`. Header
row `text-2xs uppercase tracking-wide text-fg-muted bg-surface-sunken`. Body rows separated by
`border-line-subtle`. Row hover `bg-surface-inset`. Selected row `bg-accent-subtle`.

**Empty state.** Centred, `py-12`. Icon (24px, `text-fg-muted`) → `text-lg` heading → `text-sm
text-fg-muted` explanation → single primary action. Never a mascot.

**Form.** `Label` above `Input`, `space-y-1.5`. Help text `text-xs text-fg-muted` below. Error
`text-xs text-danger`, linked via `aria-describedby`. Fields `space-y-4` apart.

**Log surface.** `bg-log-bg border border-line rounded-md p-3 font-mono text-xs`, `scrollbar-thin`,
`aria-live="polite"` when streaming.

---

## 10. Accessibility requirements

Non-negotiable, and checked at the Phase 9 gate.

- **Contrast:** 4.5:1 body text, 3:1 large text and UI boundaries — verified in **both** themes.
- **Focus:** visible on every interactive element. Focus moves into dialogs/drawers on open and
  returns to the trigger on close.
- **Keyboard:** every action reachable without a pointer. Tab order follows visual order.
- **Landmarks:** one `<main>`, `<nav>` for navigation, headings in order without skipping levels.
- **Live regions:** `aria-live="polite"` on streaming logs, task status, and progress.
  *(Pre-overhaul, the three live surfaces — `task-row`, `live-terminal`, `diff-viewer` — had none.)*
- **Names:** every icon-only button has `aria-label` or visually-hidden text.
- **Never colour-only:** see §8.4.
- **Reduced motion:** respected by CSS *and* by JS-driven animation.

---

## 11. Do / Don't

| Don't | Do |
|---|---|
| `text-[#2563eb]`, `bg-[#14171d]` | `text-accent`, `bg-surface-raised` |
| `text-[10px]` | `text-2xs` (11px floor) |
| `shadow-md` on a card | `border border-line` |
| A second accent colour | The one accent; differentiate with weight or surface |
| Status by colour alone | Colour **and** glyph/label |
| Raw `import { Drawer } from 'vaul'` | `import { Drawer } from '@/components/ui/drawer'` |
| A new one-off component | Check `src/components/ui/` first |
| Hand-rolled `cn()` variant chains | `cva` |
| A one-off `px-10` gutter | The §4 spacing scale |
| Decorative looping animation | `animate-pulse-subtle`, only for live activity |

---

## 12. Removed in the 2026-09-04 overhaul

Recorded so the decision is not silently re-litigated.

| Removed | Why |
|---|---|
| shadcn HSL token set (`--background`, `--primary`, …) | Second parallel vocabulary; already banned by `AGENTS.md` §5 but still fully wired. |
| `.bg-bg-elevated` hand-written rule | Shadowed the Tailwind-generated utility of the same name and silently injected `border` + `shadow-sm`. |
| `.terminal-surface`, `.scanline-overlay`, `.cyber-glow*`, `.phosphor-focus` | CRT chrome; conflicts with the Linear-clean direction. |
| DAEMON mascot + all `daemon-*` keyframes | Decorative looping animation; replaced by plain empty states. |
| `matrix-screensaver.tsx` | Undocumented "Concept #5" canvas animation. |
| `pixel-badge.tsx` | Replaced by a standard `badge.tsx`, which knip had confirmed dead. |
| `.theme-amber` scrollbar rules | Referenced a theme that does not exist. |
| `@base-ui/react` | Zero imports in `src`; an abandoned migration suppressed in `knip.json`. |
| Amber as an entity-ID colour | Second accent; IDs are reference data, now `text-fg-secondary`. |
