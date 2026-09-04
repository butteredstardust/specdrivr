# Contributing to Specdrivr

We welcome contributions! To maintain our high standard of AI-native engineering, please follow these rules.

## Git Workflow

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Code with your preferred AI agent (`AGENTS.md` is required reading).
4. Run `pnpm lint` and `pnpm test` locally.
5. Create a Pull Request against `main`.

## Engineering Mandates

- **Package Manager**: Use `pnpm` exclusively.
- **Database**: All schema changes MUST use `pnpm db:generate` and `pnpm db:migrate`. Never `db:push`.
- **Commits**: Follow Conventional Commits.
- **Bypass Protocol**: Never bypass Husky hooks (`--no-verify`) without a Root Cause Analysis (RCA) in your PR description.

## Pull Requests

- Describe what changed and why in the PR body; call out anything needing manual review.
- Ensure all CI checks pass.
