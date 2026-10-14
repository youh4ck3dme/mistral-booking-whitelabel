#!/bin/bash

# NEXIFY AutoOps & BizAgent 4.0 - Quick Test Script
# Run this to verify basic functionality

set -e

echo "=========================================="
echo "NEXIFY Implementation Quick Tests"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
PASSED=0
FAILED=0

# Test 1: Lint
echo -n "[1/5] Running ESLint... "
if pnpm lint > /dev/null 2>&1; then
    echo -e "${GREEN}PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAILED++))
fi

# Test 2: TypeScript
echo -n "[2/5] Running TypeScript check... "
if (cd apps/web && npx tsc --noEmit > /dev/null 2>&1); then
    echo -e "${GREEN}PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAILED++))
fi
cd ../..

# Test 3: File existence checks
echo -n "[3/5] Checking file existence... "
FILES=(
    "packages/@repo/ai/src/assistant/biz-agent.ts"
    "packages/@repo/ai/src/assistant/biz-agent.test.ts"
    "apps/web/app/api/chat/biz-agent/route.ts"
    "apps/web/app/api/cron/autoops-worker/route.ts"
    "apps/web/components/booking/InteractiveFloorCanvas.tsx"
    "supabase/migrations/20261014150000_autoops_tables.sql"
)

ALL_EXIST=true
for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        ALL_EXIST=false
        echo "  Missing: $file"
    fi
done

if [ "$ALL_EXIST" = true ]; then
    echo -e "${GREEN}PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAILED++))
fi

# Test 4: Export check
echo -n "[4/5] Checking BizAgent export... "
if grep -q "biz-agent" packages/@repo/ai/src/index.ts; then
    echo -e "${GREEN}PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}FAIL${NC}"
    ((FAILED++))
fi

# Test 5: Git status
echo -n "[5/5] Checking git status... "
if [ -z "$(git status --short 2>/dev/null)" ]; then
    echo -e "${GREEN}PASS${NC} (clean)"
    ((PASSED++))
else
    echo -e "${YELLOW}INFO${NC} (changes present)"
    git status --short 2>/dev/null | sed 's/^/  /'
    ((PASSED++))
fi

echo ""
echo "=========================================="
echo "Test Results:"
echo "  Passed: $PASSED"
echo "  Failed: $FAILED"
echo "=========================================="
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All basic tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Manually test API endpoints"
    echo "  2. Apply database migration"
    echo "  3. Test with real data"
    exit 0
else
    echo -e "${RED}Some tests failed. Please review.${NC}"
    exit 1
fi
