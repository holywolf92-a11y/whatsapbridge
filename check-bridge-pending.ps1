param(
    [int]$Hours = 24
)

$supa = "https://hncvsextwmvjydcukdwx.supabase.co"
$key  = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $key) {
    # fallback: read from backend .env
    $envFile = "D:\falisha\recruitment-portal-backend\.env"
    $key = (Get-Content $envFile | Select-String "SUPABASE_SERVICE_ROLE_KEY=(.+)").Matches[0].Groups[1].Value.Trim()
}

$headers = @{
    "apikey"        = $key
    "Authorization" = "Bearer $key"
    "Content-Type"  = "application/json"
}

$since = ([datetime]::UtcNow.AddHours(-$Hours)).ToString("yyyy-MM-ddTHH:mm:ssZ")

Write-Host "=== WhatsApp Bridge Status ===" -ForegroundColor Cyan

# 1. Bridge live status
$bridge = Invoke-RestMethod -Uri "https://recruitment-whatsapp-bridge-production.up.railway.app/status" -Method GET
Write-Host ""
Write-Host "Bridge accounts:" -ForegroundColor Yellow
$bridge.sessions | ForEach-Object {
    $color = if ($_.status -eq "connected") { "Green" } elseif ($_.status -eq "idle") { "Gray" } else { "Red" }
    Write-Host "  $($_.accountId) ($($_.displayName)): $($_.status)" -ForegroundColor $color
}
Write-Host "  Dedupe store: $($bridge.dedupe.totalRecords) total records" -ForegroundColor Gray
Write-Host ""

# 2. Inbox messages in window
Write-Host "=== CV Inbox (last $Hours hours, source=whatsapp) ===" -ForegroundColor Cyan
$msgs = Invoke-RestMethod -Uri "$supa/rest/v1/inbox_messages?source=eq.whatsapp&received_at=gte.$since&select=id,status,received_at&order=received_at.desc" -Headers $headers
Write-Host "Total WhatsApp messages: $($msgs.Count)" -ForegroundColor White

# 3. Inbox attachments breakdown
$enc = [uri]::EscapeDataString($since)
$atts = Invoke-RestMethod -Uri "$supa/rest/v1/inbox_attachments?select=id,candidate_id,attachment_type&inbox_message_id=in.($( ($msgs | ForEach-Object { $_.id }) -join ','))" -Headers $headers
$cvAtts   = $atts | Where-Object { $_.attachment_type -eq "cv" -or -not $_.attachment_type }
$pending  = $cvAtts | Where-Object { -not $_.candidate_id }
$resolved = $cvAtts | Where-Object { $_.candidate_id }

Write-Host "CV attachments total:     $($cvAtts.Count)" -ForegroundColor White
Write-Host "  - Extracted (has candidate): $($resolved.Count)" -ForegroundColor Green
Write-Host "  - Pending/Queued (no candidate): $($pending.Count)" -ForegroundColor $(if ($pending.Count -gt 0) { "Yellow" } else { "Green" })

if ($pending.Count -gt 0) {
    Write-Host ""
    Write-Host "Pending attachment IDs:" -ForegroundColor Yellow
    $pending | Select-Object -First 10 | ForEach-Object { Write-Host "  $($_.id)" -ForegroundColor Gray }
}
