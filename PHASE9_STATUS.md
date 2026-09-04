# Phase 9 verification status

**Branch:** `feat/ui-overhaul`  
**Run date:** 2026-09-04  
**Scope:** Verification/reporting only. No application or test fix was made.

## Executive result

| Check | Exit | Result |
| --- | ---: | --- |
| `pnpm typecheck` | 0 | Pass: `TypeScript: No errors found`. |
| `pnpm lint` | 0 | Pass with four warnings. |
| `pnpm build` | 1 | Compiled and typechecked, then failed page-data collection because required environment variables were unset. |
| `pnpm test` | 1 | `pnpm test:unit` ran first and failed one stale UI assertion; the script therefore never invoked its chained e2e command. |
| `pnpm test:e2e` | 130 | No tests reached selectors; the configured `next dev` web server entered an `EMFILE` restart loop and the run was terminated. |
| `pnpm knip` | 1 | Reports 16 unused files, all already present on `main`. |

`package.json` defines `test` as `pnpm test:unit && pnpm test:e2e`; despite the task shorthand
“`pnpm test` (unit)”, the exact command is a combined suite. Because the unit half failed, the e2e
half was also run separately as requested.

## Prioritised fixes still required

### P0 — Update the stale terminal-log unit test

- **File:** `tests/terminal-log.test.tsx:11-13`
- **Branch attribution:** Caused by this branch. The test is unchanged from `main`; this branch
  deliberately removed `.terminal-surface` from `src/components/ui/terminal-log.tsx`.
- **Exact failure:**

  ```text
  FAIL  tests/terminal-log.test.tsx > TerminalLog > applies terminal-surface class for scanlines
  Error: expect(element).toHaveClass("terminal-surface")

  Expected the element to have class:
    terminal-surface
  Received:
    border-line bg-log-bg overflow-y-auto rounded-md border p-4
  ❯ tests/terminal-log.test.tsx:13:34

  Test Files  1 failed | 17 passed (18)
       Tests  1 failed | 91 passed (92)
  ```

- **Fix:** Replace the deleted-CRT assertion with behavior/accessibility assertions for the shipped
  neutral log surface, such as `role="log"`, `aria-live="polite"`, `aria-label="Log output"`, and
  the `bg-log-bg`/`border-line` frame. Rename the test so it no longer promises scanlines.

### P0 — Make the e2e server runnable, then rerun both tests

- **Files:** `playwright.config.ts` (web-server command), runtime `.next` output; selectors are in
  `tests/e2e/home.spec.ts`.
- **Branch attribution:** Not attributable to this branch. `playwright.config.ts` and
  `tests/e2e/home.spec.ts` are unchanged from `main`; the observed failure is a local dev-server
  resource/restart failure.
- **Exact failure (repeated many times before termination):**

  ```text
  [WebServer] Watchpack Error (watcher): Error: EMFILE: too many open files, watch
  [WebServer] ⨯ The directory at "/Users/tuxgeek/Dev/specdrivr/.next/dev" was deleted.
  [WebServer] Deleting this directory while Next.js is running can lead to undefined behavior. Restarting the server to recover...
  Error: Process from config.webServer exited early.
  ELIFECYCLE Command failed with exit code 130.
  ```

- **Selector result:** No selector failed because neither e2e test began. Static reconciliation of
  the only spec found **zero sentence-case mismatches**: `Email`, `Password`, both `Sign In` button
  locators, and the `Mission Control` heading still exactly match source. The expected selector
  breakage is therefore not present in the checked-in e2e suite.
- **Fix:** Clear/isolate the generated Next output and resolve the watcher resource/restart loop,
  then rerun `pnpm test:e2e`. Do not change selectors unless the rerun produces an actual locator
  failure. During this audit, generated `.next/types` was moved recoverably to
  `/tmp/specdrivr-next-types-phase9-20260904` after it conflicted with `.next/dev/types`.

### P1 — Provide required build environment

- **Files:** `src/lib/env-core.ts:94`, surfaced while collecting
  `src/app/api/v1/admin/aggregate-usage/route.ts`.
- **Branch attribution:** Predates this branch. `src/lib/env-core.ts` is unchanged from `main`; the
  repository has only `.env.example`, not a configured `.env`/`.env.local`.
- **Exact failure:**

  ```text
  ✓ Compiled successfully in 4.1s
  Finished TypeScript in 4.6s ...
  Collecting page data using 10 workers ...
  Error: Failed to collect configuration for /api/v1/admin/aggregate-usage
  [cause]: Error [ZodError]:
    "path": ["DATABASE_URL"], "message": "Required"
    "path": ["BETTER_AUTH_SECRET"], "message": "Required"
  at a (src/lib/env-core.ts:94:22)
  Error: Failed to collect page data for /api/v1/admin/aggregate-usage
  ELIFECYCLE Command failed with exit code 1.
  ```

- **Fix:** Run the build with valid `DATABASE_URL` and a 32+ character `BETTER_AUTH_SECRET` (the CI
  workflow already demonstrates this contract), or configure the documented local environment.
  This is an invocation/environment fix, not a UI source change.

### P1 — Replace the raw interactive primitive flagged by lint

