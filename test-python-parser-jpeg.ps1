# Test if Python parser is using new JPEG conversion code
$pythonParserUrl = "https://recruitment-portal-python-parser-production.up.railway.app"

Write-Host "=== Testing Python Parser JPEG Conversion ===" -ForegroundColor Cyan
Write-Host ""

# First check health
Write-Host "1. Checking Python parser health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$pythonParserUrl/health" -Method Get
    Write-Host "✅ Status: $($health.status)" -ForegroundColor Green
    Write-Host "   OpenAI: $($health.openai_configured)" -ForegroundColor Gray
    Write-Host "   HMAC: $($health.hmac_configured)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Checking deployed code version..." -ForegroundColor Yellow
Write-Host "   Expected: extract_photo_as_jpeg() function present" -ForegroundColor Gray
Write-Host "   Expected: is_image and mime_type fields in response" -ForegroundColor Gray

Write-Host ""
Write-Host "3. Recent commit on Python parser:" -ForegroundColor Yellow
cd "d:\falisha\recruitment-portal-python-parser"
$commit = git log --oneline -1
Write-Host "   $commit" -ForegroundColor Green

Write-Host ""
Write-Host "=== VERIFICATION ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "To verify the fix is working, upload a CV with a photo and check:" -ForegroundColor Yellow
Write-Host "1. Check candidate_documents table:" -ForegroundColor White
Write-Host @"
   SELECT file_name, storage_path, mime_type, category
   FROM candidate_documents
   WHERE category = 'photos'
   ORDER BY created_at DESC
   LIMIT 1;
"@ -ForegroundColor Gray

Write-Host ""
Write-Host "2. Expected for NEW uploads:" -ForegroundColor White
Write-Host "   ✅ mime_type = 'image/jpeg' (not 'application/pdf')" -ForegroundColor Green
Write-Host "   ✅ storage_path ends with '.jpg' (not '.pdf')" -ForegroundColor Green

Write-Host ""
Write-Host "3. If still showing PDF:" -ForegroundColor White
Write-Host "   → Railway may still be deploying (check Railway dashboard)" -ForegroundColor Yellow
Write-Host "   → Or document wasn't categorized as 'photos'" -ForegroundColor Yellow
Write-Host "   → Or we need to implement Option 2 (Python parser V2)" -ForegroundColor Yellow
