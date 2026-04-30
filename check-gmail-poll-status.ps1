$lines = [System.IO.File]::ReadAllLines("d:\falisha\recruitment-portal-backend\.env")
$KEY = ($lines | Where-Object { $_ -match "^SUPABASE_SERVICE_ROLE_KEY=" }) -replace "^SUPABASE_SERVICE_ROLE_KEY=",""
$URL = "https://hncvsextwmvjydcukdwx.supabase.co"
$h = @{ "apikey" = $KEY; "Authorization" = "Bearer $KEY" }

Write-Host "=== Last 10 Gmail inbox messages (all accounts) ===" -ForegroundColor Cyan
$r = Invoke-RestMethod "$URL/rest/v1/inbox_messages?select=received_at,metadata&source=eq.gmail&order=received_at.desc&limit=10" -Headers $h -ErrorAction SilentlyContinue
if ($r) { $r | ForEach-Object { Write-Host "  $($_.received_at) | accountId: $($_.metadata.accountId)" } } else { Write-Host "  No results or error" }

Write-Host ""
Write-Host "=== Last poll per account (from gmail_polling_state or similar) ===" -ForegroundColor Cyan

# Check if there's a gmail_polling_state table
try {
    $state = Invoke-RestMethod "$URL/rest/v1/gmail_polling_state?select=*&order=updated_at.desc&limit=10" -Headers $h
    $state | ForEach-Object { Write-Host "  $($_ | ConvertTo-Json -Compress)" }
} catch {
    Write-Host "  No gmail_polling_state table: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== Last gmail message per account ===" -ForegroundColor Cyan
@(1,2,3) | ForEach-Object {
    $acct = $_
    $msgs = Invoke-RestMethod "$URL/rest/v1/inbox_messages?select=received_at,subject,metadata&source=eq.gmail&order=received_at.desc&limit=50" -Headers $h -ErrorAction SilentlyContinue
    $acctMsgs = $msgs | Where-Object { $_.metadata.accountId -eq $acct }
    if ($acctMsgs -and $acctMsgs.Count -gt 0) {
        $last = $acctMsgs[0]
        Write-Host "  Account ${acct} last: $($last.received_at) | $($last.subject)"
    } else {
        Write-Host "  Account ${acct}: no messages found in last 50"
    }
}

Write-Host ""
Write-Host "=== hostinger_polling_runs (for reference) ===" -ForegroundColor Cyan
try {
    $hp = Invoke-RestMethod "$URL/rest/v1/hostinger_polling_runs?select=created_at,status,emails_fetched&order=created_at.desc&limit=3" -Headers $h -ErrorAction SilentlyContinue
    if ($hp) { $hp | ForEach-Object { Write-Host "  $($_.created_at) | $($_.status) | emails: $($_.emails_fetched)" } }
} catch {
    Write-Host "  Error: $($_.Exception.Message)"
}
