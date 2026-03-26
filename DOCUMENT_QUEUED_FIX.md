# 🔧 Fix "Queued" Document (MUHAMMAD USMAN-001.pdf)

## Problem

**Document:** `MUHAMMAD USMAN-001.pdf`  
**Status:** `Queued` (not processing)  
**Root Cause:** Workers may not be running to process the queue

---

## ✅ QUICK FIX: Use "Reprocess" Button

### Steps:

1. **In your UI, find the document:**
   - `MUHAMMAD USMAN-001.pdf`
   - Status shows: `Queued`

2. **Click the "Reprocess" button** (should be next to Download/Delete)

3. **Document will be re-queued** and processed

---

## What "Reprocess" Does

```typescript
// Calls this endpoint:
POST /api/documents/candidate-documents/:id/reprocess

// Which:
1. Resets document status
2. Re-queues the job in Redis
3. Worker picks it up (if running)
4. OR it can be processed manually
```

---

## Alternative: Check if Workers Are Running

### In Railway Dashboard:

1. **Go to:** Backend Service → Logs
2. **Search for:** `"worker started"` or `"RUN_WORKER"`

**You should see:**
```
✅ CV Parser worker started
✅ Document Link worker started  
✅ Document Verification worker started
```

**If you see:**
```
❌ Workers not started (set RUN_WORKER=true to enable)
```

Then workers are disabled.

---

## If Workers Are Not Running

### Option 1: Enable Workers (Recommended)

**Requirements:**
- ✅ Redis service running
- ✅ Python parser service deployed

**Enable in Railway:**
1. Go to Backend Service → Variables
2. Set: `RUN_WORKER=true`
3. Redeploy

**Result:** All queued documents process automatically

---

### Option 2: Manual Processing (Temporary)

**If you can't enable workers right now:**

1. **Use "Reprocess" button** in UI for each stuck document
2. **OR** manually call the API:

```bash
curl -X POST \
  https://recruitment-portal-backend-production-2475.up.railway.app/api/documents/candidate-documents/{document-id}/reprocess
```

---

## Verify Document Processing

After clicking "Reprocess":

### Success Signs:
- ✅ Status changes from `Queued` → `Processing` → `Verified`/`Needs Review`
- ✅ Document appears in candidate's document list
- ✅ If it's a CV, split documents are created

### Still Stuck?
- ❌ Status stays `Queued` → Workers are definitely not running
- 💡 Need to enable workers or contact admin

---

## Long-term Solution

**Enable workers so documents process automatically:**

1. Ensure Redis is running (Railway Redis plugin)
2. Ensure Python parser is deployed
3. Set `RUN_WORKER=true` in Railway
4. Redeploy backend

**Then all future uploads will process automatically!**

---

## Current Workaround (Until Workers Enabled)

**For now, manually reprocess stuck documents:**

1. Muhammad Usman's PDF → Click "Reprocess"
2. Muhammad Adnan's photos → Run `.\fix-photos.ps1`
3. Any other stuck docs → Click "Reprocess"

---

## Summary

**Immediate Action:** Click "Reprocess" on `MUHAMMAD USMAN-001.pdf` ✅

**Long-term:** Enable workers with `RUN_WORKER=true` in Railway 🚀

---

**Let me know:**
1. Does the "Reprocess" button work?
2. Do you want help enabling workers?
