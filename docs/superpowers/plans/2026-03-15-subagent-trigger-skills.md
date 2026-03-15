# Subagent Trigger Skills Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create 6 Superpowers skills in `~/.claude/skills/` that automatically dispatch the project's specialized subagents based on what files were just modified.

**Architecture:** Each skill is a SKILL.md file with precise frontmatter that the Superpowers 1% rule evaluates. Five cluster skills fire based on file-pattern recognition; one singleton fires before every git commit. All skills use the Agent tool to dispatch subagents in parallel with the list of modified files injected as context.

**Tech Stack:** Superpowers skills format, Claude Code Agent tool, project subagents in `.claude/agents/`

**Spec:** `docs/superpowers/specs/2026-03-15-subagent-trigger-skills-design.md`

---

## File Map

| Action | Path |
|--------|------|
| Create | `~/.claude/skills/before-commit/SKILL.md` |
| Create | `~/.claude/skills/db-work/SKILL.md` |
| Create | `~/.claude/skills/auth-work/SKILL.md` |
| Create | `~/.claude/skills/frontend-work/SKILL.md` |
| Create | `~/.claude/skills/api-work/SKILL.md` |
| Create | `~/.claude/skills/test-work/SKILL.md` |

All files are user-scoped (`~/.claude/skills/`) — not project-scoped — so they apply across all sessions.

---

## Chunk 1: before-commit and db-work skills

### Task 1: Create `before-commit` skill

The most critical skill. Fires before every git commit, dispatching `secret-scanner` and `architecture-drift-detector` on staged files. Blocking: secrets or Critical/High arch violations must halt the commit.

**Files:**
- Create: `~/.claude/skills/before-commit/SKILL.md`

- [ ] **Step 1.1: Create the skills directory**

```bash
mkdir -p ~/.claude/skills/before-commit
```

- [ ] **Step 1.2: Write the skill file**

> Note: The SKILL.md content below itself contains triple-backtick fences for prompt templates. When writing the file, these are literal content — they are not nested fences relative to the plan's code block. Write the file exactly as shown.

Write `~/.claude/skills/before-commit/SKILL.md` with this exact content (use the Write tool or a heredoc):

```
---
name: before-commit
description: Use when about to create a git commit — scans staged files for secrets and architecture violations before the commit is executed
---

# Before-Commit Security & Architecture Check

Run before every git commit, without exception.

## What to Do

1. Run this command and note the output:

   git diff --cached --name-only

2. Dispatch **in parallel** using the Agent tool, substituting the actual staged file list into each prompt:

**secret-scanner** — prompt:
   Staged files: [insert output of git diff --cached --name-only]

   Scan these staged files for hardcoded secrets, API keys, and credentials. Report any findings immediately.

**architecture-drift-detector** — prompt:
   Staged files: [insert output of git diff --cached --name-only]

   Check these staged files for Repository Pattern violations, Server/Client boundary issues, and AGENTS.md mandate compliance.

## Blocking Rules

- **Secret found** → STOP. Do not commit. Report to user immediately.
- **Critical or High architecture violation** → STOP. Report to user. Ask how to proceed before committing.
- **Medium/Low findings** → Report inline. Proceed with commit.
```

- [ ] **Step 1.3: Verify the file was written correctly**

```bash
cat ~/.claude/skills/before-commit/SKILL.md
```

Expected: File starts with `---`, has `name: before-commit` and `description: Use when...`. No `type` field. Prompt templates use `[insert output of...]` syntax, not angle brackets.

- [ ] **Step 1.4: Check character count of description**

```bash
echo -n "Use when about to create a git commit — scans staged files for secrets and architecture violations before the commit is executed" | wc -c
```

Expected: Under 500 characters.

---

### Task 2: Create `db-work` skill

Fires after modifying migrations, schema, or repositories. Dispatches three DB auditors in parallel.

**Files:**
- Create: `~/.claude/skills/db-work/SKILL.md`

- [ ] **Step 2.1: Create the directory**

```bash
mkdir -p ~/.claude/skills/db-work
```

- [ ] **Step 2.2: Write the skill file**

> Note: Prompt templates below use `[insert list of modified files]` — this instructs Claude to substitute the actual file list at runtime.

Write `~/.claude/skills/db-work/SKILL.md` with this exact content:

```
---
name: db-work
description: Use after writing or modifying database migration files, src/db/schema.ts, or any file in src/repositories/ — audits for migration safety, ORM correctness, and PostgreSQL performance
---

# Database Work Audit

Trigger: you just wrote or edited files in drizzle/migrations/, src/db/schema.ts, or src/repositories/.

## What to Do

List the files you modified in this task (from your tool call history), then dispatch **in parallel** using the Agent tool, inserting the file list into each prompt:

**migration-reviewer** — prompt:
   Files modified: [insert list of modified files]

   Audit the recently modified database migration files for safety and correctness. Flag any irreversible operations, missing rollbacks, or data-loss risks.

**drizzle-orm-auditor** — prompt:
   Files modified: [insert list of modified files]

   Audit the recently modified Drizzle ORM queries and schema design for correctness, type safety, and best practices.

**postgresql-performance-auditor** — prompt:
   Files modified: [insert list of modified files]

   Audit the recently modified database schema and queries for missing indexes, N+1 risks, and PostgreSQL performance concerns.

## Reporting

Show a summary before proceeding:
   [db-work] migration-reviewer: OK | drizzle-orm-auditor: 1 issue | postgresql-performance-auditor: OK
   -> drizzle-orm-auditor: description of issue

Non-blocking — report results, let the user decide before committing.
```

