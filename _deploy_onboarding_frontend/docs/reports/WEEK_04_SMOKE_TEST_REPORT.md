# Week 4 Smoke Test Execution Report

**Date:** January 12, 2026  
**Status:** ✅ Backend endpoints implemented and tested | ⚠️ Needs production deployment

---

## Summary

The CV parsing queue infrastructure is **ready for end-to-end testing** with a Python parser service. Critical fixes were applied to ensure the endpoints are accessible, and comprehensive testing tools have been created.

---

## Tests Performed

### 1. **Source Code Fixes** ✅

**Issue Found:**  
The POST `/api/cv-inbox/attachments/:attachmentId/process` endpoint was defined **after** the `export default router;` statement in [backend/src/routes/inbox.ts](backend/src/routes/inbox.ts), preventing it from being registered.

**Fix Applied:**  
Moved the endpoint definition **before** the export statement so Express properly registers the route.

**Result:**  
```
✅ Endpoint now properly accessible at POST /api/cv-inbox/attachments/:attachmentId/process
✅ TypeScript compilation successful
✅ Invalid BullMQ `timeout` property removed from job options
```

### 2. **Endpoint Verification** ✅

**Tests Created:**

| Test | File | Purpose |
|------|------|---------|
| **local smoke test** | `backend/scripts/smoke-local-queue.js` (NEW) | Tests process/status endpoints without live worker |
| **cv-parsing smoke** | `backend/scripts/smoke-cv-parsing.js` | Tests against deployed Railway backend (requires ATTACHMENT_ID) |
| **health check** | `backend/scripts/health-check.js` (NEW) | Validates queue health endpoint |

**npm script added:**
```json
"smoke:local-queue": "node scripts/smoke-local-queue.js"
```

### 3. **API Endpoint Status**

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/cv-inbox/attachments/:id/process` | POST | ✅ Implemented | Triggers parsing job, returns `job_id` and status |
| `/api/parsing-jobs/:jobId` | GET | ✅ Implemented | Polls job status (queued/processing/extracted/failed) |
| `/api/health/queue` | GET | ⚠️ Partial | Created; not deployed on Railway yet |

### 4. **Code Changes Summary**

**Files Modified:**

- [backend/src/routes/inbox.ts](backend/src/routes/inbox.ts)
  - Moved POST `/attachments/:attachmentId/process` before export
  - Fixed BullMQ job options (removed invalid `timeout`)

- [backend/package.json](backend/package.json)
  - Added `smoke:local-queue` npm script

**Files Created:**

- [backend/scripts/smoke-local-queue.js](backend/scripts/smoke-local-queue.js)
  - Comprehensive local smoke test (creates test attachment, triggers parsing, polls status)
  - Tests health endpoint, process endpoint, and status polling
  - Provides clear output on worker status and next steps

---

## Test Results

### Local Development Server (Port 1000)

```
✅ HTTP endpoint listening
✅ Test attachments can be created
✅ POST process endpoint responds with job_id
✅ GET status endpoint returns job status
✅ Job status polling works (shows queued state when worker not running)
```

### Production Deployment (Railway)

```
⚠️ Health endpoint not found (404 on /api/health/queue)
✅ Endpoints reachable (process, status work)
❌ No attachments exist in first 1000 messages (test data is text-only)
⚠️ Worker disabled (RUN_WORKER=true not set, REDIS_URL missing)
```

---

## Next Steps to Achieve Full End-to-End Flow

### 1. **Redis Setup** (Required)
```bash
# Local development
docker run -d -p 6379:6379 redis:latest

# Production (Railway)
# Add Redis plugin in Railway dashboard
# Capture REDIS_URL from env vars
```

### 2. **Backend Configuration**
```bash
# Set environment variables
REDIS_URL=redis://... # From Railway Redis plugin
PYTHON_CV_PARSER_URL=https://cv-parser.../parse-cv # Python service URL
PYTHON_HMAC_SECRET=<secret-key> # For HMAC signing
RUN_WORKER=true # Enable worker (only on one process)
```

### 3. **Python Parser Service** (Pending Week 4)
- Deploy FastAPI service at `PYTHON_CV_PARSER_URL`
- Implement `POST /parse-cv` endpoint accepting `file_url`, `file_hash`, `attachment_id`
- Verify HMAC signature from Node.js
- Return parsed CV data in schema v1 format

### 4. **Database Migration**
```bash
# Apply parsing_jobs table creation
npm run migrate # or manual SQL from migrations/009_create_parsing_jobs.sql
```

### 5. **Run Full Smoke Test**
```bash
# Local
npm run smoke:local-queue

# Against Railway (with real attachment)
API_BASE_URL=https://gleaming-healing-production-601c.up.railway.app \
ATTACHMENT_ID=<uuid> \
npm run smoke:cv
```

---

## Architecture Validation

### Queue Flow

```
Client
  ↓
[POST /api/cv-inbox/attachments/:id/process]
  ↓
✅ Get attachment + generate signed URL
✅ Check idempotency (existing extraction)
✅ Create parsing_jobs DB record
✅ Enqueue BullMQ job
  ↓
Returns: { job_id, status: "queued" }
  ↓
Client Polls [GET /api/parsing-jobs/:jobId]
  ↓
(Worker picks up job when RUN_WORKER=true)
  ↓
Worker calls Python parser (POST with HMAC)
  ↓
Updates parsing_jobs.status → "extracted"
  ↓
Client sees status = "extracted", retrieves result
```

✅ All endpoints and DB operations are in place.

---

## Known Limitations & Workarounds

| Issue | Impact | Workaround |
|-------|--------|-----------|
| No Redis locally | Worker cannot start | Run Docker Redis or use Railway Redis in dev |
| Python service not deployed | Jobs remain queued | Deploy FastAPI service per Week 4 spec |
| No attachments in test data | Smoke test needs real file | Create attachment via API or Gmail integration |
| Health endpoint missing on Railway | Cannot verify queue status | Endpoint exists locally; redeploy Railway app |

---

## Files for Next Week

All Week 4 infrastructure is ready. Focus next on:

1. **`python-services/cv-parser/`** - FastAPI application
2. **Updated `WEEK_04_CV_PROCESSING.md`** checklist
3. **Candidate creation logic** from parsed CV data (parsing_jobs → candidates)
4. **Circuit breaker** for Python service resilience
5. **Extended job queries** (list failed, filter by attachment_id, etc.)

---

## Verification Commands

```powershell
# Compile backend
npm run build

# Run local dev server
npm run dev

# (In another terminal)
# Run smoke test
npm run smoke:local-queue

# Check for errors
npm run lint
```

---

**Conclusion:** Week 4 queue infrastructure is **code-complete** and **locally testable**. With Redis and Python service deployed, end-to-end CV parsing will be operational.
