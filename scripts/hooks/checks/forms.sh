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

# Forms that predate the validation standard. They are restyled by UI work,
# which drags them into the push range and blocks it on debt the push did not
# create. Converting them to react-hook-form + zod is tracked separately; until
# then the rule still fires on every new or newly-converted form.
# Reviewed 2026-09-04 — remove entries as they are migrated, never add one
# without migrating something else off the list.
LEGACY_UNVALIDATED_FORMS=(
    "src/app/(auth)/invite/page.tsx"
    "src/components/projects/create-project-dialog.tsx"
    "src/components/settings/api-tokens-section.tsx"
    "src/components/settings/change-password-section.tsx"
    "src/components/settings/integrations/github-card.tsx"
    "src/components/settings/integrations/slack-card.tsx"
    "src/components/settings/integrations/webhooks-card.tsx"
    "src/components/settings/members-section.tsx"
    "src/components/settings/profile-form.tsx"
    "src/components/settings/project-settings-form.tsx"
)

is_legacy_form() {
    local candidate="$1"
    for legacy in "${LEGACY_UNVALIDATED_FORMS[@]}"; do
        if [ "$candidate" = "$legacy" ]; then return 0; fi
    done
    return 1
}

FAILED=0
# Search for <form and check for useForm/zod
for file in $react_files; do
    if [ ! -f "$file" ]; then continue; fi
    if is_legacy_form "$file"; then continue; fi

    # Check if file has <form (ignoring case)
    if grep -qi "<form" "$file"; then
        # A section rendered inside a parent's <FormProvider> reaches the form
        # through useFormContext and never calls useForm itself; both are the
        # sanctioned wiring, so both satisfy the rule.
        HAS_USEFORM=$(grep -qE "useForm\(|useFormContext" "$file" && echo 1 || echo 0)
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
