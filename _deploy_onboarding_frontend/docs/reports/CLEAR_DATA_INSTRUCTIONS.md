# Clear All Data - Instructions

This guide will help you clear all data from your database to start fresh.

## ⚠️ WARNING

**This will delete ALL data from your database:**
- All candidates
- All documents
- All inbox messages and attachments
- All job orders and employers
- All communication logs
- All storage files

**The schema and table structure will be preserved** - only the data will be deleted.

## Method 1: Using the Script (Recommended)

### Prerequisites

1. Make sure you have your Supabase credentials in `.env` file:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Navigate to the backend directory:
   ```bash
   cd "Recruitment Automation Portal (2)/backend"
   ```

3. Run the script:
   ```bash
   node scripts/clear-all-data-simple.js
   ```

### What the script does:

1. Deletes all records from these tables (in order):
   - `document_verification_logs`
   - `unmatched_documents`
   - `candidate_documents`
   - `documents`
   - `parsing_jobs`
   - `inbox_attachments`
   - `communication_log`
   - `job_candidate_matches`
   - `cv_versions`
   - `share_links`
   - `candidate_timeline`
   - `form_submissions`
   - `idempotency_keys`
   - `audit_log`
   - `candidates`
   - `inbox_messages`
   - `job_orders`
   - `employers`
   - `communication_templates`
   - `matching_runs`

2. Clears all files from the `documents` storage bucket

3. Preserves the `users` table (comment out in script if you want to clear users too)

## Method 2: Using Supabase Dashboard (Alternative)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run this SQL script:

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
-- Note: users table is NOT cleared by default
```

4. To clear storage:
   - Go to **Storage** → **documents** bucket
   - Select all files
   - Click **Delete**

## Method 3: Manual SQL (If TRUNCATE doesn't work)

If you encounter foreign key constraint issues, use DELETE instead:

```sql
-- Delete in reverse dependency order
DELETE FROM document_verification_logs;
DELETE FROM unmatched_documents;
DELETE FROM candidate_documents;
DELETE FROM documents;
DELETE FROM parsing_jobs;
DELETE FROM inbox_attachments;
DELETE FROM communication_log;
DELETE FROM job_candidate_matches;
DELETE FROM cv_versions;
DELETE FROM share_links;
DELETE FROM candidate_timeline;
DELETE FROM form_submissions;
DELETE FROM idempotency_keys;
DELETE FROM audit_log;
DELETE FROM candidates;
DELETE FROM inbox_messages;
DELETE FROM job_orders;
DELETE FROM employers;
DELETE FROM communication_templates;
DELETE FROM matching_runs;
```

## Verification

After clearing, verify the data is gone:

```sql
-- Check record counts (should all be 0)
SELECT 
  'candidates' as table_name, COUNT(*) as count FROM candidates
UNION ALL
SELECT 'documents', COUNT(*) FROM documents
UNION ALL
SELECT 'candidate_documents', COUNT(*) FROM candidate_documents
UNION ALL
SELECT 'inbox_attachments', COUNT(*) FROM inbox_attachments
UNION ALL
SELECT 'inbox_messages', COUNT(*) FROM inbox_messages;
```

## After Clearing

1. ✅ All data is deleted
2. ✅ Schema is preserved
3. ✅ You can start adding new candidates and documents
4. ✅ All endpoints will work normally with empty data

## Troubleshooting

### Error: "Cannot find path"
- Make sure you're in the correct directory
- Use absolute path: `cd "D:\falisha\Recruitment Automation Portal (2)\backend"`

### Error: "Missing SUPABASE_URL"
- Check your `.env` file exists
- Verify environment variables are set correctly
- Make sure you're using the service role key (not anon key)

### Error: "Foreign key constraint"
- The script handles this by deleting in the correct order
- If issues persist, use Method 2 (Supabase Dashboard) instead

### Storage files not deleted
- Check storage bucket permissions
- Manually delete files from Supabase Dashboard if needed

## Notes

- The `users` table is **NOT** cleared by default
- If you want to clear users too, uncomment the line in the script
- All indexes and constraints are preserved
- You may need to reset auto-increment sequences if using them
