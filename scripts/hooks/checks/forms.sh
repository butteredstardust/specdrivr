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

    # Match the `<form>` element only. A bare `<form` substring also matches
    # component names that merely start with "Form" (`<FormField`, `<FormRow`),
    # which are label/layout wrappers with no form semantics — requiring a
    # delimiter after the tag name keeps those out.
    if grep -qiE "<form[[:space:]/>]" "$file"; then
        # A section rendered inside a parent's <FormProvider> reaches the form
        # through useFormContext and never calls useForm itself; both are the
        # sanctioned wiring, so both satisfy the rule.
        # `useForm<Values>(...)` is the normal typed call, so the paren does not
        # follow the name directly — matching only `useForm(` missed every form
        # that passes a type argument, which is most of them.
        HAS_USEFORM=$(grep -qE "useForm\s*[<(]|useFormContext" "$file" && echo 1 || echo 0)
        # Schemas live in @/lib/schemas and arrive via zodResolver, so requiring
        # an inline z.object() flagged correctly-validated forms as violations.
        HAS_ZOD=$(grep -qE "z\.object|from\s+['\"]zod|zodResolver|from\s+['\"]@/lib/schemas" "$file" && echo 1 || echo 0)
        # A section does not own the schema — its parent resolver does.
        if grep -q "useFormContext" "$file"; then HAS_ZOD=1; fi

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
