---
name: dependency-auditor
description: Audit dependencies for vulnerabilities, outdated packages, and unused imports
type: subagent
user-invocable: true
---

# Dependency Auditor Agent

**Purpose:** Track dependency security, updates, and health.

**Invocation:** Monthly or on demand

**Speed:** ~2 min for analysis

## How to Use

```bash
# Full dependency audit
claude agent dependency-auditor "Audit all dependencies for vulnerabilities and updates"

# Security only
claude agent dependency-auditor "Check for security vulnerabilities in dependencies"

# Outdated packages
claude agent dependency-auditor "List all outdated dependencies"

# Unused dependencies
claude agent dependency-auditor "Find unused packages that can be removed"
```

## What It Does

### 1. Security Scanning

- Checks npm registry for known vulnerabilities
- Identifies CVEs affecting your packages
- Suggests patched versions
- Rates severity (critical, high, medium, low)

### 2. Update Analysis

- Finds outdated packages
- Checks for major version updates
- Identifies breaking changes
- Recommends safe update strategy

### 3. Unused Dependencies

- Scans codebase for actual imports
- Identifies packages in `package.json` not used in code
- Safe to remove without breaking anything

## Example Report

```
DEPENDENCY AUDIT REPORT

Total dependencies: 97
Status as of 2026-03-14

🔴 CRITICAL VULNERABILITIES (1):

1. better-auth@1.5.4
   CVE-2026-12345: Authentication Bypass
   Description: JWT validation skips signature verification under certain conditions
   Severity: CRITICAL (allows unauthorized access)
   Affected versions: <1.5.5
   Patched version: 1.5.5
   Risk level: HIGH (used in auth middleware)

   Action: UPGRADE IMMEDIATELY
   Command: pnpm update better-auth@^1.5.5

   Timeline:
   - Now: Upgrade to 1.5.5+
   - Within 24h: Deploy to production
   - Revoke all active sessions (force re-login)

🟡 HIGH VULNERABILITIES (2):

1. next@16.1.6
   CVE-2026-10234: XSS in next/image
   Description: Image alt text not properly sanitized
   Severity: HIGH
   Affected versions: <16.2.0
   Patched version: 16.2.0
   Risk: Medium (mitigated by your DOMPurify usage)

   Action: UPGRADE THIS MONTH
   Command: pnpm update next@^16.2.0
   Notes: Also includes 6 other security fixes

2. drizzle-orm@0.45.1
   CVE-2026-09876: SQL Injection in query builder
   Description: Malformed input could bypass parameterization
   Severity: HIGH
   Affected versions: <0.46.0
   Patched version: 0.46.0+
   Risk: Medium (you validate with Zod)

   Action: UPGRADE THIS MONTH
   Command: pnpm update drizzle-orm@^0.46.0

🟢 LOW/MEDIUM VULNERABILITIES (0):
   None detected. Good job!

📦 OUTDATED PACKAGES (Non-critical):

Package          Current    Latest    Benefit
────────────────────────────────────────────────
zod              3.22.0     3.24.1    2 bug fixes
typescript       5.9.3      5.10.1    Better type inference
react            19.2.4     19.3.0    Performance improvements
tailwindcss      4.2.1      4.3.0     New utilities
prettier         3.8.1      3.9.0     Better formatting
vitest           4.0.18     4.1.0     Faster test execution
playwright       1.42.0     1.45.0    Better selectors

Recommendation: Update all "bug fix" releases
  pnpm up
  # Review CHANGELOG for each package
  # Test thoroughly

Breaking changes: None expected in these updates

⚠️ POTENTIALLY UNUSED DEPENDENCIES (3):

1. ts-morph@27.0.2
   Location: node_modules/
   Usage in code: 0 files
   Size: 1.2MB
   Status: LIKELY UNUSED
   Command to remove: pnpm remove ts-morph

   Note: Check if this is dev-only dependency for build tools
   Verify: grep -r "ts-morph" src/
   Result: No imports found

2. ioredis@5.10.0
   Location: node_modules/
   Usage in code: 2 files (src/lib/lock-manager.ts, src/lib/redis.ts)
   Status: ✓ USED (false positive)

3. @babel/core@7.29.0 (transitive)
   Location: node_modules/ (via @vitejs/plugin-react)
   Status: ✓ NEEDED (transitive dependency)

Unused to remove: ts-morph (1.2MB saved)

📊 DEPENDENCY HEALTH:

Security score: 8/10 (1 critical vuln, 2 high vulns)
Update score: 7/10 (most recent, some outdated)
Size: 312MB (reasonable for this stack)

Direct dependencies: 61
Dev dependencies: 36
Transitive: 432 (managed by pnpm)

License scan:
  MIT: 85 packages
  Apache 2.0: 8 packages
  BSD: 4 packages
  Other: 0
  Status: ✓ All commercial-friendly

🎯 ACTION PLAN:

Immediate (Today):
  [ ] Upgrade better-auth@^1.5.5 (critical security)
  [ ] Test authentication flows
  [ ] Deploy to production

This week:
  [ ] Upgrade next@^16.2.0
  [ ] Upgrade drizzle-orm@^0.46.0
  [ ] Run full test suite
  [ ] Deploy

This month:
  [ ] Upgrade remaining outdated packages (zod, typescript, etc.)
  [ ] Remove ts-morph (unused)
  [ ] Review breaking changes in major updates
  [ ] Test thoroughly
  [ ] Deploy

Testing strategy:
  1. Update one package at a time
  2. Run: pnpm test
  3. Run: pnpm test:e2e
  4. Test authentication flows manually
  5. Commit and push if all pass

Rollback plan:
  1. If critical issue found: pnpm update package@previous-version
  2. Revert git commit
  3. Re-deploy previous version
  4. File bug report with package maintainers

📈 DEPENDENCY TREND:

Status: Healthy
- Security vulnerabilities trending down
- Most packages kept reasonably current
- No deprecated dependencies detected
- Test suite ensures compatibility

Next audit: 2026-04-14 (30 days)

ALERTS:

⚠️ Set up dependabot or renovate for automatic PRs
   Benefit: Automatic dependency updates
   Effort: 5 minutes to configure

🔔 Enable security notifications:
   GitHub Settings → Security → Vulnerability alerts
   Enables automatic alerts for new CVEs
```

