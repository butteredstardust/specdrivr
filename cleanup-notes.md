# Cleanup Notes

## Security Audit
npm audit found 9 vulnerabilities (3 high). Running `npm audit fix --dry-run` indicated that fixing them required breaking changes (e.g., upgrading `@auth/core`, `drizzle-kit`, and `eslint-config-next`). Since there are no explicitly allowed major upgrades in `AGENTS.md`, these vulnerabilities are flagged for manual review.

## Dependency Upgrades
Ran `npx npm-check-updates --target minor -u` and upgraded the dependencies.
Updated `package.json`: added `engines.node`, ensured `private: true`, and sorted dependencies.

## Remove Unused Dependencies
Ran `npx knip`. Verified packages with `grep`. The following dependencies were marked unused by `knip` and removed: `@base-ui/react`, `@types/dompurify`, `dompurify`, `next-remove-imports`, `rehype-sanitize`, `ts-morph`, `@eslint/eslintrc`, `@types/bcryptjs`, `autoprefixer`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, and `jest`.
Note: The following packages were flagged by `knip` but are actually used (false positives), so they were kept: `@auth/core`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-separator`, `@radix-ui/react-toast`, and `next-themes`.

## Remove Dead Code
Removed unused non-special files as flagged by knip: check-users.mjs, classify.js, fix-kanban.ts, full_classification.js, list-all.js, src/components/agent-buttons.tsx, src/components/bottom-tabs.tsx, src/components/create-plan-dialog.tsx, src/components/project-tab-layout.tsx, src/components/specification-viewer.tsx, test-db.mjs, test-playwright.mjs, tests/screenshots/capture.js, tests/seed-test-data.mjs, src/hooks/use-toast.ts, src/lib/env.ts, src/styles/globals.css. Also removed export statements from unused internal components/utilities (e.g. CardSkeleton, CompactAgentStatus) instead of deleting them since they are still in use locally.

## Emoji Removal
Searched codebase for emoji Unicode characters. None found in specified locations.

## Console Log Cleanup
Searched for console logs in codebase. All instances of `console.*` found were `console.error` inside catch blocks, which are the only observability mechanisms for those error paths. None were removed.

## TypeScript Hygiene
- Enabled `"strict": true` in `tsconfig.json`.
- Fixed multiple trivial occurrences of `as any` and `@ts-ignore` related to Drizzle types and route responses.
- Note: Complex type escapes (like `projects: any[]` across layouts, Auth.js session object mutation, and UI component prop injections) were reverted to avoid breaking Next.js typing across server/client boundaries as fixing them thoroughly would require a comprehensive refactor. The build and strict compilation passes.

## Next.js Specific Hygiene
- Added minimal metadata exports to `page.tsx` files lacking them.
- Ensured `reactStrictMode: true` in `next.config.mjs`.
- No invalid `process.env` references in Client Components found.
- No missing `alt` attributes on `<Image>` tags.

## File and Folder Hygiene
- Added `knip-baseline.json`, `audit-report.json`, `cleanup-notes.md`, and `migration-notes.md` to `.gitignore`.
- Removed unused Jest config files (`jest.config.js`, `jest.setup.js`).
- Checked `README.md` baseline - it contains project name, description, prerequisites, setup instructions, and environment variables instructions.

## Final Validation
- `tsc --noEmit` exits cleanly without errors.
- `npm run build` succeeds.
- `npm run test` (Vitest) succeeds (50 passing).
- `npm run lint` exits without errors (3 pre-existing warnings).

## Manual Action Required
- **Security Vulnerabilities:** `cookie` (via `@auth/core`), `esbuild` (via `drizzle-kit`), and `glob` (via `eslint-config-next`) require major version bumps to fix. Please review and update manually.
