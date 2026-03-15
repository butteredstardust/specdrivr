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
# We check if a file contains the START marker, as it's the most unique.
# If it has <<<<<<<, it's almost certainly a conflict.
START_MARKER='^<{7} '
DIVIDE_MARKER='^={7}$'
END_MARKER='^>{7} '

for file in $pushed_files; do
    if [[ "$file" == *"conflicts.sh"* ]]; then continue; fi # Skip self
    if [ ! -f "$file" ]; then continue; fi # Skip deleted
    
    # Check for all three markers to confirm it's a conflict
    if grep -qE "$START_MARKER" "$file" && grep -qE "$DIVIDE_MARKER" "$file" && grep -qE "$END_MARKER" "$file"; then
        error "Unresolved conflict marker detected in $file:"
        violations=$(grep -nE "($START_MARKER|$DIVIDE_MARKER|$END_MARKER)" "$file" || true)
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
