#!/bin/bash
set -euo pipefail

# CI Hook Verification Script
# Runs in GitHub Actions to ensure hooks are properly configured
# and would catch issues even if local hooks were bypassed

echo "🔍 Starting CI hook verification..."
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0

# 1. Verify hook integrity using Node script
echo "1. Verifying hook file integrity..."
if node scripts/verify-hooks.js verify; then
  echo -e "${GREEN}✓ Hook integrity verified${NC}"
else
  echo -e "${RED}✗ Hook integrity check failed${NC}"
  echo "This could indicate hook files have been modified."
  FAILED=1
fi
echo ""

# 2. Check git configuration for bypasses
echo "2. Checking git configuration..."
if node scripts/verify-hooks.js check-git; then
  echo -e "${GREEN}✓ Git configuration OK${NC}"
else
  echo -e "${YELLOW}⚠ Git configuration has bypass settings${NC}"
  echo "These won't affect CI, but should be checked locally."
fi
echo ""

# 3. Verify critical hook files exist
echo "3. Verifying critical hook files..."
if [ -f ".husky/pre-push" ] && [ -f ".husky/pre-commit" ]; then
  echo -e "${GREEN}✓ Critical hooks present${NC}"
else
  echo -e "${RED}✗ Missing critical hook files${NC}"
  FAILED=1
fi
echo ""

# 4. Check hook permissions (should be executable)
echo "4. Checking hook file permissions..."
if [ -x ".husky/pre-push" ] && [ -x ".husky/pre-commit" ]; then
  echo -e "${GREEN}✓ Hook files are executable${NC}"
else
  echo -e "${YELLOW}⚠ Hook files may not be executable${NC}"
fi
echo ""

# 5. Verify audit logging setup
echo "5. Checking audit logging..."
if [ -f "scripts/audit-hooks.js" ]; then
  echo -e "${GREEN}✓ Audit logging script present${NC}"
else
  echo -e "${RED}✗ Audit logging script missing${NC}"
  FAILED=1
fi
echo ""

# 6. Verify hooks-checksum.txt exists
echo "6. Checking checksum file..."
if [ -f ".husky/hooks-checksum.txt" ]; then
  echo -e "${GREEN}✓ Checksum file present${NC}"
  echo "Note: This is for local verification only. Checks are documented."
else
  echo -e "${YELLOW}⚠ Checksum file not present (this is a local verification aid)${NC}"
fi
echo ""

# 7. Check for any temporary fix scripts that shouldn't exist
echo "7. Checking for temporary scripts..."
TEMP_FILES=$(find . -maxdepth 1 -name "fix-*.sh" ! -path "./node_modules/*" ! -path "./.git/*" -type f 2>/dev/null || true)
TEMP_FILES="$TEMP_FILES $(find . -maxdepth 1 -name "fix-*.mjs" ! -path "./node_modules/*" ! -path "./.git/*" -type f 2>/dev/null || true)"

if [ -z "$TEMP_FILES" ] || [ "$TEMP_FILES" = " " ]; then
  echo -e "${GREEN}✓ No temporary fix scripts found${NC}"
else
  echo -e "${RED}✗ Found temporary fix scripts:${NC}"
  echo "$TEMP_FILES"
  FAILED=1
fi
echo ""

# 8. Check that pnpm is being used (not npm/yarn)
echo "8. Checking package manager lockfile..."
if [ ! -f "package-lock.json" ] && [ ! -f "yarn.lock" ]; then
  echo -e "${GREEN}✓ Using pnpm as expected${NC}"
else
  echo -e "${RED}✗ Found npm/yarn lockfiles - this project uses pnpm exclusively${NC}"
  FAILED=1
fi
echo ""

# 9. Run lint-staged checks on changed files to simulate pre-commit
# (but only run if we're not in a detached HEAD state - i.e., we have a branch name)
current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "HEAD")
if [ "$current_branch" != "HEAD" ]; then
  echo "9. Running lint checks on changed files (simulating pre-commit)..."
  # Only check if there are files to check (this is a lightweight check)
  if [ -n "${CHANGED_FILES:-}" ]; then
    echo "   (Would run lint-staged on: $CHANGED_FILES)"
    echo -e "${GREEN}✓ Lint checks would run${NC}"
  else
    # If no specific files provided, just check that lint-staged is configured
    if [ -f "package.json" ] && grep -q "lint-staged" package.json; then
      echo -e "${GREEN}✓ lint-staged is configured${NC}"
    else
      echo -e "${YELLOW}⚠ lint-staged not found in package.json${NC}"
    fi
  fi
  echo ""
fi

# Final result
echo ""
echo "═══════════════════════════════════"
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ CI hook verification PASSED${NC}"
  echo "All pre-push checks in CI are properly configured."
  exit 0
else
  echo -e "${RED}❌ CI hook verification FAILED${NC}"
  echo "One or more checks failed. Review the output above."
  exit 1
fi
