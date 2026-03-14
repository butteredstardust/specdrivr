#!/usr/bin/env bash
# scripts/hooks/checks/secrets.sh
# Secret scanning using gitleaks

set -euo pipefail

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/hooks/utils.sh
source "${HOOK_DIR}/utils.sh"

if ! command -v gitleaks >/dev/null 2>&1; then
    warn "gitleaks not found. Skipping robust secret scan. Falling back to regex (limited)."
    # Fallback to a simple regex check on the union of diffs
    all_additions=""
    for range in $PUSH_RANGES; do
        all_additions="${all_additions}\n$(git diff -U0 "$range" | grep "^+" | grep -v "^+++" || true)"
    done
    
    SECRET_PATTERN='(sk-[a-zA-Z0-9]{32,}|ghp_[a-zA-Z0-9]{36}|AIza[0-9A-Za-z_-]{35}|AKIA[0-9A-Z]{16})'
    if echo -e "$all_additions" | grep -qE "$SECRET_PATTERN"; then
        die "Potential secret or API key detected in diff."
    fi
    exit 0
fi

info "Running gitleaks scan..."
# Gitleaks can scan the staged changes or a commit range
# For pre-push, we scan the union of ranges
for range in $PUSH_RANGES; do
    gitleaks detect --source . --log-level warn --redact --no-git || die "Secrets detected by gitleaks. Please audit and revoke."
done

success "Secret scan passed."
