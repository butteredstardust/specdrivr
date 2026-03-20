#!/usr/bin/env bash
# scripts/hooks/checks/branch.sh
# Branch protection logic

set -euo pipefail

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/hooks/utils.sh
source "${HOOK_DIR}/utils.sh"

current_branch=$(git rev-parse --abbrev-ref HEAD)

# 1. Main branch protection
for protected in main master develop staging; do
    [ "$current_branch" = "$protected" ] && \
        die "Direct pushes to '$protected' are prohibited. Use a feature branch."
done

# 2. Branch naming convention
if ! echo "$current_branch" | grep -qE "^(feat|feature|fix|bugfix|refactor|docs|test|chore|hotfix|release)/[a-z0-9_-]+$"; then
    die "Branch '$current_branch' must follow: <type>/kebab-or-snake-case\nAllowed types: feat|feature|fix|bugfix|refactor|docs|test|chore|hotfix|release"
fi

success "Branch '$current_branch' verified."
