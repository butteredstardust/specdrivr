#!/bin/bash

# ==============================================================================
# SPECDRIVR CODEBASE AUDIT AUTOMATION
# ==============================================================================
# Automates architectural, security, and quality checks based on the
# forensic audit report.
# ==============================================================================

# --- Configuration ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

CRITICAL=0
HIGH=0
MEDIUM=0
LOW=0

# --- Functions ---
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[PASS]${NC} $1"; }
warn() { 
    echo -e "${YELLOW}[WARN]${NC} $1"; 
    ((MEDIUM++))
}
error() { 
    echo -e "${RED}[FAIL]${NC} $1"; 
    [[ "$2" == "CRITICAL" ]] && ((CRITICAL++)) || ((HIGH++))
}

header() {
    echo -e "\n${BOLD}=== $1 ===${NC}"
}

# --- 1. Infrastructure Checks ---
header "ARCHITECTURAL INVARIANTS"

# Strict Mode Check
if grep -q '"strict": true' tsconfig.json; then
    success "TypeScript strict mode is enabled in tsconfig.json"
else
    error "TypeScript strict mode is NOT enabled in tsconfig.json" "CRITICAL"
fi

# Server Actions Usage
if grep -rE "['\"]use server['\"]" src/actions > /dev/null 2>&1; then
    success "Server Actions correctly located in src/actions"
else
    warn "No Server Actions found in src/actions"
fi

# --- 2. Dependency Audit ---
header "DEPENDENCY HYGIENE"

# Forbidden Dependencies
if grep -q '"ioredis"' package.json; then
    error "FORBIDDEN DEPENDENCY: 'ioredis' found in package.json. Use '@upstash/redis' (HTTP) only." "CRITICAL"
else
    success "No forbidden dependency 'ioredis' found"
fi

# Missing Mandatory Libraries
MANDATORY_LIBS=("framer-motion" "xterm" "react-hotkeys-hook")
for lib in "${MANDATORY_LIBS[@]}"; do
    if grep -q "\"$lib\"" package.json; then
        success "Mandatory library '$lib' found"
    else
        error "MISSING MANDATORY LIBRARY: '$lib' is required by the authoritative tech stack." "HIGH"
    fi
done

# Better Auth Alignment
if grep -A 30 '"devDependencies"' package.json | grep -q '"better-auth"'; then
    warn "'better-auth' found in devDependencies. Move to dependencies."
fi

# Server/Client Boundaries (Shiki & Imports)
CLIENT_SHIKI=$(grep -rl "import('shiki')" src --include="*.tsx" 2>/dev/null)
if [[ -n "$CLIENT_SHIKI" ]]; then
    error "SSR VIOLATION: Client-side syntax highlighting found in $CLIENT_SHIKI. Use Server Components for Shiki." "HIGH"
fi

# Prohibited imports in Client Components
CLIENT_FILES=$(grep -rl "'use client'" src --include="*.tsx" 2>/dev/null)
for file in $CLIENT_FILES; do
    if grep -q "from '@/db'" "$file"; then
        error "BOUNDARY VIOLATION: Direct DB import in Client Component $file" "CRITICAL"
    fi
    if grep -q "server-only" "$file"; then
        error "BOUNDARY VIOLATION: server-only module imported in Client Component $file" "CRITICAL"
    fi
done

# --- 3. Security Review ---
header "SECURITY & SANITIZATION"

# DOMPurify Mandatory Usage
if grep -r "DOMPurify" src > /dev/null 2>&1; then
    success "DOMPurify usage detected"
else
    error "CRITICAL SECURITY RISK: DOMPurify is NOT used for sanitization. Markdown/Terminal rendering is UNSAFE." "CRITICAL"
fi

# Sanitization Gaps: ReactMarkdown
MARKDOWN_FILES=$(grep -rl "ReactMarkdown" src --include="*.tsx" 2>/dev/null)
for file in $MARKDOWN_FILES; do
    if ! grep -q "DOMPurify" "$file"; then
        error "UNSAFE RENDERING: ReactMarkdown used without DOMPurify in $file" "HIGH"
    fi
done

