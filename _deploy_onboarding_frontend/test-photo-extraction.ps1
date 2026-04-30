$candidateId = "25c2e464-359f-479d-a8b9-ac7bb9fec3b5"
$baseUrl = "https://recruitment-portal-backend.up.railway.app"

Write-Host "Testing PDF photo extraction..." -ForegroundColor Cyan

Write-Host "`nStep 1: Get current candidate photo URL" -ForegroundColor Yellow
$getResponse = Invoke-WebRequest -Uri "$baseUrl/api/candidates/$candidateId" -Method GET -SkipHttpErrorCheck
Write-Host "Status: $($getResponse.StatusCode)"
$candidate = $getResponse.Content | ConvertFrom-Json
$currentPhotoUrl = $candidate.profile_photo_url
Write-Host "Current URL: $($currentPhotoUrl.Substring(0, 80))..."
if ($currentPhotoUrl -match '\.pdf') {
  Write-Host "Type: PDF (needs extraction)"
} else {
  Write-Host "Type: IMAGE (already extracted)"
}

Write-Host "`nStep 2: Call extraction endpoint" -ForegroundColor Yellow
$extractResponse = Invoke-WebRequest -Uri "$baseUrl/api/documents/candidates/$candidateId/extract-photo" -Method POST -SkipHttpErrorCheck -ContentType "application/json" -Body "{}"
Write-Host "Status: $($extractResponse.StatusCode)"

if ($extractResponse.StatusCode -eq 200) {
  $result = $extractResponse.Content | ConvertFrom-Json
  Write-Host "`n✓ Extraction succeeded!" -ForegroundColor Green
  Write-Host "Extracted photo URL: $($result.profile_photo_url.Substring(0, 80))..."
} else {
  Write-Host "`n✗ Extraction failed!" -ForegroundColor Red
  Write-Host "Response: $($extractResponse.Content)"
}