## Update Strategy

### Patch Updates (3.22.0 → 3.22.1)

**Safe to apply immediately**

- Bug fixes only
- No breaking changes
- `pnpm update`

### Minor Updates (3.22.0 → 3.23.0)

**Generally safe, test first**

- New features
- Backward compatible
- `pnpm update`

### Major Updates (3.0.0 → 4.0.0)

**Review carefully, test thoroughly**

- Breaking changes likely
- May require code changes
- `pnpm update package@^4.0.0` (manual)
- Review CHANGELOG before updating

## Security Response

### If Critical Vulnerability Found

```bash
# 1. Update immediately
pnpm update vulnerable-package@latest

# 2. Test everything
pnpm test && pnpm test:e2e

# 3. Deploy ASAP
git add -A && git commit -m "security: patch critical vulnerability"
git push

# 4. Monitor for issues
# Watch error logs for next 24h

# 5. Notify users (if public-facing)
# Explain what was fixed, why it matters
```

## Automation

### Dependabot Integration

Add `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: daily
    open-pull-requests-limit: 10
```

### Renovate Integration

Add `renovate.json`:

```json
{
  "extends": ["config:base"],
  "schedule": ["before 3am on Monday"],
  "vulnerabilityAlerts": {
    "labels": ["security"]
  }
}
```

## Related Commands

- `pnpm update` — Update all packages
- `pnpm audit` — Show vulnerabilities
- `pnpm list` — Show dependency tree
- `pnpm outdated` — Show outdated packages

---

**Stale dependencies are security risks. Keep them updated.**
