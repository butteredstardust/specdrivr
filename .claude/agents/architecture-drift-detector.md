---
name: architecture-drift-detector
description: Ensure codebase maintains Repository Pattern, Server/Client boundaries, and architectural mandates
type: subagent
user-invocable: true
---

# Architecture Drift Detector Agent

**Purpose:** Enforce architectural patterns and prevent deviation from AGENTS.md mandates.

**Invocation:** Code review or continuous monitoring

**Speed:** ~2 min for analysis

## How to Use

```bash
# Full architecture audit
claude agent architecture-drift-detector "Audit entire codebase for architectural compliance"

# Specific area
claude agent architecture-drift-detector "Check src/components/ for Repository Pattern violations"

# Check drift since last version
claude agent architecture-drift-detector "What architectural violations were introduced this quarter?"

# Targeted check
claude agent architecture-drift-detector "Verify Server/Client boundary integrity"
```

## What It Enforces

### 1. Repository Pattern

**Rule:** All database access through `src/repositories/`

```typescript
// ❌ VIOLATION: Direct db import in component
'use client';
import { db } from '@/db';

export function UserCard() {
  const user = db.select().from(users).where(...); // ← WRONG!
  return <div>{user.name}</div>;
}

// ✓ CORRECT: Use repository
'use client';
import { getUserAction } from '@/actions/users';

export function UserCard({ userId }: { userId: number }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUserAction(userId).then(result => {
      if (result.success) setUser(result.data);
    });
  }, [userId]);

  return <div>{user?.name}</div>;
}
```

### 2. Server/Client Boundary

**Rule:** Don't import Server Components into Client Components

```typescript
// ❌ VIOLATION: Server Component imported to client
'use client';
import { UserList } from './user-list'; // This is a Server Component!

export function Dashboard() {
  return <UserList />; // ← WRONG!
}

// ✓ CORRECT: Keep Server Components server-only
// user-list.tsx (NO 'use client' directive)
export async function UserList() {
  const users = await userRepository.getAll();
  return <div>{users.map(...)}</div>;
}

// dashboard.tsx
'use client';
import { UserList } from './user-list';

export function Dashboard() {
  return <UserList />; // ← OK (Server Component works in client context)
}
```

### 3. Server Actions Pattern

**Rule:** Use Server Actions for UI mutations (not Route Handlers)

```typescript
// ❌ VIOLATION: Using Route Handler for UI mutation
// src/app/api/projects/create/route.ts
export async function POST(request: NextRequest) {
  const data = await request.json();
  const project = await projectRepository.create(data);
  return NextResponse.json(project);
}

// In component:
async function handleCreate() {
  const response = await fetch('/api/projects/create', { method: 'POST' });
  // ← WRONG: Route Handler for form submission

// ✓ CORRECT: Use Server Action
// src/actions/projects.ts
'use server';

export async function createProjectAction(formData: FormData) {
  const data = {
    name: formData.get('name'),
    description: formData.get('description'),
  };
  const project = await projectRepository.create(data);
  revalidatePath('/projects');
  return { success: true, data: project };
}

// In component:
<form action={createProjectAction}>
  <input name="name" />
  <button type="submit">Create</button>
</form>
```

## Example Report

