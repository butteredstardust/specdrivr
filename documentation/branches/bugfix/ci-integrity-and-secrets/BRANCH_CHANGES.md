# Branch Changes: bugfix/ci-integrity-and-secrets

## Overview
This branch resolves CI failures in the `Security Scan` and `Tests` workflows on `main`.

## Changes

### CI/CD & Scripts
- **`scripts/verify-hooks.js`**: Modified `generateChecksum` to normalize line endings to LF (`\n`) before hashing. This ensures consistent checksums between Windows (CRLF) and Linux/CI (LF) environments.
- **`.env.example`**: Updated the `DATABASE_URL` placeholder to use a more generic value (`postgresql://postgres:postgres@localhost:5432/specdrivr`) to avoid triggering Trufflehog false positives.
- **`.husky/hooks-checksum.txt`**: Regenerated with the new normalized checksums.

## Verification Results
- Local verification on Windows: `node scripts/verify-hooks.js verify` returns `OK`.
- Anticipated CI behavior: Checksums should now match the LF content in the Ubuntu runner.
- Secret scanning: Placeholder values are standard and should pass Trufflehog analysis.
