# End-to-End Smoke Test
$ErrorActionPreference = "Stop"

$FRONTEND = "https://falishajobs.up.railway.app"
$BACKEND = "https://glorious-flexibility-production.up.railway.app"

Write-Host "`n=== Recruitment Portal E2E Test ===`n" -ForegroundColor Cyan

$passed = 0
$failed = 0

function Test-Url {
    param($Name, $Url, $Pattern)
    Write-Host "Testing $Name..." -NoNewline
    try {
        $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
        if ($Pattern -and $resp.Content -notmatch $Pattern) {
            Write-Host " FAIL (pattern not found)" -ForegroundColor Red
            return $false
        }
        Write-Host " PASS" -ForegroundColor Green
        return $true
    } catch {
        Write-Host " FAIL ($($_.Exception.Message))" -ForegroundColor Red
        return $false
    }
}

# Tests
if (Test-Url "Frontend" $FRONTEND "<!doctype html") { $passed++ } else { $failed++ }
if (Test-Url "Backend Health" "$BACKEND/health" '"status":"ok"') { $passed++ } else { $failed++ }
if (Test-Url "Queue Health" "$BACKEND/api/health/queue" '"ok":true') { $passed++ } else { $failed++ }
if (Test-Url "Candidates API" "$BACKEND/api/candidates?limit=1" '"candidates"') { $passed++ } else { $failed++ }
if (Test-Url "Inbox API" "$BACKEND/api/cv-inbox/?limit=1" '"messages"') { $passed++ } else { $failed++ }

Write-Host "`n=== Results ===" -ForegroundColor Cyan
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })

if ($failed -eq 0) {
    Write-Host "`n✓ All tests passed!`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n✗ Some tests failed`n" -ForegroundColor Red
    exit 1
}
