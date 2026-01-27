$backend = 'https://recruitment-portal-backend-production-d1f7.up.railway.app'

# Create a minimal PDF from scratch (different content each time)
$timestamp = Get-Date -Format 'yyyyMMddHHmmssffff'
$randomNum = Get-Random -Maximum 10000
$pdfContent = "%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 200 >>
stream
BT
/F1 12 Tf
50 700 Td
(Test CV - $timestamp - $randomNum) Tj
0 -20 Td
(John Doe) Tj
0 -20 Td
(john@example.com) Tj
0 -20 Td
(Software Engineer) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000056 00000 n
0000000115 00000 n
0000000231 00000 n
0000000333 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
584
%%EOF"

$pdfBytes = [System.Text.Encoding]::ASCII.GetBytes($pdfContent)
Write-Host "PDF size: $($pdfBytes.Length) bytes" -ForegroundColor Yellow

# Create message
Write-Host "Creating inbox message..." -ForegroundColor Yellow
$msgBody = @{
    source = 'test'
    external_message_id = "test-$randomNum"
    payload = @{ sender_name = 'Test' }
    status = 'received'
} | ConvertTo-Json

try {
    $msgResp = Invoke-WebRequest -Uri "$backend/api/cv-inbox/" -Method POST -ContentType 'application/json' -Body $msgBody -UseBasicParsing -ErrorAction Stop
    $msg = $msgResp.Content | ConvertFrom-Json
    Write-Host "Message ID: $($msg.id)" -ForegroundColor Green
}
catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Upload PDF
Write-Host "Uploading unique PDF..." -ForegroundColor Yellow
$base64 = [Convert]::ToBase64String($pdfBytes)
$attBody = @{
    file_name = "test-cv-$randomNum.pdf"
    mime_type = 'application/pdf'
    attachment_type = 'cv'
    storage_bucket = 'documents'
    storage_path = "test/cv-$randomNum.pdf"
    file_base64 = $base64
} | ConvertTo-Json

try {
    $attResp = Invoke-WebRequest -Uri "$backend/api/cv-inbox/$($msg.id)/attachments" -Method POST -ContentType 'application/json' -Body $attBody -UseBasicParsing -ErrorAction Stop
    $att = $attResp.Content | ConvertFrom-Json
    Write-Host "SUCCESS: Attachment $($att.id)" -ForegroundColor Green
    Write-Host "Status: PASSED - No errors (100MB body limit working)" -ForegroundColor Green
}
catch {
    $err = $_.Exception.Response.StatusCode.Value__
    if ($err -eq 413) {
        Write-Host "FAILED: 413 PayloadTooLarge - body limit NOT working" -ForegroundColor Red
    } else {
        Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    }
    exit 1
}
