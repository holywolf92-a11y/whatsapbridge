$SB_URL = "https://hncvsextwmvjydcukdwx.supabase.co"
$SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ"
$h = @{
    "apikey"="$SB_KEY"
    "Authorization"="Bearer $SB_KEY"
    "Content-Type"="application/json"
}

Write-Host "=== Checking for email duplicates before migration ===" -ForegroundColor Cyan

# First check if there are any email dupes that need clearing
$dupeCheck = Invoke-RestMethod "$SB_URL/rest/v1/candidates?select=candidate_code%2Cemail&email=not.is.null&status=neq.Deleted&order=candidate_code.asc" -Headers $h
Write-Host "Active candidates with email: $($dupeCheck.Count)"

# Group by lowercased email
$grouped = $dupeCheck | Where-Object { $_.email } | Group-Object { $_.email.Trim().ToLower() } | Where-Object { $_.Count -gt 1 }
if ($grouped.Count -gt 0) {
    Write-Host "Found $($grouped.Count) duplicate email groups:" -ForegroundColor Yellow
    foreach ($g in $grouped) {
        Write-Host "  Email: $($g.Name)"
        $g.Group | ForEach-Object { Write-Host "    $($_.candidate_code)" }
    }
} else {
    Write-Host "No duplicate emails found. Ready to create index." -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Applying email unique index via Railway exec ===" -ForegroundColor Cyan
Write-Host "NOTE: The SQL migration is in supabase/migrations/20260225000001_email_unique_partial_index.sql"
Write-Host "Apply it via the Supabase dashboard SQL editor:"
Write-Host "  https://supabase.com/dashboard/project/hncvsextwmvjydcukdwx/database/query"
Write-Host ""
Write-Host "SQL to run:"
Get-Content "D:\falisha\recruitment-portal-backend\supabase\migrations\20260225000001_email_unique_partial_index.sql"
