# PowerShell script to set VITE_API_BASE_URL in Railway
# Run this after authenticating with Railway CLI: railway login

Write-Host "`n=== Setting VITE_API_BASE_URL in Railway ===" -ForegroundColor Cyan

# Backend URL
$backendUrl = "https://glorious-flexibility-production.up.railway.app/api"

# Frontend service name
$serviceName = "recruitment-frontend"

Write-Host "`nBackend URL: $backendUrl" -ForegroundColor White
Write-Host "Service: $serviceName" -ForegroundColor White

# Check if Railway CLI is authenticated
Write-Host "`nChecking Railway authentication..." -ForegroundColor Yellow
$whoami = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Railway CLI is not authenticated!" -ForegroundColor Red
    Write-Host "`nPlease run: railway login" -ForegroundColor Yellow
    Write-Host "Then authenticate in the browser that opens." -ForegroundColor Yellow
    Write-Host "After authentication, run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Railway CLI is authenticated" -ForegroundColor Green

# Set the environment variable
Write-Host "`nSetting VITE_API_BASE_URL..." -ForegroundColor Yellow
railway variable set VITE_API_BASE_URL=$backendUrl --service $serviceName

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully set VITE_API_BASE_URL!" -ForegroundColor Green
    Write-Host "`nRailway will automatically redeploy the frontend." -ForegroundColor Cyan
    Write-Host "Wait 2-5 minutes for deployment to complete." -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Failed to set variable. Error code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "`nPlease set it manually via Railway Dashboard:" -ForegroundColor Yellow
    Write-Host "1. Go to https://railway.app" -ForegroundColor White
    Write-Host "2. Open 'glorious-flexibility' project" -ForegroundColor White
    Write-Host "3. Click 'recruitment-frontend' service, then 'Variables'" -ForegroundColor White
    Write-Host "4. Add: VITE_API_BASE_URL = $backendUrl" -ForegroundColor White
}
