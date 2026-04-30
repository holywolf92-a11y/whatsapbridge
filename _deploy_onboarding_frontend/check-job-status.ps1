[string]$BACKEND = "https://glorious-flexibility-production.up.railway.app"

Write-Host "Checking parsing job status..." -ForegroundColor Cyan

$jobId = "bcbe9e2b-1fbc-4c32-83df-f8787ae79f96"

# Poll job status
for ($i = 1; $i -le 5; $i++) {
    Write-Host ("`nCheck {0}:" -f $i) -ForegroundColor Gray
    
    try {
        $resp = Invoke-WebRequest -Uri "$BACKEND/api/parsing-jobs/$jobId" -UseBasicParsing
        $job = $resp.Content | ConvertFrom-Json
        
        Write-Host "  Status: $($job.status)" -ForegroundColor Cyan
        Write-Host "  Attempts: $($job.attempts)" -ForegroundColor Gray
        
        if ($job.result) {
            Write-Host "  Name: $($job.result.name)" -ForegroundColor Green
            Write-Host "  Email: $($job.result.email)" -ForegroundColor Green
            Write-Host "  Parsed: YES" -ForegroundColor Green
            break
        }
        
        if ($job.status -eq "failed") {
            Write-Host "  Error: Job failed" -ForegroundColor Red
            break
        }
        
        Start-Sleep -Seconds 2
    } catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Checking Frontend Inbox ===" -ForegroundColor Cyan
Write-Host "Visit: https://falishajobs.up.railway.app" -ForegroundColor Cyan
Write-Host "Navigate to: Inbox (CVs)" -ForegroundColor Cyan
Write-Host "Look for: Ibtehaj Uddin Ahmed Siddiqui" -ForegroundColor Cyan
