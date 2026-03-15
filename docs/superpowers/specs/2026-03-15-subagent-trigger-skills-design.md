# Design: Subagent Trigger Skills

**Date:** 2026-03-15
**Status:** Approved

## Problem

The project has 24 specialized Claude Code subagents in `.claude/agents/`. They are not being invoked proactively — Claude must be explicitly asked to run them. This means audit coverage is inconsistent and depends on the user remembering to ask.

## Goal

Create Superpowers skills that trigger subagent dispatch automatically, based on what work was just done.

## Approach

**Hybrid: file-pattern cluster skills + always-on pre-commit singletons.**

- Cluster skills fire when Claude recognizes it just touched files in a specific domain. Each skill dispatches the relevant subagents for that domain.
- One singleton skill (`before-commit`) always fires before any commit — it runs `secret-scanner` and `architecture-drift-detector` regardless of what changed.

## Skill Placement

Skills go in `~/.claude/skills/` (user-scoped, available across all projects). This is the standard Superpowers user skill directory. If `writing-skills` returns a different path at implementation time, that path takes precedence.

## Skill Format

Each skill file uses Superpowers frontmatter format:

```markdown
---
name: skill-name
description: One-line trigger description used by the 1% rule
type: project  # or user
---

# Skill Name

TRIGGER WHEN: <precise condition>

## What to do

Dispatch the following subagents in parallel using the Agent tool:
...
```

Frontmatter fields required: `name`, `description`. Do not include `type` — user-scoped skills omit it. The `description` is what Claude reads when evaluating whether a skill applies (the 1% rule check).

## Skills to Create (6 total)

### Cluster Skills (file-pattern triggered)

#### `db-work`
- **Trigger files:** `drizzle/migrations/`, `src/db/schema.ts`, `src/repositories/**`
- **Dispatches (parallel):** `migration-reviewer`, `drizzle-orm-auditor`, `postgresql-performance-auditor`
- **Prompt template:** `"Audit the recently modified database files for migration safety, ORM query correctness, and PostgreSQL performance. Focus on files changed in the current session."`

#### `auth-work`
- **Trigger files:** `src/lib/auth.ts`, `src/lib/rbac.ts`, `src/actions/**`, any file containing `await auth()` or `requireMember`
- **Dispatches (parallel):** `rbac-auditor`, `betterauth-auditor`
- **Prompt template:** `"Audit the recently modified auth and RBAC code for security correctness and BetterAuth implementation compliance."`

#### `frontend-work`
- **Trigger files:** `src/components/**`, `src/app/**/page.tsx`, `src/app/**/layout.tsx`, `*.module.css`
- **Dispatches (parallel):** `react-19-best-practices`, `shadcn-ui-auditor`, `tailwind-css-variables-auditor`, `responsive-design-checker`
- **Prompt template:** `"Audit the recently modified frontend files for React 19 patterns, shadcn/ui usage, Tailwind design token consistency, and responsive design correctness."`

#### `api-work`
- **Trigger files:** `src/app/api/**`, `src/lib/schemas.ts`, `src/middleware.ts`, any file with `z.object(` changes, `nuqs` imports
- **Dispatches (parallel):** `zod-schema-validator`, `nextjs-16-optimizer`, `nuqs-router-auditor`
- **Prompt template:** `"Audit the recently modified API routes and schemas for Zod correctness, Next.js 16 App Router compliance, and nuqs URL state management patterns."`

#### `test-work`
- **Trigger files:** `**/*.test.ts`, `**/*.spec.ts`, `**/*.e2e.ts`, `tests/**`, `e2e/**`
- **Dispatches (serial — one auditor):** `vitest-playwright-auditor`
- **Prompt template:** `"Audit the recently modified test files for Vitest unit test coverage quality and Playwright E2E test correctness."`

### Singleton Skill (pre-commit, always-on)

