# 🔍 Photo Issue Diagnosis - Muhammad Usman

## Current Status

### ✅ **Deployments:**
- **Python Parser:** Online, commit `e3973f0` (JPEG fix deployed)
- **Backend:** Online, commit `033e953` (JPEG handling deployed)
- **Services:** Both healthy and running

### ❓ **Issue:**
Photo still not appearing after:
1. Uploading Muhammad Usman's documents again
2. Approving the photo again

---

## 🧪 **Diagnostic Steps**

### **Step 1: Check What Was Actually Uploaded**

Run this SQL in Supabase to see the most recent upload:

```sql
-- Check Muhammad Usman's latest documents
SELECT 
  d.id,
  d.file_name,
  d.category,
  d.storage_path,
  d.mime_type,
  d.verification_status,
  d.created_at,
  c.profile_photo_url
FROM candidate_documents d
JOIN candidates c ON c.id = d.candidate_id
WHERE c.name ILIKE '%MUHAMMAD USMAN%'
  AND d.category = 'photos'
ORDER BY d.created_at DESC
LIMIT 3;
```

**What to look for:**
- ✅ **If `mime_type = 'image/jpeg'` and `storage_path` ends with `.jpg`**: Fix is working! ✨
- ❌ **If `mime_type = 'application/pdf'` and `storage_path` ends with `.pdf`**: Old code still being used
- ❓ **If no rows found**: Document wasn't categorized as 'photos'

---

### **Step 2: Check Upload Timestamp**

```sql
-- Check when the document was uploaded
SELECT 
  file_name,
  storage_path,
  mime_type,
  created_at,
  NOW() - created_at as "time_ago"
FROM candidate_documents
WHERE candidate_id = '1260d8ea-03cf-4acc-b069-61f576229bcc'
  AND category = 'photos'
ORDER BY created_at DESC
LIMIT 1;
```

**What this tells us:**
- If `created_at` is **before** our deployment (~20:30 UTC): Old code was used
- If `created_at` is **after** our deployment: New code should have been used

---

### **Step 3: Check cv_inbox_attachments**

```sql
-- Check the processing status
SELECT 
  id,
  file_name,
  status,
  error_message,
  created_at,
  processed_at
FROM cv_inbox_attachments
WHERE candidate_id = '1260d8ea-03cf-4acc-b069-61f576229bcc'
ORDER BY created_at DESC
LIMIT 3;
```

**What to look for:**
- ✅ `status = 'completed'`: Processing finished
- ⏳ `status = 'processing'`: Still working
- ❌ `status = 'failed'`: Something went wrong (check `error_message`)

---

## 🎯 **Possible Scenarios**

### **Scenario A: Railway Deployment Lag** ⏳
**Symptoms:**
- Upload was created AFTER commit but BEFORE Railway finished deploying
- Still seeing `.pdf` files

**Solution:**
- Wait 2-3 more minutes for Railway deployment
- Upload again to test with fully deployed code

---

### **Scenario B: Document Not Categorized as 'photos'** 📄
**Symptoms:**
- No documents found with `category = 'photos'`
- Photo went to `other_documents` category instead

**Why this happens:**
- OpenAI Vision confidence < 88%
- Photo embedded in CV differently
- Document structure confused the AI

**Solution:**
- Check `other_documents` category:
  ```sql
  SELECT file_name, storage_path, mime_type
  FROM candidate_documents
  WHERE candidate_id = '1260d8ea-03cf-4acc-b069-61f576229bcc'
    AND category = 'other_documents'
    AND (file_name ILIKE '%photo%' OR file_name ILIKE '%pic%')
  ORDER BY created_at DESC;
  ```

---

### **Scenario C: Old Document Still Referenced** 🔗
**Symptoms:**
- New `.jpg` document exists
- But `candidates.profile_photo_url` still points to old `.pdf`

**Why this happens:**
- Quick approve logic updated the `profile_photo_url`
- But it used the OLD document (PDF), not the NEW one (JPEG)

**Solution:**
- Find the NEW photo document ID
- Run quick approve again on the NEW document
- This will update `profile_photo_url` to point to the JPEG

---

### **Scenario D: Fix Not Yet Deployed** 🚧
**Symptoms:**
- ALL recent uploads still show `.pdf`
- Railway deployment still in progress

**Solution:**
- Check Railway dashboard for deployment status
- Wait for green "Deployed" status
- Then upload again

---

## 🛠️ **Immediate Actions**

### **1. Run Diagnostic SQL** (do this first!)
```sql
-- Single query to check everything
SELECT 
  'Latest Photo Document' as info,
  d.file_name,
  d.storage_path,
  d.mime_type,
  d.verification_status,
  d.created_at,
  c.profile_photo_url as candidate_photo_url,
  CASE 
    WHEN d.mime_type = 'image/jpeg' THEN '✅ JPEG (FIXED!)'
    WHEN d.mime_type = 'application/pdf' THEN '❌ PDF (OLD CODE)'
    ELSE '❓ Unknown'
  END as status
FROM candidate_documents d
JOIN candidates c ON c.id = d.candidate_id
WHERE c.name ILIKE '%MUHAMMAD USMAN%'
  AND d.category = 'photos'
ORDER BY d.created_at DESC
LIMIT 1;
```

### **2. Based on Results:**

**If Result = ✅ JPEG:**
- Fix is working!
- Check if `candidate_photo_url` matches the JPEG `storage_path`
- If not, approve the photo again to update the URL

**If Result = ❌ PDF:**
- Railway deployment may still be in progress
- Upload a NEW document to test (don't reprocess old ones)
- Check Railway dashboard

**If Result = No rows:**
- Photo went to `other_documents` instead of `photos`
- Need to check why AI categorization failed
- May need to adjust AI confidence threshold

---

## 📊 **Next Steps**

Please share the results of the diagnostic SQL query, and I'll tell you exactly what's wrong and how to fix it! 🔍

---

**Quick Test:**
Upload a NEW CV (not Muhammad Usman's - use a different candidate) with a photo and see if THAT one works. This will confirm if the fix is deployed.
