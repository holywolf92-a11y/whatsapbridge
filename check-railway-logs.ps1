# Check Railway logs for photo extraction debugging
$token = "6bf7dad2-652a-49fd-a330-37c9fd51ab45"
$env:RAILWAY_TOKEN = $token

Write-Host "=== Checking Python Parser Logs ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Looking for photo extraction logs..." -ForegroundColor Yellow
Write-Host ""

# Try to get logs
$logs = railway logs --limit 200 2>&1

# Filter for relevant lines
$photoLogs = $logs | Select-String -Pattern "PhotoExtract|photo|jpeg|AppendDoc.*Photo|Split.*photo" -Context 1

if ($photoLogs) {
    Write-Host "Found photo-related logs:" -ForegroundColor Green
    $photoLogs | ForEach-Object { Write-Host $_.Line -ForegroundColor Gray }
} else {
    Write-Host "No photo extraction logs found." -ForegroundColor Red
    Write-Host ""
    Write-Host "This could mean:" -ForegroundColor Yellow
    Write-Host "1. No photos were processed recently" -ForegroundColor Gray
    Write-Host "2. Document wasn't categorized as 'photos'" -ForegroundColor Gray
    Write-Host "3. Railway CLI not working properly" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Recent Error Logs ===" -ForegroundColor Cyan
$errorLogs = $logs | Select-String -Pattern "ERROR|Failed|Exception" | Select-Object -First 10
if ($errorLogs) {
    $errorLogs | ForEach-Object { Write-Host $_.Line -ForegroundColor Red }
} else {
    Write-Host "No recent errors found" -ForegroundColor Green
}
