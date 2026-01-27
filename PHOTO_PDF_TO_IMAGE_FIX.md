# 🎯 Production Fix: Photos as JPEG Images (Not PDFs)

## Problem Summary

**Before:** Photos extracted from CVs were stored as PDF files, causing display issues in:
- ❌ Candidate cards (can't display PDF in `<img>` tag)
- ❌ Generated CVs (Puppeteer can't embed PDFs as images)
- ❌ Embassy documents (PDFs not accepted as passport photos)
- ❌ Excel exports (can't embed PDF photos)

**After:** Photos are now extracted and stored as high-quality JPEG images:
- ✅ Display correctly in all UI components
- ✅ Embed properly in generated CVs
- ✅ Work with embassy document requirements
- ✅ Export correctly to Excel/CSV

---

## Implementation Details

### **1. Python Parser Changes**

**File:** `recruitment-portal-python-parser/split_and_categorize.py`

**Added Function:**
```python
def extract_photo_as_jpeg(img_bytes: bytes) -> bytes:
    """
    Convert image to high-quality JPEG for photo documents.
    Returns JPEG bytes suitable for direct storage and display.
    """
    from PIL import Image
    
    pil = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    buf = io.BytesIO()
    pil.save(buf, format="JPEG", quality=95, optimize=True)
    buf.seek(0)
    return buf.getvalue()
```

**Updated Function:**
```python
def _append_doc(..., image_bytes: bytes | None = None) -> None:
    """
    For 'photos' category, saves as JPEG instead of PDF.
    """
    if doc_type == "photos" and image_bytes:
        jpeg_bytes = extract_photo_as_jpeg(image_bytes)
        documents.append({
            ...
            "pdf_base64": base64.b64encode(jpeg_bytes).decode("utf-8"),
            "is_image": True,
            "mime_type": "image/jpeg",
        })
    else:
        # Standard PDF handling
        documents.append({
            ...
            "pdf_base64": base64.b64encode(pdf_bytes).decode("utf-8"),
            "is_image": False,
            "mime_type": "application/pdf",
        })
```

**All 6 call sites updated** to pass `image_bytes` parameter.

---

### **2. Backend Changes**

**File:** `recruitment-portal-backend/src/services/splitUploadService.ts`

**Updated Interface:**
```typescript
export interface SplitDoc {
  doc_type: string;
  pages: number[];
  // ... other fields ...
  pdf_base64: string;  // Actually contains JPEG for photos!
  is_image?: boolean;  // True for photos
  mime_type?: string;  // 'image/jpeg' for photos, 'application/pdf' for others
}
```

**Updated Upload Logic:**
```typescript
async function uploadOneSplitDoc(...) {
  const isImage = doc.is_image === true;
  const mimeType = doc.mime_type || (isImage ? 'image/jpeg' : 'application/pdf');
  const ext = isImage ? 'jpg' : 'pdf';  // Use .jpg for photos!
  const storagePath = `${candidateId}/${folder}/${ts}_${uploadId}_${pages}.${ext}`;

  await db.storage.from(STORAGE_BUCKET).upload(storagePath, fileBuffer, {
    contentType: mimeType,  // Correct MIME type
    upsert: false,
  });

  await db.from('documents').insert({
    ...
    mime_type: mimeType,  // Stored in DB
  });
}
```

---

## File Structure Change

### Before (Broken):
```
candidates/
  <uuid>/
    other_documents/
      1769544025868_..._pages_1.pdf  ← Photo stored as PDF ❌
```

### After (Fixed):
```
candidates/
  <uuid>/
    other_documents/
      1769544025868_..._pages_1.jpg  ← Photo stored as JPEG ✅
```

---

## Database Schema

**Table:** `candidate_documents`

| Column | Type | Example Value |
|--------|------|---------------|
| `storage_path` | text | `candidates/.../other_documents/...pages_1.jpg` |
| `mime_type` | text | `image/jpeg` (for photos) |
| `category` | text | `photos` |

**Important:** Old documents have `mime_type: 'application/pdf'`, new ones have `'image/jpeg'`.

---

## Deployment Steps

### **Step 1: Deploy Python Parser**
```bash
cd recruitment-portal-python-parser
git add split_and_categorize.py
git commit -m "Production fix: Extract photos as JPEG images instead of PDF"
git push
```

Railway will auto-deploy the Python parser.

### **Step 2: Deploy Backend**
```bash
cd recruitment-portal-backend
git add src/services/splitUploadService.ts
git commit -m "Production fix: Handle photo documents as JPEG images"
git push
```

Railway will auto-deploy the backend.

### **Step 3: Verify Deployment**
- Check Railway logs for both services
- Ensure no build errors
- Wait for services to come online

---

## Testing

### **Test 1: Upload New CV with Photo**
1. Upload a CV containing a photo
2. Check `candidate_documents` table:
   ```sql
   SELECT file_name, storage_path, mime_type, category
   FROM candidate_documents
   WHERE category = 'photos'
   ORDER BY created_at DESC
   LIMIT 5;
   ```
3. **Expected:** `mime_type` = `'image/jpeg'`, `storage_path` ends with `.jpg`

### **Test 2: Display Photo in UI**
1. Open candidate card
2. **Expected:** Photo displays correctly (not broken image)

### **Test 3: Download Employer CV**
1. Click "Download CV" for candidate with photo
2. **Expected:** CV shows photo properly embedded

### **Test 4: Verify Supabase Storage**
1. Check Supabase Storage bucket `documents`
2. Navigate to `candidates/<uuid>/other_documents/`
3. **Expected:** New photos are `.jpg` files, not `.pdf`

---

## Handling Existing Photos (Migration)

**Old photos** (stored as PDFs) will continue to exist until reprocessed.

### **Option 1: Automatic Reprocessing**
When users upload a new CV for an existing candidate, photos will be re-extracted as JPEG.

### **Option 2: Manual Reprocessing**
Create a migration script to:
1. Find all `candidate_documents` where `category = 'photos'` and `mime_type = 'application/pdf'`
2. Download PDF from storage
3. Extract first page as JPEG
4. Re-upload as `.jpg`
5. Update `storage_path` and `mime_type` in DB
6. Delete old PDF

**Note:** This migration is **optional** - new uploads will work correctly without it.

---

## Rollback Plan

If issues arise:

1. **Python Parser:** Revert `split_and_categorize.py` to previous version
2. **Backend:** Revert `splitUploadService.ts` to previous version
3. Re-deploy both services

**Impact:** Photos will go back to being PDFs (broken state).

---

## Benefits

✅ **Production-Grade**: Standard image formats (JPEG)
✅ **Universal Compatibility**: Works everywhere (UI, PDF generation, exports)
✅ **Performance**: No conversion overhead at runtime
✅ **Scalable**: One-time fix, all future uploads work correctly
✅ **Standards Compliant**: Follows best practices for photo storage

---

## Related Files

**Python Parser:**
- `recruitment-portal-python-parser/split_and_categorize.py`

**Backend:**
- `recruitment-portal-backend/src/services/splitUploadService.ts`
- `recruitment-portal-backend/src/services/cvGeneratorService.ts` (uses `profile_photo_url`)
- `recruitment-portal-backend/src/controllers/quickApproveController.ts` (sets `profile_photo_url`)

**Frontend:**
- `recruitment-portal-frontend/src/components/CandidateManagement_ENHANCED.tsx` (displays photos)
- `recruitment-portal-frontend/src/components/CandidateBrowserExcel.tsx` (displays photos)

---

## Version

**Template Version:** Photo-to-JPEG v1.0.0
**Date:** 2026-01-28
**Status:** ✅ Production-Ready
