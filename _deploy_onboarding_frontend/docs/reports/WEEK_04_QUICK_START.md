## 🎯 Quick Start: Week 4 Smoke Testing

### What Was Done

✅ **Fixed Critical Bug**  
The POST `/api/cv-inbox/attachments/:attachmentId/process` endpoint was unreachable because it was defined **after** the `export default router;` statement in `inbox.ts`. **Fixed:** Moved route before export.

✅ **Compiled Successfully**  
- Fixed BullMQ invalid `timeout` property in job options
- All TypeScript checks pass
- npm dependencies installed

✅ **Created Smoke Test Scripts**  
1. `backend/scripts/smoke-local-queue.js` — Test locally without needing a live attachment
2. npm script: `npm run smoke:local-queue`

✅ **Generated Report**  
Created [WEEK_04_SMOKE_TEST_REPORT.md](WEEK_04_SMOKE_TEST_REPORT.md) with full architecture validation and next steps.

---

### Run the Smoke Test (Local)

```bash
# Terminal 1: Start dev server
cd backend
npm run dev
# Server runs on http://localhost:1000

# Terminal 2: Run smoke test
npm run smoke:local-queue
```

**Expected Output:**  
- ✅ Test attachment created
- ✅ Job triggered (returns job_id)
- ✅ Job status queued
- ⚠️ Worker not running (Redis required)

---

### Run Against Production (Railway)

```bash
cd backend

# Need a real attachment ID first
export API_BASE_URL=https://gleaming-healing-production-601c.up.railway.app
export ATTACHMENT_ID=<actual-uuid-from-database>

npm run smoke:cv
```

**Note:** Find attachment IDs by querying `/api/cv-inbox/:messageId/attachments` on actual messages.

---

### Next Actions (Week 4 Priorities)

1. **Deploy Redis**
   - Local: `docker run -d -p 6379:6379 redis:latest`
   - Railway: Add Redis plugin, capture `REDIS_URL`

2. **Set Environment Variables** (backend)
   ```
   REDIS_URL=redis://...
   PYTHON_CV_PARSER_URL=https://cv-parser-service/parse-cv
   PYTHON_HMAC_SECRET=<your-secret>
   RUN_WORKER=true
   ```

3. **Deploy Python Service**  
   - Create [python-services/cv-parser](../python-services/cv-parser) per spec
   - Implement `/parse-cv` endpoint
   - Test HMAC signature verification

4. **Apply DB Migration**
   - Run [migrations/009_create_parsing_jobs.sql](backend/migrations/009_create_parsing_jobs.sql)
   - Verify `parsing_jobs` table exists

5. **Rebuild & Redeploy**
   ```bash
   npm run build
   # Commit and push to Railway (auto-deploy)
   ```

---

### Key Files

| File | Purpose |
|------|---------|
| [backend/src/routes/inbox.ts](backend/src/routes/inbox.ts) | ✅ Fixed: POST process endpoint |
| [backend/src/routes/parsingJobs.ts](backend/src/routes/parsingJobs.ts) | GET job status endpoint |
| [backend/src/config/queue.ts](backend/src/config/queue.ts) | BullMQ queue initialization |
| [backend/src/workers/cvParserWorker.ts](backend/src/workers/cvParserWorker.ts) | Worker skeleton (needs Redis) |
| [backend/src/services/parsingJobsService.ts](backend/src/services/parsingJobsService.ts) | DB operations for parsing jobs |
| [backend/scripts/smoke-local-queue.js](backend/scripts/smoke-local-queue.js) | 🆕 Local smoke test |
| [WEEK_04_SMOKE_TEST_REPORT.md](WEEK_04_SMOKE_TEST_REPORT.md) | 🆕 Full report & checklist |

---

### Troubleshooting

| Problem | Solution |
|---------|----------|
| `Cannot find module 'bullmq'` | Run `npm install` in backend/ |
| Route still 404 | Clear `.git` cache: `git rm --cached backend/dist && npm run build` |
| Worker won't start | Set `RUN_WORKER=true` + `REDIS_URL` env vars |
| Jobs stay queued | Python service must be running and accessible |
| Health endpoint 404 | Endpoint not deployed to Railway yet; redeploy backend |

---

✅ **Status:** Week 4 scaffolding complete. Ready for Python service integration.
