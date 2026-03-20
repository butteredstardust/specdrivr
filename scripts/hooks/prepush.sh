#!/usr/bin/env bash
# scripts/hooks/prepush.sh
# Orchestrator for modular pre-push checks

set -euo pipefail

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHECK_DIR="${HOOK_DIR}/checks"
# shellcheck source=scripts/hooks/utils.sh
source "${HOOK_DIR}/utils.sh"

# ─── 0. Multi-Ref Range Aggregation ──────────────────────────────────────────
# Pre-push receives: <local_ref> <local_sha> <remote_ref> <remote_sha> on stdin
NULL_SHA="0000000000000000000000000000000000000000"
RANGES=()

while read -r _local_ref local_sha _remote_ref remote_sha; do
    [ "$local_sha" = "$NULL_SHA" ] && continue # Branch deletion
    if [ "$remote_sha" = "$NULL_SHA" ]; then
        # New branch: diff from merge-base with main/master
        base=$(git merge-base HEAD \
            "$(git rev-parse --verify origin/main 2>/dev/null \
               || git rev-parse --verify origin/master 2>/dev/null \
               || echo "")" 2>/dev/null || true)
        RANGES+=("${base:+${base}..}${local_sha}")
    else
        RANGES+=("${remote_sha}..${local_sha}")
    fi
done

# Fallback for dry-run / local testing
if [ ${#RANGES[@]} -eq 0 ]; then
    RANGES+=("HEAD~1..HEAD")
fi

# ─── 1. Orchestration ────────────────────────────────────────────────────────
info "Running modular pre-push checks..."

# Check for pnpm as it's the project mandate
if ! (check_tool "pnpm"); then
    warn "pnpm check failed, but continuing"
fi

# Configuration: Which checks are mandatory (BLOCKING)?
BLOCKING_CHECKS=(
    "artifacts"
    "secrets"
    "env-protection"
    "migrations"
    "conflicts"
    "xss"
    "suite" # Build/Test is mandatory for stability
)

# Track failures
FAILED_CHECKS=()
CRITICAL_FAILED=0

# Export ranges for child scripts
export PUSH_RANGES="${RANGES[*]}"

# Helper to run isolated checks
run_check() {
    local name="$1"
    local script="${CHECK_DIR}/${name}.sh"
    local is_blocking=0
    
    # Check if this is a blocking check
    for b in "${BLOCKING_CHECKS[@]}"; do
        if [[ "$b" == "$name" ]]; then
            is_blocking=1
            break
        fi
    done
    
    if [ -f "$script" ]; then
        if [[ $is_blocking -eq 1 ]]; then
            info "Running $name check (BLOCKING)..."
        else
            info "Running $name check (NON-BLOCKING)..."
        fi

        if ! bash "$script"; then
            if [[ $is_blocking -eq 1 ]]; then
                error "$name check failed (CRITICAL)."
                CRITICAL_FAILED=1
            else
                warn "$name check failed (NON-BLOCKING)."
            fi
            FAILED_CHECKS+=("$name")
        fi
    else
        warn "Check '$name' script not found at $script, skipping."
    fi
}

# Run core checks in priority order
run_check "branch"
run_check "artifacts"
run_check "secrets"
run_check "large-files"
run_check "commits"
run_check "server-actions"
run_check "env-protection"
run_check "migrations"
run_check "conflicts"
run_check "xss"
run_check "images"
run_check "client-repos"
run_check "forms"
run_check "colors"
run_check "suite"

if [ ${#FAILED_CHECKS[@]} -eq 0 ]; then
    success "All pre-push checks passed!"
    exit 0
fi

if [[ $CRITICAL_FAILED -eq 1 ]]; then
    echo ""
    error "------------------------------------------------------------"
    error "PRE-PUSH FAILED: Critical security or stability violations."
    error "Failed checks: ${FAILED_CHECKS[*]}"
    error "You must fix these issues before pushing."
    error "------------------------------------------------------------"
    echo ""
    exit 1
else
    echo ""
    warn "------------------------------------------------------------"
    warn "Pre-push warnings detected for: ${FAILED_CHECKS[*]}"
    warn "These are currently NON-BLOCKING, but should be addressed."
    warn "------------------------------------------------------------"
    echo ""
    exit 0
fi