- [ ] **Step 2.3: Verify the file**

```bash
cat ~/.claude/skills/db-work/SKILL.md
```

Expected: Frontmatter present with `name` and `description`. Three subagent dispatch instructions. Prompts use `[insert list of modified files]` syntax.

---

## Chunk 2: auth-work, frontend-work, api-work, test-work skills

### Task 3: Create `auth-work` skill

Fires after modifying auth configuration, RBAC rules, or server actions.

**Files:**
- Create: `~/.claude/skills/auth-work/SKILL.md`

- [ ] **Step 3.1: Create the directory**

```bash
mkdir -p ~/.claude/skills/auth-work
```

- [ ] **Step 3.2: Write the skill file**

Write `~/.claude/skills/auth-work/SKILL.md` with this exact content:

```
---
name: auth-work
description: Use after modifying auth configuration, RBAC rules, or server actions that call await auth() or requireMember — audits for security correctness and BetterAuth compliance
---

# Auth & RBAC Audit

Trigger: you just wrote or edited src/lib/auth.ts, src/lib/rbac.ts, files in src/actions/, or any file containing await auth() or requireMember.

## What to Do

List the files you modified in this task, then dispatch **in parallel** using the Agent tool:

**rbac-auditor** — prompt:
   Files modified: [insert list of modified files]

   Audit the recently modified auth and RBAC code for role-based access control correctness, missing permission checks, and privilege escalation risks.

**betterauth-auditor** — prompt:
   Files modified: [insert list of modified files]

   Audit the recently modified auth implementation for BetterAuth session management compliance and security best practices.

## Reporting

   [auth-work] rbac-auditor: OK | betterauth-auditor: 1 issue
   -> betterauth-auditor: description of issue

Non-blocking — report results, user decides before committing.
```

- [ ] **Step 3.3: Verify the file**

```bash
cat ~/.claude/skills/auth-work/SKILL.md
```

Expected: Frontmatter present. Two subagent dispatch blocks with prompt templates.

---

### Task 4: Create `frontend-work` skill

Fires after modifying components, pages, or layouts.

**Files:**
- Create: `~/.claude/skills/frontend-work/SKILL.md`

- [ ] **Step 4.1: Create the directory**

```bash
mkdir -p ~/.claude/skills/frontend-work
```

- [ ] **Step 4.2: Write the skill file**

Write `~/.claude/skills/frontend-work/SKILL.md` with this exact content:

```
---
name: frontend-work
description: Use after modifying files in src/components/ or Next.js page/layout files — audits React 19 patterns, shadcn/ui usage, Tailwind design tokens, and responsive design
---

# Frontend Work Audit

Trigger: you just wrote or edited files in src/components/, src/app/**/page.tsx, src/app/**/layout.tsx, or *.module.css.

## What to Do

List the files you modified in this task, then dispatch **in parallel** using the Agent tool:

**react-19-best-practices** — prompt:
   Files modified: [insert list of modified files]

   Audit the recently modified React components for React 19 patterns, concurrent features usage, and best practices.

**shadcn-ui-auditor** — prompt:
   Files modified: [insert list of modified files]

   Audit the recently modified components for correct shadcn/ui usage, component composition patterns, and design system adherence.

**tailwind-css-variables-auditor** — prompt:
   Files modified: [insert list of modified files]

   Audit the recently modified files for Tailwind CSS design token consistency — no hardcoded hex colors, correct CSS variable usage.

**responsive-design-checker** — prompt:
   Files modified: [insert list of modified files]

   Check the recently modified components across breakpoints to ensure responsive design works correctly at all screen sizes.

## Reporting

   [frontend-work] react-19: OK | shadcn: 1 issue | tailwind: OK | responsive: OK
   -> shadcn: description of issue

Non-blocking.
```

- [ ] **Step 4.3: Verify the file**

```bash
cat ~/.claude/skills/frontend-work/SKILL.md
```

Expected: Frontmatter present. Four subagent dispatch blocks.

---

### Task 5: Create `api-work` skill

Fires after modifying API routes, schemas, or Zod/nuqs usage.

**Files:**
- Create: `~/.claude/skills/api-work/SKILL.md`

- [ ] **Step 5.1: Create the directory**

```bash
mkdir -p ~/.claude/skills/api-work
```

- [ ] **Step 5.2: Write the skill file**

Write `~/.claude/skills/api-work/SKILL.md` with this exact content:

