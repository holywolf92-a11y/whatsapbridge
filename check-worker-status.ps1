# Check Worker Status - Diagnose Document Processing Issues
# Calls the backend API to check if queue workers are running.

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$url = "https://glorious-flexibility-production.up.railway.app/api/worker-status?ts=$ts"

Write-Host "Checking worker status..." -ForegroundColor Cyan
Write-Host "URL: $url" -ForegroundColor DarkGray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method Get -ContentType "application/json" -TimeoutSec 20

    Write-Host ("=" * 80) -ForegroundColor Gray
    Write-Host "WORKER STATUS REPORT" -ForegroundColor Yellow
    Write-Host ("=" * 80) -ForegroundColor Gray
    Write-Host ""

    Write-Host "Overall: $($response.overall)" -ForegroundColor Green
    Write-Host "Timestamp: $($response.timestamp)" -ForegroundColor DarkGray
    if ($null -ne $response.cached) {
        Write-Host "Cached: $($response.cached)" -ForegroundColor DarkGray
    }
    if ($response.deployment) {
        $commitSha = $response.deployment.commitSha
        if (-not $commitSha) { $commitSha = $response.deployment.commit_sha }
        $commitShort = $response.deployment.commitShort
        if (-not $commitShort) { $commitShort = $response.deployment.commit_short }

        $deployLine = "Deployment: role=$($response.deployment.role) service=$($response.deployment.service)"
        if ($commitSha -or $commitShort) {
            $commitDisplay = $commitShort
            if (-not $commitDisplay) { $commitDisplay = $commitSha }
            $deployLine = "$deployLine commit=$commitDisplay"
        }
        Write-Host $deployLine -ForegroundColor DarkGray
    }
    Write-Host ""

    Write-Host "Environment:" -ForegroundColor Yellow
    if ($response.environment) {
        Write-Host "  RUN_WORKER: $($response.environment.RUN_WORKER)" -ForegroundColor Gray
        Write-Host "  SERVICE_START_COMMAND: $($response.environment.SERVICE_START_COMMAND)" -ForegroundColor Gray
        Write-Host "  REDIS_URL: $($response.environment.REDIS_URL)" -ForegroundColor Gray
        Write-Host "  PYTHON_CV_PARSER_URL: $($response.environment.PYTHON_CV_PARSER_URL)" -ForegroundColor Gray
        Write-Host "  PYTHON_HMAC_SECRET: $($response.environment.PYTHON_HMAC_SECRET)" -ForegroundColor Gray
    } else {
        Write-Host "  (no environment block in response)" -ForegroundColor DarkGray
    }
    Write-Host ""

    Write-Host "Workers:" -ForegroundColor Yellow
    if ($response.workers) {
        Write-Host "  enabled: $($response.workers.enabled)" -ForegroundColor Gray
        Write-Host "  mode: $($response.workers.mode)" -ForegroundColor Gray
        Write-Host "  cvParser.configured: $($response.workers.cvParser.configured)" -ForegroundColor Gray
        Write-Host "  documentVerification.configured: $($response.workers.documentVerification.configured)" -ForegroundColor Gray
    } else {
        Write-Host "  (no workers block in response)" -ForegroundColor DarkGray
    }
    Write-Host ""

    Write-Host "Queues:" -ForegroundColor Yellow
    if (-not $response.queues -or -not $response.queues.available) {
        Write-Host "  queues not available" -ForegroundColor Red
        if ($response.queues -and $response.queues.error) {
            Write-Host "  error: $($response.queues.error)" -ForegroundColor Red
        }
    } else {
        $cvQueue = $response.queues.jobs.cvParsing
        if (-not $cvQueue) { $cvQueue = $response.queues.jobs.cvParser }
        $docQueue = $response.queues.jobs.documentVerification

        Write-Host "  CV Parsing" -ForegroundColor Cyan
        Write-Host "    waiting:   $($cvQueue.waiting)" -ForegroundColor Gray
        Write-Host "    active:    $($cvQueue.active)" -ForegroundColor Gray
        Write-Host "    completed: $($cvQueue.completed)" -ForegroundColor Gray
        Write-Host "    failed:    $($cvQueue.failed)" -ForegroundColor Gray
        Write-Host "    delayed:   $($cvQueue.delayed)" -ForegroundColor Gray

        Write-Host ""
        Write-Host "  Document Verification" -ForegroundColor Cyan
        Write-Host "    waiting:   $($docQueue.waiting)" -ForegroundColor Gray
        Write-Host "    active:    $($docQueue.active)" -ForegroundColor Gray
        Write-Host "    completed: $($docQueue.completed)" -ForegroundColor Gray
        Write-Host "    failed:    $($docQueue.failed)" -ForegroundColor Gray
        Write-Host "    delayed:   $($docQueue.delayed)" -ForegroundColor Gray
    }
    Write-Host ""

    Write-Host "Documents:" -ForegroundColor Yellow
    Write-Host "  pendingDocuments: $($response.pendingDocuments)" -ForegroundColor Gray

    $stuckCount = 0
    if ($response.stuckDocuments -and $null -ne $response.stuckDocuments.count) {
        $stuckCount = [int]$response.stuckDocuments.count
    }
    Write-Host "  stuckDocuments: $stuckCount" -ForegroundColor $(if ($stuckCount -gt 0) { "Red" } else { "Green" })

    exit 0
}
catch {
    Write-Host "Error checking worker status" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
