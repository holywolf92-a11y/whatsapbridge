param(
    [int]$DelayMs = 1500,
    [int]$BatchSize = 20,
    [switch]$DryRun,
    [int]$StartFrom = 0
)

$SUPABASE_URL   = $env:SUPABASE_URL
$SUPABASE_KEY   = $env:SUPABASE_SERVICE_ROLE_KEY
$BACKEND_URL    = "https://glorious-flexibility-production.up.railway.app"

if (-not $SUPABASE_URL -or -not $SUPABASE_KEY) {
    Write-Error "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment."
    exit 1
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " Employer-Safe CV Backfill - v3.2.0 sanitization pipeline   " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Backend:  $BACKEND_URL"
Write-Host "DryRun:   $DryRun"
Write-Host "Delay:    ${DelayMs}ms between requests"
Write-Host ""

# --- 1. Fetch all candidate IDs from Supabase ---
Write-Host "Fetching candidate list from Supabase..." -ForegroundColor Yellow

$headers = @{
    "apikey"        = $SUPABASE_KEY
    "Authorization" = "Bearer $SUPABASE_KEY"
    "Range"         = "0-9999"
}

$allCandidates = @()
$offset = 0
$pageSize = 1000

do {
    $headers = @{
        "apikey"          = $SUPABASE_KEY
        "Authorization"   = "Bearer $SUPABASE_KEY"
        "Prefer"          = "count=none"
    }

    try {
        $candidateUri = "$SUPABASE_URL/rest/v1/candidates?select=id,name&order=created_at.asc&limit=$pageSize&offset=$offset"
        $resp = Invoke-RestMethod `
            -Uri $candidateUri `
            -Headers $headers `
            -Method GET `
            -ErrorAction Stop
        $allCandidates += $resp
        $offset += $pageSize
    } catch {
        Write-Error "Failed to fetch candidates: $_"
        exit 1
    }
} while ($resp.Count -eq $pageSize)

$total = $allCandidates.Count
Write-Host "Found $total candidates total." -ForegroundColor Green

if ($StartFrom -gt 0) {
    Write-Host "Resuming from index $StartFrom..." -ForegroundColor Yellow
    $allCandidates = $allCandidates[$StartFrom..($total - 1)]
    Write-Host "Processing $($allCandidates.Count) remaining candidates."
}

if ($DryRun) {
    Write-Host ""
    Write-Host "DRY RUN - would process these candidate IDs:" -ForegroundColor Magenta
    $allCandidates | ForEach-Object { Write-Host "  $($_.id)  $($_.name)" }
    exit 0
}

Write-Host ""

# --- 2. Call backend for each candidate ---
$success = 0
$failed  = 0
$skipped = 0
$errors  = @()

$startTime = Get-Date

for ($i = 0; $i -lt $allCandidates.Count; $i++) {
    $candidate  = $allCandidates[$i]
    $id         = $candidate.id
    $name       = $candidate.name
    $globalIdx  = $i + $StartFrom + 1

    $url = "$BACKEND_URL/api/cv-generator/${id}?format=employer-safe"

    Write-Host "[$globalIdx/$total] $name ($id)..." -NoNewline

    try {
        $result = Invoke-RestMethod -Uri $url -Method GET -TimeoutSec 120 -ErrorAction Stop

        if ($result.success -or $result.signed_url -or $result.url) {
            Write-Host " OK" -ForegroundColor Green
            $success++
        } else {
            Write-Host " (no URL returned)" -ForegroundColor Yellow
            $skipped++
        }
    } catch {
        $statusCode = "?"
        if ($_.Exception.Response) { $statusCode = [int]$_.Exception.Response.StatusCode }
        Write-Host " FAIL ($statusCode) $($_.Exception.Message)" -ForegroundColor Red
        $failed++
        $errors += "[$globalIdx] $name ($id): $($_.Exception.Message)"
    }

    # Pause between requests
    if ($i -lt $allCandidates.Count - 1) {
        Start-Sleep -Milliseconds $DelayMs
    }

    # Longer pause every batch
    if (($i + 1) % $BatchSize -eq 0 -and $i -lt $allCandidates.Count - 1) {
        $elapsed = (Get-Date) - $startTime
        $rate    = ($i + 1) / $elapsed.TotalMinutes
        $eta     = ($allCandidates.Count - $i - 1) / $rate
        Write-Host ""
        Write-Host "  --- Batch complete. Rate: $([math]::Round($rate,1))/min  ETA: $([math]::Round($eta,1)) min ---" -ForegroundColor Cyan
        Write-Host "  To resume from here if interrupted, use: -StartFrom $($globalIdx)" -ForegroundColor DarkGray
        Write-Host ""
        Start-Sleep -Milliseconds 3000
    }
}

# --- 3. Summary ---
$elapsed = (Get-Date) - $startTime
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " DONE in $([math]::Round($elapsed.TotalMinutes, 1)) minutes" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  OK:      $success"
Write-Host "  Skipped: $skipped"
Write-Host "  Failed:  $failed"

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host 'Failed candidates:' -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    Write-Host ''
    Write-Host 'To retry failed ones, run with: -StartFrom INDEX' -ForegroundColor Yellow
}
