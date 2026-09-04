# TODO — UI Overhaul

**Branch:** `feat/ui-overhaul`
**Started:** 2026-09-04
**Direction:** Linear-style clean. Matte surfaces, hairline borders, high contrast, one accent, restrained motion.
**Audit input:** `documentation/infrastructure/UI_AUDIT.md`

> **Verification policy for this branch:** per explicit instruction, lint / typecheck / unit / e2e
> verification is **deferred until the implementation is fully done**. Phase 9 is the single
> verification gate. Nothing is claimed "working" before Phase 9 passes.

---

## Decision record

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | Commit to Linear-clean; retire the CRT/retro layer | User directive. Resolves the standing conflict between `AGENTS.md` §5 ("Linear style, matte surfaces") and the shipped scanline/phosphor/mascot layer. |
| D2 | Single token vocabulary — keep Specdrivr semantic tokens, delete the shadcn HSL set | `AGENTS.md` §5 already bans `bg-background`/`text-foreground`/`bg-destructive`. Today both sets are live in `@theme inline`, so the ban is unenforceable. |
| D3 | Radix is the primitive foundation; drop `@base-ui/react` | Audit: zero `@base-ui` imports in `src`, suppressed via `knip.json` `ignoreDependencies`. It is an abandoned migration, not a dual stack. |
| D4 | `cva` for every primitive with more than one visual variant | Audit: only 5/37 primitives use `cva`; the rest hand-roll `cn()` conditionals, which is where the drift lives. |
| D5 | Keep monospace, drop the terminal *chrome* | Mono still carries meaning for logs/diffs/IDs. Scanlines, vignettes, flicker and glow do not. |
| D6 | No new routes, no changed data contracts | This is a UI overhaul. Server Components, repositories, actions and Zod schemas are out of scope except where a component boundary must move. |

**D1 dissent (recorded, not acted on):** the catalog agent argued the retro-terminal identity is the
product's actual differentiation and is largely well-executed. Overridden by user directive. If this
is ever revisited, Phase 2 is the reversal point — after that, the retro assets are gone from HEAD
and would need `git revert`.

---

## Phase 0 — Baseline & safety net

- [x] Confirm branch `feat/ui-overhaul` off `main`
- [ ] Record pre-overhaul baseline: `pnpm build` output size, route count, primitive count (37), feature LOC (9,719)
- [ ] Capture "before" screenshots of the 8 highest-traffic routes for the PR writeup
- [ ] Tag the pre-overhaul commit so the retro layer stays trivially recoverable

## Phase 1 — Token foundation (`src/app/globals.css`)

This file is the root cause of most catalogued drift. Rewrite it before touching any component.

- [x] **Delete the shadcn HSL token set** (`--background` … `--ring`, both `:root` and `.dark`) and their 19 `@theme inline` `--color-*` bridges
- [x] **Fix the `.bg-bg-elevated` footgun** (`globals.css:524`) — a hand-written rule that shadows the Tailwind-generated `bg-bg-elevated` utility and silently injects `border` + `shadow-sm`. Delete it; make the border explicit at each call site
- [x] **Delete the CRT layer**: `.terminal-surface`, `.scanline-overlay`, `.cyber-glow`, `.cyber-glow-active`, `.phosphor-focus`, `@keyframes terminal-flicker`
- [x] **Delete the mascot animation layer**: `daemon-float`, `daemon-breath`, `daemon-bounce`, `daemon-think` keyframes + utilities
- [x] **Delete dead `.theme-amber` scrollbar rules** — no such theme exists
- [x] **Rebuild the color system** as one semantic scale with explicit light *and* dark values:
      surface (`base`/`surface`/`elevated`/`sunken`), border (`subtle`/`default`/`strong`),
      text (`primary`/`secondary`/`muted`/`inverse`), one accent + hover/active/subtle,
      status (`success`/`warning`/`danger`/`info`) each with fg/bg/border
- [ ] **Establish a real spacing scale** and stop the ad-hoc `px-8 py-8 md:px-10` pattern
- [x] **Establish a type scale** with a hard 11px floor (audit found 133 arbitrary values, mostly `text-[9px]`/`text-[10px]`)
- [x] **Make `--radius` actually load-bearing** — currently declared and read by nothing
- [x] **Replace shadows with borders** as the primary elevation cue; keep at most two shadow steps for genuine overlays
- [x] **Motion tokens**: 2 durations, 2 easings, and keep the `prefers-reduced-motion` block
- [x] Verify light mode is fully specified, not derived — audit found the design doc only ever documented dark hex

