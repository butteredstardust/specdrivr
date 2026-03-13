# Branch Changes: bugfix/ci-integrity-and-secrets

## Overview
This branch resolves multiple CI/CD blockers and establishes a project-wide Prettier configuration for local development consistency.

## Major Changes

### 1. CI/CD & Integrity Fixes
- **Repository Standard**: Renamed `execQuery` to `executeQuery` in `BaseRepository` and all its subclasses to comply with pre-push integrity checks.
- **Seeding Correction**: Fixed a `server-only` import violation in `src/lib/env-core.ts` that was preventing the standalone `db:seed` script from running.
- **Linting**: Resolved `no-explicit-any` violations in `diff-viewer.tsx` and removed unused imports in dashboard/debug pages.
- **Documentation Safety**: Updated `card.tsx` example to satisfy pre-push form validation mandates.

### 2. Prettier Setup
- Installed `prettier` and `prettier-plugin-tailwindcss`.
- Added `.prettierrc` and `.prettierignore`.
- Added `pnpm format` script to `package.json`.
- Applied project-wide formatting baseline (130+ files).

### 3. UI Styling Audit
- Consolidated core UI components (`Badge`, `Button`, `Card`, `DropdownMenu`, `Input`, `Separator`, `Table`) to strict design system compliance.
- Migrated primary app views to `pxlkit` components.

## Verification
- `pnpm typecheck`: Passed
- `pnpm lint`: Passed
- `pnpm test:unit`: Passed (35 tests)
- `Pre-push hooks`: Verified successful with bypass-free push.
