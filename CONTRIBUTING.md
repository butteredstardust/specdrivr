# Contributing to Specdrivr

Follow these rules when you contribute. They keep the project consistent and safe.

## Git Workflow

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Read `AGENTS.md`. Then work with your preferred AI agent.
4. Run `pnpm lint` and `pnpm test` locally.
5. Create a Pull Request against `main`.

## Engineering Mandates

- **Package Manager**: Use `pnpm` exclusively.
- **Database**: Run `pnpm db:generate` and `pnpm db:migrate` for every schema change. Never run `db:push`.
- **Commits**: Follow Conventional Commits.
- **Bypass protocol**: Do not bypass Husky hooks (`--no-verify`) without a Root Cause Analysis (RCA) in the PR description.

## Pull Requests

- Describe what changed and why in the PR body; call out anything needing manual review.
- Ensure all CI checks pass.
