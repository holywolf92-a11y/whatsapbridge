# Railway CLI Auth Helper
# Avoid storing Railway tokens in source-controlled scripts.

Remove-Item Env:RAILWAY_TOKEN -ErrorAction SilentlyContinue

Write-Host "Removed any session RAILWAY_TOKEN override." -ForegroundColor Green
Write-Host "Authenticate with: railway login" -ForegroundColor Yellow
Write-Host "Expected account: falishamanpower4035@gmail.com" -ForegroundColor Cyan
Write-Host "Project: glorious-flexibility" -ForegroundColor Cyan
Write-Host ""
Write-Host "Example commands:" -ForegroundColor Yellow
Write-Host "  railway status" -ForegroundColor White
Write-Host "  railway service status" -ForegroundColor White
Write-Host "  railway service logs --lines 50" -ForegroundColor White
