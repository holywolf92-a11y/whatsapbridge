# Fix Approved Photos - Retroactive Update Script
# This calls the backend API to update profile_photo_url for all candidates
# who have approved photos but the URL wasn't set (approved before feature was deployed)

Write-Host "🔧 Fixing approved photos..." -ForegroundColor Cyan
Write-Host ""

$url = "https://recruitment-portal-backend-production-d1f7.up.railway.app/api/documents/fix-approved-photos"

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -ContentType "application/json"
    
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Summary:" -ForegroundColor Yellow
    Write-Host "   Fixed: $($response.fixed) candidate(s)" -ForegroundColor Green
    Write-Host "   Already set: $($response.alreadySet) candidate(s)" -ForegroundColor Gray
    Write-Host "   Total processed: $($response.total) photo document(s)" -ForegroundColor Cyan
    Write-Host ""
    
    if ($response.fixed -gt 0) {
        Write-Host "👥 Fixed Candidates:" -ForegroundColor Yellow
        foreach ($candidate in $response.candidates) {
            Write-Host "   ✓ $($candidate.name)" -ForegroundColor Green
            Write-Host "     Document: $($candidate.document)" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "🎉 Photos will now appear in candidate cards and CVs!" -ForegroundColor Green
        Write-Host "💡 Refresh your browser to see the changes." -ForegroundColor Cyan
    } else {
        Write-Host "ℹ️  All photos are already properly configured!" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Make sure the backend is deployed on Railway" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to exit"
