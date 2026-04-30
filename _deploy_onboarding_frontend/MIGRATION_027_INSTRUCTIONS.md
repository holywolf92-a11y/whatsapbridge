# Migration 027: Run Instructions

## ⚠️ Before Running

**YOU MUST CREATE STORAGE FOLDERS FIRST!**

Go to Supabase Dashboard → Storage → `candidate-documents` bucket and create these folders:
- ✅ `/educational_documents`
- ✅ `/experience_certificates`
- ✅ `/navttc_reports`

Verify existing folder:
- ✅ `/police_character_certificate`

---

## Option 1: Using PowerShell Script (Recommended)

```powershell
.\run-migration-027.ps1
```

The script will:
1. Ask for your Supabase connection details
2. Show migration summary
3. Ask for confirmation
4. Run the migration
5. Show results

---

## Option 2: Using Supabase SQL Editor (Easiest)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy-paste the contents of `backend\migrations\027_split_certificates_category.sql`
4. Click **Run** (or press Ctrl+Enter)
5. Verify you see: `✅ Successfully added 3 new document categories`

---

## Option 3: Using psql Command Line

```bash
# Set your connection details
$env:PGPASSWORD = "your-database-password"

psql "postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres" -f backend/migrations/027_split_certificates_category.sql
```

Replace:
- `db.xxxxx.supabase.co` with your Supabase database host
- `your-password` with your database password

---

## Verification Steps

After running the migration, verify it worked:

```sql
-- Check enum values were added
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'document_category_enum'::regtype
ORDER BY enumsortorder;

-- Expected output should include:
-- cv_resume
-- passport
-- cnic
-- driving_license
-- police_character_certificate
-- certificates
-- contracts
-- medical_reports
-- photos
-- other_documents
-- educational_documents       ← NEW
-- experience_certificates     ← NEW
-- navttc_reports             ← NEW
```

```sql
-- Test display function
SELECT get_document_category_display_name('educational_documents'::document_category_enum);
-- Expected: "Educational Documents"

SELECT get_document_category_display_name('experience_certificates'::document_category_enum);
-- Expected: "Experience Certificates"

SELECT get_document_category_display_name('navttc_reports'::document_category_enum);
-- Expected: "NAVTTC Reports"
```

---

## Troubleshooting

### Error: "enum value already exists"
This is **SAFE** - it means the migration was already run. The `IF NOT EXISTS` clause prevents errors.

### Error: "type document_category_enum does not exist"
Your database schema is outdated. Check if you ran previous migrations.

### Error: "permission denied"
Use a database user with `ALTER TYPE` permissions (typically `postgres` user).

---

## Rollback (If Needed)

⚠️ **WARNING**: PostgreSQL does NOT support removing enum values easily.

If you need to rollback:
1. Ensure no data uses the new enum values
2. Drop and recreate the enum type (destructive!)
3. Or simply don't use the new values

**Better approach**: If migration fails, fix the issue and re-run it.

---

## Next Steps After Migration

1. ✅ **Create Storage Folders** (see top of this file)
2. ✅ **Restart Backend Server** (`npm run dev` or redeploy)
3. ✅ **Test New Categories**
   - Upload a degree → should go to `educational_documents`
   - Upload experience letter → should go to `experience_certificates`
   - Upload NAVTTC cert → should go to `navttc_reports`
4. ✅ **Run Mandatory Multi-Document Test** (TODO 5.6)
   - Create PDF with 4 pages (degree + experience + police + NAVTTC)
   - Upload via split-upload
   - Verify it splits into 4 separate documents with correct categories

---

## Support

If you encounter issues:
1. Check migration file: `backend/migrations/027_split_certificates_category.sql`
2. Review error logs
3. Verify Supabase connection details
4. Check PostgreSQL version (must be 9.1+)
