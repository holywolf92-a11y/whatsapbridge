#!/usr/bin/env pwsh
# Week 4 Railway Deployment Setup
# Run this to configure both backend and frontend for Railway deployment

$ProjectId = "eba3c27d-3b58-4a9a-b5cc-b378445e50f9"
$ProjectName = "glorious-flexibility"

Write-Host "🚀 Week 4 Railway Deployment Setup" -ForegroundColor Cyan
Write-Host "=================================="
Write-Host ""

# Step 1: Save config
Write-Host "✓ Railway Project Details:" -ForegroundColor Green
Write-Host "  - Project: $ProjectName"
Write-Host "  - Project ID: $ProjectId"
Write-Host "  - Auth: Use 'railway login' in the browser"
Write-Host ""

# Step 2: Verify repos pushed
Write-Host "✓ Repository Status:" -ForegroundColor Green
Write-Host "  - Backend: https://github.com/holywolf92-a11y/recruitment-portal-backend ✓"
Write-Host "  - Frontend: https://github.com/holywolf92-a11y/recruitment-portal-frontend ✓"
Write-Host ""

# Step 3: Manual Railway Setup
Write-Host "⚠️  Next Steps - Manual Railway Configuration:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  Go to Railway Dashboard:"
Write-Host "   https://railway.app/project/$ProjectId"
Write-Host ""
Write-Host "2️⃣  Add Backend Service:"
Write-Host "   - Click 'New' → 'GitHub Repo'"
Write-Host "   - Select: recruitment-portal-backend"
Write-Host "   - Railway auto-detects Node.js setup"
Write-Host ""
Write-Host "3️⃣  Add Redis:"
Write-Host "   - Click 'New' → 'Database' → 'Redis'"
Write-Host "   - Copy REDIS_URL from config"
Write-Host ""
Write-Host "4️⃣  Configure Backend Variables:"
Write-Host "   Set in Railway Dashboard:"
Write-Host "   - REDIS_URL = (from Redis service)"
Write-Host "   - RUN_WORKER = true"
Write-Host "   - PYTHON_CV_PARSER_URL = https://recruitment-python-parser-production.up.railway.app"
Write-Host "   - PYTHON_HMAC_SECRET = (generate random key)"
Write-Host "   - RUN_HOSTINGER_POLLING = true (only if continuous mailbox polling is desired)"
Write-Host "   - HOSTINGER_POLL_INTERVAL_MINUTES = 10"
Write-Host ""
Write-Host "5️⃣  Add Frontend Service:"
Write-Host "   - Click 'New' → 'GitHub Repo'"
Write-Host "   - Select: recruitment-portal-frontend"
Write-Host ""
Write-Host "6️⃣  Configure Frontend Variables:"
Write-Host "   - VITE_API_BASE_URL = https://glorious-flexibility-production.up.railway.app/api"
Write-Host ""
Write-Host "7️⃣  Deploy Python Service (Week 4 Day 2):"
Write-Host "   - Create FastAPI service with OpenAI integration"
Write-Host "   - Push to GitHub with Dockerfile"
Write-Host "   - Add to Railway as separate service"
Write-Host ""

Write-Host "📖 Full Guide: See DEPLOYMENT_GUIDE_WEEK4.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Once configured, auto-deploy on git push is enabled!" -ForegroundColor Green
