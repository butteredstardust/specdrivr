#!/usr/bin/env bash
# scripts/hooks/checks/commits.sh
# Conventional commit validation

set -euo pipefail

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/hooks/utils.sh
source "${HOOK_DIR}/utils.sh"

invalid_commits=""
for range in $PUSH_RANGES; do
    result=$(check_conventional_commits "$range")
    [ -n "$result" ] && invalid_commits="${invalid_commits}${result}"
done

if [ -n "$invalid_commits" ]; then
    error "Non-conforming commit messages detected:"
    printf "%b" "$invalid_commits"
    echo "Format: <type>(<scope>)[!]: <description>  (max 100 chars)"
    die "Please fix commit messages before pushing."
fi

success "Commit messages verified."
