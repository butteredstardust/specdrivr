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

### CI Fix Procedures
When fixing CI failures (type errors, environment issues, etc.):
- Make changes **directly** to the source files, not through temporary modification scripts
- Commit the actual file changes through proper git workflows
- Do **not** commit temporary fix scripts (e.g., `fix.mjs`, `fix*.mjs`) that bypass version control
- Always verify fixes are in the actual source files, not just in scripts

## Common Commands
`pnpm dev`, `pnpm build`, `pnpm db:push`, `pnpm db:studio`, `pnpm test`.
