param()

$BACKEND_URL = "https://glorious-flexibility-production.up.railway.app"

Write-Host "Test: Full CV Upload and Parse Flow"
Write-Host "===================================="
Write-Host ""

# Step 1: Create inbox message
Write-Host "[1] Creating inbox message..."
$msgBody = @{
    source = "web"
    status = "received"
    received_at = (Get-Date -Format 'o')
    external_message_id = "test-$(Get-Random)"
    payload = @{
        sender_name = "Test User"
        sender_contact = "test@example.com"
    }
} | ConvertTo-Json

try {
    $msgResp = Invoke-RestMethod "$BACKEND_URL/api/cv-inbox" -Method POST -ContentType "application/json" -Body $msgBody -TimeoutSec 10
    $msgId = $msgResp.id
    Write-Host "OK: Message created = $msgId"
} catch {
    Write-Host "ERROR: Could not create message"
    Write-Host "  $_"
    exit 1
}

# Step 2: Find a test PDF
Write-Host "[2] Finding test PDF..."
$pdfFile = Get-Item "d:\falisha\Recruitment Automation Portal (2)\*.pdf" -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $pdfFile) {
    Write-Host "ERROR: No PDF found"
    exit 1
}
$pdfPath = $pdfFile.FullName
$pdfSize = $pdfFile.Length
Write-Host "OK: Found PDF = $($pdfFile.Name) ($($pdfSize/1024) KB)"

# Step 3: Encode PDF to base64
Write-Host "[3] Encoding PDF to base64..."
$pdfBytes = [System.IO.File]::ReadAllBytes($pdfPath)
$base64 = [Convert]::ToBase64String($pdfBytes)
Write-Host "OK: Encoded $(($base64.Length / 1024).ToString('F1')) KB of base64"

# Step 4: Upload attachment
Write-Host "[4] Uploading attachment..."
$attBody = @{
    file_base64 = $base64
    file_name = $pdfFile.Name
    mime_type = "application/pdf"
    attachment_type = "cv"
    storage_bucket = "documents"
    storage_path = "inbox/$($pdfFile.Name)"
} | ConvertTo-Json -Depth 10

try {
    $attResp = Invoke-RestMethod "$BACKEND_URL/api/cv-inbox/$msgId/attachments" -Method POST -ContentType "application/json" -Body $attBody -TimeoutSec 30
    Write-Host "OK: Response type = $($attResp.GetType().Name)"
    
    if ($attResp.id) {
        $attId = $attResp.id
        Write-Host "OK: Attachment ID = $attId"
    } else {
        Write-Host "ERROR: Response missing ID field"
        Write-Host "Response: $($attResp | ConvertTo-Json)"
        exit 1
    }
} catch {
    Write-Host "ERROR: Upload failed"
    Write-Host "  Code: $($_.Exception.Response.StatusCode)"
    Write-Host "  Message: $($_.Exception.Message)"
    exit 1
}

# Step 5: Trigger parsing
Write-Host "[5] Triggering parsing..."
$parseBody = @{} | ConvertTo-Json

try {
    $parseResp = Invoke-RestMethod "$BACKEND_URL/api/cv-inbox/attachments/$attId/process" -Method POST -ContentType "application/json" -Body $parseBody -TimeoutSec 10
    $jobId = $parseResp.job_id
    Write-Host "OK: Parsing job created = $jobId"
} catch {
    Write-Host "ERROR: Parse trigger failed"
    Write-Host "  Code: $($_.Exception.Response.StatusCode)"
    Write-Host "  Message: $($_.Exception.Message)"
    
    # Try to get more details
    try {
        $errorBody = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorBody)
        $errorText = $reader.ReadToEnd()
        Write-Host "  Response: $errorText"
    } catch {}
    
    exit 1
}

Write-Host ""
Write-Host "SUCCESS: Full flow completed!"
Write-Host "  Inbox Message: $msgId"
Write-Host "  Attachment: $attId"
Write-Host "  Parsing Job: $jobId"
