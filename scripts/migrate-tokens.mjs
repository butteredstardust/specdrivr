#!/usr/bin/env node
/**
 * One-shot token migration for the UI overhaul (branch: feat/ui-overhaul).
 *
 * Rewrites Tailwind utilities from the two pre-overhaul token vocabularies
 * (shadcn HSL + custom Specdrivr hex) onto the single vocabulary defined in
 * documentation/infrastructure/DESIGN_SYSTEM.md.
 *
 * Delete this file once the overhaul lands. It is not part of the build.
 *
 * Ordering is load-bearing:
 *   - Longest key first, so `bg-accent-blue` is consumed before `bg-accent`.
 *   - A `(?![\w-])` lookahead stops `bg-accent` matching inside `bg-accent-blue`,
 *     since `-` is not a word character and \b alone would not hold.
 *
 * The `bg-accent` -> `bg-surface-inset` mapping is deliberate and easy to get
 * wrong: in shadcn, `accent` is the *muted hover fill*. In the new system,
 * `accent` is the solid blue. Migrating it to `bg-accent` would turn every
 * hover state solid blue.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const MAP = {
  // --- Custom Specdrivr tokens ------------------------------------------
  'bg-bg-base': 'bg-surface-base',
  'bg-bg-surface': 'bg-surface-raised',
  // NOTE: the old `.bg-bg-elevated` rule also injected `border` + `shadow-sm`.
  // That implicit border is intentionally NOT reproduced; call sites that
  // relied on it are corrected by hand in Phase 5.
  'bg-bg-elevated': 'bg-surface-inset',
  'border-border-default': 'border-line',
  'border-border-muted': 'border-line-subtle',
  'divide-border-default': 'divide-line',
  'divide-border-muted': 'divide-line-subtle',
  'text-text-primary': 'text-fg',
  'text-text-secondary': 'text-fg-secondary',
  'text-text-muted': 'text-fg-muted',
  'placeholder:text-text-muted': 'placeholder:text-fg-muted',

  'text-accent-blue-dim': 'text-accent-hover',
  'bg-accent-blue-dim': 'bg-accent-hover',
  'border-accent-blue-dim': 'border-accent-hover',
  'text-accent-blue': 'text-accent',
  'bg-accent-blue': 'bg-accent',
  'border-accent-blue': 'border-accent',
  'ring-accent-blue': 'ring-accent',

  'text-brand-blue': 'text-accent',
  'bg-brand-blue': 'bg-accent',
  'border-brand-blue': 'border-accent',
  'text-brand-cyan': 'text-accent',
  'bg-brand-cyan': 'bg-accent',
  'text-brand-navy': 'text-fg',
  'bg-brand-navy': 'bg-surface-raised',

  // Amber was the warning/pending colour, not an ID colour. Verified by
  // inspection: every call site is a pending/blocked/modified/unsaved state.
  'text-phosphor-amber-dim': 'text-warning',
  'bg-phosphor-amber-dim': 'bg-warning',
  'border-phosphor-amber-dim': 'border-warning',
  'text-phosphor-amber': 'text-warning',
  'bg-phosphor-amber': 'bg-warning',
  'border-phosphor-amber': 'border-warning',

  'text-status-emerald': 'text-success',
  'bg-status-emerald': 'bg-success',
  'border-status-emerald': 'border-success',
  'text-status-red': 'text-danger',
  'bg-status-red': 'bg-danger',
  'border-status-red': 'border-danger',
  'text-status-orange': 'text-warning',
  'bg-status-orange': 'bg-warning',
  'border-status-orange': 'border-warning',

  'bg-terminal-bg': 'bg-log-bg',
  'text-terminal-text': 'text-log-text',
  'text-terminal-green': 'text-success',
  'bg-terminal-green': 'bg-success',

  'bg-diff-added': 'bg-diff-added-bg',
  'bg-diff-deleted': 'bg-diff-removed-bg',

  // --- shadcn HSL tokens -------------------------------------------------
  'bg-background': 'bg-surface-base',
  'text-background': 'text-surface-base',
  'text-foreground': 'text-fg',
  'bg-foreground': 'bg-fg',
  'bg-card-foreground': 'bg-fg',
  'text-card-foreground': 'text-fg',
  'bg-card': 'bg-surface-raised',
  'text-popover-foreground': 'text-fg',
  'bg-popover': 'bg-surface-overlay',

  'bg-primary-foreground': 'bg-accent-fg',
  'text-primary-foreground': 'text-accent-fg',
  'bg-primary': 'bg-accent',
  'text-primary': 'text-accent',
  'border-primary': 'border-accent',
  'ring-primary': 'ring-accent',

  'bg-secondary-foreground': 'bg-fg',
  'text-secondary-foreground': 'text-fg',
  'bg-secondary': 'bg-surface-inset',
  'text-secondary': 'text-fg-secondary',

  'text-muted-foreground': 'text-fg-muted',
  'bg-muted-foreground': 'bg-fg-muted',
  'bg-muted': 'bg-surface-inset',
  'text-muted': 'text-fg-muted',

  'bg-destructive-foreground': 'bg-fg-inverse',
  'text-destructive-foreground': 'text-fg-inverse',
  'bg-destructive': 'bg-danger',
  'text-destructive': 'text-danger',
  'border-destructive': 'border-danger',

  // shadcn `accent` == muted hover fill. NOT the new solid accent.
  'text-accent-foreground': 'text-fg',
  'bg-accent-foreground': 'bg-fg',
  'bg-accent': 'bg-surface-inset',

  'border-border': 'border-line',
  'bg-border': 'bg-line',
  'border-input': 'border-line',
  'ring-ring': 'ring-accent',
  'ring-offset-background': 'ring-offset-surface-base',

  // --- Removed effect classes -------------------------------------------
  'terminal-surface': '',
  'scanline-overlay': '',
  'cyber-glow-active': '',
  'cyber-glow': '',
  'phosphor-focus': '',
  'surface-dual-border': 'border border-line',
  'surface-raised': 'bg-surface-raised border border-line',
  'inner-shadow-sm': '',
  'animate-entrance': 'animate-fade-in-up',
  'animate-terminal-flicker': '',
  'animate-blink': 'animate-pulse-subtle',
  'hover-snappy': '',
  'interactive-card': 'transition-colors hover:border-line-strong',
  'stagger-1': '',
  'stagger-2': '',
  'stagger-3': '',
  'stagger-4': '',
  'stagger-5': '',
  'shadow-glow': '',
  'shadow-sm': '',
  'shadow-md': 'shadow-popover',
  'shadow-lg': 'shadow-popover',
  'shadow-xl': 'shadow-overlay',
  'shadow-2xl': 'shadow-overlay',
};

// Longest key first so prefixes never win over more specific keys.
const keys = Object.keys(MAP).sort((a, b) => b.length - a.length);

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Match the token only when it starts a class (preceded by start, whitespace,
// quote, backtick, or `:` for variants) and is not followed by more of a name.
const patterns = keys.map((k) => ({
  key: k,
  value: MAP[k],
  re: new RegExp(`(^|[\\s'"\`:])${escape(k)}(?![\\w-])`, 'g'),
}));

const files = execSync(
  "git ls-files 'src/**/*.tsx' 'src/**/*.ts' | grep -v -e 'daemon-mascot' -e 'matrix-screensaver'",
  { encoding: 'utf8' }
)
  .split('\n')
  .filter(Boolean);

let changedFiles = 0;
const tally = Object.create(null);

for (const file of files) {
  const before = readFileSync(file, 'utf8');
  let after = before;

  for (const { key, value, re } of patterns) {
    after = after.replace(re, (_m, lead) => {
      tally[key] = (tally[key] ?? 0) + 1;
      return value ? `${lead}${value}` : lead;
    });
  }

  // Collapse whitespace left behind by removed classes, inside class strings only.
  after = after.replace(/className="([^"]*)"/g, (m, cls) => {
    const cleaned = cls.replace(/[ \t]+/g, ' ').replace(/^ | $/g, '');
    return cleaned === cls ? m : `className="${cleaned}"`;
  });

  if (after !== before) {
    writeFileSync(file, after);
    changedFiles += 1;
  }
}

const entries = Object.entries(tally).sort((a, b) => b[1] - a[1]);
const total = entries.reduce((n, [, c]) => n + c, 0);

console.log(`\nFiles changed: ${changedFiles} / ${files.length}`);
console.log(`Replacements:  ${total}\n`);
for (const [k, c] of entries) {
  console.log(`  ${String(c).padStart(4)}  ${k}  ->  ${MAP[k] || '(removed)'}`);
}
