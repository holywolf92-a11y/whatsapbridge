# Profile Photo Extraction Fix - READY TO DEPLOY

## Problem Diagnosed
❌ **Profile photos are NOT being extracted from CVs** 

### Root Cause
The `python-parser` service has **WRONG Supabase credentials** in Railway environment variables:
- ❌ Wrong: `SUPABASE_SERVICE_ROLE_KEY` = fake/test key (`...EK6VwQlMX4zPY6ycGZjJFj_s9cLTnUe5VvfWJJ97i5Y`)
- ✅ Correct: `SUPABASE_SERVICE_ROLE_KEY` = production key (same as backend)

This causes **signature verification failed (403 Unauthorized)** errors when trying to upload photos to Supabase Storage.

## Solution

### ✅ What Works (Tested Locally)
1. Photo extraction code in `python-parser/main.py` is **already implemented correctly**
2. Uses PyMuPDF to extract images from first page of CV
3. Filters for profile-sized images (5KB - 1MB, jpg/png/webp)
4. Uploads to Supabase Storage: `documents/candidate_photos/{candidate_id}/profile.{ext}`
5. Returns public URL and adds to `profile_photo_url` field

**Test Results:**
- ✅ Abdullah CV has 1 image: PNG, 557KB, 1200x1800px
- ✅ Photo extracted successfully
- ✅ Photo uploaded to: `https://hncvsextwmvjydcukdwx.supabase.co/storage/v1/object/public/documents/candidate_photos/1f72d05c-1dbb-4527-9fec-4ecab315d228/profile.png`
- ✅ Candidate record updated with profile_photo_url

## Railway Deployment Steps

### 1. Update python-parser Railway Service Environment Variables

Go to Railway Dashboard → `python-parser` service → Variables → Edit:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ
```

**Important:** Make sure `SUPABASE_URL` is also correct:
```bash
SUPABASE_URL=https://hncvsextwmvjydcukdwx.supabase.co
```

### 2. Redeploy python-parser Service
After updating environment variables, Railway will automatically redeploy the service.

### 3. Re-process Abdullah CV to Test
Once deployed, trigger a re-parse of Abdullah's CV:
- Go to Inbox → Abdullah cv.pdf → Force Re-parse
- Check candidate profile to verify photo appears

## How Profile Photo Extraction Works

### Flow Diagram
```
CV Upload → python-parser/parse-cv endpoint
  ↓
extract_profile_photo_from_pdf(pdf_bytes, attachment_id)
  ↓
PyMuPDF: Open PDF → Get images from page 1
  ↓
Filter images: 5KB < size < 1MB, ext in [jpg, jpeg, png, webp]
  ↓
Select largest valid image
  ↓
upload_photo_to_supabase(image_bytes, candidate_id, ext)
  ↓
Upload to: documents/candidate_photos/{candidate_id}/profile.{ext}
  ↓
Return public URL
  ↓
Add to parsed_data['profile_photo_url']
  ↓
Worker saves to candidates.profile_photo_url
```

### Code Locations
1. **Photo extraction:** [python-parser/main.py](python-parser/main.py#L1456-L1517) - `extract_profile_photo_from_pdf()`
2. **Photo upload:** [python-parser/main.py](python-parser/main.py#L1520-L1550) - `upload_photo_to_supabase()`
3. **Integration:** [python-parser/main.py](python-parser/main.py#L1149-L1168) - Called during CV parsing

## Verification Steps

After deployment, verify photo extraction works:

1. **Check Railway Logs** (python-parser service):
```
[PHOTO_EXTRACT] candidate_id=xxx file=PDF images_found=1
[PHOTO_EXTRACT] candidate_id=xxx image_0 size=557877 ext=png
[PHOTO_EXTRACT] candidate_id=xxx image_0 action=SELECTED_PROFILE_PHOTO
[PhotoUpload] Uploading to: documents/candidate_photos/xxx/profile.png
[PhotoUpload] Success! Public URL: https://...
```

2. **Check Candidate Profile**:
   - Open candidate page
   - Profile photo should appear in header
   - URL format: `https://hncvsextwmvjydcukdwx.supabase.co/storage/v1/object/public/documents/candidate_photos/{id}/profile.png`

3. **Check Database**:
```sql
SELECT id, name, profile_photo_url 
FROM candidates 
WHERE name = 'M. Abdullah';
```

## Technical Details

### Image Extraction (PyMuPDF)
Based on research from [PyMuPDF documentation](https://pymupdf.readthedocs.io/en/latest/recipes-images.html) and [Stack Overflow](https://stackoverflow.com/questions/2693820/extract-images-from-pdf-without-resampling-in-python):

```python
import fitz  # PyMuPDF

doc = fitz.open(stream=pdf_bytes, filetype="pdf")
page = doc[0]
image_list = page.get_images(full=True)

for img_info in image_list:
    xref = img_info[0]
    base_image = doc.extract_image(xref)
    image_bytes = base_image["image"]
    image_ext = base_image["ext"]  # jpg, jpeg, png, webp, etc.
```

### Why It Was Failing
The python-parser was using a **test/fake Supabase service role key**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc19zdXBlcmFkbWluIjp0cnVlLCJpc3MiOiJzdXBhYmFzZSIsInN1YiI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MCwicm9sZSI6InN0b3JhZ2Vfc3VwZXJ1c2VyIn0.EK6VwQlMX4zPY6ycGZjJFj_s9cLTnUe5VvfWJJ97i5Y
```

This key has:
- `"is_superadmin": true` (invalid for production)
- `"sub": "00000000-0000-0000-0000-000000000000"` (placeholder)
- `"role": "storage_superuser"` (non-standard role)

When photo upload attempted, Supabase rejected it with `403 Unauthorized: signature verification failed`.

## Files Modified
- ✅ `python-parser/.env` - Updated locally with correct key (not committed - gitignored)
- ⏳ Railway `python-parser` service environment variables - **NEEDS UPDATE**

## Testing Evidence
```bash
$ python test-upload-abdullah-photo.py
Found 1 images in PDF
Image 0: ext=png, size=557,877 bytes, dims=1200x1800
  → Selected as profile photo (size: 557,877 bytes)

Uploading photo (557,877 bytes, .png)...
Upload response: UploadResponse(path='candidate_photos/1f72d05c-1dbb-4527-9fec-4ecab315d228/profile.png', ...)

Public URL: https://hncvsextwmvjydcukdwx.supabase.co/storage/v1/object/public/documents/candidate_photos/1f72d05c-1dbb-4527-9fec-4ecab315d228/profile.png

✅ Done! Photo uploaded and candidate updated.
```

## Next Steps
1. **Update Railway environment variable** (as shown above)
2. **Wait for auto-deployment** (Railway will redeploy python-parser)
3. **Test with Abdullah CV** (force re-parse or upload new CV)
4. **Verify photo appears** on candidate profile page
5. **Test with other CVs** containing photos

---

**Status:** ✅ Fix identified and tested locally | ⏳ Awaiting Railway deployment

**Photo URL:** https://hncvsextwmvjydcukdwx.supabase.co/storage/v1/object/public/documents/candidate_photos/1f72d05c-1dbb-4527-9fec-4ecab315d228/profile.png
