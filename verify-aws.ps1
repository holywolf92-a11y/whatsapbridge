# Verify AWS CLI connection using env vars only.
# Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION first.
# Run: .\verify-aws.ps1

if (-not $env:AWS_ACCESS_KEY_ID -or -not $env:AWS_SECRET_ACCESS_KEY) {
    Write-Host "Set env vars first:" -ForegroundColor Yellow
    Write-Host '  $env:AWS_ACCESS_KEY_ID = "AKIA..."'
    Write-Host '  $env:AWS_SECRET_ACCESS_KEY = "your-secret"'
    Write-Host '  $env:AWS_DEFAULT_REGION = "us-east-1"'
    Write-Host "`nSee AWS_SETUP_GUIDE.md for creating access keys." -ForegroundColor Cyan
    exit 1
}

Write-Host "Verifying AWS connection..." -ForegroundColor Cyan
$result = aws sts get-caller-identity 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Connected successfully." -ForegroundColor Green
    $result
} else {
    Write-Host "Connection failed:" -ForegroundColor Red
    $result
    exit 1
}
