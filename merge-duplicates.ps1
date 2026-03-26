####################################################################
# Merge duplicate candidates created before the Name+DOB dedup fix
# Maria Talat: keep FL-2026-974 (has CNIC, email, phone, father_name)
#              merge/delete FL-2026-979,980,981,982,983,986,987
# Abid Acyoub: keep FL-2026-973; merge FL-2026-978 (same email)
#              leave FL-2026-985 separate (different email)
####################################################################

$k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ"
$h = @{"apikey"=$k;"Authorization"="Bearer $k";"Content-Type"="application/json"}
$BASE = "https://hncvsextwmvjydcukdwx.supabase.co/rest/v1"

function SB-Get($path) {
    Invoke-RestMethod "$BASE$path" -Headers $h -Method GET
}
function SB-Patch($path, $body) {
    Invoke-RestMethod "$BASE$path" -Headers $h -Method PATCH -Body ($body | ConvertTo-Json) -ContentType "application/json"
}
function SB-Delete($path) {
    try { Invoke-RestMethod "$BASE$path" -Headers $h -Method DELETE }
    catch { Write-Host "  DELETE error: $($_.Exception.Message)" -ForegroundColor Red }
}

###############################
# Step 1: Resolve candidate IDs
###############################
Write-Host "Resolving candidate IDs..." -ForegroundColor Cyan

$all = SB-Get "/candidates?select=id%2Ccandidate_code%2Cname%2Cemail%2Cphone%2Ccnic_normalized&name=ilike.*Maria*"
$maria_keep = ($all | Where-Object { $_.candidate_code -eq "FL-2026-974" })[0]
$maria_dupes = $all | Where-Object { $_.candidate_code -in @("FL-2026-979","FL-2026-980","FL-2026-981","FL-2026-982","FL-2026-983","FL-2026-986","FL-2026-987") }

Write-Host "Maria Talat KEEP: $($maria_keep.id) ($($maria_keep.candidate_code))"
Write-Host "Maria Talat dupes to merge: $($maria_dupes.Count)"

$abid_all = SB-Get "/candidates?select=id%2Ccandidate_code%2Cname%2Cemail&name=ilike.*Abid*"
$abid_keep = ($abid_all | Where-Object { $_.candidate_code -eq "FL-2026-973" })[0]
$abid_merge = ($abid_all | Where-Object { $_.candidate_code -eq "FL-2026-978" })[0]

Write-Host "Abid KEEP: $($abid_keep.id) ($($abid_keep.candidate_code))"
Write-Host "Abid MERGE: $($abid_merge.id) ($($abid_merge.candidate_code))"

###############################
# Step 2: Re-link inbox_attachments from dupes to keep candidates
###############################
Write-Host "`nRe-linking inbox_attachments..." -ForegroundColor Cyan

foreach ($dupe in $maria_dupes) {
    if (-not $dupe.id) { continue }
    $atts = SB-Get "/inbox_attachments?select=id%2Cfile_name%2Ccandidate_id&candidate_id=eq.$($dupe.id)"
    foreach ($att in $atts) {
        Write-Host "  Re-link attachment $($att.file_name) from $($dupe.candidate_code) -> FL-2026-974"
        SB-Patch "/inbox_attachments?id=eq.$($att.id)" @{ candidate_id = $maria_keep.id }
    }
}

# Abid 978 -> 973
if ($abid_merge.id) {
    $atts = SB-Get "/inbox_attachments?select=id%2Cfile_name&candidate_id=eq.$($abid_merge.id)"
    foreach ($att in $atts) {
        Write-Host "  Re-link attachment $($att.file_name) from FL-2026-978 -> FL-2026-973"
        SB-Patch "/inbox_attachments?id=eq.$($att.id)" @{ candidate_id = $abid_keep.id }
    }
}

###############################
# Step 3: Re-link any orphaned attachments (candidate_id pointing to nonexistent)
###############################
Write-Host "`nRe-linking orphaned attachments still null..." -ForegroundColor Cyan
# If any Maria Talat attachment has candidate_id=null, link to maria_keep
$nullAtts = SB-Get "/inbox_attachments?select=id%2Cfile_name%2Ccandidate_id&candidate_id=is.null&attachment_type=eq.cv&limit=100"
Write-Host "  Null candidate CVs remaining: $($nullAtts.Count)"

###############################
# Step 4: Delete duplicate candidates
###############################
Write-Host "`nDeleting duplicate candidates..." -ForegroundColor Cyan

foreach ($dupe in $maria_dupes) {
    if (-not $dupe.id) { continue }
    # First unlink any remaining references 
    SB-Patch "/inbox_attachments?candidate_id=eq.$($dupe.id)" @{ candidate_id = $maria_keep.id }
    SB-Patch "/documents?candidate_id=eq.$($dupe.id)" @{ candidate_id = $maria_keep.id }
    Write-Host "  Deleting $($dupe.candidate_code) ($($dupe.id))"
    SB-Delete "/candidates?id=eq.$($dupe.id)"
}

if ($abid_merge.id) {
    SB-Patch "/inbox_attachments?candidate_id=eq.$($abid_merge.id)" @{ candidate_id = $abid_keep.id }
    SB-Patch "/documents?candidate_id=eq.$($abid_merge.id)" @{ candidate_id = $abid_keep.id }
    Write-Host "  Deleting FL-2026-978 ($($abid_merge.id))"
    SB-Delete "/candidates?id=eq.$($abid_merge.id)"
}

###############################
# Step 5: Verify
###############################
Write-Host "`nVerification after merge..." -ForegroundColor Cyan
$afterMaria = SB-Get "/candidates?select=candidate_code%2Cname%2Cemail%2Cphone&name=ilike.*Maria*"
Write-Host "Maria candidates remaining: $($afterMaria.Count)"
$afterMaria | ForEach-Object { "  $($_.candidate_code) | $($_.name) | $($_.email)" }

$afterAbid = SB-Get "/candidates?select=candidate_code%2Cname%2Cemail&name=ilike.*Abid*"
Write-Host "Abid candidates remaining: $($afterAbid.Count)"
$afterAbid | ForEach-Object { "  $($_.candidate_code) | $($_.name) | $($_.email)" }

Write-Host "`nDone!" -ForegroundColor Green
