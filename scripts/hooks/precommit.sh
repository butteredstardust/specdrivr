#!/usr/bin/env bash
# scripts/hooks/precommit.sh
# Modular pre-commit orchestrator

set -euo pipefail

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/hooks/utils.sh
source "${HOOK_DIR}/utils.sh"

staged_count=$(get_staged_files_count)

# Exit early if nothing is staged
if [ "$staged_count" -eq 0 ]; then
    exit 0
fi

info "Running pre-commit checks for $staged_count files..."

# Initial audit log (running)
log_audit "pre-commit" "running" "files:$staged_count"

# Check for pnpm as it's the project mandate
if ! (check_tool "pnpm"); then
    warn "pnpm check failed, but continuing (NON-BLOCKING)"
fi

# Run lint-staged via pnpm to ensure it picks up local installation
if pnpm lint-staged; then
    log_audit "pre-commit" "passed" "files:$staged_count"
    success "Pre-commit checks passed."
    exit 0
else
    log_audit "pre-commit" "failed" "files:$staged_count"
    echo ""
    warn "Pre-commit checks failed (NON-BLOCKING)"
    echo "------------------------------------------------------------"
    echo "Issues detected in staged files. Please fix before pushing."
    echo "------------------------------------------------------------"
    exit 0
fi
