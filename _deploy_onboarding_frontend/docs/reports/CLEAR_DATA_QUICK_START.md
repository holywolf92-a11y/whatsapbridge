# 🧹 Quick Start: Clear All Data

## Fastest Method: Use Supabase Dashboard

1. **Go to Supabase Dashboard** → Your Project → **SQL Editor**

2. **Copy and paste this SQL script:**

```sql
-- Clear all data (preserves schema)
TRUNCATE TABLE document_verification_logs CASCADE;
TRUNCATE TABLE unmatched_documents CASCADE;
TRUNCATE TABLE candidate_documents CASCADE;
TRUNCATE TABLE documents CASCADE;
TRUNCATE TABLE parsing_jobs CASCADE;
TRUNCATE TABLE inbox_attachments CASCADE;
TRUNCATE TABLE communication_log CASCADE;
TRUNCATE TABLE job_candidate_matches CASCADE;
TRUNCATE TABLE cv_versions CASCADE;
TRUNCATE TABLE share_links CASCADE;
TRUNCATE TABLE candidate_timeline CASCADE;
TRUNCATE TABLE form_submissions CASCADE;
TRUNCATE TABLE idempotency_keys CASCADE;
TRUNCATE TABLE audit_log CASCADE;
TRUNCATE TABLE candidates CASCADE;
TRUNCATE TABLE inbox_messages CASCADE;
TRUNCATE TABLE job_orders CASCADE;
TRUNCATE TABLE employers CASCADE;
TRUNCATE TABLE communication_templates CASCADE;
TRUNCATE TABLE matching_runs CASCADE;
```

3. **Click "Run"** ✅

4. **Clear Storage Files:**
   - Go to **Storage** → **documents** bucket
   - Select all files (or use the "Select All" option)
   - Click **Delete**

5. **Done!** 🎉 Your database is now clean and ready for fresh data.

---

## Alternative: Use the SQL File

The SQL script is also saved at:
```
Recruitment Automation Portal (2)/backend/scripts/clear-all-data.sql
```

You can copy the contents and run it in Supabase Dashboard.

---

## What Gets Deleted?

✅ **All data from:**
- Candidates
- Documents (all types)
- Inbox messages and attachments
- Job orders and employers
- Communication logs
- All other application data

❌ **What is NOT deleted:**
- Table structure (schema)
- Indexes and constraints
- Users table (by default)
- Storage bucket structure

---

## Verify It Worked

Run this query in Supabase SQL Editor to verify:

```sql
SELECT 
  'candidates' as table_name, COUNT(*) as count FROM candidates
UNION ALL
SELECT 'documents', COUNT(*) FROM documents
UNION ALL
SELECT 'candidate_documents', COUNT(*) FROM candidate_documents;
```

All counts should be **0**.

---

## Need Help?

See `CLEAR_DATA_INSTRUCTIONS.md` for detailed instructions and troubleshooting.
