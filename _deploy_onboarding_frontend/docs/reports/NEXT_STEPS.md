# CRITICAL: Next Steps to Complete Document Auto-Linking System

## ⚠️ URGENT: Run Database Migration

### Step 1: Execute Database Migration (5 minutes)

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/hncvsextwmvjydcukdwx/sql/new

2. **Copy Migration SQL**
   - Open file: `backend/migrations/010_add_document_linking_support.sql`
   - Copy ALL content from that file

3. **Paste and Run**
   - Paste into Supabase SQL editor
   - Click "Run" button
   - Wait for completion (should see: "Creating table candidate_documents", "Creating table unmatched_documents", etc.)

4. **Verify Tables Created**
   - Run this query to verify:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('candidate_documents', 'unmatched_documents');
   ```
   - Should return 2 rows

### Why This is Critical
- Worker cannot operate without these tables
- System will crash if worker tries to insert into non-existent tables
- Must complete BEFORE testing document linking

---

## ✅ Already Deployed

The following have been pushed to GitHub and auto-deployed to Railway:

✅ Document classifier service
✅ Candidate matcher service  
✅ Document link service
✅ Document link queue
✅ Document link worker
✅ Worker startup in server.ts
✅ Auto-enqueue trigger in attachment service
✅ Reconciliation trigger in candidate creation
✅ API routes for document management

**The backend code is ready to go!** Just needs the database schema.

---

## 🧪 Testing After Migration

Once migration is complete, test these scenarios:

### Quick Test 1: Upload Document
```bash
# Any document upload should be classified automatically
# Check logs for: "Attachment classified and created"
# Should see attachment_kind and document_type populated
```

### Quick Test 2: Check Unmatched Documents
```bash
curl https://recruitment-portal-backend-production-d1f7.up.railway.app/api/documents/unmatched
# Should return empty list or list of documents
```

### Full Test: Upload CV Then Document
1. Upload CV → Wait for parsing
2. Upload supporting document → Should auto-link if candidate exists
3. Verify document appears in /api/documents/candidates/{id}/documents

---

## 📋 Optional: Frontend Work (Not Blocking)

Can be done anytime after migration:

- [ ] Add DocumentsChecklist widget to candidate profile
- [ ] Add UnmatchedDocuments table to admin page
- [ ] Add link-document modal
- [ ] Add document download buttons

API is ready now, frontend just needs to call it.

---

## 🔍 Troubleshooting

### If Worker Fails to Start
- Check Railway logs for: `startDocumentLinkWorker`
- Verify `RUN_WORKER=true` environment variable
- Verify `REDIS_URL` is configured
- Verify migration ran successfully

### If Documents Not Auto-Linking
1. Check worker logs for match attempts
2. Verify candidate exists with matching identifier
3. Check `unmatched_documents` table for pending links
4. Run manual link via: `POST /api/documents/unmatched/{id}/link`

### If Checklist Not Updating
- Verify trigger created: `trg_update_candidate_checklist`
- Check `candidate_documents` insert succeeded
- Manually update: `UPDATE candidates SET passport_received=true WHERE id='...';`

---

## Summary

| Task | Status | Time |
|------|--------|------|
| Backend code | ✅ Deployed | - |
| Database migration | ⏳ **URGENT** | 5 min |
| Testing | ⏳ After migration | 10 min |
| Frontend UI | ⏳ Optional | 1-2 hours |

**Blocking Issue:** Database migration must run before any document linking will work.

**Next Action:** Execute migration in Supabase SQL editor now!

---

**Need Help?**
- Migration stuck? Check for SQL syntax errors
- Worker not running? Check Railway environment variables
- API routes 404? Verify backend redeployed successfully
