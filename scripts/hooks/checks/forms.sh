#!/usr/bin/env bash
# scripts/hooks/checks/forms.sh
# Rule: Form Validation Standards
# <form> requires react-hook-form and zod.

set -euo pipefail

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=scripts/hooks/utils.sh
source "${HOOK_DIR}/utils.sh"

info "Checking form validation standards..."

# Filter for all pushed React files
react_files=$(get_pushed_files "\.(tsx|jsx)$")

if [ -z "$react_files" ]; then
    success "No React files in push to check for form validation standards."
    exit 0
fi

FAILED=0
# Search for <form and check for useForm/zod
for file in $react_files; do
    if [ ! -f "$file" ]; then continue; fi
    
    # Check if file has <form (ignoring case)
    if grep -qi "<form" "$file"; then
        # Check for useForm() and zod (z.object or import zod)
        # Note: We check if either useForm or zod is missing.
        HAS_USEFORM=$(grep -q "useForm(" "$file" && echo 1 || echo 0)
        HAS_ZOD=$(grep -qE "z\.object|from\s+['\"]zod" "$file" && echo 1 || echo 0)
        
        if [ "$HAS_USEFORM" -eq 0 ] || [ "$HAS_ZOD" -eq 0 ]; then
            error "Incomplete form validation in $file:"
            if [ "$HAS_USEFORM" -eq 0 ]; then
                echo "    - Missing 'react-hook-form' usage (useForm())"
            fi
            if [ "$HAS_ZOD" -eq 0 ]; then
                echo "    - Missing 'zod' validation (z.object())"
            fi
            echo "    Requirement: All <form> components must use 'react-hook-form' and 'zod' for validation."
            FAILED=1
        fi
    fi
done

if [ $FAILED -ne 0 ]; then
    die "Form validation standard violation found. Use react-hook-form and zod for all forms."
fi

success "Form validation standards check passed."
