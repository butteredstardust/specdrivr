---
name: betterauth-auditor
description: Audit BetterAuth implementation for session management and security
type: subagent
user-invocable: true
---

# BetterAuth Auditor Agent

**Purpose:** Ensure BetterAuth sessions, tokens, and authentication patterns are secure.

**Invocation:** Code review or pre-deployment

**Speed:** ~2 min

## How to Use

```bash
claude agent betterauth-auditor "Audit BetterAuth session management"
claude agent betterauth-auditor "Check token handling and expiration"
```

## What It Checks

### 1. Session Validation
```typescript
// ✓ CORRECT - Always call auth()
export async function protectedAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: { code: 'UNAUTHORIZED' } };
  }
  // ...
}

// ❌ WRONG - Assume session exists
export async function protectedAction(userId: string) {
  // No auth() call!
  await updateUser(userId);
}
```

### 2. Token Management
```typescript
// ✓ CORRECT - Use session tokens
const token = session.auth.accessToken;

// ❌ WRONG - Store tokens in localStorage (XSS risk)
localStorage.setItem('token', response.token);
```

### 3. Session Expiration
```typescript
// ✓ CORRECT - Check expiration
if (session.expiresAt < Date.now()) {
  return { success: false, error: { code: 'SESSION_EXPIRED' } };
}

// ❌ WRONG - No expiration check
const user = session.user; // Assume valid
```

## Report Includes

- Missing auth() calls
- Session validation patterns
- Token expiration handling
- Provider configuration issues
- Email verification requirements
- MFA implementation

## Integration

Add to pre-deployment:
```bash
claude agent betterauth-auditor "Final auth security check"
```

---

**Session security is fundamental. Audit it regularly.**
