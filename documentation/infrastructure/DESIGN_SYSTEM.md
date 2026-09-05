# Design System

**Status:** Canonical. This document defines the specification. `src/app/globals.css` implements it.
**Companion document:** [`UI_SPEC.md`](./UI_SPEC.md) defines each page layout.

> **Rule of precedence.** Check this document against the code. Fix any difference. Do not work around it.
> Each token here exists in `globals.css`. Each token in `globals.css` exists here.

---

## 1. Philosophy

Specdrivr is a dense tool for people who monitor agent work. Keep the interface focused on the task.

**Five principles, in priority order:**

1. **Borders over shadows.** Elevation is communicated by a hairline border and a surface step, not
   by a drop shadow. Use shadows only for dialogs, popovers, and dropdowns.
2. **One accent.** Blue means "interactive or selected". It never means "decorative". Status colours
   have their own meaning. Never use them for emphasis.
3. **Density with air.** Rows are compact; the space *between* groups is generous. Cramming happens
   inside groups, never between groups.
4. **Motion confirms, never entertains.** Two durations, two easings. Animation exists to make a
   state change clear. Do not loop animation for decoration.
5. **Monospace carries meaning.** Mono is reserved for content that is literally machine text —
   identifiers, logs, diffs, paths, timestamps, and code. It is not decorative.

**Explicit non-goals.** Do not use CRT chrome, scanlines, phosphor glow, flicker, vignettes, pixel art, or mascots.
Restore them only through a product decision.

---

## 2. Colour tokens

Use two token layers. Declare **raw tokens** in `:root` / `.dark` as hex.
Expose them through **bridge tokens** in `@theme inline`. Components use only the utilities.

> Tailwind v4 shares `--color-*` across `bg-`, `text-`, and `border-`.
> Use `line-` for borders and `fg-` for text. Do not add an ambiguous `--color-*` token.

### 2.1 Surfaces

| Utility | Token | Light | Dark | Use |
|---|---|---|---|---|
| `bg-surface-base` | `--surface-base` | `#f7f8fa` | `#0b0d11` | Page background. The floor. |
| `bg-surface-raised` | `--surface-raised` | `#ffffff` | `#14171d` | Cards, tables, panels, sidebar, top bar. |
| `bg-surface-overlay` | `--surface-overlay` | `#ffffff` | `#1a1e26` | Dialogs, popovers, dropdowns, drawers. |
| `bg-surface-sunken` | `--surface-sunken` | `#f0f2f5` | `#0f1116` | Wells recessed below their parent. |
| `bg-surface-inset` | `--surface-inset` | `#eceff3` | `#1a1e26` | Inputs, hover fills, inline code. |

**Stacking rule:** `base → raised → overlay`. Do not nest `raised` inside `raised` without a border.
Use `sunken` for the inner region.

### 2.2 Borders

| Utility | Token | Light | Dark | Use |
|---|---|---|---|---|
| `border-line-subtle` | `--border-subtle` | `#eceff3` | `#1c212a` | Row dividers, internal separators. |
| `border-line` | `--border-default` | `#e0e4ea` | `#262c37` | **Default.** Card, input, panel edges. |
| `border-line-strong` | `--border-strong` | `#c9d0da` | `#38404e` | Hover state, emphasis, scrollbar thumb. |
| `border-line-control` | `--border-control` | `#83878e` | `#5d6a81` | Unfilled form-control boundaries. |

`@layer base` applies `--border-default` as global `border-color`. Use `border` alone for that colour.

`--border-control` differs from `--border-default`. WCAG 1.4.11 exempts card edges and dividers.
An empty control relies on its outline. Its boundary must reach 3:1.
Use the stronger token without making every card or divider heavy.

### 2.3 Text

