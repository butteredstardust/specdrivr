#!/usr/bin/env bash
# scripts/hooks/checks/images.sh
# Rule: Next.js Image Optimization
# Disallow raw <img> tags in React files. Use next/image instead.

set -euo pipefail

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/hooks/utils.sh
source "${HOOK_DIR}/utils.sh"

info "Checking for unoptimized <img> tags..."

# Only enforce in React/TSX files, ignore documentation
# Using --diff-filter=d to only check added/modified files
react_files=$(get_pushed_files "\.(tsx|jsx)$" | grep -vE "^(docs|documentation)/" || true)

if [ -z "$react_files" ]; then
    success "No React files in push to check for <img> tags."
    exit 0
fi

FAILED=0
# Regex to find <img tags
# Note: Case-insensitive search
for file in $react_files; do
    if [ ! -f "$file" ]; then continue; fi
    
    # Search for <img and ensure it's not part of a comment or a documentation file
    # We look for <img but ignore lines that contain "next/image" just in case of weird comments
    # A quoted "<img …" is a string, not JSX — an XSS-escaping test has to carry
    # the literal payload it expects the component to neutralise. JSX is never
    # written with a quote directly before the tag, so this only excuses strings.
    violations=$(grep -niE "<img\s+" "$file" \
        | grep -vE "['\"\`]<img" \
        || true)
    
    if [ -n "$violations" ]; then
        error "Unoptimized <img> tag detected in $file:"
        echo -e "$violations" | while read -r line; do
            echo "    Line $line"
        done
        echo "    Requirement: Use 'next/image' for optimized images."
        echo "    Correct usage: import Image from \"next/image\"; <Image ... />"
        FAILED=1
    fi
done

if [ $FAILED -ne 0 ]; then
    die "Next.js Image Optimization violation found. Replace all raw <img> tags with <Image />."
fi

success "Next.js Image Optimization check passed."
