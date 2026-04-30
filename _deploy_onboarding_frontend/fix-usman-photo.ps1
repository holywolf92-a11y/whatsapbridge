$candidateId = "25c2e464-359f-479d-a8b9-ac7bb9fec3b5"
$pdfPath = "candidates/25c2e464-359f-479d-a8b9-ac7bb9fec3b5/other_documents/1769597850750_e13c7807-2873-43d3-9b0d-b160ded466b7_pages_1.pdf"

Write-Host "Finding document record for the PDF..." -ForegroundColor Cyan

$apiBase = "https://glorious-flexibility-production.up.railway.app/api"
$docsResponse = Invoke-RestMethod -Uri "$apiBase/documents/candidates/$candidateId/documents" -Method Get

$pdfDoc = $docsResponse | Where-Object { $_.storage_path -eq $pdfPath } | Select-Object -First 1

if ($pdfDoc) {
    Write-Host "Found document: $($pdfDoc.id)" -ForegroundColor Green
    Write-Host "Current category: $($pdfDoc.category)" -ForegroundColor Yellow
    
    Write-Host "Extracting photo..." -ForegroundColor Cyan
    try {
        $body = @{ documentId = $pdfDoc.id } | ConvertTo-Json
        $result = Invoke-RestMethod -Uri "$apiBase/candidates/$candidateId/extract-photo" -Method Post -ContentType "application/json" -Body $body
        
        Write-Host "Success!" -ForegroundColor Green
        Write-Host $result.message
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
} else {
    Write-Host "Document not found!" -ForegroundColor Red
    Write-Host "Available documents:"
    $docsResponse | ForEach-Object { Write-Host "Category: $($_.category), Path: $($_.storage_path)" }
}
