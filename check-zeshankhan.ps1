$url = "https://hncvsextwmvjydcukdwx.supabase.co"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ"
$h = @{ "apikey" = $key; "Authorization" = "Bearer $key" }

Write-Host "`n=== 1. CANDIDATES TABLE ===" -ForegroundColor Cyan
$c = Invoke-RestMethod -Uri "$url/rest/v1/candidates?select=id,full_name,email,created_at&email=eq.zeshankhanmz484256%40gmail.com" -Headers $h
Write-Host "Found: $($c.Count)"
$c | Format-Table id, full_name, email, created_at -AutoSize

Write-Host "`n=== 2. ALL INBOX_MESSAGES containing zeshankhan ===" -ForegroundColor Cyan
$msgs = Invoke-RestMethod -Uri "$url/rest/v1/inbox_messages?select=id,source,status,received_at,payload&order=received_at.desc&limit=2000" -Headers $h
$found = $msgs | Where-Object { ($_ | ConvertTo-Json -Depth 6 -Compress) -match "zeshankhan" }
Write-Host "Found: $($found.Count)"
$found | ForEach-Object {
    $p = $_.payload
    Write-Host "  [$($_.received_at)] source=$($_.source) status=$($_.status) to=$($p.to) from=$($p.from) subject=$($p.subject)"
}

Write-Host "`n=== 3. AUTH USERS ===" -ForegroundColor Cyan
$u = Invoke-RestMethod -Uri "$url/rest/v1/rpc/get_user_by_email" -Method POST -Headers ($h + @{"Content-Type"="application/json"}) -Body '{"email":"zeshankhanmz484256@gmail.com"}' -ErrorAction SilentlyContinue
Write-Host "Auth user result: $($u | ConvertTo-Json)"

Write-Host "`n=== 4. EMPLOYERS TABLE ===" -ForegroundColor Cyan
$e = Invoke-RestMethod -Uri "$url/rest/v1/employers?select=id,company_name,email,created_at&email=eq.zeshankhanmz484256%40gmail.com" -Headers $h -ErrorAction SilentlyContinue
Write-Host "Found: $($e.Count)"
$e | Format-Table -AutoSize

Write-Host "`n=== 5. RESEND SEND LOG (last 500 emails - check all to fields) ===" -ForegroundColor Cyan
$sent = Invoke-RestMethod -Uri "$url/rest/v1/inbox_messages?select=id,source,payload,received_at&source=eq.email_outbound&order=received_at.desc&limit=500" -Headers $h
Write-Host "Total outbound emails in audit: $($sent.Count)"
$sent | ForEach-Object { $_.payload.to } | Sort-Object -Unique | Format-Table -AutoSize
