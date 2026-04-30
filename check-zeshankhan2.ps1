$url = "https://hncvsextwmvjydcukdwx.supabase.co"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ"
$h = @{ "apikey" = $key; "Authorization" = "Bearer $key" }

# Search ALL inbox_messages for anything mentioning zeshankhan
Write-Host "=== ALL inbox_messages (all sources) containing zeshankhan ===" -ForegroundColor Yellow
$page1 = Invoke-RestMethod -Uri "$url/rest/v1/inbox_messages?select=id,source,status,received_at,payload&order=received_at.desc&limit=1000&offset=0" -Headers $h
$page2 = Invoke-RestMethod -Uri "$url/rest/v1/inbox_messages?select=id,source,status,received_at,payload&order=received_at.desc&limit=1000&offset=1000" -Headers $h
$all = $page1 + $page2
Write-Host "Total records scanned: $($all.Count)"
$found = $all | Where-Object { ($_ | ConvertTo-Json -Depth 6 -Compress) -match "zeshankhan" }
Write-Host "Matches: $($found.Count)"
$found | ForEach-Object {
    $p = $_.payload
    Write-Host "  source=$($_.source) status=$($_.status) at=$($_.received_at)"
    Write-Host "  payload_keys=$($p.PSObject.Properties.Name -join ',')"
    Write-Host "  from=$($p.from) to=$($p.to) subject=$($p.subject)"
    Write-Host ""
}

# Also check inbound emails (email_inbound source) - someone emailed us from that address
Write-Host "`n=== INBOUND emails FROM zeshankhan ===" -ForegroundColor Yellow
$inbound = $all | Where-Object { $_.source -eq "email_inbound" }
Write-Host "Total inbound: $($inbound.Count)"
$inbound | ForEach-Object {
    $p = $_.payload
    if (($p | ConvertTo-Json -Compress) -match "zeshankhan") {
        Write-Host "  MATCH: at=$($_.received_at) from=$($p.from) subject=$($p.subject)"
    }
}

# Check candidates with partial name match
Write-Host "`n=== CANDIDATES matching 'zeshan' ===" -ForegroundColor Yellow
$cands = Invoke-RestMethod -Uri "$url/rest/v1/candidates?select=id,name,email,phone,created_at&email=ilike.*zeshan*&limit=10" -Headers $h
Write-Host "By email: $($cands.Count)"
$cands2 = Invoke-RestMethod -Uri "$url/rest/v1/candidates?select=id,name,email,phone,created_at&name=ilike.*zeshan*&limit=10" -Headers $h
Write-Host "By name: $($cands2.Count)"
($cands + $cands2) | Format-Table id, name, email, phone, created_at -AutoSize
