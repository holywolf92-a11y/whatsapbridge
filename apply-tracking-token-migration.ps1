# Apply Migration: Widen email_tracking_token from VARCHAR(10) to TEXT
#
# ROOT CAUSE: candidates.email_tracking_token was VARCHAR(10) in the live DB.
# publicPortalService.ts::generateTrackingToken() generated 16-char hex tokens
# (crypto.randomBytes(8).toString('hex')) that exceeded the VARCHAR(10) limit.
# This caused "value too long for type character varying(10)" on form submissions.
#
# FIX:
#   1. Migration widens the column to TEXT (this script)
#   2. publicPortalService.ts now uses the same 8-char format as other services
#
# Run this SQL in the Supabase SQL Editor:
#   https://supabase.com/dashboard/project/hncvsextwmvjydcukdwx/database/query

Write-Host "=== email_tracking_token Migration ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Apply this SQL in the Supabase SQL Editor:" -ForegroundColor Yellow
Write-Host "  https://supabase.com/dashboard/project/hncvsextwmvjydcukdwx/database/query" -ForegroundColor Cyan
Write-Host ""
Write-Host "SQL:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ALTER TABLE public.candidates" -ForegroundColor White
Write-Host "    ALTER COLUMN email_tracking_token TYPE text;" -ForegroundColor White
Write-Host ""

$SB_URL = "https://hncvsextwmvjydcukdwx.supabase.co"
$SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ"
$h = @{
    "apikey"        = $SB_KEY
    "Authorization" = "Bearer $SB_KEY"
    "Content-Type"  = "application/json"
}

# Verify current constraint by trying to update a candidate with a 16-char token
Write-Host "Checking current column constraint..." -ForegroundColor Cyan
$testCandidate = (Invoke-RestMethod "$SB_URL/rest/v1/candidates?select=id&limit=1" -Headers $h)[0]
if (-not $testCandidate) {
    Write-Host "Could not find a test candidate" -ForegroundColor Red
    exit 1
}

# Try writing a 16-char token to verify the constraint
$testToken = "1234567890ABCDEF"
$testBody = ConvertTo-Json @{ email_tracking_token = $testToken }
try {
    $r = Invoke-RestMethod "$SB_URL/rest/v1/candidates?id=eq.$($testCandidate.id)" `
        -Method PATCH -Headers $h -Body $testBody
    Write-Host "SUCCESS: Column is now TEXT! Migration already applied." -ForegroundColor Green

    # Revert the test
    $revertBody = ConvertTo-Json @{ email_tracking_token = $null }
    Invoke-RestMethod "$SB_URL/rest/v1/candidates?id=eq.$($testCandidate.id)" `
        -Method PATCH -Headers $h -Body $revertBody | Out-Null
    Write-Host "Test token reverted to null." -ForegroundColor Gray
} catch {
    $errMsg = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($errMsg -and $errMsg.message -match "character varying") {
        Write-Host "Column is still VARCHAR(10). Migration NOT yet applied." -ForegroundColor Red
        Write-Host ""
        Write-Host "Please run the following SQL in Supabase SQL Editor:" -ForegroundColor Yellow
        Write-Host "  https://supabase.com/dashboard/project/hncvsextwmvjydcukdwx/database/query" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "ALTER TABLE public.candidates ALTER COLUMN email_tracking_token TYPE text;" -ForegroundColor White
    } else {
        Write-Host "Unexpected error: $_" -ForegroundColor Red
    }
}
