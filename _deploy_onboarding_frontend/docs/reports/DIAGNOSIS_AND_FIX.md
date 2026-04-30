# AI Document Processing Failure - Diagnosis & Fix

## What We Know

### ✅ Working
1. **Backend API**: Running and accessible
2. **Python Parser Service**: Fixed and running (merge conflict resolved)
3. **Document Upload**: Documents upload successfully
4. **Initial Status**: Documents start with `pending_ai` status

### ❌ Problem
- **All documents end with status `failed`** instead of being processed
- Category detection returns `null`
- AI scan is failing
- Identity verification not running

## Root Cause Analysis

Based on test results, the issue is:
1. Documents are uploaded successfully ✅
2. Status starts as `pending_ai` ✅
3. Worker picks up the job (status changes from `pending_ai`) ✅
4. **AI processing fails** ❌
5. Status becomes `failed` ❌

## Most Likely Causes

### 1. Python Parser Connection Issue (Most Likely)
- Backend worker can't reach Python parser
- Wrong `PYTHON_CV_PARSER_URL` in backend
- Network/firewall blocking connection

### 2. HMAC Authentication Mismatch
- `PYTHON_HMAC_SECRET` doesn't match between backend and python-parser
- HMAC signature verification failing

### 3. Python Parser Returning Errors
- Python parser receives request but returns error
- OpenAI API key missing/invalid
- Python parser crashes during processing

### 4. Worker Not Running
- `RUN_WORKER=true` not set in backend
- Worker process crashed
- Redis connection issue

## What to Check in Railway Dashboard

### Backend Service (gleaming-healing → backend)

**1. Environment Variables:**
- `PYTHON_CV_PARSER_URL` = `https://recruitment-portal-python-parser-production.up.railway.app`
- `PYTHON_HMAC_SECRET` = (must match python-parser)
- `RUN_WORKER` = `true`
- `REDIS_URL` = (required for workers)

**2. Logs Tab - Look for:**
```
[DocumentVerification] Error processing document
AI categorization failed
Failed to call AI service
Python service error
HMAC signature
```

**3. Recent Deployments:**
- Check if latest deployment succeeded
- Check build logs for errors

### Python Parser Service (gleaming-healing → python-parser)

**1. Environment Variables:**
- `PYTHON_HMAC_SECRET` = (must match backend)
- `OPENAI_API_KEY` = (required)
- `PORT` = (auto-set by Railway)

**2. Logs Tab - Look for:**
```
[CategorizeDocument] Error
HMAC verification error
OpenAI categorization error
POST /categorize-document
```

**3. Check if receiving requests:**
- Look for incoming POST requests
- Check for HMAC verification errors

## Quick Fixes to Try

### Fix 1: Verify Environment Variables Match

**Backend:**
```
PYTHON_CV_PARSER_URL=https://recruitment-portal-python-parser-production.up.railway.app
PYTHON_HMAC_SECRET=<same-secret-as-python-parser>
RUN_WORKER=true
REDIS_URL=<your-redis-url>
```

**Python Parser:**
```
PYTHON_HMAC_SECRET=<same-secret-as-backend>
OPENAI_API_KEY=<your-openai-key>
```

### Fix 2: Test Python Parser Directly

Test if Python parser is accessible from backend:
```bash
curl https://recruitment-portal-python-parser-production.up.railway.app/health
```

Should return:
```json
{"status": "healthy", "version": "1.0.0"}
```

### Fix 3: Check Worker Status

In backend logs, look for:
```
[DocumentVerificationWorker] Worker started, listening for jobs...
```

If not present, worker isn't running.

### Fix 4: Redeploy Services

If environment variables were just updated:
1. Redeploy backend service
2. Redeploy python-parser service
3. Wait 2-5 minutes
4. Run tests again

## Expected Log Flow

**When working correctly, you should see:**

**Backend Logs:**
```
[DocumentVerification] Processing job for document <id>
[DocumentVerification] Completed: <id> -> verified (VERIFIED)
```

**Python Parser Logs:**
```
[CategorizeDocument] Received request
[DocumentCategorization] Extracted X characters from <file>
[DocumentCategorization] Categorized as: cv_resume (confidence: 0.95)
```

## Next Steps

1. **Check Railway Dashboard** for the errors mentioned above
2. **Verify environment variables** match between services
3. **Check if worker is running** (look for "Worker started" in logs)
4. **Test Python parser health** endpoint
5. **Share the specific error messages** you find in the logs

## Manual Test

You can test the connection manually:

```bash
# Test Python parser health
curl https://recruitment-portal-python-parser-production.up.railway.app/health

# Test backend health
curl https://recruitment-portal-backend-production-d1f7.up.railway.app/health
```

Both should return `{"status": "ok"}` or similar.
