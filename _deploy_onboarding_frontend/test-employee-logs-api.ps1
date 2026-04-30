# Employee Logs API Test Script (PowerShell)
# Tests all endpoints to verify they're working correctly

$API_BASE_URL = "http://localhost:3000/api"
$BEARER_TOKEN = "test-token-placeholder"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Employee Logs API - Endpoint Tests" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Description,
        [hashtable]$Headers = @{},
        [string]$Body = ""
    )
    
    Write-Host "Test: $Description" -ForegroundColor Yellow
    Write-Host "$Method $Endpoint" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri     = "http://localhost:3000$Endpoint"
            Method  = $Method
            Headers = $Headers
            ContentType = "application/json"
            TimeoutSec = 5
        }
        
        if ($Body) {
            $params['Body'] = $Body
        }
        
        $response = Invoke-WebRequest @params -ErrorAction Stop
        Write-Host "✓ Status: $($response.StatusCode)" -ForegroundColor Green
        $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 2 | Write-Host -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Test 1: Get Task Types (Public - anyone can access)
$headers = @{
    "Content-Type" = "application/json"
}

Test-Endpoint `
    -Method "GET" `
    -Endpoint "/api/employee-logs/task-types" `
    -Description "Get Task Types (Public)" `
    -Headers $headers

# Test 2: Create Log (Requires Auth)
$createLogBody = @{
    candidate_id = "550e8400-e29b-41d4-a716-446655440000"
    task_type_id = "760e8400-e29b-41d4-a716-446655440001"
    description = "Test log creation from API"
    time_spent_minutes = 30
} | ConvertTo-Json

$authHeaders = @{
    "Authorization" = "Bearer $BEARER_TOKEN"
    "Content-Type" = "application/json"
}

Test-Endpoint `
    -Method "POST" `
    -Endpoint "/api/employee-logs/logs" `
    -Description "Create Employee Log" `
    -Headers $authHeaders `
    -Body $createLogBody

# Test 3: Get Employee Logs
Test-Endpoint `
    -Method "GET" `
    -Endpoint "/api/employee-logs/logs?startDate=2026-02-05&limit=50" `
    -Description "Get Employee Logs (Today)" `
    -Headers $authHeaders

# Test 4: Get Team Logs
Test-Endpoint `
    -Method "GET" `
    -Endpoint "/api/employee-logs/team/logs?startDate=2026-02-01&endDate=2026-02-05" `
    -Description "Get Team Logs (Manager/Admin)" `
    -Headers $authHeaders

# Test 5: Get Candidate Activity
Test-Endpoint `
    -Method "GET" `
    -Endpoint "/api/employee-logs/candidate/550e8400-e29b-41d4-a716-446655440000/activity" `
    -Description "Get Candidate Activity Log" `
    -Headers $authHeaders

# Test 6: Get Daily Summary
Test-Endpoint `
    -Method "GET" `
    -Endpoint "/api/employee-logs/team/summary?startDate=2026-02-01&endDate=2026-02-05" `
    -Description "Get Employee Daily Summary" `
    -Headers $authHeaders

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✓ If endpoints return JSON: ROUTES WORKING" -ForegroundColor Green
Write-Host "✓ If auth errors (401/403): AUTHENTICATION NEEDED" -ForegroundColor Yellow
Write-Host "✓ If connection errors: BACKEND NOT RUNNING" -ForegroundColor Red
Write-Host "==========================================" -ForegroundColor Cyan
