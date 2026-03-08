# Next.js 14 to 15 Migration Notes

## Overview
This project has been successfully migrated from Next.js 14 to Next.js 15, addressing breaking changes including async request APIs and fetch caching defaults, alongside upgrading dependencies.

## Packages Upgraded
- `next`: Upgraded from `^14.2.0` to `15.5.12`.
- `react`: Upgraded from `^18.3.0` to `19.0.0`
- `react-dom`: Upgraded from `^18.3.0` to `19.0.0`

## Breaking Changes Addressed

### Async Request APIs (Next.js 15)
- All instances of `cookies()` were updated to be awaited (`await cookies()`).
  - Modified file: `src/lib/auth-utils.ts`
- All instances of `params` used within Next.js App Router dynamic routes (`Page`, `Layout`, `route.ts`) have had their type definitions changed to `Promise<{ id: string }>` and were subsequently `await`ed before accessing their properties.
  - Modified files:
    - `src/app/(authenticated)/projects/[id]/layout.tsx`
    - `src/app/(authenticated)/projects/[id]/page.tsx`
    - `src/app/(authenticated)/projects/[id]/settings/page.tsx`
    - `src/app/(authenticated)/projects/[id]/commits/page.tsx`
    - `src/app/api/admin/users/[id]/route.ts`

### Fetch Caching Inversion
- In Next.js 15, `fetch` defaults to `{ cache: 'no-store' }`. Explicit overrides were applied to guarantee expected behavior, especially for data that must remain always fresh (like authentication sessions, live agent statuses, etc.).
  - Explicit `{ cache: 'no-store' }` applied to:
    - `src/hooks/use-agent-status.ts`
    - `src/components/wave-manager.tsx`
    - `src/components/layout/user-menu.tsx`
    - `src/components/kanban-board.tsx`
    - `src/app/(authenticated)/admin/users/page.tsx`
    - `src/app/auth/login/page.tsx`
- Note: GET Route Handlers remain dynamic by default because they rely on `request.headers` or `cookies()` dynamically, which naturally enforces the non-static rendering behavior needed for these endpoints.

### Turbopack
- Turbopack was successfully enabled via `next dev --turbopack`. Initially, a caching issue with npm incorrectly retained the local `next` binary at v14 even though package.json requested v15. This was resolved by forcing `npm install next@15 --save-exact` to overwrite the CLI bin, allowing Turbopack to start successfully.

### Other Audits
- **Middleware:** No deprecated `NextResponse.next({ request: ... })` overrides existed.
- **Config:** `next.config.js` contained no deprecated experimental flags.
- **React 19:** No deprecated `ReactDOM.render` or `ReactDOM.hydrate` APIs existed.

## Pre-existing Issues
- E2E Tests: The command `npm run test:e2e` fails before executing tests with a module resolution error: `Error: Cannot find module '../utils/test-helpers'`. The directory `tests/utils/` does not exist in the repository, making the E2E tests non-functional. This is unrelated to the Next.js 15 migration and was left as-is.

# Next.js 15 to 16 Migration Notes

## Packages Upgraded
- `next`: Upgraded from `15.5.12` to `16.1.6`.
- `react`: Upgraded from `19.0.0` to `19.2.4`
- `react-dom`: Upgraded from `19.0.0` to `19.2.4`

## Breaking Changes Addressed

### Async Request APIs (Next.js 16)
- All instances of `params` used within Next.js App Router dynamic routes (`Page`, `Layout`, `route.ts`) have had their type definitions changed from `{ id: string }` to `Promise<{ id: string }>` and were `await`ed.
  - Modified files:
    - `src/app/(authenticated)/projects/[id]/layout.tsx`
    - `src/app/(authenticated)/projects/[id]/page.tsx`
    - `src/app/(authenticated)/projects/[id]/settings/page.tsx`
    - `src/app/(authenticated)/projects/[id]/commits/page.tsx`
    - `src/app/api/admin/users/[id]/route.ts`

### Proxy Middleware
- `src/middleware.ts` was renamed to `src/proxy.ts` and the export signature was adjusted to work with Next.js 16 proxy convention since the Node.js runtime is used.

### React 19 compatibility
- Fixed `React.cloneElement` types inside `src/components/project-card.tsx` to handle the new `size` prop requirements with React Node signatures.
- Replaced `JSX.Element` type reference with `React.ReactNode` in `src/components/agent-logs.tsx` for `levelIcons` record map values.

### ESLint updates
- Removed `next lint` and replaced the `lint` script in `package.json` with direct `eslint` execution `eslint . --ext .ts,.tsx,.js,.jsx`.
- Set eslint version to `^8.57.1` as ESLint 9 is not fully supported by `next/core-web-vitals` yet. Configured with a `.eslintrc.json` using `@typescript-eslint` bypass rules matching previous configuration semantics.

### Turbopack & Image Defaults
- No custom Turbopack configuration flags were required, it runs implicitly by default.
- No `next/image` width/height errors surfaced as the project sizes align correctly.

### Config Updates
- Fixed `next.config.js` to `next.config.mjs` to alleviate `MODULE_TYPELESS_PACKAGE_JSON` CommonJS parser warnings during builds.
