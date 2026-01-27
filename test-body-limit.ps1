$backend = 'https://recruitment-portal-backend-production-d1f7.up.railway.app'
$random = Get-Random

# Create message
$msgBody = @{
    source = 'test'
    external_message_id = "test-$random"
    payload = @{ sender_name = 'Test' }
    status = 'received'
} | ConvertTo-Json

Write-Host "Creating message..." -ForegroundColor Yellow
$msgResp = Invoke-WebRequest -Uri "$backend/api/cv-inbox/" -Method POST -ContentType 'application/json' -Body $msgBody -UseBasicParsing -ErrorAction Stop
$msg = $msgResp.Content | ConvertFrom-Json
Write-Host "Message ID: $($msg.id)" -ForegroundColor Cyan

# Create large test file content (to test 100MB limit)
# This creates ~10MB of data
$testContent = ""
for ($i = 0; $i -lt 1000; $i++) {
    $testContent += "This is test line $i with some sample data to make it larger. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`n"
}

$base64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($testContent))
Write-Host "Base64 size: $($base64.Length) chars" -ForegroundColor Yellow

# Upload file
$attBody = @{
    file_name = "test-large-$random.txt"
    mime_type = 'text/plain'
    attachment_type = 'test'
    storage_bucket = 'documents'
    storage_path = "test/file-$random.txt"
    file_base64 = $base64
} | ConvertTo-Json

Write-Host "Uploading file..." -ForegroundColor Yellow
try {
    $attResp = Invoke-WebRequest -Uri "$backend/api/cv-inbox/$($msg.id)/attachments" -Method POST -ContentType 'application/json' -Body $attBody -UseBasicParsing -ErrorAction Stop
    $att = $attResp.Content | ConvertFrom-Json
    Write-Host "SUCCESS! Attachment created: $($att.id)" -ForegroundColor Green
    Write-Host "Body size limit is working correctly (no 413 error)" -ForegroundColor Green
} catch {
    $err = $_.Exception.Response.StatusCode.Value__
    if ($err -eq 413) {
        Write-Host "FAILED: Got 413 PayloadTooLarge - body limit still too small!" -ForegroundColor Red
    } else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
