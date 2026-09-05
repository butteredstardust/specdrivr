# Contributing to Specdrivr

Thanks for contributing to Specdrivr. This guide covers the human contribution
workflow; `AGENTS.md` is the canonical engineering contract for coding agents.

## Before you start

- Search existing issues and pull requests before proposing work.
- Report vulnerabilities privately according to [SECURITY.md](SECURITY.md).
- Read `AGENTS.md`, `documentation/PRODUCT_MAP.md`, and the relevant module
  documentation before changing behavior.
- For local setup and code conventions, read
  `documentation/infrastructure/DEVELOPMENT.md` and
  `documentation/infrastructure/CODING_PATTERNS.md`.

## Set up the project

Use the Node version in `.nvmrc` and pnpm only.

```bash
nvm use
pnpm install --frozen-lockfile
cp .env.example .env
docker compose up -d
pnpm db:migrate
```

Never commit local environment files or credentials. Validate all new
environment variables through the project's Zod-based environment layer.

## Make a change

1. Fork the repository and create a focused branch from `main`.
2. Follow the repository, server/client boundary, validation, logging, styling,
   and testing rules in `AGENTS.md`.
3. Add or update tests for behavior changes.
4. Update canonical documentation when a workflow, API, schema, or architectural
   decision changes.
5. For database changes, run `pnpm db:generate` and inspect the generated
   migration. Never use `db:push` and never hand-edit generated migrations.

## Validate the change

Run the checks relevant to the change, including the full baseline before
requesting review:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Run `pnpm test:e2e` for user flows and `pnpm audit` when dependencies change.
Do not bypass Husky hooks without documenting the root cause and justification.

## Commits and pull requests

Use Conventional Commits, for example `fix(auth): reject expired sessions`.
Keep each pull request focused and include:

- what changed and why;
- user-visible, database, security, and deployment impact;
- tests and manual checks performed;
- screenshots for visual changes; and
- migration, rollout, or rollback notes when applicable.

All checks must pass and review findings must be resolved before merge. By
participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
