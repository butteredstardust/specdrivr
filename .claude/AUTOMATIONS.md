# Claude Code Automations for Specdrivr

This document describes all Claude Code automations configured for the project.

**Last Updated:** 2026-03-14

---

## Quick Reference

| Category        | Name                 | Status        | Invocation                                |
| --------------- | -------------------- | ------------- | ----------------------------------------- |
| **MCP Servers** | context7             | ✅ Configured | Auto (no action needed)                   |
| **MCP Servers** | Playwright           | ✅ Configured | Auto (no action needed)                   |
| **Skills**      | create-migration     | ✅ Ready      | User-only: `/create-migration`            |
| **Skills**      | hook-violation-fixer | ✅ Ready      | Both: `/hook-violation-fixer`             |
| **Hooks**       | Auto-format on edit  | ✅ Active     | Auto (PostToolUse on Edit/Write)          |
| **Hooks**       | Block .env edits     | ✅ Active     | Auto (PreToolUse on Edit)                 |
| **Agents**      | code-reviewer        | ✅ Ready      | User: `claude agent code-reviewer "..."`  |
| **Agents**      | api-documenter       | ✅ Ready      | User: `claude agent api-documenter "..."` |

---

## 🔌 MCP Servers

### context7

**What it does:** Live documentation lookup for your stack libraries
**Why it's here:** Your stack uses Next.js 16, React 19, Drizzle, Zod, better-auth
**How to use:** When fixing code, Claude can fetch authoritative docs inline
**Configuration:** `.claude/claude.json` → `mcpServers.context7`

**Example Use Case:**

```
You: "Fix the useEffect violation in notification-bell"
Claude: [Uses context7 to fetch Next.js 16 RSC patterns]
Claude: "RSC recommends removing useEffect and using Server Components..."
```

### Playwright (Already Configured)

**What it does:** Browser automation and testing
**Why it's here:** Verify UI behavior in real browser without manual testing
**How to use:** Claude can test pages, forms, and flows directly
**Configuration:** `.claude/claude.json` → `mcpServers.playwright`

---

## 🎯 Skills

### create-migration

**What it does:** Guides Drizzle ORM migration workflow with validation
**Why it's here:** Your migrations are critical; prevent enum mismatches and data issues
**How to use:**

```bash
# After changing schema in src/db/schema.ts
/create-migration
```

**Includes:**

- ✓ Pre-generation schema review checklist
- ✓ SQL validation steps
- ✓ Common mistakes reference
- ✓ Testing workflow
- ✓ CI integration notes

**Location:** `.claude/skills/create-migration/SKILL.md`

### hook-violation-fixer

**What it does:** Structured remediation for all 15 pre-push hook violations
**Why it's here:** Your 15-check hook system is strict; this skill provides exact fix patterns
**How to use:**

```bash
# When a hook violation is caught
/hook-violation-fixer

# Then follow the section for your violation type
# Copy the exact pattern from BEFORE/AFTER examples
```

**Covers:**

- ✓ useEffect for data fetching → Server Components
- ✓ process.env access → @/lib/env wrapper
- ✓ Server Actions missing 'use server' → add directive
- ✓ Server Actions missing auth() → add auth check
- ✓ Client components importing repositories → refactor to Server Actions
- ✓ Hardcoded colors → CSS variable tokens
- ✓ XSS unsafe dangerouslySetInnerHTML → DOMPurify.sanitize()
- ✓ Unoptimized images → next/image
- ✓ Forms without Zod/React Hook Form → add validation
- ✓ 5 other checks with fix patterns

**Location:** `.claude/skills/hook-violation-fixer/SKILL.md`

---

## ⚡ Hooks

### AutoFormat on Edit

**What it does:** Automatically runs prettier + eslint --fix after every file edit
**Why it's here:** Eliminate "fix linting errors" round-trips; keep code clean
**How it works:**

```
Edit file → pnpm format && pnpm lint --fix → Done
```

**Configuration:** `.claude/settings.json` → `hooks.postToolUse`

### Block .env Edits

**What it does:** Prevents Claude from editing `.env` files (security)
**Why it's here:** Your pre-push hook already blocks commits; this adds CLI protection
**How it works:**

```
Attempt to edit .env → Hook blocks → Error message
```

**Configuration:** `.claude/settings.json` → `hooks.preToolUse`

---

## 🤖 Agents

### code-reviewer

**What it does:** Reviews staged changes against your 15 architectural rules
**Why it's here:** Catch violations BEFORE pre-push hooks; faster feedback loop
**How to use:**

```bash
# After staging changes
git add src/components/my-component.tsx src/actions/my-action.ts

# Run review
claude agent code-reviewer "Review staged changes"

# Output shows violations + fix suggestions from hook-violation-fixer skill
```

**Checks:**

- ✓ Server actions have 'use server' + auth()
- ✓ Client components don't import repositories
- ✓ Forms use Zod + React Hook Form
- ✓ No hardcoded hex colors
- ✓ No raw <img> tags
- ✓ dangerouslySetInnerHTML is sanitized
- ✓ process.env usage is correct
- ✓ And 8 more rules from AGENTS.md

