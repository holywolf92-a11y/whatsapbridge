$BACKEND = "https://glorious-flexibility-production.up.railway.app"
$PDF_PATH = "D:\falisha\Recruitment Automation Portal (2)\Abdullah cv.pdf"

Write-Host "=== CV Upload & Parsing Test ===" -ForegroundColor Cyan

# Step 1: Create inbox message
Write-Host "`n1. Creating inbox message..." -NoNewline
$messagePayload = @{
    source = "manual_upload"
    external_message_id = "cv-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    payload = @{
        sender_name = "Abdullah"
        sender_contact = "cv_upload"
    }
    status = "received"
} | ConvertTo-Json

try {
    $msgResp = Invoke-WebRequest -Uri "$BACKEND/api/cv-inbox/" `
        -Method POST `
        -ContentType "application/json" `
        -Body $messagePayload `
        -UseBasicParsing
    
    $message = $msgResp.Content | ConvertFrom-Json
    $messageId = $message.id
    Write-Host " DONE (ID: $($messageId.Substring(0,8))...)" -ForegroundColor Green
} catch {
    Write-Host " FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}

# Step 2: Upload PDF as attachment
Write-Host "`n2. Uploading PDF..." -NoNewline
try {
    $pdfBytes = [System.IO.File]::ReadAllBytes($PDF_PATH)
    $base64 = [Convert]::ToBase64String($pdfBytes)
    
    $safeFileName = "Abdullah cv.pdf" -replace '[^a-zA-Z0-9.\-_]', '_'
    $storageBucket = "documents"
    $storagePath = "unmatched_documents/manual_upload/$messageId/$safeFileName"

    $attachPayload = @{
        file_name = "Abdullah cv.pdf"
        mime_type = "application/pdf"
        attachment_type = "cv"
        storage_bucket = $storageBucket
        storage_path = $storagePath
        file_base64 = $base64
    } | ConvertTo-Json -Depth 10
    
    $attResp = Invoke-WebRequest -Uri "$BACKEND/api/cv-inbox/$messageId/attachments" `
        -Method POST `
        -ContentType "application/json" `
        -Body $attachPayload `
        -UseBasicParsing
    
    $attachment = $attResp.Content | ConvertFrom-Json
    $attachmentId = $attachment.id
    Write-Host " DONE (Size: $($pdfBytes.Length) bytes)" -ForegroundColor Green
    Write-Host "   Attachment ID: $($attachmentId.Substring(0,8))..." -ForegroundColor Cyan
} catch {
    Write-Host " FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}

# Step 3: Trigger CV parsing
Write-Host "`n3. Triggering CV parsing..." -NoNewline
try {
    $parseResp = Invoke-WebRequest -Uri "$BACKEND/api/cv-inbox/attachments/$attachmentId/process" `
        -Method POST `
        -ContentType "application/json" `
        -UseBasicParsing
    
    $parseResult = $parseResp.Content | ConvertFrom-Json
    Write-Host " DONE" -ForegroundColor Green
    Write-Host "   Job ID: $($parseResult.job_id.Substring(0,8))..." -ForegroundColor Cyan
    Write-Host "   Status: $($parseResult.status)" -ForegroundColor Cyan
} catch {
    Write-Host " FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}

# Step 4: Check parsing job status
Write-Host "`n4. Checking parsing job status..."
Start-Sleep -Seconds 2

try {
    $jobResp = Invoke-WebRequest -Uri "$BACKEND/api/parsing-jobs/$($parseResult.job_id)" `
        -UseBasicParsing
    
    $job = $jobResp.Content | ConvertFrom-Json
    Write-Host "   Status: $($job.status)" -ForegroundColor Cyan
    Write-Host "   Attempts: $($job.attempts)" -ForegroundColor Cyan
    
    if ($job.result) {
        Write-Host "   Result: Parsed successfully" -ForegroundColor Green
        if ($job.result.name) {
            Write-Host "   Extracted Name: $($job.result.name)" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "Could not fetch job status: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n5. Checking frontend visibility..."
Write-Host "   Visit: https://falishajobs.up.railway.app" -ForegroundColor Cyan
Write-Host "   Look for 'Ibtehaj Uddin Ahmed Siddiqui' in Inbox/Candidates" -ForegroundColor Cyan

Write-Host "`n=== CV Upload Complete ===" -ForegroundColor Green
