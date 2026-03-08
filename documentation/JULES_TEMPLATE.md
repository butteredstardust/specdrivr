## Environment Setup
- Install: `npm ci`
- Dev server: `npm run dev`
- Build: `npm run build`

## Testing
- Full suite: `npm test`
- Single file: `npx jest path/to/file.test.ts`
- Must pass before any PR

## Architecture
- `src/api/` — Express route handlers, no business logic here
- `src/services/` — Core business logic
- `src/db/` — Prisma ORM models only

## Code Conventions
- TypeScript strict mode
- No `any` types
- Functional components only (React)
- Error boundaries required for async ops

## PR Rules
- Title: `[scope]: description`
- Never modify `prisma/migrations/` directly
- Never commit `.env` or `secrets/`

## Off-Limits
- Do not touch `infrastructure/` without explicit instruction
- Do not alter CI/CD YAML files