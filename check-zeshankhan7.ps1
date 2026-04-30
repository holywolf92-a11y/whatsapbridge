$url = "https://hncvsextwmvjydcukdwx.supabase.co"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ"
$h = @{ "apikey" = $key; "Authorization" = "Bearer $key" }
$msgId = "e8355e08-a11a-4d51-bb1d-318b3469ead1"

# 1. Check attachments linked to this inbox message
Write-Host "=== Attachments for this inbox_message ===" -ForegroundColor Cyan
$atts = Invoke-RestMethod -Uri "$url/rest/v1/inbox_attachments?select=*&inbox_message_id=eq.$msgId" -Headers $h -ErrorAction SilentlyContinue
Write-Host "Attachments: $($atts.Count)"
$atts | Format-Table -AutoSize

# 2. Find any candidate whose source_inbox_message_id = this msgId
Write-Host "`n=== Candidates with source_inbox_message_id = this message ===" -ForegroundColor Cyan
$linked = Invoke-RestMethod -Uri "$url/rest/v1/candidates?select=id,name,email,phone,missing_data_email_status,missing_data_email_attempts,missing_data_email_last_sent_at&source_inbox_message_id=eq.$msgId" -Headers $h -ErrorAction SilentlyContinue
Write-Host "Linked candidates: $($linked.Count)"
$linked | Format-Table id, name, email, missing_data_email_status, missing_data_email_attempts, missing_data_email_last_sent_at -AutoSize

# 3. Look at ALL outbound emails sent on the same day the inbox_message was processed (2026-03-04)
Write-Host "`n=== All outbound emails on 2026-03-04 ===" -ForegroundColor Cyan
$dayEmails = Invoke-RestMethod -Uri "$url/rest/v1/inbox_messages?select=id,source,payload,received_at&source=eq.email_outbound&received_at=gte.2026-03-04T00:00:00&received_at=lte.2026-03-04T23:59:59&order=received_at.asc" -Headers $h
Write-Host "Outbound on 2026-03-04: $($dayEmails.Count)"
$dayEmails | ForEach-Object { Write-Host "  [$($_.received_at)] to=$($_.payload.to) subject=$($_.payload.subject)" }

# 4. Look at inbox_messages on same day - anything from the gmail processing
Write-Host "`n=== All inbox_messages on 2026-03-04 where source != email_outbound ===" -ForegroundColor Cyan
$day = Invoke-RestMethod -Uri "$url/rest/v1/inbox_messages?select=id,source,status,payload,received_at&received_at=gte.2026-03-04T00:00:00&received_at=lte.2026-03-04T23:59:59&order=received_at.asc&limit=50" -Headers $h
$day | ForEach-Object { Write-Host "  [$($_.received_at)] source=$($_.source) status=$($_.status) from=$($_.payload.from) subject=$($_.payload.subject)" }

# 5. Check if candidate was created with that email and email was later changed - find via name match in documents
Write-Host "`n=== candidate_documents linked to any Zeeshan candidate ===" -ForegroundColor Cyan
$zeeshanIds = @(
    "c297fccc-7b09-4a0d-8787-d414d843773e",
    "bc56c7f5-9887-4b14-b1a5-c703b4350c99"
)
foreach ($id in $zeeshanIds) {
    $docs = Invoke-RestMethod -Uri "$url/rest/v1/candidate_documents?select=id,document_type,file_name,created_at&candidate_id=eq.$id&limit=5" -Headers $h -ErrorAction SilentlyContinue
    Write-Host "  Candidate $id : $($docs.Count) docs"
    $docs | Format-Table -AutoSize
}
