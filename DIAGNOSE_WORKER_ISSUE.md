# 🔍 Diagnose Worker Issue - Railway Connection

## What I've Created

Since Railway CLI isn't available, I've created tools to diagnose the worker issue remotely:

---

## ✅ **NEW: Worker Status Diagnostic Tools**

### 1. API Endpoint
**URL:** `GET /api/worker-status`

**Returns:**
- ✅ Environment variables status (RUN_WORKER, REDIS_URL, etc.)
- ✅ Worker status (enabled/disabled)
- ✅ Queue health (Redis connection, job counts)
- ✅ Stuck documents (queued >5 minutes)
- ✅ Pending documents count
- ✅ Overall health summary

### 2. PowerShell Script
**File:** `check-worker-status.ps1`

**Usage:**
```powershell
.\check-worker-status.ps1
```

**Shows:**
- 📊 Overall status
- 🔧 Environment configuration
- 👷 Workers status
- 📦 Queue status (waiting, active, failed jobs)
- 📄 Document status (pending, stuck)
- 💡 Recommendations

---

## 🚀 **How to Diagnose the Issue**

### Step 1: Wait for Deployment (~3 minutes)

Railway is deploying the new diagnostic endpoint:
- ✅ Commit: `b5f0c11`
- ⏳ Deploying...

### Step 2: Run the Diagnostic Script

```powershell
.\check-worker-status.ps1
```

This will show you:

#### **If Workers Are Running:**
```
✅ Overall Status: All systems operational

🔧 Environment Configuration:
   RUN_WORKER: true
   REDIS_URL: ✅ set
   PYTHON_CV_PARSER_URL: ✅ set
   PYTHON_HMAC_SECRET: ✅ set

👷 Workers Status:
   Enabled: ✅ YES
   CV Parser Configured: ✅ YES

📦 Queue Status:
   Redis Connected: ✅ YES
   CV Parser Queue:
      Waiting: 0
      Active: 1
      Completed: 150
      Failed: 2
```

#### **If Workers Are NOT Running:**
```
⚠️ Overall Status: Workers not enabled (set RUN_WORKER=true)

🔧 Environment Configuration:
   RUN_WORKER: not set  ← PROBLEM!
   REDIS_URL: ✅ set
   PYTHON_CV_PARSER_URL: ✅ set

👷 Workers Status:
   Enabled: ❌ NO  ← PROBLEM!

📄 Document Status:
   Pending Documents: 15
   Stuck Documents (>5 min): 5  ← PROBLEM!
```

---

## 📋 **What to Check Based on Results**

### Scenario 1: `RUN_WORKER=not set` or `false`

**Problem:** Workers are disabled  
**Solution:**
1. Go to Railway → Backend Service → **Variables**
2. Add/Update: `RUN_WORKER=true`
3. **Redeploy**
4. Run `.\check-worker-status.ps1` again to verify

---

### Scenario 2: `REDIS_URL=❌ not set`

**Problem:** Redis not configured  
**Solution:**
1. Add Redis plugin in Railway
2. Link it to your backend service
3. Railway will auto-set `REDIS_URL`
4. Redeploy

---

### Scenario 3: `PYTHON_CV_PARSER_URL=❌ not set`

**Problem:** Python parser not configured  
**Solution:**
1. Deploy Python parser service first
2. Get its Railway URL (e.g., `https://...railway.app`)
3. Set in backend: `PYTHON_CV_PARSER_URL=https://...`
4. Set: `PYTHON_HMAC_SECRET=your-secret-key`
5. Redeploy

---

### Scenario 4: Workers enabled but documents still stuck

**Problem:** Jobs failed or workers crashed  
**Solution:**
1. Check Railway logs for errors
2. Look for worker startup messages:
   ```
   CV Parser worker started
   Document Verification worker started
   ```
3. Look for error messages
4. Click "Reprocess" on stuck documents

---

## 🔧 **Manual Fixes (If Workers Can't Be Enabled Now)**

### Fix 1: Reprocess Stuck Documents
For each stuck document:
1. Open document in UI
2. Click **"Reprocess"** button

### Fix 2: Fix Photos
```powershell
.\fix-photos.ps1
```

### Fix 3: API Call
```bash
curl -X POST \
  https://recruitment-portal-backend-production-2475.up.railway.app/api/documents/candidate-documents/{doc-id}/reprocess
```

---

## 📊 **Example Output (Full)**

```
================================================================================
WORKER STATUS REPORT
================================================================================

📊 Overall Status: ⚠️ Workers not enabled (set RUN_WORKER=true)

🔧 Environment Configuration:
   RUN_WORKER: not set
   REDIS_URL: ✅ set
   PYTHON_CV_PARSER_URL: ✅ set
   PYTHON_HMAC_SECRET: ✅ set

👷 Workers Status:
   Enabled: ❌ NO
   CV Parser Configured: ✅ YES
   Document Verification Configured: ✅ YES

📦 Queue Status:
   Redis Connected: ✅ YES

   CV Parser Queue:
      Waiting: 3
      Active: 0
      Completed: 145
      Failed: 2

   Document Verification Queue:
      Waiting: 5
      Active: 0
      Completed: 198
      Failed: 1

📄 Document Status:
   Pending Documents: 8
   Stuck Documents (>5 min): 3

   🚨 Stuck Documents:
      • MUHAMMAD USMAN-001.pdf
        ID: abc-123
        Stuck for: 127 minutes
      • split_photos_1769355582362.pdf
        ID: def-456
        Stuck for: 85 minutes

================================================================================
HEALTH SUMMARY
================================================================================
   Workers Running: ❌
   Redis Connected: ✅
   Python Service Configured: ✅
   Stuck Documents: 3

💡 RECOMMENDATION:
   Set RUN_WORKER=true in Railway environment variables
   Then redeploy the backend

💡 TO FIX STUCK DOCUMENTS:
   1. Enable workers (if not already enabled)
   2. Click 'Reprocess' button on each document in the UI
   3. OR run: .\fix-photos.ps1 (for photos)
```

---

## 🎯 **Action Plan**

### Right Now (After Deployment):

1. **Run diagnostic:**
   ```powershell
   .\check-worker-status.ps1
   ```

2. **Share the output with me**

3. **Based on output, I'll tell you exactly:**
   - What's wrong
   - What variables to set in Railway
   - Whether you need Redis/Python services
   - How to fix stuck documents

---

## 📁 **Files Created**

- ✅ `src/controllers/workerStatusController.ts` - Worker status API
- ✅ `check-worker-status.ps1` - Diagnostic script
- ✅ `DIAGNOSE_WORKER_ISSUE.md` - This guide

---

## 🚀 **Deployment Status**

- ✅ Commit: `b5f0c11`
- ⏳ Railway deploying (~3 minutes)
- 🎯 After deployment: Run `.\check-worker-status.ps1`

---

## 📝 **Summary**

**Instead of connecting to Railway directly, we're using:**
1. 🌐 Remote API endpoint to check status
2. 📊 PowerShell script to display results
3. 💡 Automated recommendations

**This works from anywhere, no Railway CLI needed!**

---

**Next Step:** Wait 3 minutes, then run `.\check-worker-status.ps1` and share the output! 🎉
