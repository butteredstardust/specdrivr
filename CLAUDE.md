# Claude-specific instructions

Read [AGENTS.md](AGENTS.md) first. This file contains only Claude Code instructions.

## Skills

Use the matching skill for complex work.

- Architecture: `.claude/skills/senior-architect/SKILL.md`
- Frontend: `.claude/skills/senior-frontend/SKILL.md`
- Backend: `.claude/skills/senior-backend/SKILL.md`
- QA and testing: `.claude/skills/senior-qa/SKILL.md`
- Database: `.claude/skills/database-designer/SKILL.md`
- Stack auditing: `.claude/skills/tech-stack-evaluator/SKILL.md`
- Project planning: `.claude/skills/senior-pm/SKILL.md`
- Roadmaps: `.claude/skills/roadmap-communicator/SKILL.md`
- Migrations: `.claude/skills/create-migration/SKILL.md`
- Hook fixes: `.claude/skills/hook-violation-fixer/SKILL.md`
- Test generation: `.claude/skills/gen-test/SKILL.md`
- Components: `.claude/skills/new-component/SKILL.md`

Use `/create-migration` after changing `src/db/schema.ts`.

Use `/hook-violation-fixer` after a pre-push hook rejects a change.

## Subagents

Use an existing subagent from `.claude/agents/` when its specialization matches the task.

## Setup

Read `.env.example` and [environment variables](documentation/infrastructure/ENVIRONMENT_VARIABLES.md) before setup.

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://specdrivr:specdrivr_password@localhost:5432/specdrivr"
```

```bash
pnpm install
pnpm setup    # runs db:migrate then db:seed
pnpm dev
```

## MCP servers

Use `.mcp.json` as the only MCP configuration. It configures `filesystem`, `git`, `memory`, and `postgres`.

Add required servers to `.mcp.json`. See `.claude/AUTOMATIONS.md`.

## Claude Code

`.claude/settings.json` runs `pnpm lint --fix` after each Edit or Write.

Put the change summary in the PR body.
