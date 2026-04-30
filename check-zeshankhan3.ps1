$url = "https://hncvsextwmvjydcukdwx.supabase.co"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ"
$h = @{ "apikey" = $key; "Authorization" = "Bearer $key" }

# Scan ALL outbound emails - paginate through entire table
Write-Host "=== Scanning ALL outbound email records for zeshankhan ===" -ForegroundColor Yellow
$offset = 0
$batchSize = 1000
$totalFound = 0

do {
    $batch = Invoke-RestMethod -Uri "$url/rest/v1/inbox_messages?select=id,source,payload,received_at&source=eq.email_outbound&order=received_at.asc&limit=$batchSize&offset=$offset" -Headers $h
    $found = $batch | Where-Object { ($_ | ConvertTo-Json -Depth 6 -Compress) -match "zeshankhan|484256" }
    if ($found.Count -gt 0) {
        $totalFound += $found.Count
        $found | ForEach-Object { Write-Host "  FOUND at=$($_.received_at) to=$($_.payload.to) subject=$($_.payload.subject)" }
    }
    Write-Host "  Scanned offset=$offset batch=$($batch.Count)"
    $offset += $batchSize
} while ($batch.Count -eq $batchSize)

Write-Host "Total outbound records scanned. Matches: $totalFound"

# Also check inbound - the bounce from Mail Delivery Subsystem would be stored here
Write-Host "`n=== INBOUND emails (bounce/delivery failure) from mailer-daemon ===" -ForegroundColor Yellow
$offset = 0
do {
    $batch = Invoke-RestMethod -Uri "$url/rest/v1/inbox_messages?select=id,source,payload,received_at,status&source=eq.email_inbound&order=received_at.desc&limit=$batchSize&offset=$offset" -Headers $h
    $bounces = $batch | Where-Object { ($_ | ConvertTo-Json -Depth 6 -Compress) -match "mailer-daemon|delivery.*fail|undeliverable|zeshankhan|484256|bounce" }
    if ($bounces.Count -gt 0) {
        $bounces | ForEach-Object { 
            Write-Host "  BOUNCE: at=$($_.received_at) from=$($_.payload.from) subject=$($_.payload.subject)"
        }
    }
    Write-Host "  Scanned inbound offset=$offset batch=$($batch.Count)"
    $offset += $batchSize
} while ($batch.Count -eq $batchSize)

# Check Resend dashboard via API
Write-Host "`n=== Checking Resend API for emails to zeshankhan ===" -ForegroundColor Yellow
$resendKey = Get-Content "d:\falisha\recruitment-portal-backend\.env" | Where-Object { $_ -match "RESEND_API_KEY" } | ForEach-Object { ($_ -split "=",2)[1].Trim() }
Write-Host "Resend key found: $($resendKey.Length -gt 0)"
if ($resendKey) {
    # Resend doesn't have a search API but we can check recent sends
    $resendResp = Invoke-RestMethod -Uri "https://api.resend.com/emails?limit=100" -Headers @{ "Authorization" = "Bearer $resendKey" } -ErrorAction SilentlyContinue
    Write-Host "Resend total fetched: $($resendResp.data.Count)"
    $resendResp.data | Where-Object { ($_.to -join ",") -match "zeshankhan" } | ForEach-Object {
        Write-Host "  RESEND MATCH: id=$($_.id) to=$($_.to) subject=$($_.subject) created_at=$($_.created_at)"
    }
}
