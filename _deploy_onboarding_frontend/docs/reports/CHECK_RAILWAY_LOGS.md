# How to Check Railway Logs for Python Parser

## Option 1: Railway CLI (Recommended)

After you authenticate, run these commands:

```bash
cd "D:\falisha\Recruitment Automation Portal (2)\python-parser"

# Authenticate (opens browser)
railway login

# Check service status
railway status

# View recent logs
railway logs --tail 100

# View environment variables
railway variables

# Check specific errors
railway logs | Select-String -Pattern "error|Error|ERROR|ValueError|ModuleNotFoundError" -Context 3
```

## Option 2: Railway Dashboard (Easier)

1. Go to https://railway.app
2. Login to your account
3. Select project: **"gleaming-healing"**
4. Find service: **"recruitment-portal-python-parser"**
5. Click on **"Logs"** tab
6. Look for:
   - `ValueError: PYTHON_HMAC_SECRET environment variable is required`
   - `ValueError: OPENAI_API_KEY environment variable is required`
   - `ModuleNotFoundError` (missing Python package)
   - `Failed to start` or crash messages

## Option 3: Check Environment Variables

In Railway Dashboard:
1. Go to **"gleaming-healing"** project
2. Click on **"recruitment-portal-python-parser"** service
3. Go to **"Variables"** tab
4. Verify these are set:
   - ✅ `PYTHON_HMAC_SECRET` (REQUIRED)
   - ✅ `OPENAI_API_KEY` (REQUIRED)
   - ⚠️ `PORT` (auto-set by Railway)
   - ⚠️ `SUPABASE_URL` (optional)
   - ⚠️ `SUPABASE_SERVICE_ROLE_KEY` (optional)

## What to Look For in Logs

### Startup Errors:
```
ValueError: PYTHON_HMAC_SECRET environment variable is required
ValueError: OPENAI_API_KEY environment variable is required
ModuleNotFoundError: No module named 'fastapi'
ImportError: cannot import name 'X'
```

### Runtime Errors:
```
Failed to start
Port already in use
Connection refused
Timeout
```

### Success Messages:
```
INFO:     Started server process
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Quick Fix Checklist

- [ ] Check Railway dashboard for deployment status
- [ ] Verify `PYTHON_HMAC_SECRET` is set
- [ ] Verify `OPENAI_API_KEY` is set
- [ ] Check build logs for dependency installation
- [ ] Check runtime logs for startup errors
- [ ] Redeploy if environment variables were just added
