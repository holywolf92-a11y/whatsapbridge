param()

$BACKEND_URL = "https://glorious-flexibility-production.up.railway.app"

Write-Host "========================================" 
Write-Host "E2E Test: CV Upload to Candidate Display" 
Write-Host "========================================" 
Write-Host ""
Write-Host "Testing: Upload PDF --> Parse --> Create Candidate"
Write-Host ""

# Step 1: Get current candidates count
Write-Host "[Step 1] Fetching current candidates..." 
try {
    $resp = Invoke-RestMethod "$BACKEND_URL/api/candidates"
    $countBefore = @($resp.candidates).Count
    Write-Host "  Current count: $countBefore candidates"
} catch {
    Write-Host "  ERROR: $_"
    exit 1
}

# Step 2: Find test CV
Write-Host "[Step 2] Finding test PDF file..." 
$pdfFile = Get-Item "d:\falisha\Recruitment Automation Portal (2)\*.pdf" -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName

if (-not $pdfFile) {
    Write-Host "  ERROR: No PDF files found"
    exit 1
}
Write-Host "  Found: $pdfFile"

# Step 3: Create inbox message
Write-Host "[Step 3] Creating inbox message..."
try {
    $body = @{
        source = "test"
        status = "pending"
    } | ConvertTo-Json
    
    $inbox = Invoke-RestMethod "$BACKEND_URL/api/inbox" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 10
    $inboxId = $inbox.id
    Write-Host "  Created inbox: $inboxId"
} catch {
    Write-Host "  ERROR: $_"
    exit 1
}

# Step 4: Upload CV as base64
Write-Host "[Step 4] Uploading CV file..."
try {
    $fileBytes = [System.IO.File]::ReadAllBytes($pdfFile)
    $base64 = [Convert]::ToBase64String($fileBytes)
    $fileName = [System.IO.Path]::GetFileName($pdfFile)
    
    $body = @{
        file_name = $fileName
        mime_type = "application/pdf"
        attachment_type = "cv"
        file_base64 = $base64
    } | ConvertTo-Json
    
    $attachment = Invoke-RestMethod "$BACKEND_URL/api/inbox/$inboxId/attachments" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 30
    $attachmentId = $attachment.id
    Write-Host "  Uploaded: $attachmentId"
    Write-Host "  File size: $(($fileBytes.Length / 1024).ToString('F2')) KB"
} catch {
    Write-Host "  ERROR: $_"
    exit 1
}

# Step 5: Trigger parsing
Write-Host "[Step 5] Triggering CV parsing..."
try {
    $body = @{} | ConvertTo-Json
    $parseResp = Invoke-RestMethod "$BACKEND_URL/api/inbox/attachments/$attachmentId/process" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 30
    $jobId = $parseResp.job_id
    Write-Host "  Parsing job created: $jobId"
} catch {
    Write-Host "  ERROR: $_"
    exit 1
}

# Step 6: Wait for parsing completion
Write-Host "[Step 6] Waiting for parsing to complete (polling every 3 sec, max 45 sec)..."
$maxAttempts = 15
$parsingDone = $false

for ($i = 1; $i -le $maxAttempts; $i++) {
    Start-Sleep -Seconds 3
    
    try {
        $jobs = Invoke-RestMethod "$BACKEND_URL/api/parsing-jobs/$jobId" -TimeoutSec 10
        $status = $jobs.status
        
        Write-Host "  [$i/$maxAttempts] Status: $status"
        
        if ($status -eq "completed" -or $status -eq "extracted") {
            Write-Host "  PARSING COMPLETE!"
            $parsingDone = $true
            break
        }
    } catch {
        Write-Host "  [$i/$maxAttempts] Error checking status: $_"
    }
}

if (-not $parsingDone) {
    Write-Host "  WARNING: Parsing did not complete within timeout"
}

# Step 7: Check if candidate was created
Write-Host "[Step 7] Checking if candidate was created..."
$countAfter = 0

try {
    Start-Sleep -Seconds 2
    $resp = Invoke-RestMethod "$BACKEND_URL/api/candidates" -TimeoutSec 10
    $countAfter = @($resp.candidates).Count
    
    Write-Host "  Candidates before: $countBefore"
    Write-Host "  Candidates after:  $countAfter"
    
    if ($countAfter -gt $countBefore) {
        Write-Host "  NEW CANDIDATES CREATED!"
        
        # Show new candidates
        $newCandidates = @($resp.candidates) | Where-Object { $_.created_at -gt (Get-Date).AddMinutes(-5) } | Sort-Object -Property created_at -Descending
        foreach ($cand in $newCandidates | Select-Object -First 2) {
            Write-Host "    - Name: $($cand.name)"
            Write-Host "      Email: $($cand.email)"
            Write-Host "      Experience: $($cand.experience_years) years"
            Write-Host "      Skills: $($cand.skills)"
        }
    }
} catch {
    Write-Host "  ERROR: $_"
}

# Summary
Write-Host ""
Write-Host "========================================" 
Write-Host "Test Summary:" 
Write-Host "========================================" 

if ($parsingDone -and $countAfter -gt $countBefore) {
    Write-Host "SUCCESS: Full E2E workflow completed!"
    Write-Host "  - CV uploaded: YES"
    Write-Host "  - CV parsed: YES"
    Write-Host "  - Candidate created: YES ($($countAfter - $countBefore) new)"
} elseif ($parsingDone) {
    Write-Host "PARTIAL: CV parsed but candidate may still be processing"
    Write-Host "  - CV uploaded: YES"
    Write-Host "  - CV parsed: YES"
    Write-Host "  - Candidate creation: PENDING (may take a few more seconds)"
} else {
    Write-Host "INCOMPLETE: CV parsing did not complete"
    Write-Host "  - Check backend logs for details"
}

Write-Host ""
Write-Host "To view candidates in the frontend, visit the Candidate Management page."
