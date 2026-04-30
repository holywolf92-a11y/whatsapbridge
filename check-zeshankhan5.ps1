$url = "https://hncvsextwmvjydcukdwx.supabase.co"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ"
$h = @{ "apikey" = $key; "Authorization" = "Bearer $key" }

# 1. Direct DB filter on missing_data_email_log - no client-side scan
Write-Host "=== 1. missing_data_email_log WHERE to_email = zeshankhan ===" -ForegroundColor Cyan
$r1 = Invoke-RestMethod -Uri "$url/rest/v1/candidate_missing_data_email_log?select=*&to_email=eq.zeshankhanmz484256%40gmail.com" -Headers $h
Write-Host "Exact match: $($r1.Count)"
$r1 | Format-Table -AutoSize

# 2. Total rows in missing_data_email_log (check if > 500)
Write-Host "`n=== 2. Total rows in missing_data_email_log ===" -ForegroundColor Cyan
$count = Invoke-RestMethod -Uri "$url/rest/v1/candidate_missing_data_email_log?select=id" -Headers ($h + @{"Prefer"="count=exact"}) -Method Head -ErrorAction SilentlyContinue
Write-Host "Response headers check done"
$r2 = Invoke-RestMethod -Uri "$url/rest/v1/candidate_missing_data_email_log?select=id&limit=1" -Headers ($h + @{"Prefer"="count=exact"})
Write-Host "Total count query sent"

# 3. Direct filter on inbox_messages payload->>'to'
Write-Host "`n=== 3. inbox_messages with payload->to = zeshankhan (server-side filter) ===" -ForegroundColor Cyan
$r3 = Invoke-RestMethod -Uri "$url/rest/v1/inbox_messages?select=id,source,received_at,payload&payload->>to=eq.zeshankhanmz484256%40gmail.com&order=received_at.desc" -Headers $h
Write-Host "inbox_messages exact match: $($r3.Count)"
$r3 | ForEach-Object { Write-Host "  source=$($_.source) at=$($_.received_at) subject=$($_.payload.subject)" }

# 4. Check if the email is in payload->>'from' (they emailed us)
Write-Host "`n=== 4. inbox_messages WHERE payload->from contains zeshankhan ===" -ForegroundColor Cyan
$r4 = Invoke-RestMethod -Uri "$url/rest/v1/inbox_messages?select=id,source,received_at,payload&payload->>from=like.*zeshankhan*&order=received_at.desc" -Headers $h
Write-Host "From zeshankhan: $($r4.Count)"
$r4 | ForEach-Object { Write-Host "  source=$($_.source) at=$($_.received_at) from=$($_.payload.from) subject=$($_.payload.subject)" }

# 5. Check candidates table - search for email ilike
Write-Host "`n=== 5. candidates WHERE email ilike zeshankhan ===" -ForegroundColor Cyan
$r5 = Invoke-RestMethod -Uri "$url/rest/v1/candidates?select=id,name,email,missing_data_email_status,missing_data_email_attempts,missing_data_email_last_sent_at&email=ilike.*zeshankhan*" -Headers $h
Write-Host "Candidates: $($r5.Count)"
$r5 | Format-Table id, name, email, missing_data_email_status, missing_data_email_attempts -AutoSize

# 6. Check employer_inquiries / job_applications tables if they exist
Write-Host "`n=== 6. Other tables with email ===" -ForegroundColor Cyan
foreach ($tbl in @("employer_inquiries","job_applications","users","employer_contacts")) {
    $r = Invoke-RestMethod -Uri "$url/rest/v1/$tbl`?select=*&email=eq.zeshankhanmz484256%40gmail.com&limit=5" -Headers $h -ErrorAction SilentlyContinue
    if ($r -and $r.Count -gt 0) { Write-Host "  FOUND in $tbl : $($r.Count) records"; $r | Format-Table -AutoSize }
    else { Write-Host "  $tbl : 0 or table not found" }
}
