# CRITICAL FIX: Unmatched Documents Table Schema

## Problem Found
The backend is crashing when processing CV uploads because the `unmatched_documents` table is missing required columns:
- `file_name` 
- `storage_bucket`
- `storage_path`
- `status`

**Error in Railway logs:**
```
[ERROR] [DocumentLinkService] Failed to create unmatched_documents record | 
{"error":"Could not find the 'file_name' column of 'unmatched_documents' in the schema cache"}
```

## Root Cause
Migration 013 (`013_profile_photos_and_unmatched_docs.sql`) was recreating the `unmatched_documents` table but forgot to include the columns that the application code is using.

## Solution
Run the updated migration in Supabase SQL Editor.

### Step 1: Go to Supabase SQL Editor
1. Open: https://supabase.com/dashboard/project/hncvsextwmvjydcukdwx/sql/new
2. Or login at https://app.supabase.com and navigate to SQL Editor

### Step 2: Copy the Fixed Migration
The file `backend/migrations/013_profile_photos_and_unmatched_docs.sql` has been updated with all required columns.

Copy and paste the entire content into the Supabase SQL editor.

### Step 3: Execute
Click **"Run"** button to execute the migration.

### Step 4: Verify
After running, check that no errors appear. The table should be recreated with all columns:
- ✅ id
- ✅ inbox_attachment_id
- ✅ source
- ✅ storage_bucket (CRITICAL)
- ✅ storage_path (CRITICAL)
- ✅ file_name (CRITICAL)
- ✅ document_type
- ✅ status (CRITICAL)
- ✅ needs_manual_review
- ✅ review_reasons
- ✅ extracted_cnic, extracted_email, extracted_phone, extracted_name, extracted_father_name
- ✅ reviewed_at, reviewed_by, resolution_action
- ✅ linked_candidate_id
- ✅ created_at, updated_at

## What Changed in Migration 013
**Before:** Missing critical columns (file_name, storage_bucket, storage_path, status)
**After:** Now includes all columns that the backend code expects

## Next Steps After Fix
1. The backend will automatically retry processing CVs
2. Upload a test CV file to verify it processes correctly
3. Check Railway backend logs for success: `[CVParser] Created candidate...`

## Testing
After running the migration, upload Hamna Ghouri's Resume.pdf again to test:
- ✅ CV should parse successfully
- ✅ Profile photo should extract from PDF
- ✅ Candidate should be created
- ✅ Photo should appear in candidate details

## Questions?
If migration fails, check:
1. Are you logged into the correct Supabase project? (hncvsextwmvjydcukdwx)
2. Do you have admin permissions?
3. Is the inbox_attachments table created first?
