# Railway Environment Configuration
# Use Railway browser login instead of storing long-lived tokens in scripts.

Remove-Item Env:RAILWAY_TOKEN -ErrorAction SilentlyContinue

Write-Host "Cleared any session RAILWAY_TOKEN override." -ForegroundColor Green
Write-Host "Use 'railway login' to authenticate with the Falisha Manpower account." -ForegroundColor Yellow
Write-Host "Current Railway project: glorious-flexibility" -ForegroundColor Cyan
