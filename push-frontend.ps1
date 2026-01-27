$ErrorActionPreference = "Stop"
Set-Location 'd:\falisha\Recruitment Automation Portal (2)'

Write-Host "=== Checking Git Status ===" -ForegroundColor Cyan
git status

Write-Host "`n=== Checking Current Commits ===" -ForegroundColor Cyan
git log --oneline -5

Write-Host "`n=== Checking Remote Branches ===" -ForegroundColor Cyan
git remote -v

Write-Host "`n=== Pushing to Frontend Repo ===" -ForegroundColor Cyan
git push frontend main --force

Write-Host "`n=== Pushing to Backend Repo ===" -ForegroundColor Cyan  
git push backend main --force

Write-Host "`nDone!" -ForegroundColor Green
