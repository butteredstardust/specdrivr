#!/usr/bin/env bash
# scripts/hooks/checks/conflicts.sh
# Rule: Conflict Marker Detection
# Detect unresolved git conflict markers in pushed files.

set -euo pipefail

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/hooks/utils.sh
source "${HOOK_DIR}/utils.sh"

info "Checking for unresolved conflict markers..."

# Get all pushed files
pushed_files=$(get_pushed_files)

if [ -z "$pushed_files" ]; then
    success "No files in push to check for conflicts."
    exit 0
fi

FAILED=0
# Search for standard conflict markers: <<<<<<<, =======, >>>>>>>
# Note: ======= is less unique, but in combination they are sure markers.
CONFLICT_PATTERN='(<<<<<<<|=======|>>>>>>>)'

for file in $pushed_files; do
    if [ ! -f "$file" ]; then continue; fi # Skip deleted
    
    violations=$(grep -nE "$CONFLICT_PATTERN" "$file" || true)
    if [ -n "$violations" ]; then
        error "Unresolved conflict marker detected in $file:"
        echo -e "$violations" | while read -r line; do
            echo "    Line $line"
        done
        FAILED=1
    fi
done

if [ $FAILED -ne 0 ]; then
    die "Conflict markers found. Resolve all conflicts and re-push."
fi

success "Conflict marker check passed."
