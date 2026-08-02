# Claude Code Automations for Specdrivr

This document describes the Claude Code automations actually configured for this project: MCP servers, skills, hooks, and subagents.

---

## Quick Reference

| Category        | Name                                    | Where it lives                        |
| ---------------- | ----------------------------------------- | ----------------------------------------- |
| **MCP Servers**  | `filesystem`, `git`, `memory`, `postgres` | `.mcp.json` (4 servers)                 |
| **Skills**       | 12 skills (see below)                    | `.claude/skills/<name>/SKILL.md`        |
| **Hooks**        | Auto-format on edit                      | `.claude/settings.json` → `PostToolUse` |
| **Hooks**        | Pre-commit / pre-push                    | `.husky/pre-commit`, `.husky/pre-push` → `scripts/hooks/` |
| **Subagents**    | 29 subagents                             | `.claude/agents/*.md`                   |

> **Note:** `.claude/claude.json` also exists in this repo and defines a different, larger set of
> MCP servers (`postgres`, `memory`, `playwright`, `shadcn`, `docker`, `next-devtools`, `vitest`,
> `context7`) — some overlapping `.mcp.json` with different arguments (e.g. a different `postgres`
> connection string). It's unclear which of the two files is actually loaded by a given Claude
> Code client; `.mcp.json` is the standard project-level MCP config location, so treat it as
> authoritative unless you've confirmed otherwise for your setup. This divergence is a config
> issue, not a docs issue — flagged here rather than silently resolved.

---

## 🔌 MCP Servers (`.mcp.json`)

### `filesystem`

Read/write access to the project directory and its parent, via `@modelcontextprotocol/server-filesystem`.

### `git`

Git operations via `mcp-server-git`, scoped to this repository.

### `memory`

Persistent key-value memory via `@modelcontextprotocol/server-memory`, backed by `.mcp-memory.jsonl`.

### `postgres`

Direct read access to the Postgres database via `@modelcontextprotocol/server-postgres`, using the connection string embedded in `.mcp.json`.

---

## 🎯 Skills (`.claude/skills/`)

All 12 skills: `create-migration`, `database-designer`, `gen-test`, `hook-violation-fixer`, `new-component`, `roadmap-communicator`, `senior-architect`, `senior-backend`, `senior-frontend`, `senior-pm`, `senior-qa`, `tech-stack-evaluator`.

Two are wired to slash commands and documented in `CLAUDE.md`:

### `/create-migration`

**What it does:** Guides the Drizzle ORM migration workflow with validation.
**Why it's here:** Migrations are critical; this prevents enum mismatches and data issues.
**How to use:**

```bash
# After changing schema in src/db/schema.ts
/create-migration
```

**Location:** `.claude/skills/create-migration/SKILL.md`

### `/hook-violation-fixer`

**What it does:** Structured remediation for pre-push hook violations.
**Why it's here:** The pre-push hook system is strict; this skill provides exact fix patterns.
**How to use:**

```bash
# When a hook violation is caught
/hook-violation-fixer
```

**Location:** `.claude/skills/hook-violation-fixer/SKILL.md`

The remaining 10 skills are reference material — Claude can read them directly (e.g. `.claude/skills/senior-architect/SKILL.md`) when working in that domain; see `CLAUDE.md` for the full list.

---

## ⚡ Hooks

### Auto-format on edit

**What it does:** Runs `pnpm lint --fix` after every Edit/Write tool call.
**Configuration:** `.claude/settings.json` → `hooks.PostToolUse`.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "pnpm lint --fix", "ignoreError": true }]
      }
    ]
  }
}
```

### Git hooks (Husky)

`.husky/pre-commit` runs `pnpm lint` and `pnpm typecheck`. `.husky/pre-push` hands off to the modular orchestrator at `scripts/hooks/prepush.sh`, which runs the checks under `scripts/hooks/checks/` (including the full test suite) and verifies hook checksums via `.husky/hooks-checksum.txt`. See `AGENTS.md` §6 for the bypass protocol.

---

## 🤖 Subagents (`.claude/agents/`)

29 specialized subagents are defined as markdown files under `.claude/agents/`, covering areas such as architecture drift detection, RBAC auditing, Drizzle ORM auditing, security review, Next.js 16 / React 19 best practices, and more. Each file's frontmatter documents when it should be invoked. Browse `.claude/agents/*.md` for the full list, or see the examples called out in `CLAUDE.md`.

---

## Troubleshooting

### Hooks not running

Check `pnpm format` and `pnpm lint` work standalone first — if they fail locally, the hooks that shell out to them will fail too.

### MCP server not responding

Restart your Claude Code client; MCP servers are spawned per-session from `.mcp.json`.

### Skill not showing up in `/` autocomplete

Confirm the skill has a `.claude/skills/<name>/SKILL.md` file with valid frontmatter, then restart Claude Code.

---

## Related Documentation

- **`AGENTS.md`** — canonical architectural rules (source of all hook checks).
- **`CLAUDE.md`** — Claude-specific supplement, including the skills/subagents lists.
- **`documentation/infrastructure/DEVELOPMENT.md`** — local setup guide.
- **`.claude/settings.json`** — hook configuration.
