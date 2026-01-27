$backend = 'https://recruitment-portal-backend-production-d1f7.up.railway.app'

# Read PDF file
$pdfPath = "d:\falisha\Recruitment Automation Portal (2)\NASIR UR REHMAN CV.pdf"
Write-Host "Reading PDF: $pdfPath" -ForegroundColor Yellow
$pdfBytes = [System.IO.File]::ReadAllBytes($pdfPath)
Write-Host "PDF size: $($pdfBytes.Length) bytes" -ForegroundColor Yellow

# Step 1: Create inbox message
Write-Host "Step 1: Creating inbox message..." -ForegroundColor Yellow
$msgBody = @{
    source = 'email'
    external_message_id = "test-$(Get-Random)"
    payload = @{ 
        sender_name = 'Test Sender'
        sender_email = 'test@example.com'
    }
    status = 'received'
} | ConvertTo-Json

try {
    $msgResp = Invoke-WebRequest -Uri "$backend/api/cv-inbox/" -Method POST -ContentType 'application/json' -Body $msgBody -UseBasicParsing -ErrorAction Stop
    $msg = $msgResp.Content | ConvertFrom-Json
    Write-Host "OK: Message created $($msg.id)" -ForegroundColor Green
} 
catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Convert PDF to base64
Write-Host "Step 2: Converting PDF to base64..." -ForegroundColor Yellow
$base64 = [Convert]::ToBase64String($pdfBytes)
Write-Host "Base64 size: $($base64.Length) chars" -ForegroundColor Yellow

# Step 3: Upload attachment
Write-Host "Step 3: Uploading CV attachment..." -ForegroundColor Yellow
$attBody = @{
    file_name = "NASIR-UR-REHMAN-CV.pdf"
    mime_type = 'application/pdf'
    attachment_type = 'cv'
    storage_bucket = 'documents'
    storage_path = "cv-inbox/nasir-$(Get-Random).pdf"
    file_base64 = $base64
} | ConvertTo-Json

try {
    $attResp = Invoke-WebRequest -Uri "$backend/api/cv-inbox/$($msg.id)/attachments" -Method POST -ContentType 'application/json' -Body $attBody -UseBasicParsing -ErrorAction Stop
    $att = $attResp.Content | ConvertFrom-Json
    Write-Host "OK: Attachment $($att.id)" -ForegroundColor Green
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    if ($statusCode -eq 413) {
        Write-Host "ERROR 413: Body too large" -ForegroundColor Red
    } else {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }
    exit 1
}

# Step 4: Check status
Write-Host "Step 4: Checking parsing status..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
try {
    $statusResp = Invoke-WebRequest -Uri "$backend/api/cv-inbox/$($msg.id)" -Method GET -UseBasicParsing -ErrorAction Stop
    $status = $statusResp.Content | ConvertFrom-Json
    Write-Host "Status: $($status.status)" -ForegroundColor Cyan
    if ($status.parsed_data) {
        Write-Host "Parsed: YES" -ForegroundColor Green
    } else {
        Write-Host "Parsed: Pending or no data" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Could not check status" -ForegroundColor Yellow
}

Write-Host "`nSUCCESS: Upload completed without errors!" -ForegroundColor Green
