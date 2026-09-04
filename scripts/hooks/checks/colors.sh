#!/usr/bin/env bash
# scripts/hooks/checks/colors.sh
# Rule: Design System Color Enforcement
# Disallow hardcoded hex colors. Use design tokens (CSS variables) instead.

set -euo pipefail

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/hooks/utils.sh
source "${HOOK_DIR}/utils.sh"

info "Checking for hardcoded hex colors..."

# Filter for pushed styling and markup files
style_files=$(get_pushed_files "\.(tsx|jsx|css|scss)$")

if [ -z "$style_files" ]; then
    success "No styling files in push to check for hex colors."
    exit 0
fi

FAILED=0
# Regex to find hex colors: #[0-9a-fA-F]{3,6}
# We must be careful not to match things like CSS variable names or other IDs,
# but usually in styling it's fairly unique.
# We ignore some common patterns like #fff, #000 if needed, but the rule says NO hex colors.
HEX_PATTERN='#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b'

for file in $style_files; do
    if [ ! -f "$file" ]; then continue; fi

    # globals.css is the legitimate home of design token definitions (CSS custom properties).
    # Hex values there are intentional — they ARE the design tokens. Skip it.
    if [[ "$file" == *"globals.css" ]]; then continue; fi

    # Search for hex colors.
    # `grep -n` prefixes each hit with "NN:", so the comment filter has to skip
    # that prefix — anchoring on ^// matched nothing and let commented-out hexes
    # through.
    # A canvas cannot consume a CSS custom property, so `live-terminal.tsx` reads
    # tokens through getComputedStyle and passes a literal as the fallback for
    # when the variable does not resolve. That call *is* the token system, so
    # `token('--name', '#hex')` is exempt; a bare hex in the same file is not.
    violations=$(grep -nE "$HEX_PATTERN" "$file" \
        | grep -vE "^[0-9]+:[[:space:]]*(//|/\*|\*)" \
        | grep -vE "token\([[:space:]]*['\"]--[a-zA-Z0-9-]+['\"],[[:space:]]*['\"]#[0-9a-fA-F]{3,6}['\"][[:space:]]*\)" \
        || true)
    
    if [ -n "$violations" ]; then
        error "Hardcoded hex color detected in $file:"
        echo -e "$violations" | while read -r line; do
            echo "    Line $line"
        done
        echo "    Requirement: Use design tokens (CSS variables from globals.css) instead of hex codes."
        FAILED=1
    fi
done

if [ $FAILED -ne 0 ]; then
    die "Design system color violation found. Replace all hex colors with design tokens."
fi

success "Design system color enforcement check passed."
