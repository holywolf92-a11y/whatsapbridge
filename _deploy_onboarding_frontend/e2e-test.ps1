param()

$BACKEND_URL = "https://glorious-flexibility-production.up.railway.app"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "E2E Test: CV Upload to Candidate Display" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check backend health
Write-Host "[1/5] Checking backend health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod "$BACKEND_URL/api/health" -ErrorAction Stop
    Write-Host "✓ Backend is healthy" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend health check failed" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Check candidates list BEFORE upload
Write-Host "[2/5] Fetching candidates BEFORE upload..." -ForegroundColor Yellow
try {
    $candidatesBefore = Invoke-RestMethod "$BACKEND_URL/api/candidates" -ErrorAction Stop
    $countBefore = @($candidatesBefore.candidates).Count
    Write-Host "✓ Current candidates: $countBefore" -ForegroundColor Green
} catch {
    Write-Host "✗ Could not fetch candidates" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $countBefore = 0
}

Write-Host ""

# Step 3: Find and prepare test CV
Write-Host "[3/5] Finding test CV file..." -ForegroundColor Yellow

$possiblePaths = @(
    "d:\falisha\Recruitment Automation Portal (2)\Ibtehaj Uddin Ahmed Siddiqui.pdf",
    "d:\falisha\Recruitment Automation Portal (2)\test.pdf",
    (Get-Item "d:\falisha\Recruitment Automation Portal (2)\*.pdf" -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName)
)

$testCVPath = $null
foreach ($path in $possiblePaths) {
    if ($path -and (Test-Path $path)) {
        $testCVPath = $path
        break
    }
}

if (-not $testCVPath) {
    Write-Host "✗ No test PDF found" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Found test CV: $testCVPath" -ForegroundColor Green
Write-Host ""

# Step 4: Upload CV
Write-Host "[4/5] Creating inbox entry and uploading CV..." -ForegroundColor Yellow

try {
    # Create inbox entry
    $inboxBody = @{
        email = "test@example.com"
        source = "test"
    } | ConvertTo-Json
    
    $inboxResponse = Invoke-RestMethod "$BACKEND_URL/api/cv-inbox" -Method POST -ContentType "application/json" -Body $inboxBody
    $inboxId = $inboxResponse.id
    Write-Host "✓ Created inbox entry: $inboxId" -ForegroundColor Green
    
    # Upload the CV file
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
    Write-Host "✓ Uploaded CV file: $attachmentId" -ForegroundColor Green
    
} catch {
    Write-Host "✗ Upload failed" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 5: Wait for parsing
Write-Host "[5/5] Waiting for CV parsing (polling every 2 sec, timeout 30 sec)..." -ForegroundColor Yellow

$maxAttempts = 15
$attempt = 0
$parsingComplete = $false

while ($attempt -lt $maxAttempts) {
    $attempt++
    Start-Sleep -Seconds 2
    
    try {
        $parseJob = Invoke-RestMethod "$BACKEND_URL/api/cv-inbox/$inboxId/attachments/$attachmentId"
        $status = $parseJob.parsing_status
        
        Write-Host "  Attempt $attempt/$maxAttempts - Status: $status" -ForegroundColor Cyan
        
        if ($status -eq "completed" -or $status -eq "Extracted") {
            Write-Host "✓ CV parsing completed!" -ForegroundColor Green
            $parsingComplete = $true
            break
        }
    } catch {
        Write-Host "  ⚠ Error checking status: $_" -ForegroundColor Yellow
    }
}

Write-Host ""

# Final Check: Verify candidate was created
Write-Host "Verifying candidate creation..." -ForegroundColor Yellow
$candidateFound = $false

try {
    $candidatesAfter = Invoke-RestMethod "$BACKEND_URL/api/candidates"
    $countAfter = @($candidatesAfter.candidates).Count
    
    if ($countAfter -gt $countBefore) {
        Write-Host "✓ Candidate created! ($countBefore -> $countAfter)" -ForegroundColor Green
        
        # Show the new candidate
        $newCandidate = $candidatesAfter.candidates | Where-Object { $_.created_at -gt (Get-Date).AddMinutes(-2) } | Select-Object -First 1
        if ($newCandidate) {
            Write-Host ""
            Write-Host "New Candidate Details:" -ForegroundColor Green
            Write-Host "  Name: $($newCandidate.name)" -ForegroundColor Green
            Write-Host "  Email: $($newCandidate.email)" -ForegroundColor Green
            Write-Host "  Location: $($newCandidate.location)" -ForegroundColor Green
            Write-Host "  Skills: $($newCandidate.skills -join ', ')" -ForegroundColor Green
            $candidateFound = $true
        }
    }
} catch {
    Write-Host "⚠ Could not verify candidate creation: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($parsingComplete -and $candidateFound) {
    Write-Host "✓ PASSED: Full E2E workflow successful!" -ForegroundColor Green
    Write-Host "  - CV uploaded and parsed" -ForegroundColor Green
    Write-Host "  - Candidate record created" -ForegroundColor Green
    Write-Host "  - You can view it in the frontend Candidate Management page" -ForegroundColor Green
} elseif ($parsingComplete) {
    Write-Host "⚠ PARTIAL: CV parsed but candidate verification pending" -ForegroundColor Yellow
    Write-Host "  - CV parsing: OK" -ForegroundColor Yellow
    Write-Host "  - Candidate creation: PENDING (check backend logs)" -ForegroundColor Yellow
} else {
    Write-Host "✗ FAILED: CV parsing did not complete" -ForegroundColor Red
    Write-Host "  - Check backend logs at: $BACKEND_URL/logs" -ForegroundColor Red
}
