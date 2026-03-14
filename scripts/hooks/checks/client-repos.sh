#!/usr/bin/env bash
# scripts/hooks/checks/client-repos.sh
# Rule: Client Repository Access
# 'use client' files must NOT import from @/repositories.

set -euo pipefail

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/hooks/utils.sh
source "${HOOK_DIR}/utils.sh"

info "Checking client-side repository access..."

# Filter for all pushed React files
react_files=$(get_pushed_files "\.(tsx|jsx|ts|js)$")

if [ -z "$react_files" ]; then
    success "No files in push to check for client repository access."
    exit 0
fi

FAILED=0
# Search for 'use client' and then check if it imports from @/repositories
for file in $react_files; do
    if [ ! -f "$file" ]; then continue; fi
    
    # Check if file has 'use client'
    if grep -q "'use client'\|\"use client\"" "$file"; then
        # Check for forbidden imports from @/repositories
        violations=$(grep -nE "from\s+['\"]@/repositories" "$file" || true)
        
        if [ -n "$violations" ]; then
            error "Forbidden repository import in Client Component ($file):"
            echo -e "$violations" | while read -r line; do
                echo "    Line $line"
            done
            echo "    Requirement: Client Components must NOT access repositories directly. Use Server Actions or API routes instead."
            FAILED=1
        fi
    fi
done

if [ $FAILED -ne 0 ]; then
    die "Client-side repository access violation. Refactor data access and re-push."
fi

success "Client-side repository access check passed."
