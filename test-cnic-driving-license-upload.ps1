# Test Script: Upload PDF with Driving License and CNIC
# Tests the new document categories (cnic, driving_license)

param(
    [string]$BackendUrl = "https://recruitment-portal-backend-production-d1f7.up.railway.app",
    [string]$PdfPath = "D:\falisha\Recruitment Automation Portal (2)\MUHAMMAD AMIN-021.pdf"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing: CNIC & Driving License Upload" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get or create a test candidate
Write-Host "[1] Getting test candidate..." -ForegroundColor Yellow
try {
    $candidatesResp = Invoke-RestMethod "$BackendUrl/api/candidates?limit=1" -Method GET -TimeoutSec 10
    if ($candidatesResp.candidates -and $candidatesResp.candidates.Count -gt 0) {
        $candidateId = $candidatesResp.candidates[0].id
        Write-Host "✓ Using existing candidate: $candidateId" -ForegroundColor Green
    } else {
        Write-Host "✗ No candidates found. Please create a candidate first." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error fetching candidates: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Verify PDF exists
Write-Host "[2] Checking PDF file..." -ForegroundColor Yellow
if (-not (Test-Path $PdfPath)) {
    Write-Host "✗ PDF not found: $PdfPath" -ForegroundColor Red
    exit 1
}
$pdfFile = Get-Item $PdfPath
Write-Host "✓ Found PDF: $($pdfFile.Name) ($([math]::Round($pdfFile.Length/1KB, 2)) KB)" -ForegroundColor Green

# Step 3: Upload PDF using curl (more reliable for multipart)
Write-Host "[3] Uploading PDF to /api/documents/candidate-documents..." -ForegroundColor Yellow
try {
    $curlOutput = curl.exe -X POST "$BackendUrl/api/documents/candidate-documents" `
        -F "file=@`"$PdfPath`"" `
        -F "candidate_id=$candidateId" `
        -F "source=web" `
        --silent --show-error 2>&1
    
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
        throw "curl failed: $curlOutput"
    }
    
    $uploadResp = $curlOutput | ConvertFrom-Json
    
    Write-Host "✓ Upload successful!" -ForegroundColor Green
    Write-Host "  Document ID: $($uploadResp.document.id)" -ForegroundColor Gray
    Write-Host "  Request ID: $($uploadResp.request_id)" -ForegroundColor Gray
    Write-Host "  Status: $($uploadResp.document.verification_status)" -ForegroundColor Gray
    Write-Host "  Category: $($uploadResp.document.category)" -ForegroundColor Gray
    
    $documentId = $uploadResp.document.id
    $requestId = $uploadResp.request_id
    
} catch {
    Write-Host "✗ Upload failed: $_" -ForegroundColor Red
    Write-Host "  Output: $curlOutput" -ForegroundColor Red
    exit 1
}

# Step 4: Wait and check document status
Write-Host "[4] Waiting for processing..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "[5] Checking document details..." -ForegroundColor Yellow
try {
    $docResp = Invoke-RestMethod "$BackendUrl/api/documents/candidate-documents/$documentId" -Method GET -TimeoutSec 10
    Write-Host "✓ Document details retrieved" -ForegroundColor Green
    Write-Host ""
    Write-Host "Document Information:" -ForegroundColor Cyan
    Write-Host "  ID: $($docResp.id)" -ForegroundColor Gray
    Write-Host "  File Name: $($docResp.file_name)" -ForegroundColor Gray
    
    $categoryColor = if ($docResp.category -in @('cnic', 'driving_license', 'police_character_certificate')) { 'Green' } else { 'Yellow' }
    Write-Host "  Category: $($docResp.category)" -ForegroundColor $categoryColor
    Write-Host "  Detected Category: $($docResp.detected_category)" -ForegroundColor Gray
    Write-Host "  Document Type: $($docResp.document_type)" -ForegroundColor Gray
    Write-Host "  Verification Status: $($docResp.verification_status)" -ForegroundColor Gray
    Write-Host "  Confidence: $($docResp.confidence)" -ForegroundColor Gray
    Write-Host "  Storage Path: $($docResp.storage_path)" -ForegroundColor Gray
    
    # Check folder placement
    if ($docResp.storage_path) {
        $expectedFolders = @('cnic', 'driving_license', 'police_character_certificate')
        $pathParts = $docResp.storage_path -split '/'
        $folder = $pathParts[1]  # Format: candidate_id/folder/filename
        
        Write-Host ""
        Write-Host "Folder Placement:" -ForegroundColor Cyan
        $folderColor = if ($folder -in $expectedFolders) { 'Green' } else { 'Yellow' }
        Write-Host "  Folder: $folder" -ForegroundColor $folderColor
        
        if ($folder -in $expectedFolders) {
            Write-Host "  ✓ Document is in correct folder!" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ Document may be in wrong folder (expected: cnic, driving_license, or police_character_certificate)" -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "✗ Failed to get document details: $_" -ForegroundColor Red
}

# Step 6: Check for split documents (if PDF was split)
Write-Host ""
Write-Host "[6] Checking for split documents..." -ForegroundColor Yellow
try {
    $allDocsResp = Invoke-RestMethod "$BackendUrl/api/documents/candidate-documents?candidate_id=$candidateId" -Method GET -TimeoutSec 10
    $cutoffTime = (Get-Date).AddMinutes(-5).ToUniversalTime().ToString('o')
    $recentDocs = $allDocsResp | Where-Object { $_.id -eq $documentId -or $_.created_at -gt $cutoffTime }
    
    if ($recentDocs.Count -gt 1) {
        Write-Host "✓ Found $($recentDocs.Count) documents (PDF was split)" -ForegroundColor Green
        Write-Host ""
        Write-Host "Split Documents:" -ForegroundColor Cyan
        foreach ($doc in $recentDocs) {
            $folder = ($doc.storage_path -split '/')[1]
            Write-Host "  - $($doc.file_name)" -ForegroundColor Gray
            Write-Host "    Category: $($doc.category) | Type: $($doc.document_type) | Folder: $folder" -ForegroundColor Gray
        }
    } else {
        Write-Host "  Single document (not split)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ⚠ Could not check split documents: $_" -ForegroundColor Yellow
}

# Step 7: Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Upload completed successfully" -ForegroundColor Green
Write-Host "✓ Document ID: $documentId" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check Railway logs for processing details:" -ForegroundColor Gray
Write-Host "   railway logs --service recruitment-portal-backend --tail 100" -ForegroundColor DarkGray
Write-Host "2. Verify documents in Supabase Storage:" -ForegroundColor Gray
Write-Host "   Check folders: cnic/, driving_license/, police_character_certificate/" -ForegroundColor DarkGray
Write-Host "3. Check candidate flags were updated:" -ForegroundColor Gray
Write-Host "   cnic_received, driving_license_received should be true" -ForegroundColor DarkGray
Write-Host ""
