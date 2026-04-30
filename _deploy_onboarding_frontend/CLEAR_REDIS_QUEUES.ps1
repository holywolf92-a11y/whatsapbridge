#!/usr/bin/env pwsh
# Clear Redis BullMQ Queues using redis-cli

# Configuration
$REDIS_HOST = "redis.railway.internal"
$REDIS_PORT = 6379
$REDIS_PASSWORD = "sBtnDrpJrbASwbGejzqByuCroCidLUVI"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Redis Queue Clearing Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "ℹ️  You have two options to clear the queues:" -ForegroundColor Yellow
Write-Host ""
Write-Host "OPTION 1: Using Railway Redis Console" -ForegroundColor Green
Write-Host "─────────────────────────────────────────"
Write-Host "1. Go to: https://railway.app/project/54e09ca0-5643-4b5e-a172-8704293ae095"
Write-Host "2. Click 'Redis' service in sidebar"
Write-Host "3. Click 'Connect' tab"
Write-Host "4. Click 'Redis Console'"
Write-Host "5. Run these commands:"
Write-Host ""
Write-Host "   # Clear all BullMQ queue data"
Write-Host "   FLUSHDB"
Write-Host ""
Write-Host "   # Or selectively clear BullMQ keys:"
Write-Host "   KEYS bull:* | xargs DEL"
Write-Host ""
Write-Host "6. Press Enter"
Write-Host ""

Write-Host "OPTION 2: Using Local redis-cli (if installed)" -ForegroundColor Green
Write-Host "─────────────────────────────────────────"
Write-Host "Run these commands in your terminal:"
Write-Host ""
Write-Host "   redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD"
Write-Host "   > FLUSHDB"
Write-Host "   > EXIT"
Write-Host ""

Write-Host "OPTION 3: Using Node.js Script (from backend folder)" -ForegroundColor Green
Write-Host "─────────────────────────────────────────"
Write-Host "Run: node scripts/clear-queues.mjs"
Write-Host ""

Write-Host "📝 Note:" -ForegroundColor Yellow
Write-Host "   - FLUSHDB clears ALL Redis data (safest for now)"
Write-Host "   - You can be more selective later with key patterns"
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "⚠️  After clearing:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Verify backend is running and healthy"
Write-Host "2. Check backend logs for: 'CV Parser worker started'"
Write-Host "3. Try uploading a CV again"
Write-Host "4. Job should show 'queued' → 'processing' → 'completed'"
Write-Host ""