**Location:** `.claude/agents/code-reviewer.md`

### api-documenter

**What it does:** Generates OpenAPI 3.1 spec from your 44+ API routes
**Why it's here:** Keep API documentation in sync without manual maintenance
**How to use:**

```bash
# After adding new API route
touch src/app/api/v1/my-endpoint/route.ts
# ... implement handler ...

# Generate docs
claude agent api-documenter "Add my-endpoint to OpenAPI spec"

# Verify
cat openapi.json | grep "my-endpoint"

# Commit
git add openapi.json
```

**Output:**

- `openapi.json` — Swagger/Redoc compatible
- Supports Swagger UI, API portals, client SDK generation
- Auto-inferred from code + JSDoc comments

**Location:** `.claude/agents/api-documenter.md`

---

## Configuration Files

### `.claude/claude.json`

Added MCP server:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"]
    }
    // ... other servers ...
  }
}
```

### `.claude/settings.json` (NEW)

Created with hooks and permissions:

```json
{
  "hooks": {
    "postToolUse": {
      "Edit": "pnpm format && pnpm lint --fix",
      "Write": "pnpm format && pnpm lint --fix"
    },
    "preToolUse": {
      "Edit": {
        "description": "Block edits to .env files",
        "condition": "if echo '{file}' | grep -qE '\\.env(\\..*)?$' && ! echo '{file}' | grep -q '\\.env\\.example$'; then exit 1; fi"
      }
    }
  }
}
```

### `.claude/skills/` (NEW)

Added two skills:

- `create-migration/SKILL.md`
- `hook-violation-fixer/SKILL.md`

### `.claude/agents/` (UPDATED)

Added two agents:

- `code-reviewer.md`
- `api-documenter.md`

---

## Recommended Workflows

### 1. Daily Development

```bash
# Make changes
vim src/components/new-feature.tsx

# Stage
git add .

# Pre-push review (catches issues early)
claude agent code-reviewer "Review before push"

# Fix any issues
vim src/components/new-feature.tsx

# Format & commit
git commit -m "feat: add new feature"

# Push (hooks will pass)
git push
```

### 2. Database Schema Changes

```bash
# Modify schema
vim src/db/schema.ts

# Generate migration with validation
/create-migration

# Review SQL
cat drizzle/migrations/[timestamp]_*.sql

# Apply locally
pnpm db:migrate

# Commit
git add drizzle/migrations/
git commit -m "migration: [description]"
```

### 3. API Endpoint Addition

```bash
# Create route
touch src/app/api/v1/new-endpoint/route.ts
# ... implement ...

# Generate documentation
claude agent api-documenter "Add new-endpoint"

# Commit both
git add src/app/api/v1/new-endpoint/ openapi.json
git commit -m "api: add new-endpoint with docs"
```

### 4. Fixing Hook Violations

```bash
# Hit pre-push error
git push
# ❌ Error: useEffect for data fetching detected

# Use fixer skill
/hook-violation-fixer

# Follow the pattern
# (e.g., convert to Server Component)

# Commit fix
git add src/components/fixed-component.tsx
git commit -m "fix: replace useEffect with Server Component"

# Re-push
git push
# ✅ Success
```

---

## Troubleshooting

### Hooks Not Running

Check if `pnpm format` and `pnpm lint` are working:

```bash
pnpm format
pnpm lint --fix
```

If they fail locally, hooks won't work either.

### MCP Server Not Found

If context7 fails to load:

```bash
npx -y @context7/mcp-server --help
```

If that fails, restart Claude Code.

### Agent Not Responding

Agents are independent processes. If one fails:

```bash
# Check logs
claude agent code-reviewer "Test agent"

# Restart
# Quit Claude Code and restart
```

### Skills Not Showing Up

Skills in `.claude/skills/*/SKILL.md` should appear in `/` autocomplete:

```bash
# Type: /
# Should see: create-migration, hook-violation-fixer
```

If not visible, restart Claude Code.

---

## Next Steps

1. **Enable the automations:**
   - `context7` — Already configured in `claude.json`
   - Hooks — Already configured in `settings.json`
   - Skills — Already available in `.claude/skills/`
   - Agents — Already available in `.claude/agents/`

2. **Test them:**
   - Try `/hook-violation-fixer` to see the skill in action
   - Run `claude agent code-reviewer "test"` to verify agent setup
   - Try creating a migration to test `/create-migration`

3. **Integrate into team workflow:**
   - Update `DEVELOPMENT.md` to mention these automations
   - Add pre-push checklist to PR template
   - Share agent commands with team

4. **Monitor and improve:**
   - Track which violations are most common
   - Refine hook checks if needed
   - Add more agents as patterns emerge

---

## Related Documentation

- **AGENTS.md** — Architectural rules (source of all hook checks)
- **CLAUDE.md** — AI-specific constraints
- **documentation/DEVELOPMENT.md** — Local setup guide
- `.claude/settings.json` — Hook configuration
- `.husky/pre-push` → `scripts/hooks/prepush.sh` — Hook orchestration

---

**All automations are ready to use. Start with `/hook-violation-fixer` to explore!**
