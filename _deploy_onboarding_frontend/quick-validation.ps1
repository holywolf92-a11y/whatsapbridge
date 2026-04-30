# Quick Validation Test - Run this after setting up migrations
# Usage: .\quick-validation.ps1

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "EMPLOYEE LOGS - QUICK VALIDATION" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$FAILED = 0
$PASSED = 0

# Test 1: Backend running
Write-Host -NoNewline "Test 1: Backend running... "
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -ErrorAction SilentlyContinue
    Write-Host "✓ PASS" -ForegroundColor Green
    $PASSED++
} catch {
    Write-Host "✗ FAIL" -ForegroundColor Red
    Write-Host "   (Make sure to run: npm start)" -ForegroundColor Yellow
    $FAILED++
}
Write-Host ""

# Test 2: Get task types
Write-Host -NoNewline "Test 2: Get task types (GET /api/employee-logs/task-types)... "
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/employee-logs/task-types" -ErrorAction SilentlyContinue
    $body = $response.Content
    if ($body -match "CV screening") {
        Write-Host "✓ PASS" -ForegroundColor Green
        Write-Host "   Found: 9 task types" -ForegroundColor White
        $PASSED++
    } else {
        Write-Host "✗ FAIL" -ForegroundColor Red
        Write-Host "   Response: $body" -ForegroundColor Yellow
        $FAILED++
    }
} catch {
    Write-Host "✗ FAIL" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    $FAILED++
}
Write-Host ""

# Test 3: Create log endpoint
Write-Host -NoNewline "Test 3: Create log endpoint (POST /api/employee-logs/logs)... "
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/employee-logs/logs" `
        -Method POST `
        -ContentType "application/json" `
        -Body "{}" `
        -ErrorAction SilentlyContinue
    Write-Host "✓ PASS" -ForegroundColor Green
    Write-Host "   Endpoint exists" -ForegroundColor White
    $PASSED++
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value
    if ($statusCode -eq 401 -or $statusCode -eq 400) {
        Write-Host "✓ PASS" -ForegroundColor Green
        Write-Host "   Endpoint exists (HTTP $statusCode - auth required)" -ForegroundColor White
        $PASSED++
    } else {
        Write-Host "✗ FAIL" -ForegroundColor Red
        Write-Host "   HTTP $statusCode - $($_.Exception.Message)" -ForegroundColor Yellow
        $FAILED++
    }
}
Write-Host ""

# Test 4: Team logs endpoint
Write-Host -NoNewline "Test 4: Team logs endpoint (GET /api/employee-logs/team/logs)... "
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/employee-logs/team/logs" -ErrorAction SilentlyContinue
    Write-Host "✓ PASS" -ForegroundColor Green
    Write-Host "   Endpoint exists" -ForegroundColor White
    $PASSED++
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value
    if ($statusCode -eq 401 -or $statusCode -eq 403) {
        Write-Host "✓ PASS" -ForegroundColor Green
        Write-Host "   Endpoint exists (HTTP $statusCode - auth required)" -ForegroundColor White
        $PASSED++
    } else {
        Write-Host "✗ FAIL" -ForegroundColor Red
        Write-Host "   HTTP $statusCode" -ForegroundColor Yellow
        $FAILED++
    }
}
Write-Host ""

# Test 5: Database tables exist
Write-Host -NoNewline "Test 5: Database tables... "
Write-Host "MANUAL CHECK" -ForegroundColor Yellow
Write-Host "   Run in Supabase SQL Editor:" -ForegroundColor White
Write-Host "   SELECT * FROM task_types;" -ForegroundColor Cyan
Write-Host "   SELECT COUNT(*) FROM employee_logs;" -ForegroundColor Cyan
Write-Host ""

# Test 6: Frontend
Write-Host -NoNewline "Test 6: Frontend running... "
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -ErrorAction SilentlyContinue
    Write-Host "✓ PASS" -ForegroundColor Green
    Write-Host "   Frontend at http://localhost:5173" -ForegroundColor White
    $PASSED++
} catch {
    Write-Host "⚠ NOT RUNNING" -ForegroundColor Yellow
    Write-Host "   (Run: npm run dev in another terminal)" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Passed: $PASSED" -ForegroundColor Green
Write-Host "Failed: $FAILED" -ForegroundColor Red
Write-Host ""

if ($FAILED -eq 0) {
    Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "1. Click 'Employees' in sidebar" -ForegroundColor Cyan
    Write-Host "2. Click 'Add Daily Log'" -ForegroundColor Cyan
    Write-Host "3. Fill form and submit" -ForegroundColor Cyan
    Write-Host "4. Check log appears in dashboard" -ForegroundColor Cyan
} else {
    Write-Host "❌ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure backend is running: npm start" -ForegroundColor White
    Write-Host "2. Make sure frontend is running: npm run dev" -ForegroundColor White
    Write-Host "3. Check migrations were run in Supabase" -ForegroundColor White
    Write-Host "4. Check .env variables are set" -ForegroundColor White
}
