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
check_tool "pnpm"

# Run lint-staged via pnpm to ensure it picks up local installation
if pnpm lint-staged; then
    log_audit "pre-commit" "passed" "files:$staged_count"
    success "Pre-commit checks passed."
    exit 0
else
    log_audit "pre-commit" "failed" "files:$staged_count"
    echo ""
    error "Pre-commit checks failed"
    echo "------------------------------------------------------------"
    echo "Issues detected in staged files. Please:"
    echo "  1. Fix lint/formatting errors shown above"
    echo "  2. Stage the updated files (git add)"
    echo "  3. Commit again"
    echo ""
    echo "Emergency bypass (logged):"
    echo "  git commit --no-verify"
    echo "------------------------------------------------------------"
    exit 1
fi
