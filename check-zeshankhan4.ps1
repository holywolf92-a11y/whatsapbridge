$url = "https://hncvsextwmvjydcukdwx.supabase.co"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ"
$h = @{ "apikey" = $key; "Authorization" = "Bearer $key" }

Write-Host "=== 1. candidate_missing_data_email_log ===" -ForegroundColor Cyan
$log = Invoke-RestMethod -Uri "$url/rest/v1/candidate_missing_data_email_log?select=*&order=sent_at.desc&limit=500" -Headers $h
Write-Host "Total entries: $($log.Count)"
$log | Where-Object { ($_ | ConvertTo-Json -Depth 4 -Compress) -match "zeshankhan|484256" } | Format-Table -AutoSize
Write-Host "All unique to_email:"
$log | ForEach-Object { $_.to_email } | Sort-Object -Unique

Write-Host "`n=== 2. candidates with missing_data_email_status (active/stopped) ===" -ForegroundColor Cyan
$active = Invoke-RestMethod -Uri "$url/rest/v1/candidates?select=id,name,email,missing_data_email_status,missing_data_email_attempts,missing_data_email_last_sent_at&missing_data_email_status=neq.inactive&limit=100" -Headers $h
Write-Host "Active/stopped candidates: $($active.Count)"
$active | Where-Object { $_.email -match "zeshankhan|484256" } | Format-Table id, name, email, missing_data_email_status, missing_data_email_attempts, missing_data_email_last_sent_at -AutoSize
Write-Host "All emails in active set:"
$active | ForEach-Object { "$($_.missing_data_email_status) | $($_.email) | attempts=$($_.missing_data_email_attempts) | last=$($_.missing_data_email_last_sent_at)" }

Write-Host "`n=== 3. Hostinger polling checkpoint ===" -ForegroundColor Cyan
$poll = Invoke-RestMethod -Uri "$url/rest/v1/hostinger_polling_runs?select=*&order=created_at.desc&limit=5" -Headers $h
$poll | Format-Table -AutoSize
