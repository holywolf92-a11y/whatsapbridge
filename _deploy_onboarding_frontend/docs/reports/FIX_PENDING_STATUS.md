# 🔧 Fix "Pending" Status - Document Verification Not Running

## Problem
Documents are stuck in "Pending" status and not updating to "Verified" because the AI verification worker is not running.

## Root Cause
The document verification worker requires:
1. `RUN_WORKER=true` environment variable
2. `REDIS_URL` configured
3. `PYTHON_CV_PARSER_URL` configured
4. `PYTHON_HMAC_SECRET` configured

If any of these are missing, the worker won't start and documents will stay "Pending".

## Quick Fix: Manual Reprocess

You can manually trigger verification for a specific document:

### Option 1: Use API Endpoint

```bash
POST /api/documents/candidate-documents/:id/reprocess
```

Example:
```bash
curl -X POST https://your-backend-url/api/documents/candidate-documents/DOCUMENT_ID/reprocess
```

### Option 2: Use Script

```bash
cd backend
node scripts/manually-verify-document.js <document-id>
```

### Option 3: From Frontend

Add a "Reprocess" button in the document list that calls the reprocess endpoint.

## Permanent Fix: Configure Worker

### 1. Check Railway Environment Variables

Go to Railway Dashboard → Backend Service → Variables:

Required:
- ✅ `RUN_WORKER=true`
- ✅ `REDIS_URL=redis://...` (Railway Redis URL)
- ✅ `PYTHON_CV_PARSER_URL=https://...` (Python parser service URL)
- ✅ `PYTHON_HMAC_SECRET=your-secret-key`

### 2. Check Worker Logs

Railway Dashboard → Backend Service → Logs

Look for:
- ✅ `Document Verification worker started` - Worker is running
- ❌ `Workers not started` - Worker is NOT running
- ❌ `Failed to start Document Verification worker` - Error starting

### 3. Check Redis Connection

The worker needs Redis to queue jobs. Verify:
- Redis service is running in Railway
- `REDIS_URL` is correct
- Redis is accessible from backend

### 4. Check Python Service

The worker calls the Python AI service. Verify:
- Python parser service is deployed and running
- `PYTHON_CV_PARSER_URL` is correct
- `/categorize-document` endpoint exists
- `PYTHON_HMAC_SECRET` matches between services

## Alternative: Update Status Manually

If the worker can't run, you can manually update the status:

```sql
-- Update document to "Verified" status
UPDATE candidate_documents
SET 
  verification_status = 'verified',
  category = 'passport', -- or 'cv_resume', 'certificates', etc.
  verification_completed_at = NOW()
WHERE id = 'DOCUMENT_ID';
```

## What I Fixed

1. ✅ **Flags now set immediately** - Green/red icons show right away based on filename
2. ✅ **Worker startup improved** - Better error handling and logging
3. ✅ **Reprocess endpoint available** - Can manually trigger verification

## Next Steps

1. **Check Railway logs** to see if worker is starting
2. **Configure environment variables** if missing
3. **Use reprocess endpoint** to manually trigger verification for stuck documents
4. **Check Python service** is running and accessible

## Testing

After configuring the worker:

1. Upload a new document
2. Check logs for: `Document Verification worker started`
3. Check logs for: `[DocumentVerification] Processing job`
4. Document status should update from "Pending" to "Verified" within seconds

If worker is not running, use the reprocess endpoint to manually trigger verification.
