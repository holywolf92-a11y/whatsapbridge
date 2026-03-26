$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ"
$h = @{"apikey"=$k;"Authorization"="Bearer $k"}
$BASE = "https://hncvsextwmvjydcukdwx.supabase.co/rest/v1"

Write-Host "=== Maria Talat candidates ===" -ForegroundColor Cyan
$maria = Invoke-RestMethod "$BASE/candidates?select=candidate_code,name,email,phone,date_of_birth,cnic_normalized,passport_normalized,father_name&name=ilike.*Maria*&order=created_at.asc" -Headers $h
Write-Host "Count: $($maria.Count)"
$maria | ForEach-Object {
    Write-Host "$($_.candidate_code) | email=$($_.email) | phone=$($_.phone) | cnic=$($_.cnic_normalized) | dob=$($_.date_of_birth) | father=$($_.father_name)"
}

Write-Host ""
Write-Host "=== Abid candidates ===" -ForegroundColor Cyan
$abid = Invoke-RestMethod "$BASE/candidates?select=candidate_code,name,email,phone,date_of_birth,cnic_normalized&name=ilike.*Abid*&order=created_at.asc" -Headers $h
Write-Host "Count: $($abid.Count)"
$abid | ForEach-Object {
    Write-Host "$($_.candidate_code) | email=$($_.email) | phone=$($_.phone) | cnic=$($_.cnic_normalized) | dob=$($_.date_of_birth)"
}

Write-Host ""
Write-Host "=== Inbox attachments for these candidates ===" -ForegroundColor Cyan
$attachments = Invoke-RestMethod "$BASE/inbox_attachments?select=id,file_name,candidate_id,created_at,attachment_type&attachment_type=eq.cv&order=created_at.asc&limit=100" -Headers $h
Write-Host "Total CV attachments: $($attachments.Count)"
Write-Host "With candidate_id: $(($attachments | Where-Object { $_.candidate_id }).Count)"
Write-Host "Without candidate_id: $(($attachments | Where-Object { !$_.candidate_id }).Count)"
