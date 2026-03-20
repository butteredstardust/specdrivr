#!/usr/bin/env bash
# scripts/hooks/checks/xss.sh
# Rule: XSS Prevention
# Detect dangerouslySetInnerHTML without an approved sanitization call.
# Approved: DOMPurify.sanitize() or the project's sanitizeHtml() wrapper.

set -euo pipefail

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/hooks/utils.sh
source "${HOOK_DIR}/utils.sh"

info "Checking for unsafe XSS patterns..."

# Filter for React files
react_files=$(get_pushed_files "\.(tsx|jsx)$")

if [ -z "$react_files" ]; then
    success "No React files in push to check for XSS."
    exit 0
fi

FAILED=0
# Regex to find dangerouslySetInnerHTML that DOES NOT contain DOMPurify.sanitize
# Note: This is a static analysis check and might have edge cases, but covers the common cases.
for file in $react_files; do
    if [ ! -f "$file" ]; then continue; fi
    
    # We look for lines containing dangerouslySetInnerHTML that use neither DOMPurify.sanitize
    # nor the project's sanitizeHtml() wrapper (which calls DOMPurify internally).
    violations=$(grep -n "dangerouslySetInnerHTML" "$file" | grep -v "DOMPurify\.sanitize" | grep -v "sanitizeHtml(" || true)
    
    if [ -n "$violations" ]; then
        error "Potentially unsafe dangerouslySetInnerHTML usage in $file:"
        echo -e "$violations" | while read -r line; do
            echo "    Line $line"
        done
        echo "    Requirement: All HTML injected via dangerouslySetInnerHTML must be sanitized using 'DOMPurify.sanitize()' or 'sanitizeHtml()' (project wrapper)."
        FAILED=1
    fi
done

if [ $FAILED -ne 0 ]; then
    die "XSS prevention check failed. Sanitize all dangerouslySetInnerHTML usage with DOMPurify."
fi

success "XSS prevention check passed."
