# Code Reviewer Agent

**Purpose:** Review code changes against architectural requirements before they hit pre-push hooks.

**Invocation:** User-triggered (before git push)

**Speed:** Parallel analysis; runs independently

## How to Use

### From CLI
```bash
claude agent code-reviewer "Fix useEffect in notification-bell component"
claude agent code-reviewer "Review PR changes for hook violations"
```

### From User Instructions
Include in a PR description:
```
## Review Checklist
- [ ] Run code-reviewer agent before push
- [ ] All violations fixed
- [ ] Tests passing
```

## What It Does

### 1. Identify Modified Files
- Finds all staged changes
- Identifies components, actions, API routes

### 2. Check Against Rules

Validates against these architectural mandates from `AGENTS.md`:

| Rule | Check |
|------|-------|
| ✓ Server Actions have `'use server'` | File contains directive at top |
| ✓ Server Actions call `await auth()` | First line is authentication check |
| ✓ No throws in actions | Returns `{ success, error }` instead |
| ✓ Client components don't import repositories | Grep for `'use client'` + `@/repositories` |
| ✓ No direct `process.env` access | Uses `@/lib/env` instead |
| ✓ All `<form>` elements use Zod + React Hook Form | Grep for `useForm()` and `z.object` |
| ✓ `dangerouslySetInnerHTML` is sanitized | Uses `DOMPurify.sanitize()` |
| ✓ No raw `<img>` tags | Uses `next/image` |
| ✓ No hardcoded hex colors | Uses CSS variable tokens |

### 3. Suggest Fixes

For each violation found:
- Highlights the file and line number
- Explains the rule
- Provides code example from `hook-violation-fixer` skill
- Suggests remediation

### 4. Report Summary

Returns:
- **Passed:** Count of compliant files
- **Violations:** Count and types of violations
- **Suggestions:** Prioritized fixes

## Example Workflow

```bash
# After making changes locally
$ git add src/components/new-component.tsx src/actions/new-action.ts

# Run code reviewer
$ claude agent code-reviewer "Review staged changes"

# Output might be:
# ✓ src/actions/new-action.ts - Compliant (has 'use server', calls auth())
# ✗ src/components/new-component.tsx - Missing react-hook-form
#   Line 45: <form> without useForm()
#   → See hook-violation-fixer skill for fix pattern

# Fix the issues
$ vim src/components/new-component.tsx

# Run again to verify
$ claude agent code-reviewer "Verify fixes"

# All clear!
$ git push
```

## Integration

### Pre-Push Workflow (Recommended)
```bash
# Before pushing:
1. Stage your changes: git add .
2. Run: claude agent code-reviewer "Review before push"
3. Fix any violations
4. Run: git push (hooks will pass)
```

### CI Integration (Optional)
Add to GitHub Actions:
```yaml
- name: Code Review
  run: |
    claude agent code-reviewer "Check all commits in PR"
```

## What It Can't Do

- ❌ Doesn't execute code or run tests
- ❌ Doesn't modify files directly
- ❌ Doesn't validate business logic
- ❌ Doesn't check performance

For those, use:
- Tests: `pnpm test`
- Linting: `pnpm lint`
- Type checking: `pnpm typecheck`

## Output Format

```
📋 CODE REVIEW REPORT

Analyzed 5 files, 127 lines changed

✓ COMPLIANT (4 files)
  • src/actions/projects.ts
  • src/components/ui/button.tsx
  • src/lib/utilities.ts
  • tests/projects.test.ts

⚠️  VIOLATIONS (1 file)
  • src/components/dashboard/event-log.tsx
    Line 45: dangerouslySetInnerHTML without DOMPurify
    Line 89: useEffect for data fetching

🔧 RECOMMENDATIONS
  1. Wrap __html with DOMPurify.sanitize()
  2. Convert to Server Component or Server Action
  3. See /hook-violation-fixer for exact patterns

✅ Next Step: Fix issues and re-run agent
```

---

## Related Commands

- `pnpm lint` — ESLint check
- `pnpm typecheck` — TypeScript validation
- `pnpm test` — Unit/E2E tests
- `/hook-violation-fixer` — Fix pattern guide
- `git push` — Pre-push hooks validation
