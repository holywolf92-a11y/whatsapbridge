# Document Verification Worker Troubleshooting

## Issue: Documents Stuck in "Pending" Status

When documents are uploaded but remain in "Pending" status, it means the AI categorization worker is not processing them.

## Root Cause

The document verification worker requires:
1. `RUN_WORKER=true` environment variable
2. `REDIS_URL` - Redis connection string
3. `PYTHON_CV_PARSER_URL` - Python parser service URL
4. `PYTHON_HMAC_SECRET` - HMAC secret for authentication

## How to Check

### 1. Check Railway Backend Logs

Look for one of these messages:

**✅ Worker is running:**
```
Document Verification worker started
[DocumentVerificationWorker] Worker started, listening for jobs...
```

**❌ Worker is NOT running:**
```
Workers not started (set RUN_WORKER=true and configure REDIS_URL + PYTHON vars)
```

### 2. Verify Environment Variables in Railway

Go to Railway Dashboard → Backend Service → Variables tab:

**Required Variables:**
- `RUN_WORKER=true`
- `REDIS_URL=redis://default:password@redis.railway.internal:6379`
- `PYTHON_CV_PARSER_URL=https://recruitment-portal-python-parser-production.up.railway.app`
- `PYTHON_HMAC_SECRET=your-secret-key`

### 3. Check Queue Status

Run the diagnostic script:
```bash
cd backend
node scripts/check-document-worker.js
```

This will show:
- Queue statistics (waiting, active, completed, failed jobs)
- Recent jobs in the queue
- Whether workers are detected

## Solution

### Step 1: Set Environment Variables in Railway

1. Go to Railway Dashboard
2. Select your backend service (`gleaming-healing`)
3. Go to "Variables" tab
4. Add/Update these variables:

```
RUN_WORKER=true
REDIS_URL=redis://default:YOUR_PASSWORD@redis.railway.internal:6379
PYTHON_CV_PARSER_URL=https://recruitment-portal-python-parser-production.up.railway.app
PYTHON_HMAC_SECRET=your-hmac-secret-key
```

### Step 2: Redeploy Backend

After setting the variables, Railway should auto-redeploy. If not:
1. Go to Railway Dashboard → Backend Service
2. Click "Redeploy" or trigger a new deployment

### Step 3: Verify Worker Started

Check Railway logs for:
```
✅ Document Verification worker started
✅ [DocumentVerificationWorker] Worker started, listening for jobs...
```

### Step 4: Test Upload

1. Upload a new document
2. Wait 10-30 seconds
3. Check if status changes from "Pending" to "Verified" or shows a category

## Common Issues

### Issue: "Workers not started" in logs

**Cause:** Missing or incorrect environment variables

**Fix:** 
- Verify all required variables are set
- Check variable names are exact (case-sensitive)
- Ensure `RUN_WORKER=true` (not `RUN_WORKER=1` or `RUN_WORKER="true"`)

### Issue: "Redis connection error"

**Cause:** Invalid or missing `REDIS_URL`

**Fix:**
- Verify Redis service is running in Railway
- Check `REDIS_URL` format is correct
- Ensure Redis password is correct

### Issue: "Python parser connection error"

**Cause:** Invalid `PYTHON_CV_PARSER_URL` or Python parser is down

**Fix:**
- Verify Python parser service is running
- Check `PYTHON_CV_PARSER_URL` is correct
- Ensure `PYTHON_HMAC_SECRET` matches between backend and Python parser

### Issue: Jobs in queue but not processing

**Cause:** Worker crashed or not started

**Fix:**
- Check Railway logs for worker errors
- Verify worker started successfully
- Check Redis connection is stable
- Restart backend service if needed

## Testing

After fixing, test with:
```bash
cd backend
node scripts/test-document-upload-endpoint.js
```

This will:
1. Upload a test document
2. Wait for categorization
3. Verify the category is set correctly
