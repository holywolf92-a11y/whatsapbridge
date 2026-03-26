$BACKEND = "https://recruitment-portal-backend-production-d1f7.up.railway.app/api"
$SB_URL  = "https://hncvsextwmvjydcukdwx.supabase.co/rest/v1"
$SB_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ"
$sbH = @{ "apikey" = $SB_KEY; "Authorization" = "Bearer $SB_KEY" }

Write-Host "Fetching unprocessed CV attachments..." -ForegroundColor Cyan
$atts = @()
$offset = 0
do {
    $url = "$SB_URL/inbox_attachments?select=id,file_name&kind=eq.cv&candidate_id=is.null&linked_candidate_id=is.null&order=created_at.asc&limit=1000&offset=$offset"
    $page = Invoke-RestMethod $url -Headers $sbH
    $atts += $page
    $offset += 1000
} while ($page.Count -eq 1000)

Write-Host "Found $($atts.Count) unprocessed CV attachments" -ForegroundColor Yellow

$ok=0; $err=0; $i=0
foreach ($att in $atts) {
    $i++
    Write-Progress -Activity "Re-queuing" -Status "$i/$($atts.Count) $($att.file_name)" -PercentComplete ([int](($i/$atts.Count)*100))
    try {
        Invoke-RestMethod -Uri "$BACKEND/cv-inbox/attachments/$($att.id)/retry" -Method POST -Headers @{"X-Admin-Token"="falisha-admin-2026-X9k7mPqr4LzT"} | Out-Null
        $ok++
    } catch { $err++ }
    if ($i % 5 -eq 0) { Start-Sleep -Milliseconds 800 }
}
Write-Progress -Completed -Activity "Re-queuing"
Write-Host "Done! Queued=$ok  Errors=$err" -ForegroundColor Green
