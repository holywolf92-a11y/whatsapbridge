# Check Python Parser Version
$url = "https://recruitment-portal-python-parser-production.up.railway.app"

Write-Host "=== Python Parser Version Check ===" -ForegroundColor Cyan
Write-Host ""

try {
    $health = Invoke-RestMethod -Uri "$url/health" -Method Get
    
    Write-Host "Status: $($health.status)" -ForegroundColor Green
    Write-Host "Version: $($health.version)" -ForegroundColor Yellow
    Write-Host "Photo JPEG: $($health.photo_jpeg_enabled)" -ForegroundColor Yellow
    Write-Host ""
    
    if ($health.version -like "*2.1*") {
        Write-Host "✅ v2.1 DEPLOYED! (FINAL FIX)" -ForegroundColor Green
        Write-Host "   Embedded image extraction is ACTIVE" -ForegroundColor Green
    } elseif ($health.version -like "*2.0*") {
        Write-Host "⏳ v2.0 running (v2.1 deploying...)" -ForegroundColor Yellow
        Write-Host "   Wait 2-3 minutes for v2.1" -ForegroundColor Gray
    } else {
        Write-Host "⏳ Old version still running" -ForegroundColor Yellow
        Write-Host "   Wait 2-3 minutes for deployment" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
