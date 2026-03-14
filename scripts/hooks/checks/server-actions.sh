#!/usr/bin/env bash
# scripts/hooks/checks/server-actions.sh
# Rule: Server Action Security
# Enforces 'use server', auth() calls, and structured errors in actions.

set -euo pipefail

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/hooks/utils.sh
source "${HOOK_DIR}/utils.sh"

info "Checking Server Action security rules..."

# Get all pushed files under src/actions/
action_files=$(get_pushed_files "^src/actions/.*\.ts$")

if [ -z "$action_files" ]; then
    success "No server actions found in push."
    exit 0
fi

FAILED=0

for file in $action_files; do
    # 1. Must include 'use server'
    if ! grep -q "'use server'" "$file"; then
        error "$file: Missing 'use server' directive."
        FAILED=1
    fi

    # 2. Must call await auth()
    if ! grep -q "await auth()" "$file"; then
        error "$file: Missing 'await auth()' authentication call."
        FAILED=1
    fi

    # 3. Must NOT use throw new Error(...) or throw ...
    # We look for 'throw' at the beginning of a line or after some whitespace
    if grep -nE "^\s*throw\s+" "$file" | grep -v "//" || true; then
        violations=$(grep -nE "^\s*throw\s+" "$file" | grep -v "//" || true)
        if [ -n "$violations" ]; then
            error "$file: Direct 'throw' detected. Use structured errors instead."
            echo -e "$violations" | while read -r line; do
                echo "    Line $line"
            done
            FAILED=1
        fi
    fi
done

if [ $FAILED -ne 0 ]; then
    die "Server Action security violations found. Please fix and re-push."
fi

success "Server Action security check passed."
