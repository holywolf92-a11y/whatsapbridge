[string]$BACKEND = "https://glorious-flexibility-production.up.railway.app"
[string]$PDF_PATH = "D:\falisha\recruitment-portal-backend\Ibtehaj Uddin Ahmed Siddiqui.pdf"

Write-Host "=== Final CV Parsing Test ===" -ForegroundColor Cyan

# Step 1: Create inbox message
Write-Host "`nStep 1: Creating inbox message..."
$msgPayload = @{
    source = "manual_upload"
    external_message_id = "test-cv-$(Get-Random -Minimum 10000 -Maximum 99999)"
    payload = @{ sender_name = "Ibtehaj Uddin Ahmed Siddiqui" }
    status = "received"
} | ConvertTo-Json

$msg = (Invoke-WebRequest -Uri "$BACKEND/api/cv-inbox/" -Method POST -ContentType "application/json" -Body $msgPayload -UseBasicParsing).Content | ConvertFrom-Json
$msgId = $msg.id
Write-Host "Message created: $msgId" -ForegroundColor Green

# Step 2: Read and encode PDF
Write-Host "`nStep 2: Reading and encoding PDF..."
$pdfBytes = [System.IO.File]::ReadAllBytes($PDF_PATH)
$base64 = [Convert]::ToBase64String($pdfBytes)
Write-Host "PDF size: $($pdfBytes.Length) bytes" -ForegroundColor Green

# Step 3: Upload attachment
Write-Host "`nStep 3: Uploading attachment..."
$json = @"
{
  "file_name": "Ibtehaj_Resume.pdf",
  "mime_type": "application/pdf",
  "attachment_type": "cv",
  "storage_bucket": "documents",
  "storage_path": "uploads/cv-$(Get-Random)/Ibtehaj.pdf",
  "file_base64": "$base64"
}
"@

try {
    $att = (Invoke-WebRequest -Uri "$BACKEND/api/cv-inbox/$msgId/attachments" -Method POST -ContentType "application/json" -Body $json -UseBasicParsing).Content | ConvertFrom-Json
    $attId = $att.id
    Write-Host "Attachment created: $attId" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Trigger CV parsing
Write-Host "`nStep 4: Triggering CV parsing..."
try {
    $job = (Invoke-WebRequest -Uri "$BACKEND/api/cv-inbox/attachments/$attId/process" -Method POST -ContentType "application/json" -UseBasicParsing).Content | ConvertFrom-Json
    $jobId = $job.job_id
    Write-Host "Job created: $jobId" -ForegroundColor Green
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 5: Poll job status
Write-Host "`nStep 5: Waiting for CV parsing (checking for 30 seconds)..."
$success = $false
for ($i = 1; $i -le 15; $i++) {
    $resp = Invoke-WebRequest -Uri "$BACKEND/api/parsing-jobs/$jobId" -UseBasicParsing -ErrorAction SilentlyContinue
    $jobStatus = $resp.Content | ConvertFrom-Json
    
    Write-Host "  Attempt $i - Status: $($jobStatus.status)" -ForegroundColor Gray
    
    if ($jobStatus.status -eq "extracted") {
        Write-Host "`n✅ SUCCESS! CV Parsed Successfully" -ForegroundColor Green
        Write-Host "  Name: $($jobStatus.result.name)" -ForegroundColor Green
        Write-Host "  Email: $($jobStatus.result.email)" -ForegroundColor Green
        $success = $true
        break
    }
    
    if ($jobStatus.status -eq "failed") {
        Write-Host "`n❌ FAILED: $($jobStatus.error_message)" -ForegroundColor Red
        break
    }
    
    Start-Sleep -Seconds 2
}

if ($success) {
    Write-Host "`n✅ CV Extraction Complete!" -ForegroundColor Green
    Write-Host "Check frontend at: https://falishajobs.up.railway.app" -ForegroundColor Cyan
} else {
    Write-Host "`n⏳ Still processing or failed. Check logs in Railway." -ForegroundColor Yellow
}
