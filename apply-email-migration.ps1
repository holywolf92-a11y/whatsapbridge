$SQL = @"
DO $`$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM candidates
    WHERE email IS NOT NULL AND trim(email) != '' AND status != 'Deleted'
    GROUP BY lower(trim(email))
    HAVING count(*) > 1
  ) THEN
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY lower(trim(email))
          ORDER BY candidate_code ASC, created_at ASC
        ) AS rn
      FROM candidates
      WHERE email IS NOT NULL AND trim(email) != '' AND status != 'Deleted'
    )
    UPDATE candidates
    SET email = NULL
    FROM ranked
    WHERE candidates.id = ranked.id AND ranked.rn > 1;

    RAISE NOTICE 'Cleared duplicate emails before creating unique index';
  END IF;
END $`$;

CREATE UNIQUE INDEX IF NOT EXISTS candidates_email_unique_active
  ON candidates (lower(trim(email)))
  WHERE status IS DISTINCT FROM 'Deleted'
    AND email IS NOT NULL
    AND trim(email) != '';
"@

# Try via Supabase Management API
$SUPABASE_TOKEN = $env:SUPABASE_ACCESS_TOKEN
if (-not $SUPABASE_TOKEN) {
    Write-Host "No SUPABASE_ACCESS_TOKEN set - trying supabase CLI..." -ForegroundColor Yellow
    $env:RAILWAY_TOKEN = "6bf7dad2-652a-49fd-a330-37c9fd51ab45"
    $result = railway run --service recruitment-portal-backend -- node -e @"
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// We can't run DDL via Supabase JS client directly
// but we can check if the index exists
db.from('pg_indexes').select('indexname').eq('indexname', 'candidates_email_unique_active').then(r => {
  console.log(JSON.stringify(r));
});
"@ 2>&1
    Write-Host $result
    exit 0
}

Write-Host "Running migration via Supabase Management API..."
$PROJECT_REF = "hncvsextwmvjydcukdwx"
$body = @{ query = $SQL } | ConvertTo-Json
$result = Invoke-RestMethod `
    -Uri "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" `
    -Method POST `
    -Headers @{ "Authorization" = "Bearer $SUPABASE_TOKEN"; "Content-Type" = "application/json" } `
    -Body $body

Write-Host "Result: $($result | ConvertTo-Json)"
