# 🔍 Document Processing Issue: "Queued" but Not Processing

## Problem

**Document:** `MUHAMMAD USMAN-001.pdf`  
**Status:** `Queued` (not processing)  
**Uploaded:** 27/01/2026, 19:28:18

---

## Root Cause

The document is stuck in the queue because the **workers are not running**.

### How Workers Start

From `server.ts` lines 130-157:

```typescript
// Start workers if explicitly enabled
if (process.env.RUN_WORKER === 'true' && process.env.REDIS_URL) {
  // Start CV parser worker
  if (process.env.PYTHON_CV_PARSER_URL && process.env.PYTHON_HMAC_SECRET) {
    startCvParserWorker();
    startDocumentVerificationWorker();
  }
}
```

**Workers only start if:**
1. ✅ `RUN_WORKER=true` (environment variable)
2. ✅ `REDIS_URL` exists
3. ✅ `PYTHON_CV_PARSER_URL` exists
4. ✅ `PYTHON_HMAC_SECRET` exists

---

## Check Railway Environment

### Step 1: Check if Workers Are Enabled

Go to Railway → Backend Service → Variables

**Look for:**
- `RUN_WORKER` = `true` or `false`?
- `REDIS_URL` = set?
- `PYTHON_CV_PARSER_URL` = set?
- `PYTHON_HMAC_SECRET` = set?

---

## Solution

### Option 1: Enable Workers (If All Services Are Running)

If you have:
- ✅ Redis service running
- ✅ Python parser service running

Then set in Railway:
```
RUN_WORKER=true
```

Redeploy → Workers start → Documents process automatically

---

### Option 2: Manual Processing (Temporary Fix)

If workers are not enabled, you can manually trigger processing:

#### A. Reprocess Button in UI
1. Open `MUHAMMAD USMAN-001.pdf` in the document list
2. Click **"Reprocess"** button
3. This re-queues the document for AI verification

#### B. API Call
```bash
POST /api/documents/candidate-documents/{document_id}/reprocess
```

---

## How Document Processing Works

### Normal Flow (When Workers Are Running):

```
Upload Document
     ↓
Create DB record (status = queued)
     ↓
Enqueue job in Redis
     ↓
Worker picks up job ← THIS IS NOT HAPPENING
     ↓
Call Python AI service
     ↓
Process & split document
     ↓
Update status (verified/needs_review/rejected)
```

### Current Flow (Workers Not Running):

```
Upload Document
     ↓
Create DB record (status = queued)
     ↓
Enqueue job in Redis
     ↓
❌ NO WORKER TO PICK UP JOB ← STUCK HERE
```

---

## Quick Diagnostic

### Check Worker Status via Logs

In Railway → Backend Service → Logs

**Look for these messages on startup:**

✅ **If workers are running:**
```
CV Parser worker started
Document Link worker started
Document Verification worker started
```

❌ **If workers are NOT running:**
```
Workers not started (set RUN_WORKER=true to enable)
```

---

## Recommended Actions

### Immediate Fix (Today):

1. **Check Railway Variables:**
   - Is `RUN_WORKER=true`?
   - Is `REDIS_URL` set?
   - Is `PYTHON_CV_PARSER_URL` set?

2. **If Variables Are Missing:**
   - Don't set `RUN_WORKER=true` yet (need Redis + Python service first)
   - Use **"Reprocess"** button in UI for manual processing

3. **If Variables Are Set:**
   - Redeploy backend
   - Check logs for "Worker started" messages
   - Document should process automatically

---

### Long-term Solution:

1. **Ensure All Services Are Running:**
   - ✅ Backend (Node.js)
   - ✅ Python Parser (recruitment-portal-python-parser)
   - ✅ Redis (Railway plugin or external)

2. **Set Environment Variables:**
   ```
   RUN_WORKER=true
   REDIS_URL=redis://...
   PYTHON_CV_PARSER_URL=https://...
   PYTHON_HMAC_SECRET=your-secret
   ```

3. **Deploy & Verify:**
   - Check logs for worker startup messages
   - Upload test document
   - Should process automatically (no "Queued" status)

---

## Why "Queued" Status Exists

The `queued` status means:
- ✅ Document uploaded successfully
- ✅ DB record created
- ✅ Job added to Redis queue
- ❌ No worker to process the job

It's not an error—it's just waiting for a worker to pick it up.

---

## Next Steps

**Please check:**
1. What is `RUN_WORKER` set to in Railway?
2. Do you have a Redis service running?
3. Is the Python parser service deployed?

Based on your answers, I can:
- Help you enable workers (if services are ready)
- Help you manually process documents (if workers can't be enabled yet)
- Help you set up missing services (Redis, Python parser)

---

## Files to Review

- `src/server.ts` (lines 130-157) - Worker startup logic
- `src/workers/documentVerificationWorker.ts` - Document processing worker
- `src/workers/cvParserWorker.ts` - CV parsing worker
- Railway environment variables

---

**Status:** 🔴 Workers not running  
**Impact:** Documents stuck in "Queued" status  
**Fix:** Enable `RUN_WORKER=true` + ensure services are running