| Utility | Token | Light | Dark | Use |
|---|---|---|---|---|
| `text-fg` | `--text-primary` | `#14161a` | `#f2f4f7` | Headings, primary body, values. |
| `text-fg-secondary` | `--text-secondary` | `#4a5260` | `#a6b0be` | Supporting body, entity IDs, descriptions. |
| `text-fg-muted` | `--text-muted` | `#616977` | `#808b9b` | Labels, timestamps, placeholders, captions. |
| `text-fg-inverse` | `--text-inverse` | `#ffffff` | `#0b0d11` | Text on a solid accent or inverted fill. |

Use only three text levels. Use a different size or weight instead of a fourth colour.

### 2.4 Accent

| Utility | Token | Light | Dark | Use |
|---|---|---|---|---|
| `bg-accent` / `text-accent` | `--accent` | `#1f5fe0` | `#4d8dfa` | Primary buttons, links, active nav, focus ring. |
| `bg-accent-hover` | `--accent-hover` | `#1d4ed8` | `#6ba1fb` | Hover on a solid accent fill. |
| `bg-accent-active` | `--accent-active` | `#1e40af` | `#85b2fc` | Active/pressed on a solid accent fill. |
| `bg-accent-subtle` | `--accent-subtle` | `#eff4ff` | `#10203a` | Selected row, active nav background, soft chip. |
| `border-accent-border` | `--accent-border` | `#c3d6fd` | `#1e3a60` | Border paired with `accent-subtle`. |
| `text-accent-fg` | `--accent-fg` | `#ffffff` | `#0b0d11` | Text on a solid accent fill. |

In dark mode, `hover` and `active` are **lighter**. Do not change this to match light mode.

### 2.5 Status

Use four statuses. Each has foreground, background, and border tokens. Never use them for emphasis.

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

Use a plain recessed log panel with mono text. Do not use scanlines, vignettes, flicker, or glow.

---

## 3. Typography

**Sans:** Source Sans 3 (`--font-sans`) — all interface text.
**Mono:** Fira Code (`--font-mono`) — IDs, code, log output, timestamps, and numeric table columns
when paired with `tabular-nums`.

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

**11px is a hard floor.** Text below 11px fails at normal viewing distance.
Change the layout when it requires 10px text.

### 3.2 Weights

`400` body · `500` emphasis and labels · `600` headings and buttons. Nothing heavier. Never `700`.

### 3.3 Mono rules

- Use mono only for IDs, code, log output, timestamps, and numeric columns with `tabular-nums`.
- Do not use mono for prose, headings, table headers, badges, or control labels. Use sentence-case sans.
- Render entity IDs (`SPEC-003`, `T-042`, `SES-0091`) in `text-fg-secondary`, not accent.
- Keep ligatures (`calt`, `liga`) on.

---

## 4. Spacing

Use a 4px base grid. Use the Tailwind default scale and the listed step for each context.

| Context | Step |
|---|---|
| Icon-to-label, inline chip padding | `gap-1.5` / `gap-2` (6–8px) |
| Inside a form field, table cell padding | `px-3 py-2` (12/8px) |
| Card interior padding | `p-4` compact · `p-6` standard |
| Between related elements in a group | `space-y-3` (12px) |
| Between groups within a section | `space-y-6` (24px) |
| Between page sections | `space-y-8` (32px) |
| Page gutter | `px-6 py-6` mobile · `px-8 py-8` desktop |

Do not create a one-off gutter. `src/app/(app)/layout.tsx` sets and shares page padding.

---

## 5. Radii

`--radius` is `0.375rem` (6px). Other steps use `calc()` from it.
Changing it rescales the system.

| Utility | Value | Use |
|---|---|---|
| `rounded-sm` | 4px | Chips, badges, small inline marks. |
| `rounded-md` | 6px | Controls: buttons, inputs, selects, menus. |
| `rounded-lg` | 8px | Containers: cards, panels, dialogs, drawers. |
| `rounded-xl` | 12px | Available token; not part of the standard component vocabulary. |
| `rounded-full` | — | Avatars, status dots, pills. |

