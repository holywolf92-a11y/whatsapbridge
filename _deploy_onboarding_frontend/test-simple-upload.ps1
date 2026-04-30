[string]$BACKEND = "https://glorious-flexibility-production.up.railway.app"

Write-Host "Testing simple attachment upload (small JSON)..." -ForegroundColor Cyan

# Create message first
$msgPayload = @{
    source = "test"
    external_message_id = "simple-test-$(Get-Date -Format 'yyyyMMddHHmmss')"
    payload = @{ sender_name = "Test" }
    status = "received"
} | ConvertTo-Json

$msg = (Invoke-WebRequest -Uri "$BACKEND/api/cv-inbox/" -Method POST -ContentType "application/json" -Body $msgPayload -UseBasicParsing).Content | ConvertFrom-Json
$msgId = $msg.id
Write-Host "Message: $msgId" -ForegroundColor Green

# Try minimal attachment (empty base64)
$json = @"
{
  "file_name": "test.txt",
  "mime_type": "text/plain",
  "attachment_type": "test",
  "storage_bucket": "inbox",
  "storage_path": "test/test.txt",
  "file_base64": "dGVzdA=="
}
"@

Write-Host "Sending minimal attachment..." -ForegroundColor Cyan
try {
    $resp = Invoke-WebRequest -Uri "$BACKEND/api/cv-inbox/$msgId/attachments" -Method POST -ContentType "application/json" -Body $json -UseBasicParsing
    Write-Host "Success: $($resp.StatusCode)" -ForegroundColor Green
    $att = $resp.Content | ConvertFrom-Json
    Write-Host "Attachment ID: $($att.id)" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $body = $reader.ReadToEnd()
    Write-Host "Response: $body" -ForegroundColor Yellow
    $reader.Close()
}