## Phase 1.5 — Write the specification (gate for all implementation)

Everything from Phase 2 onward is built against this document. It is written **before** the code.

- [x] **Rewrite `documentation/infrastructure/DESIGN_SYSTEM.md`** (currently 41KB, heavily drifted). Contents: philosophy, the single token vocabulary with light+dark values, type scale, spacing scale, elevation, motion, the primitive catalogue with props and variants, composition patterns, a11y requirements, explicit do/don't rules
- [ ] Ensure every token named in the doc exists in the Phase 1 `globals.css`, and vice versa — the doc and the stylesheet must be one-to-one

## Phase 2 — Retire the retro components

- [x] Delete `src/components/ui/matrix-screensaver.tsx` (undocumented "Concept #5" canvas rain) and unwire its trigger
- [x] Delete `src/components/ui/daemon-mascot.tsx` (5-expression CRT robot) and every call site
- [x] Replace `src/components/ui/pixel-badge.tsx` with a real `badge.tsx` (see Phase 3) and migrate all call sites
- [x] Rebuild `live-terminal.tsx` and `terminal-log.tsx` as neutral mono log surfaces — no scanlines, no vignette, no flicker; keep the streaming behaviour
- [x] Audit `brand-mark.tsx` — keep the isometric brand logo, strip any CRT treatment
- [x] Grep for orphaned imports of every deleted symbol before moving on

## Phase 3 — Primitive layer rebuild (`src/components/ui/`)

Target: one consistent vintage across all primitives.

- [x] Standardise on the modern shadcn `data-slot` pattern — currently **1 of 37** (`calendar.tsx`) uses it
- [x] Convert every multi-variant primitive to `cva` (currently 5/37)
- [x] **Resurrect the dead stock primitives** the custom layer displaced: `badge.tsx` (confirmed dead by knip), `alert.tsx`, `separator.tsx` — and **remove their entries from `knip.json`'s ignore list** so CI can see them again
- [x] Wrap `vaul`'s `Drawer` as `ui/drawer.tsx` like every other headless dep, instead of raw imports
- [x] Unify on `lucide-react`; remove the 2 `@radix-ui/react-icons` holdouts
- [x] Uniform focus-visible ring across every interactive primitive (replaces `.phosphor-focus`)
- [x] Uniform disabled, loading, and invalid states
- [x] Per-primitive pass over all 37 files: `button`, `input`, `textarea`, `select`, `checkbox`, `switch`, `slider`, `label`, `card`, `table`, `tabs`, `dialog`, `alert-dialog`, `popover`, `dropdown-menu`, `tooltip`, `progress`, `skeleton`, `avatar`, `breadcrumb`, `collapsible`, `calendar`, `date-picker`, `page-header`, `diff-viewer`, `task-row`, `theme-toggle`, `keyboard-shortcuts-modal`

## Phase 4 — App shell

- [x] `src/app/layout.tsx` — theme provider, font wiring, Toaster styling off the new tokens
- [x] `src/components/shell/sidebar.tsx` (386 LOC) — rebuild nav; reconcile the **6 real nav items vs 4 documented**
- [x] `src/components/shell/top-bar.tsx` (233 LOC) — rebuild
- [x] `src/app/(app)/layout.tsx` — replace ad-hoc `px-8 py-8 md:px-10` with the Phase 1 spacing scale; keep the Suspense skeleton but rebuild it to match the new shell exactly
- [x] `src/components/layout/systems-bar.tsx` — keep or retire (decide against the clean direction)
- [x] Define and apply a real breakpoint strategy — audit found breakpoint use is thin and inconsistent

## Phase 5 — Feature surfaces

Ordered by blast radius. Decompose the monoliths while rebuilding — do not port 1,167-line files as-is.

