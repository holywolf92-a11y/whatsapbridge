$url = "https://hncvsextwmvjydcukdwx.supabase.co"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ"
$h = @{ "apikey" = $key; "Authorization" = "Bearer $key" }

# Get the inbox message details
Write-Host "=== inbox_message from zeshankhan ===" -ForegroundColor Cyan
$msg = Invoke-RestMethod -Uri "$url/rest/v1/inbox_messages?select=*&payload->>from=like.*zeshankhan*&order=received_at.desc" -Headers $h
$msg | ConvertTo-Json -Depth 5

# Find candidate linked to this inbox message
Write-Host "`n=== candidates linked via inbox_message_id ===" -ForegroundColor Cyan
$msg | ForEach-Object {
    $msgId = $_.id
    Write-Host "Message ID: $msgId"
    $cands = Invoke-RestMethod -Uri "$url/rest/v1/candidates?select=id,name,email,phone,missing_data_email_status,missing_data_email_attempts,missing_data_email_last_sent_at,missing_data_email_next_send_at&source_inbox_message_id=eq.$msgId" -Headers $h
    Write-Host "Candidates linked: $($cands.Count)"
    $cands | Format-Table id, name, email, missing_data_email_status, missing_data_email_attempts, missing_data_email_last_sent_at -AutoSize
}

# Also search candidates by name Zeeshan
Write-Host "`n=== candidates WHERE name ilike zeeshan ===" -ForegroundColor Cyan
$byName = Invoke-RestMethod -Uri "$url/rest/v1/candidates?select=id,name,email,phone,missing_data_email_status,missing_data_email_attempts,missing_data_email_last_sent_at,missing_data_email_next_send_at&name=ilike.*zeeshan*&limit=20" -Headers $h
Write-Host "Found: $($byName.Count)"
$byName | Format-Table id, name, email, missing_data_email_status, missing_data_email_attempts, missing_data_email_last_sent_at -AutoSize

# Check missing_data_email_log for any entry with that email (case insensitive)
Write-Host "`n=== missing_data_email_log ilike zeshankhan ===" -ForegroundColor Cyan
$logMatch = Invoke-RestMethod -Uri "$url/rest/v1/candidate_missing_data_email_log?select=*&to_email=ilike.*zeshankhan*" -Headers $h
Write-Host "Found: $($logMatch.Count)"
$logMatch | Format-Table -AutoSize
