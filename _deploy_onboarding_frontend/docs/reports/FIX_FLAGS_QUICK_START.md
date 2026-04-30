# 🔧 Fix Document Flags - Quick Start

After clearing data, the document flags (CV, Passport, etc.) need to be recalculated based on actual documents in the database.

## ⚡ Fastest Method: Use Supabase Dashboard

1. **Go to Supabase Dashboard** → Your Project → **SQL Editor**

2. **Copy and paste this SQL:**

```sql
-- Recalculate flags for all candidates
UPDATE candidates
SET
  cv_received = EXISTS(
    SELECT 1 FROM candidate_documents
    WHERE candidate_id = candidates.id AND category = 'cv_resume'
  ) OR EXISTS(
    SELECT 1 FROM inbox_attachments
    WHERE (candidate_id = candidates.id OR linked_candidate_id = candidates.id)
      AND (attachment_kind = 'cv' OR document_type = 'cv')
  ),
  passport_received = EXISTS(
    SELECT 1 FROM candidate_documents
    WHERE candidate_id = candidates.id AND category = 'passport'
  ) OR EXISTS(
    SELECT 1 FROM inbox_attachments
    WHERE (candidate_id = candidates.id OR linked_candidate_id = candidates.id)
      AND document_type = 'passport'
  ),
  cnic_received = EXISTS(
    SELECT 1 FROM candidate_documents
    WHERE candidate_id = candidates.id AND document_type = 'cnic'
  ) OR EXISTS(
    SELECT 1 FROM inbox_attachments
    WHERE (candidate_id = candidates.id OR linked_candidate_id = candidates.id)
      AND document_type = 'cnic'
  ),
  certificate_received = EXISTS(
    SELECT 1 FROM candidate_documents
    WHERE candidate_id = candidates.id 
      AND (category = 'certificates' OR document_type IN ('certificate', 'degree'))
  ),
  degree_received = EXISTS(
    SELECT 1 FROM candidate_documents
    WHERE candidate_id = candidates.id 
      AND (category = 'certificates' OR document_type IN ('certificate', 'degree'))
  ),
  photo_received = EXISTS(
    SELECT 1 FROM candidate_documents
    WHERE candidate_id = candidates.id AND category = 'photos'
  ),
  medical_received = EXISTS(
    SELECT 1 FROM candidate_documents
    WHERE candidate_id = candidates.id AND category = 'medical_reports'
  ),
  visa_received = EXISTS(
    SELECT 1 FROM candidate_documents
    WHERE candidate_id = candidates.id AND document_type = 'visa'
  );
```

3. **Click "Run"** ✅

4. **Refresh your frontend** - flags should now appear correctly!

---

## Alternative: Use Node.js Script

If you prefer using a script:

```bash
cd "Recruitment Automation Portal (2)/backend"
node scripts/recalculate-all-flags.js
```

**Note:** Requires `.env` file with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

---

## What This Does

- ✅ Checks `candidate_documents` table for documents
- ✅ Checks `inbox_attachments` table for linked documents
- ✅ Updates flags: `cv_received`, `passport_received`, `certificate_received`, `photo_received`, `medical_received`
- ✅ Sets `_received_at` timestamps for documents that exist

---

## Verify It Worked

Run this query to see flags:

```sql
SELECT 
  name,
  candidate_code,
  cv_received,
  passport_received,
  certificate_received,
  photo_received,
  medical_received
FROM candidates
ORDER BY created_at DESC
LIMIT 10;
```

Flags should show `true` for candidates who have those documents.

---

## Still Not Working?

If flags still don't show:

1. **Check if documents exist:**
   ```sql
   SELECT candidate_id, category, document_type, file_name 
   FROM candidate_documents 
   LIMIT 10;
   ```

2. **Check if candidate has documents:**
   ```sql
   SELECT c.name, COUNT(cd.id) as doc_count
   FROM candidates c
   LEFT JOIN candidate_documents cd ON cd.candidate_id = c.id
   GROUP BY c.id, c.name
   ORDER BY doc_count DESC;
   ```

3. **Manually trigger flag update for a candidate:**
   - Call the API: `POST /api/candidates/:id/update-document-flags`
   - Or use the SQL script above for specific candidates

---

## Need More Help?

See the detailed script at:
- `backend/scripts/recalculate-all-flags.js` (Node.js version)
- `backend/scripts/recalculate-all-flags.sql` (SQL version with loop)