- **File:** `src/components/sessions/task-timeline.tsx:190`
- **Branch attribution:** Caused by this branch; the raw `<button>` was introduced when the
  clickable card was made keyboard accessible.
- **Exact warning:**

  ```text
  190:21  warning  Prefer the design system components in @/components/ui (Button, Input, Select) over raw HTML primitives  no-restricted-syntax
  ```

- **Fix:** Use the local `Button` primitive with the appropriate unstyled/ghost composition while
  preserving `type="button"`, `aria-expanded`, full-width layout, and text alignment.

### P1 — Resolve pre-existing direct-DB lint warnings

- **File:** `src/lib/webhooks.ts:5-6`
- **Branch attribution:** Predates this branch; the file is unchanged from `main`.
- **Exact warnings:**

  ```text
  5:1  warning  '@/db' import is restricted from being used. Direct DB access in components is prohibited. Use Repositories instead  @typescript-eslint/no-restricted-imports
  6:1  warning  '@/db/schema' import is restricted from being used. Direct DB access in components is prohibited. Use Repositories instead  @typescript-eslint/no-restricted-imports
  6:1  warning  '@/db/schema' import is restricted from being used by a pattern. Direct DB access in components is prohibited. Use Repositories instead  @typescript-eslint/no-restricted-imports

  ✖ 4 problems (0 errors, 4 warnings)
  ```

- **Fix:** Move webhook persistence reads/writes behind repository methods, or narrow the lint rule
  if direct DB access is intentionally permitted in this non-component infrastructure module.

### P2 — Triage the 16 Knip findings now exposed by the branch

- **Files:**

  ```text
  db/seed-enhanced.ts
  scripts/audit-hooks.js
  scripts/db-verify.ts
  src/lib/schemas/webhook.ts
  src/queries/agent-query.ts
  src/queries/api-request-logs-query.ts
  src/queries/audit-query.ts
  src/queries/git-commits-query.ts
  src/queries/notifications-query.ts
  src/queries/plans-query.ts
  src/queries/tasks-query.ts
  src/queries/test-query.ts
  src/queries/tokens-query.ts
  src/queries/usage-query.ts
  src/queries/webhooks-query.ts
  src/repositories/api-request-log-repository.ts
  ```

- **Branch attribution:** The files all exist on `main`; the debt predates the UI overhaul. This
  branch removed UI-related Knip suppressions, so the existing backend debt is now visible.
- **Exact result:** `Unused files (16)` followed by the list above; exit code 1.
- **Fix:** Review each file and either connect a legitimate entry point, delete dead code in a
  separately scoped backend cleanup, or add a narrowly justified Knip entry for intentional scripts.

### P2 — Complete the mono-policy source cleanup

- **Files (representative exact matches):**

  ```text
  src/components/settings/api-tokens-section.tsx:280: <DialogTitle className="font-mono">
  src/components/settings/api-tokens-section.tsx:284: <label className="text-fg-secondary font-mono text-xs" ...>
  src/components/settings/api-tokens-section.tsx:370: <AlertDialogTitle className="font-mono">
  src/components/specs/activity-tab.tsx:90: ... font-mono ... Loading activity…
  src/app/(app)/projects/page.tsx:116: <p className="text-fg-secondary font-mono text-sm">
  src/app/(app)/specs/[id]/page.tsx:227: ... font-mono ...
  ```

- **Branch attribution:** Mixed. The branch removed the broad uppercase-mono treatment but these
  surviving semantic misuses remain in changed UI files.
- **Fix:** Remove `font-mono` from prose, headings, table headers, badges, tabs, and control labels.
  Keep it only on IDs, code, log output, timestamps, and numeric columns paired with
  `tabular-nums`, per `documentation/infrastructure/DESIGN_SYSTEM.md`.

## Pre-push hook finding

The reported `.husky/pre-push` abort at `scripts/hooks/utils.sh:86` is **not reproducible through
the current orchestrator**. A direct `.husky/pre-push` run passed the range-consuming checks because
`scripts/hooks/prepush.sh:68` exports `PUSH_RANGES` before invoking child checks; it later failed in
the suite check due to generated `.next` type conflicts from the aborted e2e run.

There is nevertheless a genuine robustness bug when a check is invoked standalone:

```text
$ env -u PUSH_RANGES bash scripts/hooks/checks/xss.sh
info Checking for unsafe XSS patterns...
scripts/hooks/utils.sh: line 86: PUSH_RANGES: unbound variable
```

`scripts/hooks/utils.sh` and `scripts/hooks/prepush.sh` are unchanged from `main`, so this predates
the branch. The fix would be to give the helper a safe local fallback before iteration, for example
`local ranges="${PUSH_RANGES:-HEAD~1..HEAD}"` followed by `for range in $ranges; do`, or to make
each standalone check initialize/export the same fallback contract as the orchestrator.

## Passing evidence

- `pnpm typecheck`: exit 0, `TypeScript: No errors found` (confirmed before and after generated
  `.next` cleanup).
- `pnpm lint`: exit 0; warnings are recorded above.
- Unit suite breadth before its one failure: 18 files, 92 tests; 17 files and 91 tests passed.
- No `ERR_PNPM_UNEXPECTED_STORE` occurred, so the documented `--store-dir` fallback was not needed.
