#!/usr/bin/env bash
# scripts/hooks/checks/env-protection.sh
# Rule: .env File Protection
# Blocks commits containing real environment files.

set -euo pipefail

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/hooks/utils.sh
source "${HOOK_DIR}/utils.sh"

info "Checking for staged or pushed .env files..."

# Block all .env files except .env.example
# We check the entire repository state for added/modified .env files in the push
env_files=$(get_pushed_files "\.env(\..+)?$")

if [ -z "$env_files" ]; then
    success "No restricted .env files found."
    exit 0
fi

FAILED=0
for file in $env_files; do
    if [ "$file" != ".env.example" ]; then
        error "Forbidden file detected: $file"
        FAILED=1
    fi
done

if [ $FAILED -ne 0 ]; then
    error "CRITICAL: Do not push real environment files. Only .env.example is allowed."
    die ".env file protection violation. Remove these files and re-push."
fi

success ".env file protection check passed."
