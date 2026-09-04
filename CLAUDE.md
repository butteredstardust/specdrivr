# CLAUDE.md | Claude-Specific Instructions

> **This is a short supplement, not a restatement.** `AGENTS.md` is the canonical, shared ruleset
> — read it first. This file only covers what's specific to Claude Code on this project.

## Role Identity

You are a Senior AI Architecture Engineer. Your primary directive is maintaining the integrity of the project's Repository Pattern and Type Safety.

## Project Skills

The project has a modular expertise library in `.claude/skills/<name>/SKILL.md`. Refer to these when conducting complex tasks:

- **Architecture**: `.claude/skills/senior-architect/SKILL.md`
- **Frontend**: `.claude/skills/senior-frontend/SKILL.md`
- **Backend**: `.claude/skills/senior-backend/SKILL.md`
- **QA & Testing**: `.claude/skills/senior-qa/SKILL.md`
- **Database**: `.claude/skills/database-designer/SKILL.md`
- **Stack Auditing**: `.claude/skills/tech-stack-evaluator/SKILL.md`
- **Project Planning**: `.claude/skills/senior-pm/SKILL.md`
- **Roadmapping**: `.claude/skills/roadmap-communicator/SKILL.md`
- **Migrations**: `.claude/skills/create-migration/SKILL.md`
- **Hook fixes**: `.claude/skills/hook-violation-fixer/SKILL.md`
- **Test generation**: `.claude/skills/gen-test/SKILL.md`
- **New components**: `.claude/skills/new-component/SKILL.md`

Two skills are wired to slash commands:

### `/create-migration`

**When to use:** After modifying `src/db/schema.ts`

- Validates schema changes before migration generation
- Prevents enum mismatches and data loss
- Guides SQL review and testing workflow

### `/hook-violation-fixer`

**When to use:** After pre-push hook rejection

- Provides fix patterns for the modular checks in `scripts/hooks/checks/`
- Covers: useEffect→RSC, process.env→env wrapper, missing auth checks, etc.
- Copy-paste ready BEFORE/AFTER examples

## Claude Code Subagents

The project includes 29 specialized Claude Code subagents in `.claude/agents/`, covering areas such as architecture drift, RBAC, Drizzle ORM, security review, and Next.js/React best-practice audits. Prefer an existing subagent over ad-hoc analysis when a task matches one. See `.claude/agents/*.md` for the full list — a few examples:

- **Fullstack**: `.claude/agents/fullstack-developer.md`
- **DevOps**: `.claude/agents/devops-engineer.md`
- **Product Manager**: `.claude/agents/product-manager.md`
- **Security review**: `.claude/agents/security-reviewer.md`

## Architectural Mandates (Claude-specific emphasis)

All rules live in `AGENTS.md`. Claude should additionally:

- **Ground Truth First**: Before any directive, verify feature implementation status in `documentation/PRODUCT_MAP.md`.
- **One-Shot Success**: ALWAYS consult `documentation/infrastructure/CODING_PATTERNS.md` and `documentation/infrastructure/DIRECTORY_MAP.md` before writing code.
- **Troubleshooting**: If a build fails, follow the `documentation/infrastructure/TROUBLESHOOTING.md` decision tree before retrying.

## Environment & Setup

Required variables (see `.env.example` and `documentation/infrastructure/ENVIRONMENT_VARIABLES.md` for the full list):

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://specdrivr:specdrivr_password@localhost:5432/specdrivr"
```

Initial setup:

```bash
pnpm install
pnpm setup    # runs db:migrate then db:seed
pnpm dev
```

## MCP Servers

`.mcp.json` configures 4 MCP servers: `filesystem`, `git`, `memory`, and `postgres`. No configuration action is needed — they're available automatically.

`.mcp.json` is the single source of truth. A second, unused `.claude/claude.json` declaring eight servers was removed — Claude Code does not load that path, so those servers were never active. If you want any of them (`playwright`, `vitest`, `context7`, `shadcn`, `docker`, `next-devtools`), add them to `.mcp.json`. See `.claude/AUTOMATIONS.md`.

## Additional Claude-only Notes

- **Auto-format hook**: `.claude/settings.json` runs `pnpm lint --fix` automatically after every Edit/Write.
- **No branch reports**: `BRANCH_CHANGES.md` / `BRANCH_CODE_REVIEW.md` were retired on 2026-09-04. Put the change summary in the PR body instead.