- [x] **Mission control / home** — `page.tsx`, `session-panel.tsx`, `event-log.tsx`, `activity-feed.tsx`, `recent-sessions.tsx`, `needs-attention-banner.tsx`
- [x] **Specs** — `plan-tab.tsx` (682 → 164 + `specs/plan/{shared,use-plan,plan-review}`), `spec-editor.tsx`, `spec-tab.tsx`, `tasks-tab.tsx`, `activity-tab.tsx`, `changes-tab.tsx`
- [x] **Tasks** — `task-drawer.tsx` (473 → 254 + `task-drawer-footer.tsx` + `use-task-actions.ts`), `task-drawer-overview/attempts/changes`, `ui/task-row.tsx`
- [x] **Sessions** — `sessions/`, `sessions/[id]`, `task-timeline.tsx`
- [x] **Settings** (11 routes, the largest cluster):
  - [x] `integrations-section.tsx` (1,161 → 61 + `integrations/{shared,github-card,slack-card,webhooks-card}`)
  - [x] `agent-config-form.tsx` (859 → 160 + `agent-config/` — one file per section, wired through `FormProvider`)
  - [x] `api-tokens-section.tsx`, `audit-log-section.tsx`, `active-sessions-section.tsx`, `members-section.tsx`, `project-settings-form.tsx`, `webhook-log-section.tsx`, `notification-preferences-section.tsx`, `usage-section.tsx`, `change-password-section.tsx`, `danger-zone-section.tsx`, `profile-form.tsx`
  - [x] `settings-nav.tsx` — duplicate `/settings/security` entry replaced with the webhook log and an anchor to API tokens
- [x] **Projects** — `projects/page.tsx`, `create-project-dialog.tsx`
- [x] **Notifications** — `notifications/page.tsx`, `notification-panel.tsx`
- [x] **Auth** (4 routes) — `login`, `invite`, `forgot-password`, `reset-password`
- [x] **Onboarding** — `onboarding-wizard.tsx`
- [x] **Jobs** — `plan-job-status-indicator.tsx`

Found and fixed along the way, beyond the planned scope:

- **All rendered markdown was unstyled.** Six surfaces used `prose prose-invert`, but
  `@tailwindcss/typography` has never been a dependency, so those classes matched nothing. Replaced
  with a token-driven `.markdown` block in `globals.css`.
- **`GatedButton`** (`ui/gated-button.tsx`) — the "disabled button that explains itself" pattern was
  written out by hand at a dozen call sites, which was most of the bulk in the plan tab and drawer.
- **Hardcoded palette colours** — `border-amber-500/40 bg-amber-500/10 text-amber-300` on the spec
  editor banners plus three `text-emerald-400` readouts, all now on status tokens.
- **`spec-editor.tsx` used `h-screen`** inside the shell's already-sized `main`, pushing the preview
  pane below the fold.

## Phase 6 — Accessibility

Audit baseline: only **16 of 78** component files use `aria-*` at all.

- [x] `aria-live` on the streaming surfaces that have none: `task-row.tsx`, `live-terminal.tsx`, ~~`diff-viewer.tsx`~~
- [x] Focus management on dialog / drawer / popover open and close
- [x] Full keyboard path through sidebar, tabs, task drawer, and the command palette
- [x] Semantic landmarks (`nav`, `main`, `aside`, headings in order)
- [x] Contrast check every status colour against its surface in **both** themes
- [x] Extend reduced-motion beyond the single global CSS rule to JS-driven animation
- [x] Accessible names on all icon-only buttons

Corrections to the plan as written:

- **`diff-viewer.tsx` did not need `aria-live`.** It is not a streaming surface — its
  content changes only when the user picks a file. The actual defect was that the file
  list looked like a tablist without being one, so it got `role="tab"` / `aria-controls` /
  `aria-selected` / roving `tabIndex` and a matching `role="tabpanel"` instead.
- **Focus management needed no work.** Every overlay in the app is Radix or vaul
  (`dialog.tsx`, `alert-dialog.tsx`, `drawer.tsx` are the only `fixed inset-0` surfaces),
  so trapping and restoration come from the libraries.
- **Reduced motion needed no JS gate.** There is no `requestAnimationFrame`, no smooth
  scroll, and no JS-driven animation in the app; the three `setInterval`s are elapsed-time
  counters. Vaul's inline drawer transition is already covered, because a stylesheet
  `!important` outranks an inline declaration. Added the two delay resets to complete
  the recipe.

The keyboard path was blocked in two places by `onClick` on a plain `<div>` — the session
timeline card and the notification row — both now real controls. Added the skip link the
shell never had.

Contrast audit (computed over every token pair, both themes). Four failures, all fixed:

