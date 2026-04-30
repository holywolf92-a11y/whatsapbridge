# Run Migration 027: Split Certificates Category
# This script runs the database migration to add new document categories

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration 027: Document Categorization" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if migration file exists
$migrationFile = "backend\migrations\027_split_certificates_category.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ ERROR: Migration file not found at: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Migration file found: $migrationFile" -ForegroundColor Green
Write-Host ""

# Display migration summary
Write-Host "📋 Migration Summary:" -ForegroundColor Yellow
Write-Host "  • Add 3 new document categories to database enum" -ForegroundColor White
Write-Host "    - educational_documents (degrees, diplomas, transcripts)" -ForegroundColor White
Write-Host "    - experience_certificates (employment letters)" -ForegroundColor White
Write-Host "    - navttc_reports (vocational training certificates)" -ForegroundColor White
Write-Host "  • Update display function with new category names" -ForegroundColor White
Write-Host "  • Verify enum values were added successfully" -ForegroundColor White
Write-Host ""

# Get database connection details
Write-Host "🔐 Database Connection Required" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please provide your Supabase connection details:" -ForegroundColor White
Write-Host "(You can find these in Supabase Project Settings > Database > Connection String)" -ForegroundColor Gray
Write-Host ""

$dbHost = Read-Host "Database Host (e.g., db.xxxxx.supabase.co)"
$dbPort = Read-Host "Database Port (default: 5432)"
$dbName = Read-Host "Database Name (default: postgres)"
$dbUser = Read-Host "Database User (default: postgres)"
$dbPassword = Read-Host "Database Password" -AsSecureString

# Convert secure string to plain text
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
$dbPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Set defaults
if ([string]::IsNullOrWhiteSpace($dbPort)) { $dbPort = "5432" }
if ([string]::IsNullOrWhiteSpace($dbName)) { $dbName = "postgres" }
if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "postgres" }

Write-Host ""
Write-Host "⚠️  WARNING: This will modify your database schema!" -ForegroundColor Yellow
Write-Host "   Make sure you have a backup before proceeding." -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Do you want to continue? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "❌ Migration cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🚀 Running migration..." -ForegroundColor Cyan
Write-Host ""

# Build connection string
$env:PGPASSWORD = $dbPasswordPlain
$connectionString = "postgresql://${dbUser}:${dbPasswordPlain}@${dbHost}:${dbPort}/${dbName}"

# Check if psql is available
$psqlCommand = Get-Command psql -ErrorAction SilentlyContinue

if ($null -eq $psqlCommand) {
    Write-Host "❌ ERROR: psql command not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL client tools:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "  2. Or use Supabase SQL Editor in your browser" -ForegroundColor White
    Write-Host ""
    Write-Host "📄 Migration file location: $migrationFile" -ForegroundColor Cyan
    Write-Host "You can copy-paste the SQL directly into Supabase SQL Editor" -ForegroundColor Gray
    exit 1
}

# Run migration
try {
    $result = psql $connectionString -f $migrationFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Results:" -ForegroundColor Cyan
        Write-Host $result
        Write-Host ""
        Write-Host "✅ Next Steps:" -ForegroundColor Green
        Write-Host "  1. Create Supabase storage folders:" -ForegroundColor White
        Write-Host "     - /educational_documents" -ForegroundColor Gray
        Write-Host "     - /experience_certificates" -ForegroundColor Gray
        Write-Host "     - /navttc_reports" -ForegroundColor Gray
        Write-Host "  2. Deploy backend changes (npm run build)" -ForegroundColor White
        Write-Host "  3. Deploy frontend changes" -ForegroundColor White
        Write-Host "  4. Run tests (especially TODO 5.6 multi-document test)" -ForegroundColor White
    } else {
        Write-Host "❌ Migration failed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Error output:" -ForegroundColor Yellow
        Write-Host $result -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Clear password from environment
    $env:PGPASSWORD = ""
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
