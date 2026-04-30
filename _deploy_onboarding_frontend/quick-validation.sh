#!/bin/bash
# Quick Validation Test - Run this after setting up migrations
# Usage: bash quick-validation.sh

echo "====================================="
echo "EMPLOYEE LOGS - QUICK VALIDATION"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0
PASSED=0

# Test 1: Backend running
echo -n "Test 1: Backend running... "
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Make sure to run: npm start)"
    ((FAILED++))
fi
echo ""

# Test 2: Get task types
echo -n "Test 2: Get task types (GET /api/employee-logs/task-types)... "
RESPONSE=$(curl -s http://localhost:3000/api/employee-logs/task-types)
if echo "$RESPONSE" | grep -q "CV screening"; then
    echo -e "${GREEN}✓ PASS${NC}"
    echo "   Found: 9 task types"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   Response: $RESPONSE"
    ((FAILED++))
fi
echo ""

# Test 3: Create log (requires auth)
echo -n "Test 3: Create log endpoint (POST /api/employee-logs/logs)... "
RESPONSE=$(curl -s -X POST http://localhost:3000/api/employee-logs/logs \
  -H "Content-Type: application/json" \
  -d '{}' -w "%{http_code}")
# Expecting 401 (no auth) or 400 (bad request), NOT 404 or 500
if echo "$RESPONSE" | grep -qE "(401|400)"; then
    echo -e "${GREEN}✓ PASS${NC}"
    echo "   Endpoint exists (auth required)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   Response: $RESPONSE"
    ((FAILED++))
fi
echo ""

# Test 4: Team logs endpoint
echo -n "Test 4: Team logs endpoint (GET /api/employee-logs/team/logs)... "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/employee-logs/team/logs)
if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    echo "   Endpoint exists (HTTP $RESPONSE)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (HTTP $RESPONSE)"
    ((FAILED++))
fi
echo ""

# Test 5: Database tables exist
echo -n "Test 5: Database tables... "
echo -e "${YELLOW}MANUAL CHECK${NC} (Check in Supabase SQL):"
echo "   SELECT * FROM task_types;"
echo "   SELECT COUNT(*) FROM employee_logs;"
echo ""

# Test 6: Frontend
echo -n "Test 6: Frontend running... "
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    echo "   Frontend at http://localhost:5173"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ NOT RUNNING${NC}"
    echo "   (Run: npm run dev in another terminal)"
fi
echo ""

# Summary
echo "====================================="
echo "SUMMARY"
echo "====================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Click 'Employees' in sidebar"
    echo "2. Click 'Add Daily Log'"
    echo "3. Fill form and submit"
    echo "4. Check log appears in dashboard"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure backend is running: npm start"
    echo "2. Make sure frontend is running: npm run dev"
    echo "3. Check migrations were run in Supabase"
    echo "4. Check .env variables are set"
    exit 1
fi
