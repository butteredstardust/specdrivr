#!/usr/bin/env bash
# scripts/hooks/checks/artifacts.sh
# Check for forbidden artifacts and restricted files

set -euo pipefail

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/hooks/utils.sh
source "${HOOK_DIR}/utils.sh"

# Union of all changed files in PUSH_RANGES
all_changed=""
for range in $PUSH_RANGES; do
    all_changed="${all_changed}\n$(get_changed_files "$range")"
done
all_changed=$(echo -e "$all_changed" | sort -u | sed '/^$/d')

[ -z "$all_changed" ] && exit 0

# 1. Forbidden Artifacts (patterns from AGENTS.md)
FORBIDDEN_REGEX="^(fix-.*|debug-.*|ai-.*|agent-.*|generated-.*|.*_generated\..*|experiment-.*|scratch-.*|tmp-.*|repair-.*|migrate-quick\..*|quick-test\..*|local-.*|test-local\..*|testing\.exp|.*_output\.txt|.*_results\.txt)$"
FORBIDDEN_EXT_REGEX="\.(patch|diff|rej|orig|tmp|bak|log)$"

offending_artifacts=$(echo "$all_changed" | grep -vE "^(node_modules|dist|build|coverage|\.git)/" | grep -E "$FORBIDDEN_REGEX|$FORBIDDEN_EXT_REGEX" || true)

if [ -n "$offending_artifacts" ]; then
    error "Forbidden artifacts detected in push range:"
    echo "------------------------------------------------------------"
    echo "$offending_artifacts"
    echo "------------------------------------------------------------"
    die "Do not commit temporary AI-generated artifacts, debug scripts, or patch files."
fi

# 2. Lockfile consistency
if echo "$all_changed" | grep -q "^package\.json$" && ! echo "$all_changed" | grep -q "^pnpm-lock\.yaml$"; then
    die "package.json changed without updating pnpm-lock.yaml. Run 'pnpm install'."
fi

# 3. Restricted files
for lock in package-lock.json yarn.lock; do
    echo "$all_changed" | grep -q "^$lock$" && die "Forbidden lockfile '$lock' detected. Use pnpm-lock.yaml."
done

echo "$all_changed" | grep -q "next-env\.d\.ts" && die "Do not commit manual changes to next-env.d.ts."

success "Artifacts and restricted files checked."
