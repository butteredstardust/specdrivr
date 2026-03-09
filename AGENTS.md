## Environment Setup
- `pnpm install --frozen-lockfile`, `pnpm dev`, `pnpm build`

## Testing
- `pnpm test`, `pnpm test:unit`, `pnpm test:e2e`
- Must pass

## Architecture
- `src/app`, `src/repositories`, `src/lib`

## Code
- TS strict, no `any`, repository pattern

## PR
- `[scope]: description`, never modify migrations
- Package manager: **pnpm** (not npm)

## Off Limits
- `infrastructure/`, CI/CD YAML, `.env`, secrets

## Best Practices
File paths, errors, goals. Clarify research vs implement vs test.

## Common Commands
`pnpm dev`, `pnpm build`, `pnpm db:push`, `pnpm db:studio`, `pnpm test`.
