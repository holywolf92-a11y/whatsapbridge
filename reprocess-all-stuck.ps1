$BASE = "https://recruitment-portal-backend-production-d1f7.up.railway.app"
$TOKEN = "falisha-admin-2026-X9k7mPqr4LzT"
$SB_URL = "https://hncvsextwmvjydcukdwx.supabase.co"
$SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ"
$H = @{"apikey"=$SB_KEY;"Authorization"="Bearer $SB_KEY"}

Write-Host "Fetching stuck CVs..."
$stuck = Invoke-RestMethod -Method GET `
    -Uri "$SB_URL/rest/v1/inbox_attachments?candidate_id=is.null&attachment_type=eq.cv&select=id,file_name&order=created_at.asc&limit=200" `
    -Headers $H

Write-Host "Found $($stuck.Count) stuck CV attachments"

$ok = 0; $fail = 0
foreach ($att in $stuck) {
    try {
        $r = Invoke-RestMethod -Method POST `
            -Uri "$BASE/api/cv-inbox/attachments/$($att.id)/process?force=true" `
            -Headers @{"x-admin-token"=$TOKEN}
        Write-Host "  OK  [$ok/$($stuck.Count)] $($att.file_name) -> job $($r.job_id)"
        $ok++
    } catch {
        Write-Host "  ERR [$fail] $($att.id) $($att.file_name): $($_.Exception.Message)"
        $fail++
    }
    Start-Sleep -Milliseconds 600
}

Write-Host ""
Write-Host "=== DONE: OK=$ok  FAIL=$fail ==="
