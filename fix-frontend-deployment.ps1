# Frontend Deployment Fix Script
# Frontend is GitHub-linked in Railway. Push to GitHub only; do not run railway up.

$repo = "d:\falisha\Recruitment Automation Portal (2)"
Set-Location $repo

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend Deployment Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check current status
Write-Host "[1] Checking git status..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "Uncommitted changes found:" -ForegroundColor Yellow
    Write-Host $status
    Write-Host ""
    Write-Host "Committing changes..." -ForegroundColor Yellow
    git add -A
    git commit -m "Frontend: Latest changes including CandidateManagement fix"
}

# Step 2: Show recent commits
Write-Host "[2] Recent commits:" -ForegroundColor Yellow
git log --oneline -3

# Step 3: Push to frontend repo
Write-Host ""
Write-Host "[3] Pushing to frontend repo..." -ForegroundColor Yellow
try {
    git push frontend main --force 2>&1 | ForEach-Object { Write-Host "  $_" }
    Write-Host "SUCCESS: Pushed to frontend repo" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to push to frontend" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# Step 4: Push to backend repo  
Write-Host ""
Write-Host "[4] Pushing to backend repo..." -ForegroundColor Yellow
try {
    git push backend main --force 2>&1 | ForEach-Object { Write-Host "  $_" }
    Write-Host "SUCCESS: Pushed to backend repo" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to push to backend" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# Step 5: Trigger Railway deployment
Write-Host ""
Write-Host "[5] Triggering Railway via GitHub..." -ForegroundColor Yellow
Write-Host "Building frontend..." -ForegroundColor Yellow
npm run build 2>&1 | Select-Object -Last 10

Write-Host ""
Write-Host "Pushing frontend repo is enough for Railway." -ForegroundColor Green
Write-Host "Do NOT run 'railway up' for this repo; that creates duplicate/manual deployment records." -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Verify the push reached the frontend repo" -ForegroundColor White
Write-Host "2. Wait for Railway GitHub deploy to complete" -ForegroundColor White
Write-Host "3. Verify: https://falishajobs.up.railway.app" -ForegroundColor White
