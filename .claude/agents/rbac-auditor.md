---
name: rbac-auditor
description: Audit role-based access control implementation across Server Actions and API routes
type: subagent
user-invocable: true
---

# RBAC Auditor Agent

**Purpose:** Ensure role-based access control (`@/lib/rbac.ts`) is correctly applied to all protected endpoints.

**Invocation:** User-triggered before deployment

**Speed:** Parallel scan; ~2 min for full codebase

## How to Use

```bash
# Full audit of all endpoints
claude agent rbac-auditor "Audit all permission checks across actions and API routes"

# Targeted audit
claude agent rbac-auditor "Check RBAC in src/actions/"
claude agent rbac-auditor "Verify permission checks on admin endpoints"
```

## What It Does

### 1. Scans All Protected Resources

Identifies endpoints that should require permission checks:

- `src/actions/*.ts` — Server Actions (mutations)
- `src/app/api/v1/**/route.ts` — API routes (data access)
- Admin endpoints (should require `requireAdmin()`)
- Member endpoints (should require `requireMember()`)

### 2. Verifies Permission Calls

Checks for:

```typescript
// ✓ CORRECT
const { allowed } = await requireAdmin(userId, projectId);
if (!allowed) return { success: false, error: { code: 'FORBIDDEN' } };

// ❌ WRONG
const admin = checkIsAdmin(userId); // Wrong function
// Missing permission check entirely
// Checking wrong resource
```

### 3. Reports Violations

**Example output:**

```
RBAC AUDIT REPORT

🔴 CRITICAL VIOLATIONS (3):
  1. src/actions/plans.ts:approvePlanAction() - Missing permission check
     Line 42: User can approve any plan without verifying membership
     → Add: await requireMember(userId, plan.spec.projectId)
     Severity: CRITICAL (allows unauthorized modifications)

  2. src/app/api/v1/projects/[id]/route.ts (DELETE) - Wrong check
     Line 89: Uses requireMember() but should be requireAdmin()
     → Fix: await requireAdmin(userId, projectId)
     Severity: CRITICAL (allows users to delete others' projects)

  3. src/app/api/v1/tasks/[id]/attempts/route.ts - Missing auth entirely
     Line 15: No await auth() or permission check
     → Add: const session = await auth()
     Severity: CRITICAL

🟡 INCONSISTENCIES (2):
  1. 12 endpoints use requireAdmin with projectId
     5 endpoints use requireMember with specId
     → Standardize pattern across codebase

  2. 3 admin endpoints missing "admin-only" comment
     → Add JSDoc: /** @requires admin */

📊 SUMMARY:
  Total endpoints: 44
  Protected: 39 (89%)
  Unprotected: 5 (11%) ← Should these be public?

  Permission checks valid: 36/39 (92%)
  Violations found: 3
  Inconsistencies: 2

RISK LEVEL: 🔴 HIGH
→ Fix critical violations before deployment
```

### 4. Suggests Fixes

For each violation, suggests exact remediation:

```typescript
// VIOLATION: Missing permission check
// BEFORE:
'use server';
export async function deleteSpecAction(formData: FormData) {
  const specId = Number(formData.get('specId'));
  await specificationRepository.delete(specId); // ❌ No auth!
  return { success: true };
}

// AFTER:
('use server');
export async function deleteSpecAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED' } };
  }

  const specId = Number(formData.get('specId'));
  const spec = await specificationRepository.getById(specId);
  if (!spec) {
    return { success: false, error: { code: 'NOT_FOUND' } };
  }

  const { allowed } = await requireMember(session.user.id, spec.projectId);
  if (!allowed) {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You must be a project member to delete specifications',
      },
    };
  }

  await specificationRepository.delete(specId);
  revalidatePath(`/specs`);
  return { success: true, data: { id: specId } };
}
```

## Integration Points

### CI/CD Pipeline

Add to pre-deployment checks:

```yaml
# .github/workflows/security.yml
- name: RBAC Audit
  run: |
    claude agent rbac-auditor "Audit all endpoints before deployment"
    # Fail if violations found
```

### Code Review Checklist

Include in PR template:

```markdown
## Security Checklist

- [ ] Run RBAC auditor: `claude agent rbac-auditor "Check my changes"`
- [ ] All permission checks verified
- [ ] No new public endpoints
```

### Local Development

Before pushing:

```bash
# Check your branch changes
claude agent rbac-auditor "Audit actions/ and api/ changes"
```

## Permission Check Reference

### `requireAdmin(userId, projectId)`

**Use for:** Actions only project admins can perform

- Delete projects
- Manage project settings
- Change project members
- View billing

**Example:**

```typescript
const { allowed } = await requireAdmin(userId, projectId);
if (!allowed) {
  return { success: false, error: { code: 'FORBIDDEN', message: 'Admin only' } };
}
```

### `requireMember(userId, projectId)`

**Use for:** Actions members can perform

- View specs
- Create tasks
- Submit attempts
- View project data

**Example:**

```typescript
const { allowed } = await requireMember(userId, projectId);
if (!allowed) {
  return { success: false, error: { code: 'FORBIDDEN', message: 'Must be project member' } };
}
```

### Public Endpoints (No check)

- Login / signup
- Accept invite (with token validation)
- Public project pages (if applicable)
- Health checks

## Common Violations & Fixes

### 1. Missing Permission Check

```
Detected: endpoint accesses project data without permission
Fixed: Added requireMember() call
```

### 2. Wrong Function

```
Detected: Used requireMember() for admin-only operation
Fixed: Changed to requireAdmin()
```

### 3. Wrong Resource ID

```
Detected: Checking permissions on wrong project
Fixed: Updated to check actual project being accessed
```

### 4. Missing Auth Call

```
Detected: No await auth() before permission checks
Fixed: Added auth() call as first line
```

## Output Format

```
RBAC AUDIT RESULTS

Category | Count | Status
---------|-------|--------
Critical | 3     | 🔴 FAIL
High     | 2     | 🟡 WARN
Medium   | 0     | ✓
Low      | 0     | ✓
Compliant| 39    | ✓ PASS

Recommendation: Fix 3 critical + 2 high before deployment
Estimated fix time: 15 minutes
```

## Related Commands

- `/hook-violation-fixer` — Fix Server Action patterns
- `pnpm lint` — Check for other violations
- `AGENTS.md §4` — RBAC reference documentation
- `src/lib/rbac.ts` — Permission implementation

## Troubleshooting

### Agent Not Finding Endpoints

Ensure files follow naming convention:

- Server Actions: `src/actions/[name].ts`
- API routes: `src/app/api/**/route.ts`

### False Positives

If agent flags legitimate public endpoints:

```typescript
// Add comment to suppress:
// @audit-ignore: public-endpoint
export async function getPublicData() { ... }
```

---

**Security is not optional. Run this audit before every deployment.**
