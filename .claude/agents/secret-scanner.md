---
name: secret-scanner
description: Detect hardcoded secrets, API keys, and credentials before they're committed
type: subagent
user-invocable: true
---

# Secret Scanner Agent

**Purpose:** Prevent accidental commits of API keys, tokens, and sensitive credentials.

**Invocation:** Pre-commit / pre-push

**Speed:** ~1 min full scan

## How to Use

```bash
# Pre-commit security check
claude agent secret-scanner "Scan staged files for secrets"

# Pre-deployment audit
claude agent secret-scanner "Full repository scan for credentials"

# Specific directory
claude agent secret-scanner "Scan src/lib/ for hardcoded secrets"
```

## What It Detects

### API Keys & Tokens

- AWS keys: `AKIA...`, `aws_secret_access_key`
- GitHub tokens: `ghp_`, `gho_`, `ghu_`
- OpenAI API keys: `sk-...`
- Stripe keys: `sk_live_`, `pk_live_`
- Database credentials: connection strings with passwords
- JWT secrets in code

### Environment Files

- `.env` files (should be `.env.example` only)
- `.env.local` (local overrides)
- `.env.production` (production secrets)
- `.env.*.secret` (any secret files)

### Code Patterns

- Hardcoded password strings
- Bearer tokens in code
- Private keys (SSH, RSA, etc.)
- OAuth tokens
- Database URLs with credentials

### Common Mistakes

```typescript
// ❌ WRONG - Secrets in code
const GITHUB_TOKEN = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz';
const DB_PASSWORD = 'sup3rs3cr3tp@ssw0rd';
const STRIPE_KEY = 'sk_live_51234567890abcdef';

// ✓ RIGHT - Use environment variables
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const DB_PASSWORD = env.DATABASE_PASSWORD;
const STRIPE_KEY = env.STRIPE_SECRET_KEY;
```

## Example Output

```
SECRET SCAN RESULTS

🔴 CRITICAL SECRETS FOUND (3):

1. src/lib/github.ts:42
   Type: GitHub Personal Access Token
   Pattern: ghp_1234567890...
   Status: LEAKED
   Action: REVOKE IMMEDIATELY
   → Token starts with ghp_ (personal access token)
   → Likely exposed in git history
   → Revoke at https://github.com/settings/tokens

2. .env.local:3
   Type: Database Password
   Pattern: postgresql://user:P@ssw0rd123@localhost:5432/db
   Status: STAGED FOR COMMIT
   Problem: .env.local accidentally staged
   Action: Remove from git
   → git rm --cached .env.local
   → Add to .gitignore
   → Rotate password (was in plaintext)

3. src/config/stripe.ts:8
   Type: Stripe Secret Key
   Pattern: sk_live_12345...
   Status: COMMITTED (in git history)
   Problem: Secret has been in repository since 2026-03-10
   Action: IMMEDIATE - Rotate key in Stripe dashboard
   → Old key: sk_live_12345...
   → Rotation required immediately

⚠️  WARNING PATTERNS (2):

1. src/lib/env.ts:45
   Pattern: Looks like an API key (long alphanumeric string)
   Check: Is this intentional? (likely a type, but verify)

2. documentation/setup.md:89
   Contains: Example token for testing (sk_test_...)
   Status: OK (test key, not secret)

✅ ENVIRONMENT FILE STATUS:
   .env           - NOT in git (good)
   .env.example   - In git (good)
   .env.local     - NOT in git (good) [was accidentally staged]
   .env.production - NOT in git (good)

✓ Code follows pattern:
   - Uses process.env.VAR (ok)
   - Uses env.VAR from @/lib/env (good)
   - No hardcoded secrets in source files

📊 SUMMARY:
   Secrets found: 3
   Critical: 3 (leaked, committed, or staged)
   Warnings: 2
   Safe files: 38

RISK LEVEL: 🔴 CRITICAL
→ Revoke tokens immediately
→ Rotate credentials
→ Remove from git history
→ Add to .gitignore

NEXT STEPS:
1. Run: git rm --cached .env.local
2. Revoke GitHub token: https://github.com/settings/tokens
3. Rotate Stripe key immediately
4. Amend commit to remove secrets
5. Force push (only if not yet pushed to main)
```

## Prevention Strategies

### 1. Use Environment Variables

```typescript
// ✓ CORRECT
const githubToken = process.env.GITHUB_TOKEN;
const stripeKey = env.STRIPE_SECRET_KEY;
const dbPassword = env.DATABASE_PASSWORD;

// ❌ WRONG
const githubToken = 'ghp_abc123...'; // LEAKED
const stripeKey = 'sk_live_abc...'; // LEAKED
```

### 2. Protect .env Files

Add to `.gitignore`:

```
.env
.env.*.local
.env.local
.env.*.secret
.env.production
.env.development.local
.env.test.local
```

Keep only:

```
.env.example     # Template with dummy values
```

### 3. Use Pre-commit Hooks

Add to `.husky/pre-commit`:

```bash
claude agent secret-scanner "Check staged files before commit"
```

### 4. Document Safe Patterns

In `DEVELOPMENT.md`:

```markdown
## Environment Variables

Never commit real credentials. Use .env.example:

.env.example:
GITHUB*TOKEN=your_token_here
STRIPE_SECRET_KEY=sk_test*...

.env.local (local development, not committed):
GITHUB_TOKEN=ghp_actualtoken...
STRIPE_SECRET_KEY=sk_test_actualkey...
```

## Rotating Compromised Secrets

### GitHub Token

1. Visit https://github.com/settings/tokens
2. Delete the compromised token
3. Generate new token
4. Update `.env.local`
5. Redeploy

### Stripe Key

1. Go to Stripe Dashboard → Settings → API Keys
2. Reveal old key, then delete
3. Reveal new key
4. Update `env.STRIPE_SECRET_KEY`
5. Redeploy

### Database Password

1. Connect to database with admin account
2. ALTER USER password to new value
3. Update `DATABASE_PASSWORD` in all environments
4. Redeploy

## What To Do If Leaked

If a secret was already committed:

```bash
# Option 1: Remove from git history (destructive)
git filter-repo --invert-paths --path .env.local

# Option 2: Force new commit without secret
git rm --cached .env.local
git commit --amend -m "remove: .env.local from git"
git push --force-with-lease  # Only if not yet on main

# Option 3: Rotate credential immediately (safest)
# Keep secret in git history
# But rotate the actual credential
# File a security incident report
```

**Always rotate credentials, even if you remove them from git.**

## CI/CD Integration

Add to GitHub Actions:

```yaml
- name: Scan for Secrets
  run: claude agent secret-scanner "Full repo scan"
```

Block merge if secrets found:

```yaml
- name: Fail on Secrets
  if: failure()
  run: |
    echo "❌ Secrets detected. DO NOT MERGE."
    exit 1
```

## Related Commands

- `.husky/pre-commit` — Hook orchestration
- `.gitignore` — Files to exclude from git
- `src/lib/env.ts` — Safe environment variable access
- `DEVELOPMENT.md` — Setup guide

---

**Secrets in git are equivalent to leaving your house unlocked. Scan before every commit.**
