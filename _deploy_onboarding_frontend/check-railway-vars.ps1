#!/usr/bin/env pwsh

# Railway CLI Environment Variables Check and Setup Script
# This script will check existing variables and add missing ones

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Railway Environment Variables Setup" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# First, let's check the current project and service
Write-Host "Checking current Railway project..." -ForegroundColor Yellow

try {
    $status = & npx @railway/cli@latest status 2>&1
    Write-Host "Status output:" -ForegroundColor Green
    Write-Host $status
} catch {
    Write-Host "Error getting status: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Yellow
Write-Host "NEXT STEP: Select glorious-flexibility project" -ForegroundColor Yellow
Write-Host "THEN select: glorious-flexibility backend service" -ForegroundColor Yellow
Write-Host "===========================================" -ForegroundColor Yellow
