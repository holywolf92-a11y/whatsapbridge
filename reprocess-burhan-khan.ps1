#!/usr/bin/env pwsh
# ============================================================
# Reprocess Burhan Khan (FL-2026-919) CV pipeline
# ============================================================
# This script:
#   1. Looks up Burhan's inbox_attachment via Supabase REST
#   2. Triggers a FORCED retry of the CV parsing job
#      (new code: hybrid photo extraction + WhatsApp notification
#       sent to CV-extracted phone, regardless of sender)
#   3. Separately fires the manual photo extraction + missing-data
#      email endpoints in case the retry is still running
# ============================================================

$Backend         = 'https://recruitment-portal-backend-production-d1f7.up.railway.app'
$SupabaseUrl     = 'https://hncvsextwmvjydcukdwx.supabase.co'
# FILL IN your service role key (Settings > API in Supabase dashboard):
$SupabaseKey     = $env:SUPABASE_SERVICE_ROLE_KEY
$CandidateCode   = 'FL-2026-919'

if (-not $SupabaseKey) {
    Write-Host '❌ Set $env:SUPABASE_SERVICE_ROLE_KEY before running this script' -ForegroundColor Red
    exit 1
}

$headers = @{
    'apikey'        = $SupabaseKey
    'Authorization' = "Bearer $SupabaseKey"
    'Content-Type'  = 'application/json'
}

# ── Step 1: Find the candidate ────────────────────────────────────────────────
Write-Host "`n[1/4] Looking up candidate $CandidateCode ..." -ForegroundColor Cyan
$candidateQuery = "$SupabaseUrl/rest/v1/candidates?candidate_code=eq.$CandidateCode&select=id,name,phone,email,profile_photo_url"
$candidates = Invoke-RestMethod -Uri $candidateQuery -Headers $headers -Method Get

if (-not $candidates -or $candidates.Count -eq 0) {
    Write-Host "❌ Candidate $CandidateCode not found in DB" -ForegroundColor Red
    exit 1
}

$candidate = $candidates[0]
$candidateId = $candidate.id
Write-Host "✅ Found: $($candidate.name)  ID=$candidateId" -ForegroundColor Green
Write-Host "   Phone: $($candidate.phone)   Email: $($candidate.email)"
Write-Host "   Current photo: $($candidate.profile_photo_url ?? '(none)')"

# ── Step 2: Find the inbox_attachment ────────────────────────────────────────
Write-Host "`n[2/4] Finding inbox attachment for candidate ..." -ForegroundColor Cyan
$attQuery = "$SupabaseUrl/rest/v1/inbox_attachments?candidate_id=eq.$candidateId&select=id,file_name,created_at&order=created_at.desc&limit=1"
$attachments = Invoke-RestMethod -Uri $attQuery -Headers $headers -Method Get

if (-not $attachments -or $attachments.Count -eq 0) {
    Write-Host "❌ No inbox_attachment found for candidate $candidateId" -ForegroundColor Red
    exit 1
}

$att = $attachments[0]
$attachmentId = $att.id
Write-Host "✅ Attachment: $($att.file_name)  ID=$attachmentId  Created=$($att.created_at)" -ForegroundColor Green

# ── Step 3: Force-retry the full CV parsing pipeline ─────────────────────────
Write-Host "`n[3/4] Triggering FORCED retry of CV parsing pipeline ..." -ForegroundColor Cyan
Write-Host "   This will: re-parse CV → extract photo (hybrid) → send WhatsApp notification → send missing-data email"

try {
    $retryUrl = "$Backend/api/inbox/attachments/$attachmentId/retry"
    $retryResult = Invoke-RestMethod -Uri $retryUrl -Method Post -ContentType 'application/json' -Body '{}'
    Write-Host "✅ Retry queued: job_id=$($retryResult.job_id)  status=$($retryResult.status)" -ForegroundColor Green
    Write-Host "   ℹ️  Job will run asynchronously — check Railway logs for progress."
} catch {
    Write-Host "❌ Retry failed: $_" -ForegroundColor Red
    Write-Host "   Try manually: POST $Backend/api/inbox/attachments/$attachmentId/retry"
}

# ── Step 4: Manual photo extraction (belt-and-suspenders) ────────────────────
Write-Host "`n[4/4] Triggering manual photo extraction (belt-and-suspenders) ..." -ForegroundColor Cyan
Write-Host "   (This can run in parallel with the queued job above)"

try {
    $photoUrl = "$Backend/api/documents/candidates/$candidateId/extract-photo"
    $photoResult = Invoke-RestMethod -Uri $photoUrl -Method Post -ContentType 'application/json' -Body '{}'
    Write-Host "✅ Photo extraction triggered:" -ForegroundColor Green
    Write-Host "   $($photoResult | ConvertTo-Json -Compress)"
} catch {
    Write-Host "⚠️  Photo extraction endpoint returned: $_" -ForegroundColor Yellow
    Write-Host "   (Non-fatal — the retry job above will also attempt extraction)"
}

Write-Host "`n✅ Done. Monitor Railway logs for candidate $candidateId ($CandidateCode)" -ForegroundColor Green
Write-Host "   Backend logs: https://railway.app → recruitment-portal-backend → Deployments → Logs"
