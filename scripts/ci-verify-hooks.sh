#!/usr/bin/env bash
# scripts/ci-verify-hooks.sh
# CI wrapper for modular repository policy checks.

set -euo pipefail

HOOK_DIR="scripts/hooks"
CHECK_DIR="${HOOK_DIR}/checks"
# shellcheck source=scripts/hooks/utils.sh
source "${HOOK_DIR}/utils.sh"

# Determine the range of commits to check
if [ "${GITHUB_EVENT_NAME:-}" == "pull_request" ]; then
    # For PRs, check all commits in the PR
    PUSH_RANGES="origin/${GITHUB_BASE_REF}..HEAD"
    info "CI: Verifying PR diff (range: $PUSH_RANGES)"
elif [ -n "${GITHUB_SHA:-}" ]; then
    # For pushes, check the last commit or range if available
    # GitHub push event provides BEFORE and AFTER SHAs
    BEFORE_SHA="${GITHUB_EVENT_BEFORE:-HEAD~1}"
    AFTER_SHA="${GITHUB_SHA}"
    PUSH_RANGES="${BEFORE_SHA}..${AFTER_SHA}"
    info "CI: Verifying push diff (range: $PUSH_RANGES)"
else
    # Local fallback
    PUSH_RANGES="HEAD~1..HEAD"
    info "CI: Verifying local diff (range: $PUSH_RANGES)"
fi

export PUSH_RANGES

# Execute the prepush orchestrator
# We skip the "suite" check in pre-push during CI because CI runs them in separate steps anyway.
# To do this, we can either modify prepush.sh to accept an ignore list or just run checks manually.

FAILED=0
run_check() {
    local name="$1"
    local script="${CHECK_DIR}/${name}.sh"
    
    if [ -f "$script" ]; then
        info "Running $name check..."
        # Note: We don't use 'die' here to allow all checks to run
        if ! bash "$script"; then
            error "$name check failed."
            FAILED=1
        fi
    fi
}

# Run all security/policy checks, but skip the heavy 'suite' check
run_check "artifacts"
run_check "secrets"
run_check "large-files"
run_check "server-actions"
run_check "env-protection"
run_check "migrations"
run_check "conflicts"
run_check "xss"
run_check "images"
run_check "client-repos"
run_check "forms"
run_check "colors"

if [ $FAILED -ne 0 ]; then
    die "Repository policy enforcement failed. See errors above."
fi

success "All repository policy checks passed!"
