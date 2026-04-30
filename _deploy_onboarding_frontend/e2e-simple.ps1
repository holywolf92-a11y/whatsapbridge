$BACKEND_URL = "https://glorious-flexibility-production.up.railway.app"

Write-Host "========================================" 
Write-Host "E2E Test: CV Upload to Candidate Display" 
Write-Host "========================================" 
Write-Host ""

# Step 1: Check backend by testing API
Write-Host "[1] Checking backend API..." 
try {
    $test = Invoke-RestMethod "$BACKEND_URL/api/candidates"
    Write-Host "OK: Backend is responding"
} catch {
    Write-Host "FAILED: Backend check failed - $_"
    exit 1
}

Write-Host ""

# Step 2: Check candidates BEFORE
Write-Host "[2] Fetching candidates BEFORE upload..." 
try {
    $candidatesBefore = Invoke-RestMethod "$BACKEND_URL/api/candidates"
    $countBefore = @($candidatesBefore.candidates).Count
    Write-Host "OK: Current candidates count = $countBefore"
} catch {
    Write-Host "ERROR: $_"
    $countBefore = 0
}

Write-Host ""

# Step 3: Find test CV
Write-Host "[3] Finding test CV file..." 
$testCVPath = Get-Item "d:\falisha\Recruitment Automation Portal (2)\*.pdf" -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName

if (-not $testCVPath) {
    Write-Host "ERROR: No PDF file found"
    exit 1
}

Write-Host "OK: Found CV = $testCVPath"
Write-Host ""

# Step 4: Upload CV
Write-Host "[4] Uploading CV..." 
try {
    $inboxBody = @{
        email = "test@example.com"
        source = "test"
    } | ConvertTo-Json
    
    $inboxResponse = Invoke-RestMethod "$BACKEND_URL/api/cv-inbox" -Method POST -ContentType "application/json" -Body $inboxBody
    $inboxId = $inboxResponse.id
    Write-Host "OK: Created inbox entry = $inboxId"
    
    $fileBytes = [System.IO.File]::ReadAllBytes($testCVPath)
    $fileName = [System.IO.Path]::GetFileName($testCVPath)
    
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    $body = [System.Text.Encoding]::UTF8.GetBytes("--$boundary$LF")
    $body += [System.Text.Encoding]::UTF8.GetBytes("Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"$LF")
    $body += [System.Text.Encoding]::UTF8.GetBytes("Content-Type: application/pdf$LF$LF")
    $body += $fileBytes
    $body += [System.Text.Encoding]::UTF8.GetBytes("$LF--$boundary--$LF")
    
    $uploadResponse = Invoke-RestMethod "$BACKEND_URL/api/cv-inbox/$inboxId/attachments" -Method POST -ContentType "multipart/form-data; boundary=$boundary" -Body $body
    $attachmentId = $uploadResponse.id
    Write-Host "OK: Uploaded CV file = $attachmentId"
    
} catch {
    Write-Host "ERROR: Upload failed - $_"
    exit 1
}

Write-Host ""
Write-Host "[5] Waiting for CV parsing (polling every 2 sec)..." 

$maxAttempts = 15
$attempt = 0
$parsingComplete = $false

while ($attempt -lt $maxAttempts) {
    $attempt++
    Start-Sleep -Seconds 2
    
    try {
        $parseJob = Invoke-RestMethod "$BACKEND_URL/api/cv-inbox/$inboxId/attachments/$attachmentId"
        $status = $parseJob.parsing_status
        
        Write-Host "  Attempt $attempt/$maxAttempts - Status: $status"
        
        if ($status -eq "completed" -or $status -eq "Extracted") {
            Write-Host "OK: CV parsing completed"
            $parsingComplete = $true
            break
        }
    } catch {
        Write-Host "  Warning: $_"
    }
}

Write-Host ""
Write-Host "Verifying candidate creation..." 
$candidateFound = $false

try {
    $candidatesAfter = Invoke-RestMethod "$BACKEND_URL/api/candidates"
    $countAfter = @($candidatesAfter.candidates).Count
    
    if ($countAfter -gt $countBefore) {
        Write-Host "OK: Candidate created ($countBefore to $countAfter)"
        $candidateFound = $true
    }
} catch {
    Write-Host "Warning: $_"
}

Write-Host ""
Write-Host "========================================" 
Write-Host "Test Summary:" 
Write-Host "========================================" 

if ($parsingComplete -and $candidateFound) {
    Write-Host "SUCCESS: Full E2E workflow completed!"
    Write-Host "  - CV uploaded and parsed"
    Write-Host "  - Candidate record created"
} elseif ($parsingComplete) {
    Write-Host "PARTIAL: CV parsed, candidate verification pending"
} else {
    Write-Host "FAILED: CV parsing did not complete"
}