# Sanitization Gaps: dangerouslySetInnerHTML
DANGER_FILES=$(grep -rl "dangerouslySetInnerHTML" src --include="*.tsx" 2>/dev/null)
for file in $DANGER_FILES; do
    if ! grep -q "DOMPurify" "$file"; then
        error "UNSAFE RENDERING: dangerouslySetInnerHTML used without DOMPurify in $file" "CRITICAL"
    fi
done

# API Route Security: Session checks and Zod validation
API_ROUTES=$(find src/app/api -name "route.ts" 2>/dev/null)
for route in $API_ROUTES; do
    # Skip known public or auth routes
    if [[ "$route" =~ "api/auth" || "$route" =~ "api/health" || "$route" =~ "api/webhooks" || "$route" =~ "api/v1/health" ]]; then
        info "PUBLIC API ROUTE: Intentionally public or auth-handled: $route"
        continue
    fi
    
    if ! grep -q "auth(" "$route"; then
        warn "API SECURITY: Potential missing session check in $route"
    fi
    if ! grep -q "z\." "$route" && grep -qE "POST|PUT|PATCH" "$route"; then
        warn "API VALIDATION: Potential missing Zod validation in mutation route $route"
    fi
done

# Next.js 16 Dynamic API Await Check
DYNAMIC_APIS=("params" "searchParams" "cookies()" "headers()")
for api in "${DYNAMIC_APIS[@]}"; do
    UNAWAITED=$(grep -rnE "[^await ]\b$api\b" src/app 2>/dev/null | grep -v "interface " | grep -v "type ")
    if [[ -n "$UNAWAITED" ]]; then
        warn "NEXT.JS 16 COMPLIANCE: Potential unawaited dynamic API '$api' in src/app"
    fi
done

# Environment Safety
ENV_LEAKS=$(grep -rn "process.env" src --exclude="src/lib/env-core.ts" --exclude="src/lib/env.ts" --exclude="src/lib/env-script.ts" 2>/dev/null)
if [[ -n "$ENV_LEAKS" ]]; then
    while IFS= read -r line; do
        file=$(echo "$line" | cut -d: -f1)
        content=$(echo "$line" | cut -d: -f2-)
        
        # Legitimate uses: NODE_ENV or NEXT_PUBLIC_*
        if [[ "$content" =~ "process.env.NODE_ENV" || "$content" =~ "process.env.NEXT_PUBLIC_" ]]; then
            info "LEGITIMATE ENV USE: Found '$content' in $file"
        else
            warn "POTENTIAL ENV LEAKAGE: Found '$content' in $file. Use '@/lib/env' for non-public vars."
        fi
    done <<< "$ENV_LEAKS"
else
    success "No process.env leakage detected outside env modules"
fi

# --- 4. Database Layer Analysis ---
header "DATABASE LAYER"

# Repository Usage in Components
COMPONENT_DB=$(grep -rl "import { db } from '@/db'" src/components 2>/dev/null)
if [[ -n "$COMPONENT_DB" ]]; then
    error "ARCHITECTURE VIOLATION: Direct DB import in component (use repositories instead): $COMPONENT_DB" "HIGH"
fi

# Pagination Check
PAGINATION_GAPS=$(grep -rlE "getAll|list|getByProjectId" src/repositories --exclude="src/repositories/base-repository.ts" 2>/dev/null)
for file in $PAGINATION_GAPS; do
    if ! grep -Ei "limit|offset|page|paginate" "$file" > /dev/null 2>&1; then
        warn "SCALABILITY RISK: Potential missing pagination in repository method: $file"
    fi
done

# Drizzle Schema Checks (FK references)
if [ -f "src/db/schema.ts" ]; then
    if grep "\.references(" src/db/schema.ts | grep -v "onDelete:" > /dev/null 2>&1; then
        warn "DATABASE INTEGRITY: Some FK references in src/db/schema.ts are missing 'onDelete' actions."
    fi
fi

