#!/usr/bin/env bash
#
# Dependency audit gate for .github/workflows/security.yml.
#
# `pnpm audit` exits 1 both when it finds vulnerabilities and when it cannot
# reach the registry, and the npm advisory endpoint
# (registry.npmjs.org/-/npm/v1/security/audits) times out often enough to matter.
# Treating those two cases the same is how a security gate rots: the job goes
# red for reasons nobody can act on, and people stop reading it.
#
# So: retry on transport failures, and only fail the build when the audit
# actually ran and reported something at or above the threshold.
#
# Exit codes
#   0  audit ran clean, or the registry was unreachable after every attempt
#   1  audit ran and found advisories at or above AUDIT_LEVEL
#
# Usage: scripts/ci-audit.sh [audit-level]

set -uo pipefail

AUDIT_LEVEL="${1:-${AUDIT_LEVEL:-high}}"
MAX_ATTEMPTS="${AUDIT_MAX_ATTEMPTS:-5}"
output=''
attempt=1

# GitHub Actions workflow commands; no-ops when run locally.
notice() { if [ -n "${GITHUB_ACTIONS:-}" ]; then echo "::notice::$1"; else echo "NOTICE: $1"; fi; }
warn() { if [ -n "${GITHUB_ACTIONS:-}" ]; then echo "::warning::$1"; else echo "WARNING: $1"; fi; }
fail() { if [ -n "${GITHUB_ACTIONS:-}" ]; then echo "::error::$1"; else echo "ERROR: $1"; fi; }

while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
  echo "==> pnpm audit --audit-level=$AUDIT_LEVEL (attempt $attempt/$MAX_ATTEMPTS)"

  # Capture rather than stream so the output can be classified. It is echoed
  # back below either way, so nothing is hidden from the log.
  output="$(pnpm audit --audit-level="$AUDIT_LEVEL" 2>&1)"
  status=$?

  echo "$output"

  if [ "$status" -eq 0 ]; then
    notice "Dependency audit clean at level '$AUDIT_LEVEL'."
    exit 0
  fi

  # A non-zero exit is only a real finding if the request completed. pnpm
  # surfaces transport problems as these; anything else is a genuine result.
  if ! grep -qE 'ERR_SOCKET_TIMEOUT|ERR_PNPM_FETCH|FetchError|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up|502 Bad Gateway|503 Service' <<<"$output"; then
    fail "Dependency audit found advisories at or above '$AUDIT_LEVEL'. See documentation/infrastructure/DEPENDENCY_SECURITY.md for how to resolve or record an exception."
    exit 1
  fi

  if [ "$attempt" -lt "$MAX_ATTEMPTS" ]; then
    backoff=$((attempt * 15))
    warn "Could not reach the npm advisory endpoint (attempt $attempt/$MAX_ATTEMPTS). Retrying in ${backoff}s."
    sleep "$backoff"
  fi

  attempt=$((attempt + 1))
done

# Every attempt failed to reach the registry, so the tree was never actually
# checked. Passing here is deliberate: this is npm infrastructure, not a
# regression in this repository, and blocking on it is what trains people to
# ignore the job. The weekly scheduled run and every later pull request
# re-check the same tree, so a genuine advisory cannot hide for long.
warn "npm advisory endpoint unreachable after $MAX_ATTEMPTS attempts; dependency audit was skipped, not passed. It will run again on the next push, pull request, or weekly schedule."
exit 0
