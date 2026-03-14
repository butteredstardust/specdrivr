#!/usr/bin/env bash
# scripts/hooks/checks/migrations.sh
# Rule: Database Migration Lock
# Prevent direct modification of existing migration SQL files.

set -euo pipefail

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/hooks/utils.sh
source "${HOOK_DIR}/utils.sh"

info "Checking database migration integrity..."

FAILED=0
# Loop through all pushed ranges
for range in $PUSH_RANGES; do
    # Check for Modified or Deleted files in drizzle/**/*.sql
    # Existing files should not be touched.
    # --diff-filter=MD finds modified or deleted files.
    # Note: we use --relative to get paths relative to repo root if needed, but git diff --name-only is already from root.
    modified_migrations=$(git diff --name-only --diff-filter=M "$range" | grep "^drizzle/.*\.sql$" || true)
    
    if [ -n "$modified_migrations" ]; then
        error "Direct modification of existing migrations detected:"
        echo -e "$modified_migrations"
        FAILED=1
    fi

    # Check for new migrations (A) and ensure they follow naming convention
    # Generated naming pattern: [timestamp]_[name].sql
    new_migrations=$(git diff --name-only --diff-filter=A "$range" | grep "^drizzle/.*\.sql$" || true)
    
    if [ -n "$new_migrations" ]; then
        for file in $new_migrations; do
            filename=$(basename "$file")
            # Example: 0000_jazzy_ink.sql or 1710432345_update_users.sql
            if [[ ! "$filename" =~ ^[0-9]{4,14}_[a-zA-Z0-9_]+\.sql$ ]]; then
                error "Invalid migration naming pattern: $file"
                echo "    Migrations must be generated via 'pnpm db:generate'."
                FAILED=1
            fi
        done
    fi
done

if [ $FAILED -ne 0 ]; then
    die "Database migration integrity violation. Migrations are immutable. Use 'pnpm db:generate' for new migrations."
fi

success "Database migration integrity check passed."
