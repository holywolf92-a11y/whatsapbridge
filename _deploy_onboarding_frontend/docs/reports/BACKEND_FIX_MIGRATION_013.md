# 🚨 URGENT FIX: Backend Database Migration

## Issue Found
**Backend deployment is failing** because the `unmatched_documents` table is missing critical columns.

**Error in logs:**
```
[ERROR] [DocumentLinkService] Failed to create unmatched_documents record | 
{"error":"Could not find the 'file_name' column of 'unmatched_documents' in the schema cache"}
```

**What this means:** CVs cannot be processed because the database table structure is incomplete.

---

## 🔧 How to Fix (2 Steps)

### Step 1: Run the Migration in Supabase

1. **Open Supabase Dashboard:**
   - Go to: https://app.supabase.com/project/hncvsextwmvjydcukdwx/sql/new
   - Or: https://supabase.com/dashboard/project/hncvsextwmvjydcukdwx/sql/new

2. **Copy the SQL migration** from:
   - File: `backend/migrations/013_profile_photos_and_unmatched_docs.sql`
   - Located in: `d:\falisha\Recruitment Automation Portal (2)\backend\migrations\`

3. **Paste into the SQL Editor** in Supabase

4. **Click "Run"** ▶️ to execute

5. **Expected Result:** No errors, migration completes successfully

---

### Step 2: Verify the Fix

The migration creates the `unmatched_documents` table with these critical columns:
- ✅ `file_name` - Filename of the document
- ✅ `storage_bucket` - Where file is stored
- ✅ `storage_path` - Path to file in storage  
- ✅ `status` - Processing status (pending_link, linked, rejected)
- ✅ Plus 15+ other columns for metadata and linking

---

## 🧪 Testing After Fix

Once migration runs successfully:

1. **Upload a test CV** to the inbox
2. **Check backend logs** for success message:
   ```
   [CVParser] Created candidate...
   ```
3. **Verify candidate appears** in the system

---

## 📊 What Changed

**Migration 013 was corrected to:**
- Keep all required columns from the old table
- Add the `file_name`, `storage_bucket`, `storage_path` columns that the backend code uses
- Include the `status` column for tracking document processing

---

## ❓ Need Help?

If the migration fails:
1. Check that you're logged into the correct Supabase project
2. Ensure you have admin permissions
3. Verify the `inbox_attachments` table exists (it should)
4. Check for any SQL syntax errors in the editor

---

## 📝 Changes Made

- ✅ Fixed migration file: `backend/migrations/013_profile_photos_and_unmatched_docs.sql`
- ✅ Committed to GitHub (commits: bdae2a9, f54ada4)
- ✅ Created this guide

**Your backend will work once this migration runs!** 🎉
