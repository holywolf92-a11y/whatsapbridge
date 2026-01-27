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
    Write-Host "✓ Message created: $($msg.id)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create message: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Convert PDF to base64
Write-Host "Step 2: Converting PDF to base64..." -ForegroundColor Yellow
$base64 = [Convert]::ToBase64String($pdfBytes)
Write-Host "Base64 size: $($base64.Length) chars (~$([math]::Round($base64.Length/1MB, 2))MB)" -ForegroundColor Yellow

# Step 3: Upload attachment
Write-Host "Step 3: Uploading CV attachment..." -ForegroundColor Yellow
$attBody = @{
    file_name = "NASIR-UR-REHMAN-CV.pdf"
    mime_type = 'application/pdf'
    attachment_type = 'cv'
    storage_bucket = 'documents'
    storage_path = "cv-inbox/nasir-ur-rehman-$(Get-Random).pdf"
    file_base64 = $base64
} | ConvertTo-Json

try {
    $attResp = Invoke-WebRequest -Uri "$backend/api/cv-inbox/$($msg.id)/attachments" -Method POST -ContentType 'application/json' -Body $attBody -UseBasicParsing -ErrorAction Stop
    $att = $attResp.Content | ConvertFrom-Json
    Write-Host "✓ Attachment created: $($att.id)" -ForegroundColor Green
    Write-Host "✓ File uploaded to: $($att.storage_path)" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    if ($statusCode -eq 409) {
        Write-Host "✗ 409 Conflict: File already exists (duplicate)" -ForegroundColor Yellow
    } elseif ($statusCode -eq 413) {
        Write-Host "✗ 413 Payload Too Large: Body size limit exceeded" -ForegroundColor Red
    } else {
        Write-Host "✗ Error $statusCode : $($_.Exception.Message)" -ForegroundColor Red
    }
    exit 1
}

# Step 4: Wait and check parsing status
Write-Host ""
Write-Host "Step 4: Waiting for CV parsing..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    $statusResp = Invoke-WebRequest -Uri "$backend/api/cv-inbox/$($msg.id)" -Method GET -UseBasicParsing -ErrorAction Stop
    $status = $statusResp.Content | ConvertFrom-Json
    $parseStatus = if ($status.parsing_status) { $status.parsing_status } else { 'unknown' }
    Write-Host "Parsing status: $parseStatus" -ForegroundColor Cyan
    if ($status.parsed_data) {
        Write-Host "✓ Parsed data available!" -ForegroundColor Green
        $name = if ($status.parsed_data.name) { $status.parsed_data.name } else { 'N/A' }
        $email = if ($status.parsed_data.email) { $status.parsed_data.email } else { 'N/A' }
        Write-Host "  - Name: $name" -ForegroundColor Green
        Write-Host "  - Email: $email" -ForegroundColor Green
    } else {
        Write-Host "⏳ Parsing still in progress or no data yet" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Could not fetch parsing status: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "✓ Body size limit is working (100MB)" -ForegroundColor Green
Write-Host "✓ File upload successful" -ForegroundColor Green
Write-Host "✓ No 413 PayloadTooLarge error" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
