#!/usr/bin/env bash
# scripts/hooks/checks/large-files.sh
# Efficient size check using native Git commands

set -euo pipefail

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/hooks/utils.sh
source "${HOOK_DIR}/utils.sh"

MAX_KB=500
MAX_BYTES=$((MAX_KB * 1024))

offending_files=""

for range in $PUSH_RANGES; do
    # Get files added/modified in this range
    files=$(git diff --name-only --diff-filter=AM "$range")
    [ -z "$files" ] && continue
    
    # Range is usually SHA..SHA, we check the tail (local_sha)
    final_sha=$(echo "$range" | awk -F'..' '{print ($2=="" ? $1 : $2)}')
    
    while IFS= read -r f; do
        [ -z "$f" ] && continue
        size=$(get_git_object_size "$final_sha" "$f")
        if [ "$size" -gt "$MAX_BYTES" ]; then
            offending_files="${offending_files}  $f ($((size / 1024))KB)\n"
        fi
    done <<< "$files"
done

if [ -n "$offending_files" ]; then
    error "Large files (> ${MAX_KB}KB) detected in push:"
    echo -e "$offending_files"
    die "Use Git LFS or remove large assets before pushing."
fi

success "Large file check passed."
