# Python Parser Service - Diagnosis Guide

## Common Crash Causes

### 1. Missing Environment Variables ⚠️ MOST COMMON

The Python parser **requires** these environment variables on startup:

```python
# main.py lines 43-47
if not HMAC_SECRET:
    raise ValueError("PYTHON_HMAC_SECRET environment variable is required")

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is required")
```

**Fix**: Add these to Railway environment variables:
- `PYTHON_HMAC_SECRET` (REQUIRED)
- `OPENAI_API_KEY` (REQUIRED)
- `SUPABASE_URL` (optional)
- `SUPABASE_SERVICE_ROLE_KEY` (optional)

### 2. Missing Python Dependencies

If `requirements.txt` dependencies are not installed, the service will crash on import.

**Fix**: Railway should auto-install, but verify in build logs.

### 3. Port Conflict

If port 8000 (or configured PORT) is already in use.

**Fix**: Railway automatically assigns ports via `$PORT` environment variable.

### 4. OpenAI API Key Invalid/Expired

If `OPENAI_API_KEY` is invalid, the service will start but fail on API calls.

**Fix**: Verify OpenAI API key is valid and has credits.

### 5. Import Errors

Missing Python packages or version conflicts.

**Common packages required:**
- `fastapi`
- `uvicorn`
- `openai`
- `PyPDF2`
- `PyMuPDF` (fitz)
- `PIL` (Pillow)
- `supabase`

## How to Diagnose

### Step 1: Run Health Check Script

```bash
cd "D:\falisha\Recruitment Automation Portal (2)\python-parser"
node scripts/check-python-parser-health.js
```

This will check:
- Root endpoint (`/`)
- Health endpoint (`/health`)
- Categorize endpoint (`/categorize-document`)

### Step 2: Check Railway Logs

**Note**: You need to authenticate first:
```bash
railway login
```

Then check logs:
```bash
cd "D:\falisha\Recruitment Automation Portal (2)\python-parser"
railway logs --tail 100
```

Look for:
- `ValueError: PYTHON_HMAC_SECRET environment variable is required`
- `ValueError: OPENAI_API_KEY environment variable is required`
- `ModuleNotFoundError` (missing dependency)
- `ImportError` (import failure)
- `Port already in use`
- `Failed to start`

### Step 3: Check Railway Dashboard

1. Go to Railway dashboard
2. Select "gleaming-healing" project
3. Find "recruitment-portal-python-parser" service
4. Check:
   - **Deployments**: Latest deployment status
   - **Variables**: Environment variables
   - **Logs**: Recent error messages
   - **Metrics**: CPU/Memory usage

### Step 4: Verify Environment Variables

In Railway dashboard, verify these are set:
- ✅ `PYTHON_HMAC_SECRET` (REQUIRED)
- ✅ `OPENAI_API_KEY` (REQUIRED)
- ⚠️ `PORT` (auto-set by Railway)
- ⚠️ `SUPABASE_URL` (optional)
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` (optional)

### Step 5: Check Build Logs

In Railway deployment logs, look for:
- `pip install` success/failure
- Python version detection
- Build success/failure
- Startup errors

## Quick Fixes

### Fix 1: Add Missing Environment Variables

1. Go to Railway dashboard
2. Select python-parser service
3. Go to Variables tab
4. Add:
   - `PYTHON_HMAC_SECRET` = (your secret key)
   - `OPENAI_API_KEY` = (your OpenAI API key)
5. Redeploy

### Fix 2: Relink Service

If service is not found:
```bash
cd "D:\falisha\Recruitment Automation Portal (2)\python-parser"
railway service
# Select the correct service
```

### Fix 3: Check Procfile

Verify `Procfile` exists and is correct:
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Fix 4: Verify Requirements

Check `requirements.txt` has all dependencies:
```bash
cat requirements.txt
```

Should include:
- fastapi
- uvicorn
- openai
- PyPDF2
- PyMuPDF
- Pillow
- supabase

## Expected Startup Logs

When Python parser starts successfully, you should see:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## Error Patterns

| Error | Cause | Fix |
|-------|-------|-----|
| `ValueError: PYTHON_HMAC_SECRET...` | Missing env var | Add to Railway |
| `ValueError: OPENAI_API_KEY...` | Missing env var | Add to Railway |
| `ModuleNotFoundError: No module named 'X'` | Missing dependency | Check requirements.txt |
| `Port already in use` | Port conflict | Railway handles this |
| `Failed to start` | Startup error | Check logs for details |

## Testing the Service

### Test Root Endpoint
```bash
curl https://recruitment-portal-python-parser-production.up.railway.app/
```

Expected response:
```json
{
  "service": "CV Parser",
  "version": "1.0.0",
  "status": "running",
  "environment": "production"
}
```

### Test Health Endpoint
```bash
curl https://recruitment-portal-python-parser-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

## Next Steps

1. ✅ Run health check script
2. ✅ Check Railway logs (after authentication)
3. ✅ Verify environment variables in Railway dashboard
4. ✅ Check deployment status
5. ✅ Review build logs for errors

## Service URL

The Python parser service should be accessible at:
- **Production**: `https://recruitment-portal-python-parser-production.up.railway.app`

This URL is used by the backend in:
- `backend/src/workers/documentVerificationWorker.ts`
- `backend/src/workers/cvParserWorker.ts`

Make sure `PYTHON_CV_PARSER_URL` environment variable in backend matches this URL.
