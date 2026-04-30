#!/bin/bash

# Employee Logs API Test Script
# Tests all endpoints to ensure they're working correctly

API_BASE_URL="http://localhost:3000/api"
BEARER_TOKEN="test-token-placeholder" # Will be replaced with actual token

echo "=========================================="
echo "Employee Logs API - Endpoint Tests"
echo "=========================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Get Task Types (No auth required initially)
echo -e "${YELLOW}Test 1: Get Task Types${NC}"
echo "GET /api/employee-logs/task-types"
curl -s -X GET \
  "http://localhost:3000/api/employee-logs/task-types" \
  -H "Content-Type: application/json" | jq '.' || echo "❌ Failed"
echo ""

# Test 2: Create Log (Requires Auth)
echo -e "${YELLOW}Test 2: Create Employee Log${NC}"
echo "POST /api/employee-logs/logs"
echo "Required: Bearer token from authenticated session"
curl -s -X POST \
  "http://localhost:3000/api/employee-logs/logs" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": "test-candidate-uuid",
    "task_type_id": "test-task-type-uuid",
    "description": "Test log creation",
    "time_spent_minutes": 30
  }' | jq '.' || echo "❌ Failed - Check auth token"
echo ""

# Test 3: Get Employee Logs
echo -e "${YELLOW}Test 3: Get Employee Logs${NC}"
echo "GET /api/employee-logs/logs?startDate=2026-02-05&limit=50"
curl -s -X GET \
  "http://localhost:3000/api/employee-logs/logs?startDate=2026-02-05&limit=50" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" | jq '.' || echo "❌ Failed - Check auth token"
echo ""

# Test 4: Get Team Logs (Manager/Admin)
echo -e "${YELLOW}Test 4: Get Team Logs (Manager/Admin Only)${NC}"
echo "GET /api/employee-logs/team/logs"
curl -s -X GET \
  "http://localhost:3000/api/employee-logs/team/logs" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" | jq '.' || echo "❌ Failed - Check auth token and role"
echo ""

# Test 5: Get Candidate Activity
echo -e "${YELLOW}Test 5: Get Candidate Activity${NC}"
echo "GET /api/employee-logs/candidate/{candidateId}/activity"
curl -s -X GET \
  "http://localhost:3000/api/employee-logs/candidate/test-candidate-uuid/activity" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" | jq '.' || echo "❌ Failed"
echo ""

echo -e "${GREEN}=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "✓ If tests above return JSON data: ${GREEN}PASS${NC}"
echo -e "✓ If tests show auth errors: Expected (no valid token)"
echo -e "✓ If tests show connection error: Backend not running"
echo "==========================================${NC}"
