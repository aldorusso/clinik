#!/bin/bash
# ===========================================
# Clinik - File Size & Structure Validator
# Ensures code quality standards are maintained
# ===========================================
#
# Usage:
#   ./scripts/check-file-sizes.sh          # Default: warnings only for existing files
#   ./scripts/check-file-sizes.sh --strict # Strict mode: fail on any violation
#   ./scripts/check-file-sizes.sh --report # Report mode: just show stats, don't fail
#

MODE="${1:-default}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Relaxed limits for legacy code (current state)
# These will be gradually reduced as we refactor
PAGE_LIMIT=500
COMPONENT_LIMIT=400
UI_LIMIT=200
HOOK_LIMIT=350
BACKEND_API_LIMIT=650
BACKEND_SERVICE_LIMIT=300

# Strict limits (target for new code)
STRICT_PAGE_LIMIT=300
STRICT_COMPONENT_LIMIT=200
STRICT_UI_LIMIT=150
STRICT_HOOK_LIMIT=100
STRICT_BACKEND_API_LIMIT=300
STRICT_BACKEND_SERVICE_LIMIT=200

if [ "$MODE" == "--strict" ]; then
    echo "🔒 Running in STRICT mode - enforcing target limits"
    PAGE_LIMIT=$STRICT_PAGE_LIMIT
    COMPONENT_LIMIT=$STRICT_COMPONENT_LIMIT
    UI_LIMIT=$STRICT_UI_LIMIT
    HOOK_LIMIT=$STRICT_HOOK_LIMIT
    BACKEND_API_LIMIT=$STRICT_BACKEND_API_LIMIT
    BACKEND_SERVICE_LIMIT=$STRICT_BACKEND_SERVICE_LIMIT
elif [ "$MODE" == "--report" ]; then
    echo "📊 Running in REPORT mode - showing stats only"
fi

echo ""
echo "🔍 Checking file sizes and structure..."
echo ""

# ===========================================
# Frontend Limits
# ===========================================

echo "📄 Checking Next.js pages (max $PAGE_LIMIT lines)..."
for file in $(find frontend/app -name "page.tsx" 2>/dev/null); do
    lines=$(wc -l < "$file")
    if [ "$lines" -gt $PAGE_LIMIT ]; then
        echo -e "${RED}❌ ERROR: $file has $lines lines (max $PAGE_LIMIT)${NC}"
        echo "   → Split into smaller components"
        ERRORS=$((ERRORS + 1))
    elif [ "$lines" -gt $STRICT_PAGE_LIMIT ]; then
        echo -e "${YELLOW}⚠️  WARNING: $file has $lines lines (target: $STRICT_PAGE_LIMIT)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
done

echo "📦 Checking React components (max $COMPONENT_LIMIT lines)..."
for file in $(find frontend/components -name "*.tsx" ! -path "*/ui/*" 2>/dev/null); do
    lines=$(wc -l < "$file")
    if [ "$lines" -gt $COMPONENT_LIMIT ]; then
        echo -e "${RED}❌ ERROR: $file has $lines lines (max $COMPONENT_LIMIT)${NC}"
        echo "   → Extract logic to hooks or split into subcomponents"
        ERRORS=$((ERRORS + 1))
    elif [ "$lines" -gt $STRICT_COMPONENT_LIMIT ]; then
        echo -e "${YELLOW}⚠️  WARNING: $file has $lines lines (target: $STRICT_COMPONENT_LIMIT)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
done

echo "🎨 Checking UI components (max $UI_LIMIT lines)..."
for file in $(find frontend/components/ui -name "*.tsx" 2>/dev/null); do
    lines=$(wc -l < "$file")
    if [ "$lines" -gt $UI_LIMIT ]; then
        echo -e "${YELLOW}⚠️  WARNING: $file has $lines lines (UI components should be <$UI_LIMIT)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
done

echo "🪝 Checking custom hooks (max $HOOK_LIMIT lines)..."
for file in $(find frontend/hooks -name "use*.ts" -o -name "use*.tsx" 2>/dev/null); do
    lines=$(wc -l < "$file")
    if [ "$lines" -gt $HOOK_LIMIT ]; then
        echo -e "${RED}❌ ERROR: $file has $lines lines (max $HOOK_LIMIT)${NC}"
        echo "   → Split into smaller, focused hooks"
        ERRORS=$((ERRORS + 1))
    elif [ "$lines" -gt $STRICT_HOOK_LIMIT ]; then
        echo -e "${YELLOW}⚠️  WARNING: $file has $lines lines (target: $STRICT_HOOK_LIMIT)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
done

# ===========================================
# Backend Limits
# ===========================================

echo "🔌 Checking API endpoint files (max $BACKEND_API_LIMIT lines)..."
for file in $(find backend/app/api -name "*.py" 2>/dev/null); do
    lines=$(wc -l < "$file")
    if [ "$lines" -gt $BACKEND_API_LIMIT ]; then
        echo -e "${RED}❌ ERROR: $file has $lines lines (max $BACKEND_API_LIMIT)${NC}"
        echo "   → Move business logic to services layer"
        ERRORS=$((ERRORS + 1))
    elif [ "$lines" -gt $STRICT_BACKEND_API_LIMIT ]; then
        echo -e "${YELLOW}⚠️  WARNING: $file has $lines lines (target: $STRICT_BACKEND_API_LIMIT)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
done

echo "⚙️  Checking service files (max $BACKEND_SERVICE_LIMIT lines)..."
for file in $(find backend/app/services -name "*.py" 2>/dev/null); do
    lines=$(wc -l < "$file")
    if [ "$lines" -gt $BACKEND_SERVICE_LIMIT ]; then
        echo -e "${RED}❌ ERROR: $file has $lines lines (max $BACKEND_SERVICE_LIMIT)${NC}"
        echo "   → Split by responsibility"
        ERRORS=$((ERRORS + 1))
    elif [ "$lines" -gt $STRICT_BACKEND_SERVICE_LIMIT ]; then
        echo -e "${YELLOW}⚠️  WARNING: $file has $lines lines (target: $STRICT_BACKEND_SERVICE_LIMIT)${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
done

# ===========================================
# Summary
# ===========================================

echo ""
echo "=========================================="

if [ "$MODE" == "--report" ]; then
    if [ $ERRORS -gt 0 ] || [ $WARNINGS -gt 0 ]; then
        echo -e "${CYAN}📊 REPORT: $ERRORS file(s) exceed limits, $WARNINGS approaching limits${NC}"
    else
        echo -e "${GREEN}✅ REPORT: All files within size limits${NC}"
    fi
    exit 0
fi

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ FAILED: $ERRORS error(s), $WARNINGS warning(s)${NC}"
    echo ""
    echo "Files exceeding limits must be refactored before merging."
    echo "See .claude/rules.md for refactoring guidelines."
    echo ""
    echo "Tip: Run with --report to see stats without failing"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  PASSED with $WARNINGS warning(s)${NC}"
    echo ""
    echo "Consider refactoring files approaching limits."
    echo "Run with --strict to enforce target limits."
    exit 0
else
    echo -e "${GREEN}✅ PASSED: All files within size limits${NC}"
    exit 0
fi