| Token | Was | Now | Worst ratio before → after |
| --- | --- | --- | --- |
| `--text-muted` (light) | `#767f8e` | `#616977` | 3.50 → 4.80 |
| `--text-muted` (dark) | `#737d8c` | `#808b9b` | 4.01 → 4.84 |
| `--accent` (light) | `#2563eb` | `#1f5fe0` | 4.48 → 4.83 |
| control borders | `--border-default` | new `--border-control` | 1.15 → 3.13 |

Every status colour (`success`, `warning`, `danger`, `info`) already passed on all four
neutral surfaces and on its own tinted background, in both themes — the worst was 4.71.

`--border-control` is a new token rather than a change to `--border-default`: hairlines on
cards and dividers are the D1 aesthetic and WCAG 1.4.11 exempts them, but an empty checkbox
has no affordance except its outline. `input`, `textarea`, `select`, `checkbox` and the
`switch`'s off track now use it; cards and dividers are untouched.

## Phase 7 — Cleanup

- [ ] Remove `@base-ui/react` from `package.json` and its `knip.json` `ignoreDependencies` entry
- [ ] Fix `components.json` — it points at `tailwind.config.mjs`, **which does not exist** (project is Tailwind v4 CSS-first). Stale manifest misdirects `shadcn add` / `shadcn diff`
- [ ] Empty out `knip.json`'s UI ignore list and let CI see the real dead code
- [ ] Grep for surviving hex codes and arbitrary bracket values; drive the 133 count toward zero
- [ ] Delete now-unused assets and keyframes
- [ ] The `no-restricted-syntax` raw-primitive rule in `eslint.config.js` named
      `@pxlkit/ui-kit`, which D1 killed. Message retargeted at `@/components/ui`; the
      four `@pxlkit/*` entries in `knip.json`'s `ignoreDependencies` still need removing

## Phase 8 — Documentation reconciliation

> `DESIGN_SYSTEM.md` is **not** written here — it is written up-front, between Phase 1 and Phase 2,
> because it is the specification the implementation is built against. This phase only reconciles it
> with what actually shipped, plus the surrounding docs.

- [ ] Reconcile `documentation/infrastructure/DESIGN_SYSTEM.md` against the shipped code; correct anywhere implementation diverged from spec
- [ ] Update `AGENTS.md` §5 and §12 to match the rebuilt system
- [ ] Update `documentation/infrastructure/CODING_PATTERNS.md` for the new component conventions
- [ ] Update `documentation/infrastructure/DIRECTORY_MAP.md` if the component tree moved
- [ ] Update `documentation/infrastructure/SYMBOL_REGISTRY.md` for deleted and added symbols
- [ ] Update `documentation/modules/*.md` where screen descriptions changed
- [ ] Mark `UI_AUDIT.md` as historical, superseded by the rewritten design system

## Phase 9 — Verification gate (deferred until everything above is done)

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] `pnpm test:unit`
- [ ] `pnpm test:e2e` — expect selector breakage from the rebuild; fix the tests
- [ ] Manual pass over all 25 routes in light **and** dark
- [ ] Responsive pass at every supported breakpoint
- [ ] Re-run `knip` with the ignore list emptied
- [ ] Contrast audit
- [ ] Capture "after" screenshots

## Phase 10 — Closing ritual (`AGENTS.md` §18)

- [ ] `documentation/branches/feat-ui-overhaul/BRANCH_CHANGES.md` — full table with per-file rationale and best-practice scores
- [ ] `documentation/branches/feat-ui-overhaul/BRANCH_CODE_REVIEW.md` — senior review of the diff
- [ ] Executive summary + deliverables checklist
- [ ] Open PR

---

## Risk register

| Risk | Mitigation |
|------|------------|
| Deleting the shadcn HSL tokens breaks primitives still referencing `bg-background` etc. | Phase 1 and Phase 3 must land together; grep every removed token before deleting |
| E2E suite is selector-coupled to the old markup | Expected. Budgeted in Phase 9, not treated as a regression |
| 9.7k LOC of feature components is a large surface for one branch | Phase 5 is ordered by blast radius and can ship incrementally within the branch |
| Deferred verification means errors compound silently | Accepted per directive. Phase 9 is a hard gate, and Phase 1 (tokens) is deliberately sequenced first so downstream work builds on a settled foundation |
| Decomposing 1,167-line files invites behaviour drift | Decompose by extraction only — move code, don't rewrite logic |
