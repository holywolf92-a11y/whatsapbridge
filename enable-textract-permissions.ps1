# Enable IAM permissions for document-split pipeline (Textract).
# Loads AWS_* from .env if not set, then runs enable_textract_permissions.py.
#
# Usage:
#   .\enable-textract-permissions.ps1 [--user textract-service] [--verify-only] [--region us-east-1] [--try-regions]
#
# - Run with **admin** credentials to create policy + attach to IAM user.
# - Use --user IAM_USERNAME (e.g. textract-service) when caller is root.
# - Use --verify-only to only test AWS + Textract access (e.g. parser user keys).

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ParserDir = Join-Path $ScriptDir "recruitment-portal-python-parser"
$EnvPath = Join-Path $ParserDir ".env"
$FallbackEnv = Join-Path (Join-Path (Join-Path $ScriptDir "Recruitment Automation Portal (2)") "python-parser") ".env"

function Load-AwsFromEnv {
    $path = $EnvPath
    if (-not (Test-Path $path)) { $path = $FallbackEnv }
    if (-not (Test-Path $path)) { return }
    $lines = Get-Content $path -ErrorAction SilentlyContinue
    foreach ($line in $lines) {
        $line = $line.Trim()
        if ($line -match "^\s*#" -or $line -eq "") { continue }
        if ($line -match '^\s*(AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|AWS_DEFAULT_REGION)\s*=\s*(.+)\s*$') {
            $key = $matches[1]
            $val = $matches[2].Trim().Trim('"').Trim("'")
            $cur = [Environment]::GetEnvironmentVariable($key, "Process")
            if ($val -and [string]::IsNullOrEmpty($cur)) {
                [Environment]::SetEnvironmentVariable($key, $val, "Process")
            }
        }
    }
}

if (-not $env:AWS_ACCESS_KEY_ID -or -not $env:AWS_SECRET_ACCESS_KEY) {
    Load-AwsFromEnv
}
if (-not $env:AWS_ACCESS_KEY_ID -or -not $env:AWS_SECRET_ACCESS_KEY) {
    Write-Host "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY (env or .env)." -ForegroundColor Yellow
    Write-Host "  .env: $ParserDir\.env or Recruitment Automation Portal (2)\python-parser\.env" -ForegroundColor Gray
    exit 1
}
if (-not $env:AWS_DEFAULT_REGION) { $env:AWS_DEFAULT_REGION = "us-east-1" }

Push-Location $ParserDir
try {
    python -m enable_textract_permissions @args
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