---

## 6. Elevation

Express elevation as **surface step + border**. Use this order:

1. Change the surface token (`base` → `raised` → `overlay`).
2. Add `border border-line`.
3. Add a shadow only when the element floats.

| Utility | Use |
|---|---|
| `shadow-popover` | Popovers, dropdowns, tooltips, selects. |
| `shadow-overlay` | Dialogs, drawers, command palette. |

Use only these two shadows. Do not use `shadow-sm`, `shadow-md`, or glow. Use borders on cards.

---

## 7. Motion

| Token | Value | Use |
|---|---|---|
| `--animate-duration-fast` | `120ms` | Hover, focus, colour and border transitions. |
| `--animate-duration-base` | `200ms` | Enter/exit, expand/collapse, overlays. |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Everything entering or moving. |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Things leaving. |

Use only `animate-fade-in`, `animate-fade-in-up`, and `animate-pulse-subtle`.
Use looping `pulse-subtle` only for live-activity indicators.

`globals.css` imports `tw-animate-css` for Radix `animate-in`, `fade-in-0`, `zoom-in-95`, and `slide-in-from-*` utilities.
Tailwind v4 core does not provide them. `prefers-reduced-motion: reduce` collapses all CSS motion durations.
The app has no JS-driven animation. Elapsed-time intervals are counters.

---

## 8. Component conventions

Use these primitive conventions. Apply each convention when the component has the related behavior.

### 8.1 Structure

- Add a **`data-slot` attribute** to stable primitive parts. New low-level controls must expose slots.
  Do not add synthetic slots to helpers that delegate to slotted primitives.
- **`cva` for variants.** Any primitive with more than one visual variant declares them with
  `class-variance-authority`, and export `VariantProps`. Do not hand-roll conditional `cn()` strings.
- Use **`cn()` for merging**. Accept `className` and merge it last.
- Use **Radix as the headless foundation.** Wrap each dependency in `src/components/ui/`.
  Do not import it directly into a feature component.

### 8.2 Required states

Implement all five states for each interactive primitive:

| State | Treatment |
|---|---|
| Default | Per variant. |
| Hover | Surface or border step up. Never a size or position change. |
| Focus-visible | `outline: 2px solid var(--focus-ring); outline-offset: 2px`. Set globally; do not override per component. |
| Disabled | `opacity-50 pointer-events-none`, plus a real `disabled` / `aria-disabled` attribute. |
| Invalid | `border-danger-border` + `aria-invalid`, with the message linked by `aria-describedby`. |

### 8.3 Icons

Use `lucide-react` only. Do not use `@radix-ui/react-icons`. Use `size={16}` by default and `14` in dense rows.
Give every icon-only control an accessible name.

### 8.4 Status display

Do not convey status by colour alone. Use colour with a glyph or label:

| Status | Glyph | Colour |
|---|---|---|
| Done / success | `Check` | `success` |
| Running | `Loader` (spin) or pulsing dot | `info` |
| Blocked / needs review | `AlertTriangle` | `warning` |
| Failed | `X` | `danger` |
| Todo / idle | `Circle` | `fg-muted` |

### 8.5 Labels and gated actions

- Write badges and UI labels in sentence case. Render them with sans.
- Use `GatedButton` from `src/components/ui/gated-button.tsx` for a disabled role or lifecycle action.
  Pass `allowed` and a readable `reason`. Use an ancestor `TooltipProvider`.
- Use only the global `:focus-visible` rule in `globals.css`. Do not add component focus rings or outlines.
  Components can change border colour on focus.

---

## 9. Composition patterns

**Page.** Use `PageHeader` with a title and optional breadcrumb, description, and right-aligned actions.
Use `space-y-6` for content sections.

**Card.** `bg-surface-raised border border-line rounded-lg p-6`. No shadow.

