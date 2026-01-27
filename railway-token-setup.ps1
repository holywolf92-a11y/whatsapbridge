# Railway Token Setup Script
# This script sets up your Railway project token for use with Railway CLI

# Set your Railway project token
$env:RAILWAY_TOKEN = "fe4c6bd4-c216-480e-8bf3-3a721abe9780"

# Display status
Write-Host "Railway Project Token configured!" -ForegroundColor Green
Write-Host "Token: $env:RAILWAY_TOKEN" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now use Railway CLI commands with this token." -ForegroundColor Yellow
Write-Host "Example commands:" -ForegroundColor Yellow
Write-Host "  railway status" -ForegroundColor White
Write-Host "  railway up" -ForegroundColor White
Write-Host "  railway logs" -ForegroundColor White
Write-Host ""
Write-Host "Note: You may need to authenticate first with 'railway login' if you haven't already." -ForegroundColor Yellow