```
ARCHITECTURE DRIFT DETECTION

Code analyzed: 350 files
Architectural mandates checked: 12
Compliance score: 94/100

✓ COMPLIANT AREAS (10):

1. Repository Pattern
   Status: ✓ ENFORCED
   Direct db imports in components: 0
   All data access goes through repositories: YES
   Repository methods: 10 (well-organized)

2. Server Actions Pattern
   Status: ✓ COMPLIANT
   Server Actions: 8 (all have 'use server')
   Auth checks: 8/8 (all call await auth())
   Error patterns: Correct (return { success, error })

3. Client/Server Boundary
   Status: ✓ MAINTAINED
   'use client' components: 12 (appropriate)
   Server Components imported incorrectly: 0
   Server-only code in client: 0

4. Zod Validation
   Status: ✓ ENFORCED
   Forms with Zod: 5/5
   API inputs with Zod: 38/44
   Server Action inputs with Zod: 8/8

5. Type Safety
   Status: ✓ STRICT
   'any' type usages: 0 (excellent)
   Implicit types: 0
   Type inference from Drizzle: Good

6. Error Handling
   Status: ✓ GOOD
   Structured error returns: 8/8 actions
   No throw statements in actions: Correct
   Error codes standardized: YES

7. Logging
   Status: ✓ CONSISTENT
   Direct console.log usage: 2 (in logger utility only)
   Pino logger usage: Good
   Client logger usage: Good

8. Design System Adherence
   Status: ✓ GOOD
   Custom UI vs shadcn: 5 custom (all necessary)
   Hardcoded colors: 0 (using tokens)
   Design token compliance: 98%

9. Testing
   Status: ✓ ADEQUATE
   Unit test coverage: 62% (target: 80%)
   E2E test coverage: Good
   Integration tests: 4 files

10. Documentation
    Status: ✓ PRESENT
    AGENTS.md updated: YES
    CLAUDE.md relevant: YES
    Code comments: Minimal but adequate

🟡 DRIFT DETECTED (2):

1. src/components/shell/notification-bell.tsx
   Violation: useEffect for data fetching
   Rule: NO useEffect for data fetching (use Server Components)
   Line: 13-33
   Impact: Medium (polling pattern, should use Server Component with revalidation)

   Suggested fix:
     - Convert to Server Component
     - Or use Server Action with polling
     - See /hook-violation-fixer for pattern

2. src/app/api/v1/projects/route.ts
   Issue: Route Handler used for API (acceptable)
   Note: This is correct usage (external API, not UI)
   Status: ✓ OK

⚠️ ARCHITECTURAL OBSERVATIONS (4):

1. No form error boundary patterns
   Observation: Forms return errors but UI doesn't show them
   Recommendation: Add error display in all forms
   Impact: Minor (UX issue, not architecture)

2. Limited use of context for global state
   Current: Only shell context
   Could benefit: Theme context, notification context
   Recommendation: Extract to context as complexity grows

3. No middleware for role-based routing
   Current: Auth checks in individual actions/routes
   Recommendation: Consider middleware for critical paths (optional)

4. API versioning (/api/v1)
   Status: ✓ GOOD PRACTICE
   Allows future /api/v2 without breaking clients

📊 COMPLIANCE BREAKDOWN:

Mandate                                  Status    Compliance
────────────────────────────────────────────────────────────
Repository Pattern                       ✓         100%
Server/Client Boundary                   ✓         100%
Server Actions (use server + auth)       ✓         100%
Zod Validation (inputs)                  ✓         95%
Type Safety (no any)                     ✓         100%
Error Handling (structured)              ✓         100%
Logging (Pino, no console)               ✓          99%
Design Tokens (no hex codes)             ✓          98%
Database Access (repositories)           ✓         100%
Testing Coverage                         ⚠️        62% (need 80%)
useEffect (data fetching)                ⚠️        5 violations
Auth First (await auth())                ✓         100%

Overall Compliance: 94/100 (94%)

VIOLATIONS SUMMARY:

Critical (blocks deployment): 0
High (should fix soon): 0
Medium (fix this sprint): 2
Low (nice to have): 4

🎯 RECOMMENDED FIXES:

Priority 1 (Next sprint):
  [ ] Fix useEffect in notification-bell.tsx
  [ ] Run /hook-violation-fixer on violations
  [ ] Commit fixes: "fix: remove useEffect data fetching"

Priority 2 (Next quarter):
  [ ] Extract theme context (optional)
  [ ] Add form error boundaries (UX improvement)
  [ ] Increase test coverage to 80%

Priority 3 (Ongoing):
  [ ] Maintain 94%+ architecture compliance
  [ ] Run drift-detector monthly
  [ ] Review new code for pattern adherence

ARCHITECTURAL STRENGTHS:

✓ Repository Pattern well-established
✓ Strong Server/Client boundary
✓ Consistent Server Actions pattern
✓ Good type safety (no any)
✓ Proper error handling
✓ Design system adoption

NEXT AUDIT: 2026-04-14 (30 days)

BASELINE FOR TRACKING:
  Current: 94% compliance
  Target: 95%+ (maintain high standard)
  Violations: 2 (down from 7 last quarter)
  Trend: ✓ IMPROVING
```

## Enforcement

### Key Architectural Rules

**From AGENTS.md:**

1. **Repository Pattern (§7)**
   - Never import `db` in components
   - Use repository methods wrapped in `executeQuery`

2. **Server Components (§7)**
   - Default to Server Components
   - Only `'use client'` for interactivity/state
   - Never import Server Components into Client Components

3. **Server Actions (§9)**
   - Call `await auth()` first
   - Validate with Zod `.safeParse()`
   - Return structured `{ success, error }` (never throw)
   - Use `revalidatePath()` after mutations

4. **Security (§10)**
   - Use `@/lib/rbac` for permission checks
   - Sanitize HTML with `DOMPurify.sanitize()`
   - Import secrets from `@/lib/env`

5. **Logging (§11)**
   - Use `logger` (server) or `clientLogger` (client)
   - NO `console.log` in production code

6. **Type Safety (§6)**
   - Strict TypeScript mode
   - NO `any` type
   - Explicit return types

## Integration

### Code Review Checklist

```markdown
## Architecture

- [ ] No direct db imports in components
- [ ] Server/Client boundary maintained
- [ ] Server Actions have 'use server' + await auth()
- [ ] Structured error returns (no throw)
- [ ] Zod validation on inputs
- [ ] No useEffect for data fetching
- [ ] Using repositories, not direct db
```

### CI/CD Integration

```yaml
- name: Architecture Check
  run: |
    claude agent architecture-drift-detector "Check compliance"
```

### Monthly Review

```bash
# 1st of month
claude agent architecture-drift-detector "Architecture compliance status"
```

## Related Commands

- `AGENTS.md` — Architectural mandates (source of truth)
- `CLAUDE.md` — AI-specific constraints
- `/hook-violation-fixer` — Fix architectural violations
- `src/repositories/` — Repository pattern implementation

---

**Architecture isn't optional. Enforce it consistently.**