```
---
name: api-work
description: Use after modifying API route handlers in src/app/api/, Zod schemas in src/lib/schemas.ts, or files using nuqs — audits Zod correctness, Next.js 16 compliance, and URL state management
---

# API Work Audit

Trigger: you just wrote or edited files in src/app/api/, src/lib/schemas.ts, src/middleware.ts, or any file with z.object( or nuqs imports.

## What to Do

List the files you modified in this task, then dispatch **in parallel** using the Agent tool:

**zod-schema-validator** — prompt:
   Files modified: [insert list of modified files]

   Validate the recently modified Zod schemas for correctness, type safety, and best practices. Check for missing validations and improper transforms.

**nextjs-16-optimizer** — prompt:
   Files modified: [insert list of modified files]

   Audit the recently modified API routes and Next.js code for App Router patterns, Server Component usage, and Next.js 16 performance best practices.

**nuqs-router-auditor** — prompt:
   Files modified: [insert list of modified files]

   Audit the recently modified files for nuqs search parameter type safety and URL state management correctness.

## Reporting

   [api-work] zod: OK | nextjs: 1 issue | nuqs: OK
   -> nextjs: description of issue

Non-blocking.
```

- [ ] **Step 5.3: Verify the file**

```bash
cat ~/.claude/skills/api-work/SKILL.md
```

Expected: Frontmatter present. Three subagent dispatch blocks.

---

### Task 6: Create `test-work` skill

Fires after modifying test files.

**Files:**
- Create: `~/.claude/skills/test-work/SKILL.md`

- [ ] **Step 6.1: Create the directory**

```bash
mkdir -p ~/.claude/skills/test-work
```

- [ ] **Step 6.2: Write the skill file**

Write `~/.claude/skills/test-work/SKILL.md` with this exact content:

```
---
name: test-work
description: Use after writing or modifying test files (*.test.ts, *.spec.ts, *.e2e.ts) — audits Vitest unit tests and Playwright E2E tests for coverage quality and correctness
---

# Test Work Audit

Trigger: you just wrote or edited files matching **/*.test.ts, **/*.spec.ts, **/*.e2e.ts, or files in tests/ or e2e/.

## What to Do

List the test files you modified in this task, then dispatch using the Agent tool:

**vitest-playwright-auditor** — prompt:
   Files modified: [insert list of modified test files]

   Audit the recently modified test files for Vitest unit test coverage quality and Playwright E2E test correctness. Flag missing assertions, improper mocking, and gaps in coverage.

## Reporting

   [test-work] vitest-playwright-auditor: 2 issues
   -> description of issues

Non-blocking.
```

- [ ] **Step 6.3: Verify the file**

```bash
cat ~/.claude/skills/test-work/SKILL.md
```

Expected: Frontmatter present. One subagent dispatch block.

---

## Chunk 3: Final verification

### Task 7: Confirm all skills are discoverable

- [ ] **Step 7.1: List all created skill directories**

```bash
ls ~/.claude/skills/
```

Expected output includes: `before-commit`, `db-work`, `auth-work`, `frontend-work`, `api-work`, `test-work`

- [ ] **Step 7.2: Verify each SKILL.md exists**

```bash
for skill in before-commit db-work auth-work frontend-work api-work test-work; do
  echo "--- $skill ---"
  head -5 ~/.claude/skills/$skill/SKILL.md
done
```

Expected: Each file shows frontmatter with `name` and `description` fields.

- [ ] **Step 7.3: Verify no `type` field leaked into any frontmatter**

```bash
grep -r "^type:" ~/.claude/skills/before-commit ~/.claude/skills/db-work ~/.claude/skills/auth-work ~/.claude/skills/frontend-work ~/.claude/skills/api-work ~/.claude/skills/test-work
```

Expected: No output (no `type:` fields present).

- [ ] **Step 7.4: Verify all descriptions start with "Use when"**

```bash
grep "^description:" ~/.claude/skills/before-commit/SKILL.md \
  ~/.claude/skills/db-work/SKILL.md \
  ~/.claude/skills/auth-work/SKILL.md \
  ~/.claude/skills/frontend-work/SKILL.md \
  ~/.claude/skills/api-work/SKILL.md \
  ~/.claude/skills/test-work/SKILL.md
```

Expected: All 6 lines start with `description: Use when`.

- [ ] **Step 7.5: Verify Claude Code will discover these skills**

```bash
cat ~/.claude/settings.json 2>/dev/null | grep -i skill || echo "No skill path override — default ~/.claude/skills/ applies"
```

Expected: Either no override (default path applies) or the listed path includes `~/.claude/skills/`. If a different path is shown, move the skill directories to match.

- [ ] **Step 7.6: Commit the plan doc and spec to the project repo**

```bash
cd /Users/tuxgeek/Dev/specdrivr && git add docs/superpowers/plans/2026-03-15-subagent-trigger-skills.md && git commit -m "docs: add implementation plan for subagent trigger skills"
```

Expected: Commit succeeds. Note: the actual skill files live in `~/.claude/skills/` (user home) and are not committed to the project repo.