#### `before-commit`
- **Trigger:** Any time Claude is about to run a `git commit` command
- **Dispatches (parallel):** `secret-scanner`, `architecture-drift-detector`
- **Prompt template for secret-scanner:** `"Scan all staged files for hardcoded secrets, API keys, and credentials. Report any findings immediately."`
- **Prompt template for architecture-drift-detector:** `"Check staged files for Repository Pattern violations, Server/Client boundary issues, and AGENTS.md mandate compliance."`

## Subagent Inventory Reconciliation

All 24 subagents accounted for:

| Subagent | Disposition |
|----------|-------------|
| migration-reviewer | `db-work` cluster |
| drizzle-orm-auditor | `db-work` cluster |
| postgresql-performance-auditor | `db-work` cluster |
| rbac-auditor | `auth-work` cluster |
| betterauth-auditor | `auth-work` cluster |
| react-19-best-practices | `frontend-work` cluster |
| shadcn-ui-auditor | `frontend-work` cluster |
| tailwind-css-variables-auditor | `frontend-work` cluster |
| responsive-design-checker | `frontend-work` cluster |
| zod-schema-validator | `api-work` cluster |
| nextjs-16-optimizer | `api-work` cluster |
| nuqs-router-auditor | `api-work` cluster |
| vitest-playwright-auditor | `test-work` cluster |
| secret-scanner | `before-commit` singleton |
| architecture-drift-detector | `before-commit` singleton |
| typescript-strict-mode-advisor | Out of scope — invoke on demand (no reliable file trigger; fires on any `.ts` change which is too broad) |
| redis-cache-optimizer | Out of scope — invoke on demand (infrastructure-specific, rarely changes) |
| dependency-auditor | Out of scope — invoke on demand (runs on `package.json` changes; user installs packages explicitly) |
| fullstack-developer | Out of scope — worker agent, not an auditor |
| devops-engineer | Out of scope — worker agent, not an auditor |
| product-manager | Out of scope — worker agent, not an auditor |
| agent-installer | Out of scope — utility agent, not an auditor |
| api-documenter | Out of scope — triggered separately after API work |
| code-reviewer | Out of scope — triggered by PR/commit review workflow |

## Trigger Matching Rules

Claude determines whether a cluster skill applies by checking what files it **just wrote, edited, or created** in the current task using tool call history (Write, Edit, Bash output for file operations). The trigger is satisfied if **any** file touched matches the trigger pattern for a cluster.

If multiple clusters fire simultaneously (e.g., a task touched both migrations and components), each cluster dispatches its subagents **independently and in parallel**. Results are reported separately per cluster.

## Subagent Context Injection

When dispatching a subagent, the skill instructs Claude to prepend the list of modified files to the prompt:

```
Files modified in this session: [list from tool call history]

<prompt template>
```

For `before-commit`, "staged files" means the output of `git diff --cached --name-only`— the skill instructs Claude to run this command and inject the result.

## Blocking Behavior

- **`before-commit`:** Blocking. If `secret-scanner` finds a secret, Claude **must stop and report to the user before committing**. For `architecture-drift-detector`, the subagent itself classifies severity (Critical / High / Medium / Low). Critical or High findings block the commit and require user acknowledgement; Medium/Low are reported inline but do not block.
- **Cluster skills:** Non-blocking. Auditor results are shown as a summary report after the main task completes. The user decides whether to act on findings before committing.

## Report Format

Auditor results are surfaced as a brief inline summary:

```
[db-work audit] migration-reviewer: ✓ safe | drizzle-orm-auditor: ⚠ 1 issue | postgresql-performance-auditor: ✓ ok
  → drizzle-orm-auditor: Missing index on `agent_events.spec_id` — consider adding before deploy.
```

Full auditor output is available if the user asks. The summary is always shown.

## Deduplication

"Current session" means the current conversation window. If a cluster skill already ran at any point during the conversation, `before-commit` does not re-dispatch those same auditors. `before-commit` only dispatches `secret-scanner` and `architecture-drift-detector` — neither of which belongs to any cluster — so there is no overlap to deduplicate in practice.