**Table.** Use `bg-surface-raised`, `border border-line rounded-lg overflow-hidden`.
Use `text-xs font-medium text-fg-muted bg-surface-sunken` for the header row. Use sentence-case sans headers.
Separate body rows with `border-line-subtle`. Use `bg-surface-inset` on hover and `bg-accent-subtle` when selected.

**Empty state.** Centre it with `py-12`. Use a 24px `text-fg-muted` icon, `text-lg` heading, `text-sm text-fg-muted` explanation, and one primary action.
Do not use a mascot.

**Form.** `Label` above `Input`, `space-y-1.5`. Help text `text-xs text-fg-muted` below. Error
`text-xs text-danger`, linked via `aria-describedby`. Fields `space-y-4` apart.

**Log surface.** `bg-log-bg border border-line rounded-md p-3 font-mono text-xs`, `scrollbar-thin`,
`aria-live="polite"` when streaming.

**Rendered markdown.** Apply `.markdown` to the `ReactMarkdown` wrapper. It styles headings, lists, links, code, quotes, rules, and tables.
Do not use `prose` or `prose-invert`. `@tailwindcss/typography` is not installed.

**Full bleed.** Use `.full-bleed` for pages with a full-width header or divider.
It negates `--shell-gutter` and `--shell-gutter-y`. Pair it with `.fill-shell`, not `min-h-full`.
Inside a full-bleed page, `100%` ends two vertical gutters early.

**Filter toolbar.** Use `FilterToolbar` from `src/components/ui/filter-toolbar.tsx` below `PageHeader` on an index page.
Use `FilterSearch`, `FilterTabs`, `FilterSelect`, and `FilterDateRange`.
Use `FilterTextInput`, `FilterToolbarActions`, `FilterToolbarMeta`, and `FilterClearButton`.
Set every control to `h-8 text-xs`. Use sentence-case sans labels. Use `variant="inline"` inside a padded panel.
Do not create a search-and-pills row.

### 9.1 Breakpoint strategy

The app is mobile-first and uses Tailwind standard breakpoints. Do not create breakpoint tokens.
Base classes define narrow layouts. Use `sm:` only when a local row or grid can expand.
Use `md:` at the shell boundary (`px-4 py-6` to `px-8 py-8`). Reserve `lg:` for multi-column layouts.
Keep core actions and information at every breakpoint. Rearrange or wrap them. `.full-bleed` reads both gutter sizes.

---

## 10. Accessibility requirements

These requirements are mandatory. Check them at the Phase 9 gate.

- **Contrast:** Check 4.5:1 body text and 3:1 large text and UI boundaries in **both** themes.
- **Focus:** Show focus on every interactive element. Move it into dialogs and drawers on open. Return it on close.
- **Keyboard:** Make every action available without a pointer. Keep tab order aligned with visual order.
- **Landmarks:** Use one `<main>` and `<nav>` for navigation. Keep heading levels in order.
- **Live regions:** Use `aria-live="polite"` on streaming logs, task status, and progress. `DiffViewer` uses tab/tabpanel semantics.
- **Names:** Give each icon-only button `aria-label` or visually-hidden text.
- **Never colour-only:** See §8.4.
- **Reduced motion:** Respect it in CSS and JS-driven animation.

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
| `prose prose-invert` around `ReactMarkdown` | `.markdown` |
| Local `focus-visible:ring-*` / outline classes | The single global `:focus-visible` outline |
| Mono prose, heading, table header, badge, or control label | Sans sentence case |

### 11.1 CodeMirror token exception

`src/lib/editor-theme.ts` copies light and dark token values as colour literals. CodeMirror `createTheme` cannot read CSS custom properties.
This is the only token copy outside `globals.css`. Update both files together.
`src/components/specs/spec-editor.tsx` selects the pair from `useTheme().resolvedTheme`.

---

## 12. Removed items

Do not restore these items without a product decision.

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