# env-core.ts Direct Import Check
CORE_ENV_IMPORTS=$(grep -rl "from '@/lib/env-core'" src --exclude="src/lib/env.ts" --exclude="src/lib/env-script.ts" --exclude="src/lib/env-core.ts" 2>/dev/null)
if [[ -n "$CORE_ENV_IMPORTS" ]]; then
    warn "ARCHITECTURE VIOLATION: Direct import from env-core.ts. Use '@/lib/env' or '@/lib/env-script': $CORE_ENV_IMPORTS"
fi

# --- 5. UI & Design Standards ---
header "UI & DESIGN STANDARDS"

# Hex Color Enforcement
HEX_CODES=$(grep -rnE "#[0-9a-fA-F]{3,6}" src/components --exclude-dir="ui" 2>/dev/null)
if [[ -n "$HEX_CODES" ]]; then
    warn "DESIGN TOKEN VIOLATION: Hardcoded hex codes found in components. Use CSS variables from globals.css."
fi

# Prohibited shadcn tokens
PROHIBITED_TOKENS=("bg-background" "text-foreground" "bg-destructive")
for token in "${PROHIBITED_TOKENS[@]}"; do
    if grep -r "$token" src/components src/app > /dev/null 2>&1; then
        warn "DESIGN TOKEN VIOLATION: Prohibited shadcn token '$token' found. Use project-specific CSS variables."
    fi
done

# --- 6. Code Hygiene & Testing ---
header "CODE HYGIENE & TESTING"

# TODO/FIXME Check
TODO_COUNT=$(grep -riE "//\s*(TODO|FIXME)|/\*\s*(TODO|FIXME)" src | wc -l)
if [[ $TODO_COUNT -gt 0 ]]; then
    info "MAINTENANCE: $TODO_COUNT TODO/FIXME comments found in src/"
fi

# Placeholder Test Check
PLACEHOLDER_TESTS=$(grep -rlE "test\(['\"]todo['\"]|it\(['\"]todo['\"]" tests 2>/dev/null)
if [[ -n "$PLACEHOLDER_TESTS" ]]; then
    warn "TESTING DEBT: Placeholder 'todo' tests found in: $PLACEHOLDER_TESTS"
fi

# Committed .only/.skip check
TEST_MODIFIERS=$(grep -rlE "\.only\(|\.skip\(" tests 2>/dev/null)
if [[ -n "$TEST_MODIFIERS" ]]; then
    error "TESTING INTEGRITY: Committed .only() or .skip() found in tests: $TEST_MODIFIERS" "HIGH"
fi

# File Size Check
LARGE_FILES=$(find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | awk '$1 > 500 && $2 != "total" {print $2 " (" $1 " lines)"}')
if [[ -n "$LARGE_FILES" ]]; then
    warn "CODE QUALITY: High complexity files (>500 lines) detected."
fi

# --- 7. Standard Quality Checks ---
header "STANDARD QUALITY CHECKS"

info "Running lint..."
if pnpm lint > /dev/null 2>&1; then
    success "Linting passed"
else
    error "Linting failed. Run 'pnpm lint' to see errors." "HIGH"
fi

info "Running typecheck..."
if pnpm typecheck > /dev/null 2>&1; then
    success "Typecheck passed"
else
    error "Typecheck failed. Run 'pnpm typecheck' to see errors." "CRITICAL"
fi

info "Running unit tests..."
if pnpm test:unit > /dev/null 2>&1; then
    success "Unit tests passed"
else
    error "Unit tests failed. Run 'pnpm test:unit' to see errors." "HIGH"
fi

# --- 8. Summary ---
echo -e "\n${BOLD}=== AUDIT SUMMARY ===${NC}"
echo -e "Critical Issues: ${RED}$CRITICAL${NC}"
echo -e "High Priority:   ${RED}$HIGH${NC}"
echo -e "Medium/Low:      ${YELLOW}$MEDIUM${NC}"

if [[ $CRITICAL -gt 0 || $HIGH -gt 0 ]]; then
    echo -e "\n${RED}${BOLD}ACTION REQUIRED: Architectural and Security violations must be addressed.${NC}"
    exit 1
else
    echo -e "\n${GREEN}${BOLD}AUDIT PASSED: Codebase complies with core mandates.${NC}"
    exit 0
fi
