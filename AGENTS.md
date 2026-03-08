## Environment Setup
- `npm ci`, `npm run dev`, `npm run build`

## Testing
- `npm test`, `npx jest file.test.ts`
- Must pass

## Architecture
- `src/app`, `src/repositories`, `src/lib`

## Code
- TS strict, no `any`, repository pattern

## PR
- `[scope]: description`, never modify migrations

## Off Limits
- `infrastructure/`, CI/CD YAML, `.env`, secrets

## Best Practices
File paths, errors, goals. Clarify research vs implement vs test.

## Common Commands
`npm run dev build`, `db:push db:studio`, `npm test`.
