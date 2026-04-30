[string]$BACKEND = "https://glorious-flexibility-production.up.railway.app"
[string]$PDF_PATH = "D:\falisha\recruitment-portal-backend\Ibtehaj Uddin Ahmed Siddiqui.pdf"

Write-Host "Step 1: Creating inbox message..." -ForegroundColor Cyan
$msgPayload = @{
    source = "manual_upload"
    external_message_id = "test-cv-upload-$(Get-Date -Format 'yyyyMMddHHmmss')"
    payload = @{ sender_name = "Test User" }
    status = "received"
} | ConvertTo-Json

$msgResp = Invoke-WebRequest -Uri "$BACKEND/api/cv-inbox/" `
    -Method POST `
    -ContentType "application/json" `
    -Body $msgPayload `
    -UseBasicParsing
$msg = $msgResp.Content | ConvertFrom-Json
$msgId = $msg.id
Write-Host "Message created: $msgId" -ForegroundColor Green

Write-Host "`nStep 2: Reading and encoding PDF..." -ForegroundColor Cyan
$pdfBytes = [System.IO.File]::ReadAllBytes($PDF_PATH)
$base64 = [Convert]::ToBase64String($pdfBytes)
Write-Host "PDF bytes: $($pdfBytes.Length), Base64 length: $($base64.Length)" -ForegroundColor Green

Write-Host "`nStep 3: Uploading attachment (building JSON carefully)..." -ForegroundColor Cyan

# Manually build JSON to ensure proper escaping
$json = @"
{
  "file_name": "Ibtehaj Uddin Ahmed Siddiqui.pdf",
  "mime_type": "application/pdf",
  "attachment_type": "cv",
  "storage_bucket": "inbox",
  "storage_path": "uploads/cv-uploads/Ibtehaj_Uddin_Ahmed_Siddiqui.pdf",
  "file_base64": "$base64"
}
"@

Write-Host "JSON size: $($json.Length) bytes" -ForegroundColor Gray

try {
    $attResp = Invoke-WebRequest -Uri "$BACKEND/api/cv-inbox/$msgId/attachments" `
        -Method POST `
        -ContentType "application/json" `
        -Body $json `
        -UseBasicParsing
    $att = $attResp.Content | ConvertFrom-Json
    Write-Host "Attachment created: $($att.id)" -ForegroundColor Green
    $attId = $att.id
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    try {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error details: $errorBody" -ForegroundColor Yellow
        $reader.Close()
    } catch { }
    exit 1
}

Write-Host "`nStep 4: Triggering parsing job..." -ForegroundColor Cyan
try {
    $parseResp = Invoke-WebRequest -Uri "$BACKEND/api/cv-inbox/attachments/$attId/process" `
        -Method POST `
        -ContentType "application/json" `
        -UseBasicParsing
    $parseJob = $parseResp.Content | ConvertFrom-Json
    Write-Host "Parsing job created: $($parseJob.job_id)" -ForegroundColor Green
    Write-Host "Status: $($parseJob.status)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== SUCCESS ===" -ForegroundColor Green
Write-Host "Check frontend at: https://falishajobs.up.railway.app" -ForegroundColor Cyan
