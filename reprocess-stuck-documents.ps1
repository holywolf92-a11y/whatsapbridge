# Reprocess Stuck Documents - Muhammad Usman & Ahmed Sarfarz
# These documents have parsing jobs that failed due to date format issues
# Now that the date parsing fix is deployed, we need to reprocess them

Write-Host "🔄 Reprocessing Stuck Documents..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "https://recruitment-portal-backend-production-d1f7.up.railway.app/api"

# The attachment IDs from the logs
$attachments = @(
    @{ 
        id = "114628d9-e879-40eb-b0e2-24fd19a76c89"
        name = "MUHAMMAD USMAN-001.pdf"
        jobId = "0ae26a26-6d53-4e30-ab4b-196005fa67d1"
    },
    @{
        id = "de03dbf3-4b84-46dc-b7c8-1aefde517905"
        name = "AHMED SARFARZ-002.pdf"
        jobId = "97901e9f-03d7-413a-ae41-16eda16ebb58"
    }
)

foreach ($att in $attachments) {
    Write-Host "Processing: $($att.name)" -ForegroundColor Yellow
    Write-Host "  Attachment ID: $($att.id)" -ForegroundColor Gray
    Write-Host "  Job ID: $($att.jobId)" -ForegroundColor Gray
    
    try {
        # Trigger reprocessing
        $url = "$baseUrl/cv-inbox/attachments/$($att.id)/process"
        Write-Host "  Calling: $url" -ForegroundColor Gray
        
        $response = Invoke-RestMethod -Uri $url -Method Post -ContentType "application/json"
        
        Write-Host "  ✅ Success!" -ForegroundColor Green
        Write-Host "  Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
    }
    catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        
        # Try to get more details from the response
        if ($_.ErrorDetails.Message) {
            Write-Host "  Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
}

Write-Host "=" * 80 -ForegroundColor Gray
Write-Host "✅ Reprocessing completed!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Check Railway logs to see if the documents are processing:" -ForegroundColor Yellow
Write-Host "   railway logs | Select-Object -Last 50" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Look for these messages:" -ForegroundColor Yellow
Write-Host "   [CVParser] Created candidate ... for attachment ..." -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"
