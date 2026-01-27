# Frontend repo push
Write-Host "=== FRONTEND REPOSITORY ===" -ForegroundColor Green
cd "D:\falisha\recruitment-portal-frontend"

Write-Host "1. Initialize Git..."
git init
git config user.name "tripavail92-byte"
git config user.email "tripavail92@gmail.com"

Write-Host "2. Add files..."
git add .

Write-Host "3. Initial commit..."
git commit -m "Initial frontend commit - React + TypeScript"

Write-Host "4. Set remote..."
git remote add origin https://github.com/tripavail92-byte/recruitment-portal-frontend.git

Write-Host "5. Push to GitHub (you may be asked to authenticate)..."
git branch -M main
git push -u origin main

Write-Host ""
Write-Host "=== BACKEND REPOSITORY ===" -ForegroundColor Green
cd "D:\falisha\recruitment-portal-backend"

Write-Host "1. Initialize Git..."
git init
git config user.name "tripavail92-byte"
git config user.email "tripavail92@gmail.com"

Write-Host "2. Add files..."
git add .

Write-Host "3. Initial commit..."
git commit -m "Initial backend commit - Express.js + TypeScript"

Write-Host "4. Set remote..."
git remote add origin https://github.com/tripavail92-byte/recruitment-portal-backend.git

Write-Host "5. Push to GitHub (you may be asked to authenticate)..."
git branch -M main
git push -u origin main

Write-Host ""
Write-Host "=== COMPLETE ===" -ForegroundColor Green
Write-Host "Both repositories have been pushed to GitHub!"
Write-Host ""
Write-Host "Frontend: https://github.com/tripavail92-byte/recruitment-portal-frontend"
Write-Host "Backend: https://github.com/tripavail92-byte/recruitment-portal-backend"
