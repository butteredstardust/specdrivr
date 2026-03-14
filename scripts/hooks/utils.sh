#!/usr/bin/env bash
# scripts/hooks/utils.sh
# Shared utilities and Git wrappers for modular hooks

set -euo pipefail

# ─── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ─── Logging ─────────────────────────────────────────────────────────────────
info() { echo -e "${BLUE}info${NC} $*"; }
success() { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}warn${NC} $*"; }
error() { echo -e "${RED}error${NC} $*"; }

die() {
    error "$*"
    exit 1
}

# Audit logging helper
# Must be non-blocking and fail silently
log_audit() {
    local hook_name="$1"
    local status="$2"
    local extra="$3"
    local user
    user=$(get_username)
    
    if [ -f "scripts/audit-hooks.js" ] && command -v node >/dev/null 2>&1; then
        # Run in background, hide errors
        node scripts/audit-hooks.js "$hook_name" "$user" "$status" "$extra" >/dev/null 2>&1 &
    fi
}

# ─── Tool Checks ─────────────────────────────────────────────────────────────
check_tool() {
    if ! command -v "$1" >/dev/null 2>&1; then
        die "Required tool '$1' not found. Please install it."
    fi
}

# ─── Git Utilities ────────────────────────────────────────────────────────────

# Cache common git values
GIT_USER_NAME=""
get_username() {
    if [ -z "$GIT_USER_NAME" ]; then
        GIT_USER_NAME=$(git config user.name 2>/dev/null || echo "unknown")
    fi
    echo "$GIT_USER_NAME"
}

get_staged_files() {
    git diff --cached --name-only
}

get_staged_files_count() {
    # Efficiently count staged files without wc -l subshell
    git status --porcelain=v1 | grep -c "^[MADRC]" || echo 0
}

get_changed_files() {
    local range="$1"
    git diff --name-only "$range" 2>/dev/null || echo ""
}

get_added_files() {
    local range="$1"
    git diff --name-only --diff-filter=A "$range" 2>/dev/null || echo ""
}

get_git_object_size() {
    local rev="$1"
    local file="$2"
    git cat-file -s "${rev}:${file}" 2>/dev/null || echo "0"
}

get_pushed_files() {
    local filter="${1:-}"
    local files=""
    for range in $PUSH_RANGES; do
        if [ -n "$filter" ]; then
            files="${files}\n$(git diff --name-only --diff-filter=d "$range" | grep -E "$filter" || true)"
        else
            files="${files}\n$(git diff --name-only --diff-filter=d "$range" || true)"
        fi
    done
    echo -e "$files" | sort -u | sed '/^$/d'
}

check_conventional_commits() {
    local range="$1"
    local pattern="^(feat|feature|fix|bugfix|docs|style|refactor|perf|test|build|ci|chore|revert|merge)(\(.+\))?(!)?: .{1,100}$"
    local invalid=""
    
    while IFS= read -r sha; do
        msg=$(git log -1 --pretty=%s "$sha")
        if ! echo "$msg" | grep -qE "$pattern"; then
            invalid="${invalid}  $sha: $msg\n"
        fi
    done < <(git log --pretty=format:"%H" "$range")
    
    echo -e "$invalid"
}
