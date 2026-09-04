#!/usr/bin/env node
/**
 * One-shot migration: DaemonMascot -> StatusIcon, PixelBadge -> Badge.
 * Part of the UI overhaul (branch: feat/ui-overhaul). Delete once landed.
 *
 * Mascot sizes were illustration-scale (48/64px). They are stepped down to
 * icon-scale here, per DESIGN_SYSTEM.md §9 (empty-state icon = 24px).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const RULES = [
  // Imports
  [
    /import \{ DaemonMascot(?:\s*,\s*[^}]*)? \} from '@\/components\/ui\/daemon-mascot';\n/g,
    "import { StatusIcon } from '@/components/ui/status-icon';\n",
  ],
  [
    /import \{ PixelBadge \} from '@\/components\/ui\/pixel-badge';/g,
    "import { Badge } from '@/components/ui/badge';",
  ],

  // Mascot: illustration scale -> icon scale
  [/<DaemonMascot size=\{64\}/g, '<StatusIcon size={28}'],
  [/<DaemonMascot size=\{48\}/g, '<StatusIcon size={24}'],
  [/<DaemonMascot size=\{32\}/g, '<StatusIcon size={20}'],
  [/<DaemonMascot size=\{24\}/g, '<StatusIcon size={18}'],
  [/<DaemonMascot/g, '<StatusIcon'],
  [/\bexpression=/g, 'status='],

  // Badge: colour-named variants -> semantic variants
  [/<PixelBadge/g, '<Badge'],
  [/<\/PixelBadge>/g, '</Badge>'],
  [/variant="amber"/g, 'variant="warning"'],
  [/variant="emerald"/g, 'variant="success"'],
  [/variant="red"/g, 'variant="danger"'],
  [/variant="blue"/g, 'variant="info"'],
  [/variant="primary"/g, 'variant="accent"'],
];

const files = execSync("grep -rl -E 'DaemonMascot|PixelBadge' src/", { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter((f) => !f.includes('ui/daemon-mascot') && !f.includes('ui/pixel-badge'));

let changed = 0;
for (const file of files) {
  const before = readFileSync(file, 'utf8');
  let after = before;
  for (const [re, to] of RULES) after = after.replace(re, to);
  if (after !== before) {
    writeFileSync(file, after);
    changed += 1;
  }
}
console.log(`Migrated ${changed} / ${files.length} files`);
