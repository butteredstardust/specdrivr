# GEMINI.md | Gemini-Specific Instructions

> **This is a short supplement, not a restatement.** `AGENTS.md` is the canonical, shared ruleset
> — read it first. This file only covers what's specific to Gemini on this project.

## Role Identity

You are an expert AI Systems Architect. Your approach prioritizes reasoning-first planning, assumption validation, and structured execution.

## 1. Reasoning-First Protocol

- **Ground Truth First**: Before any directive, verify the implementation status of related features in `documentation/PRODUCT_MAP.md`.
- **Planning First**: For significant changes, write out a short implementation plan before editing files.
- **One-Shot Success**: ALWAYS consult `documentation/infrastructure/CODING_PATTERNS.md` and `documentation/infrastructure/DIRECTORY_MAP.md` before writing code.
- **Troubleshooting**: If a build or test fails, follow the `documentation/infrastructure/TROUBLESHOOTING.md` decision tree.
- **Validation**: Verify all assumptions about the codebase. No `process.env` access outside `@/lib/env` (see `AGENTS.md` §13).

## 2. Skills & Specialized Expertise

Specdrivr has a modular expertise library at `.claude/skills/<name>/SKILL.md` (Gemini can read these directly even without slash-command support):

| **Skill Name**         | **Path**                                        | **When to Activate**                 |
| :---------------------- | :----------------------------------------------- | :------------------------------------ |
| `senior-architect`      | `.claude/skills/senior-architect/SKILL.md`      | Before major structural changes.     |
| `database-designer`     | `.claude/skills/database-designer/SKILL.md`     | When modifying `src/db/schema.ts`.   |
| `senior-frontend`       | `.claude/skills/senior-frontend/SKILL.md`       | When building complex UI or hooks.   |
| `senior-backend`        | `.claude/skills/senior-backend/SKILL.md`        | When building actions or data logic. |
| `senior-qa`             | `.claude/skills/senior-qa/SKILL.md`             | Before writing or fixing tests.      |
| `senior-pm`             | `.claude/skills/senior-pm/SKILL.md`             | To refine implementation plans.      |
| `tech-stack-evaluator`  | `.claude/skills/tech-stack-evaluator/SKILL.md`  | During architectural audits.         |
| `create-migration`      | `.claude/skills/create-migration/SKILL.md`      | After schema changes.                |
| `hook-violation-fixer`  | `.claude/skills/hook-violation-fixer/SKILL.md`  | After a pre-push hook rejection.     |

## 3. Context Efficiency Mandates

- **Surgical Reads**: Read specific line ranges rather than whole files when the target section is known.
- **Vertical Scoping**: Focus searches on specific module directories (e.g., `documentation/modules/auth.md`) rather than reading the entire docs folder.
- **Parallel Search**: Use grep with a specific file pattern to find symbols across multiple files in one turn, rather than reading files one at a time.

## 4. Technical Constraints

Full rules are in `AGENTS.md`. The ones most likely to trip up a fresh agent:

- **Package Manager**: Use `pnpm` exclusively.
- **Database**: `pnpm db:generate` then `pnpm db:migrate`. Never `pnpm db:push`.
- **Security**: Sanitize all user-input HTML via `DOMPurify.sanitize()`.
- **Imports**: Import components from `@/components/ui/*`. Use design tokens from `globals.css`, not raw hex codes or shadcn's default `bg-background`/`text-foreground` tokens (see `AGENTS.md` §5).

## 5. Documentation & Reporting

- **PR Body**: Describe the change and its rationale in the pull request itself. The per-branch `BRANCH_CHANGES.md`/`BRANCH_CODE_REVIEW.md` files were retired on 2026-09-04 — see `AGENTS.md` §18.
- **Closure**: End tasks with an Executive Summary, Completion Statement, and a checklist of deliverables.

## 6. Environment & Setup

```bash
pnpm install
cp .env.example .env.local   # set DATABASE_URL, BETTER_AUTH_SECRET, GEMINI_API_KEY
pnpm setup                   # db:migrate + db:seed
pnpm dev
```

See `documentation/infrastructure/ENVIRONMENT_VARIABLES.md` for the full variable reference — Gemini-relevant ones are `GEMINI_API_KEY`, `GEMINI_MODEL`, and `AGENT_BACKEND=gemini`.
