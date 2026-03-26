# Check Worker Status - Diagnose Document Processing Issues
# This script calls the backend API to check if workers are running

Write-Host "🔍 Checking Worker Status..." -ForegroundColor Cyan
Write-Host ""

$url = "https://recruitment-portal-backend-production-d1f7.up.railway.app/api/worker-status"

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -ContentType "application/json"
    
    Write-Host "=" * 80 -ForegroundColor Gray
    Write-Host "WORKER STATUS REPORT" -ForegroundColor Yellow
    Write-Host "=" * 80 -ForegroundColor Gray
    Write-Host ""
    
    # Overall Status
    Write-Host "📊 Overall Status: $($response.overall)" -ForegroundColor $(if ($response.overall -like "*✅*") { "Green" } elseif ($response.overall -like "*⚠️*") { "Yellow" } else { "Red" })
    Write-Host ""
    
    # Environment Variables
    Write-Host "🔧 Environment Configuration:" -ForegroundColor Yellow
    Write-Host "   RUN_WORKER: $($response.environment.RUN_WORKER)" -ForegroundColor $(if ($response.environment.RUN_WORKER -eq 'true') { "Green" } else { "Red" })
    Write-Host "   REDIS_URL: $($response.environment.REDIS_URL)" -ForegroundColor $(if ($response.environment.REDIS_URL -like "*✅*") { "Green" } else { "Red" })
    Write-Host "   PYTHON_CV_PARSER_URL: $($response.environment.PYTHON_CV_PARSER_URL)" -ForegroundColor $(if ($response.environment.PYTHON_CV_PARSER_URL -like "*✅*") { "Green" } else { "Red" })
    Write-Host "   PYTHON_HMAC_SECRET: $($response.environment.PYTHON_HMAC_SECRET)" -ForegroundColor $(if ($response.environment.PYTHON_HMAC_SECRET -like "*✅*") { "Green" } else { "Red" })
    Write-Host ""
    
    # Workers Status
    Write-Host "👷 Workers Status:" -ForegroundColor Yellow
    Write-Host "   Enabled: $(if ($response.workers.enabled) { '✅ YES' } else { '❌ NO' })" -ForegroundColor $(if ($response.workers.enabled) { "Green" } else { "Red" })
    Write-Host "   CV Parser Configured: $(if ($response.workers.cvParser.configured) { '✅ YES' } else { '❌ NO' })" -ForegroundColor $(if ($response.workers.cvParser.configured) { "Green" } else { "Red" })
    Write-Host "   Document Verification Configured: $(if ($response.workers.documentVerification.configured) { '✅ YES' } else { '❌ NO' })" -ForegroundColor $(if ($response.workers.documentVerification.configured) { "Green" } else { "Red" })
    Write-Host ""
    
    # Queue Status
    Write-Host "📦 Queue Status:" -ForegroundColor Yellow
    if ($response.queues.available) {
        $cvQueue = $response.queues.jobs.cvParsing
        if (-not $cvQueue) { $cvQueue = $response.queues.jobs.cvParser }

        $docVerQueue = $response.queues.jobs.documentVerification

        $waMediaQueue = $response.queues.jobs.whatsappMedia
        $waVerifyQueue = $response.queues.jobs.whatsappAttachmentVerification

        Write-Host "   Redis Connected: ✅ YES" -ForegroundColor Green
        Write-Host ""
        Write-Host "   CV Parser Queue:" -ForegroundColor Cyan
        Write-Host "      Waiting: $($cvQueue.waiting)" -ForegroundColor Gray
        Write-Host "      Active: $($cvQueue.active)" -ForegroundColor Gray
        Write-Host "      Completed: $($cvQueue.completed)" -ForegroundColor Gray
        Write-Host "      Failed: $($cvQueue.failed)" -ForegroundColor $(if ($cvQueue.failed -gt 0) { "Red" } else { "Gray" })
        Write-Host ""
        Write-Host "   Document Verification Queue:" -ForegroundColor Cyan
        Write-Host "      Waiting: $($docVerQueue.waiting)" -ForegroundColor Gray
        Write-Host "      Active: $($docVerQueue.active)" -ForegroundColor Gray
        Write-Host "      Completed: $($docVerQueue.completed)" -ForegroundColor Gray
        Write-Host "      Failed: $($docVerQueue.failed)" -ForegroundColor $(if ($docVerQueue.failed -gt 0) { "Red" } else { "Gray" })

        if ($waMediaQueue) {
            Write-Host ""
            Write-Host "   WhatsApp Media Queue:" -ForegroundColor Cyan
            Write-Host "      Waiting: $($waMediaQueue.waiting)" -ForegroundColor Gray
            Write-Host "      Active: $($waMediaQueue.active)" -ForegroundColor Gray
            Write-Host "      Completed: $($waMediaQueue.completed)" -ForegroundColor Gray
            Write-Host "      Failed: $($waMediaQueue.failed)" -ForegroundColor $(if ($waMediaQueue.failed -gt 0) { "Red" } else { "Gray" })
        }

        if ($waVerifyQueue) {
            Write-Host ""
            Write-Host "   WhatsApp Attachment Verification Queue:" -ForegroundColor Cyan
            Write-Host "      Waiting: $($waVerifyQueue.waiting)" -ForegroundColor Gray
            Write-Host "      Active: $($waVerifyQueue.active)" -ForegroundColor Gray
            Write-Host "      Completed: $($waVerifyQueue.completed)" -ForegroundColor Gray
            Write-Host "      Failed: $($waVerifyQueue.failed)" -ForegroundColor $(if ($waVerifyQueue.failed -gt 0) { "Red" } else { "Gray" })
        }
    } else {
        Write-Host "   Redis Connected: ❌ NO" -ForegroundColor Red
        if ($response.queues.error) {
            Write-Host "   Error: $($response.queues.error)" -ForegroundColor Red
        }
    }
    Write-Host ""
    
    # Pending Documents
    Write-Host "📄 Document Status:" -ForegroundColor Yellow
    Write-Host "   Pending Documents: $($response.pendingDocuments)" -ForegroundColor $(if ($response.pendingDocuments -gt 0) { "Yellow" } else { "Green" })
    
    if ($response.stuckDocuments -and $response.stuckDocuments.count -gt 0) {
        Write-Host "   Stuck Documents (>5 min): $($response.stuckDocuments.count)" -ForegroundColor Red
        Write-Host ""
        Write-Host "   🚨 Stuck Documents:" -ForegroundColor Red
        foreach ($doc in $response.stuckDocuments.documents) {
            Write-Host "      • $($doc.name)" -ForegroundColor Gray
            Write-Host "        ID: $($doc.id)" -ForegroundColor DarkGray
            Write-Host "        Stuck for: $($doc.stuck_duration_minutes) minutes" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "   Stuck Documents: 0 ✅" -ForegroundColor Green
    }
    Write-Host ""
    
    # Health Summary
    Write-Host "=" * 80 -ForegroundColor Gray
    Write-Host "HEALTH SUMMARY" -ForegroundColor Yellow
    Write-Host "=" * 80 -ForegroundColor Gray
    Write-Host "   Workers Running: $(if ($response.health.workersRunning) { '✅' } else { '❌' })" -ForegroundColor $(if ($response.health.workersRunning) { "Green" } else { "Red" })
    Write-Host "   Redis Connected: $(if ($response.health.redisConnected) { '✅' } else { '❌' })" -ForegroundColor $(if ($response.health.redisConnected) { "Green" } else { "Red" })
    Write-Host "   Python Service Configured: $(if ($response.health.pythonServiceConfigured) { '✅' } else { '❌' })" -ForegroundColor $(if ($response.health.pythonServiceConfigured) { "Green" } else { "Red" })
    Write-Host "   Stuck Documents: $($response.health.stuckDocuments)" -ForegroundColor $(if ($response.health.stuckDocuments -eq 0) { "Green" } else { "Red" })
    Write-Host ""
    
    # Recommendations
    if (-not $response.workers.enabled) {
        Write-Host "💡 RECOMMENDATION:" -ForegroundColor Yellow
        Write-Host "   Set RUN_WORKER=true in Railway environment variables" -ForegroundColor White
        Write-Host "   Then redeploy the backend" -ForegroundColor White
        Write-Host ""
    }
    
    if ($response.stuckDocuments -and $response.stuckDocuments.count -gt 0) {
        Write-Host "💡 TO FIX STUCK DOCUMENTS:" -ForegroundColor Yellow
        Write-Host "   1. Enable workers (if not already enabled)" -ForegroundColor White
        Write-Host "   2. Click 'Reprocess' button on each document in the UI" -ForegroundColor White
        Write-Host "   3. OR run: .\fix-photos.ps1 (for photos)" -ForegroundColor White
        Write-Host ""
    }
    
    Write-Host "=" * 80 -ForegroundColor Gray
    Write-Host "Timestamp: $($response.timestamp)" -ForegroundColor DarkGray
    Write-Host "=" * 80 -ForegroundColor Gray
}
catch {
    Write-Host "❌ Error checking worker status" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Make sure the backend is deployed and accessible at:" -ForegroundColor Yellow
    Write-Host "   $url" -ForegroundColor White
}

Write-Host ""
Read-Host "Press Enter to exit"
