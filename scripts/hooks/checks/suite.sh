#!/usr/bin/env bash
# scripts/hooks/checks/suite.sh
# Build, Typecheck, and Test suite

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

# 1. Docs-only shortcut
non_doc_files=$(echo "$all_changed" | grep -vE "\.(md|mdx|txt)$" || true)
if [ -z "$non_doc_files" ]; then
    success "Documentation-only push. Skipping full suite."
    exit 0
fi

info "Starting Build & Test Suite..."

info "Running TypeScript check..."
pnpm typecheck || die "TypeScript errors found. Run 'pnpm typecheck' for details."

info "Running ESLint..."
pnpm lint || die "Linting failed. Run 'pnpm lint' for details."

info "Running tests..."
pnpm test:unit || die "Unit tests failed. Run 'pnpm test:unit' for details."

success "Build suite passed."
