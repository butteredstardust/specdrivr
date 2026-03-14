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

# Export ranges for child scripts
export PUSH_RANGES="${RANGES[*]}"

# Helper to run isolated checks
run_check() {
    local name="$1"
    local script="${CHECK_DIR}/${name}.sh"
    
    if [ -f "$script" ]; then
        info "Running $name check..."
        bash "$script" || die "$name check failed."
    else
        warn "Check '$name' script not found at $script, skipping."
    fi
}

# Run core checks
run_check "branch"
run_check "artifacts"
run_check "secrets"
run_check "large-files"
run_check "commits"
run_check "suite"

success "All pre-push checks passed!"
