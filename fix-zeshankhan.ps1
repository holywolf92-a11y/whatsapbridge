$url = "https://hncvsextwmvjydcukdwx.supabase.co"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ"
$h = @{ "apikey" = $key; "Authorization" = "Bearer $key" }

# Get full details for all Zeeshan candidates with no/partial email
$ids = @(
    "219a79ce-0aa0-4772-96f3-d845b3e3be33",  # ZEESHAN KHALIL zeeshankha...
    "c297fccc-7b09-4a0d-8787-d414d843773e",  # Muhammad Zeeshan (no email)
    "bc56c7f5-9887-4b14-b1a5-c703b4350c99"   # Zeeshan Khan (no email)
)

Write-Host "=== Full details for suspect candidates ===" -ForegroundColor Cyan
foreach ($id in $ids) {
    $c = Invoke-RestMethod -Uri "$url/rest/v1/candidates?select=id,name,email,phone,missing_data_email_status,missing_data_email_attempts,missing_data_email_last_sent_at,missing_data_email_next_send_at&id=eq.$id" -Headers $h
    $c | Format-Table id, name, email, missing_data_email_status, missing_data_email_attempts, missing_data_email_last_sent_at, missing_data_email_next_send_at -AutoSize
}

# Directly search by email pattern
Write-Host "`n=== candidates WHERE email starts with zeshankhan ===" -ForegroundColor Cyan
$r = Invoke-RestMethod -Uri "$url/rest/v1/candidates?select=id,name,email,missing_data_email_status,missing_data_email_attempts,missing_data_email_last_sent_at,missing_data_email_next_send_at&email=ilike.zeshankhan*" -Headers $h
Write-Host "Found: $($r.Count)"
$r | Format-Table id, name, email, missing_data_email_status, missing_data_email_attempts, missing_data_email_last_sent_at, missing_data_email_next_send_at -AutoSize

if ($r.Count -gt 0) {
    Write-Host "`n>>> STOPPING missing data emails for these candidates..." -ForegroundColor Yellow
    foreach ($cand in $r) {
        $body = @{
            missing_data_email_status       = "stopped"
            missing_data_email_next_send_at = $null
        } | ConvertTo-Json
        $upd = Invoke-RestMethod -Uri "$url/rest/v1/candidates?id=eq.$($cand.id)" -Method PATCH -Headers ($h + @{"Content-Type"="application/json";"Prefer"="return=representation"}) -Body $body
        Write-Host "  STOPPED: $($cand.name) ($($cand.email))"
    }
}
