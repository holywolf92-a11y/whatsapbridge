# 🔧 Profile Photo Extraction - Complete Fix

## ✅ **ROOT CAUSE IDENTIFIED**

Profile pictures are **NOT being extracted** from CVs because:

1. **MediaPipe was removed** from `python-parser/requirements.txt` on Feb 3, 2026 (today)
2. The removal was necessary to prevent parser crashes (MediaPipe pulled opencv-python GUI version)
3. Photo extraction in Python parser now **fails gracefully** and returns `None`
4. The backend's AI-based fallback may not be triggering correctly

## 📊 Current System State

### Python Parser Status
```
✅ CV text extraction: WORKING
✅ OpenAI Vision parsing: WORKING  
✅ Document categorization: WORKING
❌ Profile photo extraction: DISABLED (returns None)
```

### Backend Worker Status
```
✅ CV processing: WORKING
✅ Candidate creation: WORKING
⚠️  AI photo extraction fallback: MAY NOT BE TRIGGERING
```

## 🎯 Recommended Solution

Since the Python parser photo extraction is **intentionally disabled** to prevent crashes, we should:

### **Option 1: Enable Backend AI Photo Extraction (Recommended)**

The backend already has a sophisticated AI-based photo extraction system using OpenAI Vision API. Ensure it's working correctly:

**File**: `backend/src/workers/cvParserWorker.ts` (lines 598-623)

**Current logic**:
```typescript
// Lines 598-623
if (newCandidate?.id && mimeType === 'application/pdf') {
  try {
    const { data: freshCandidate } = await db
      .from('candidates')
      .select('profile_photo_bucket, profile_photo_path, profile_photo_url, photo_received')
      .eq('id', newCandidate.id)
      .maybeSingle();

    if (!hasProfilePhoto(freshCandidate)) {
      console.log(`[CVParser] No profile photo found for candidate ${newCandidate.id}. Extracting from CV PDF...`);
      const extraction = await extractProfilePhotoFromPdfUsingAI({
        candidateId: newCandidate.id,
      });
      console.log(`[CVParser] ✅ Extracted profile photo from CV PDF`, {
        candidateId: newCandidate.id,
        pageUsed: extraction.pageUsed,
        confidence: extraction.confidence,
      });
    }
  } catch (photoErr: any) {
    console.warn(`[CVParser] CV photo extraction failed:`, photoErr?.message);
  }
}
```

**Why it might not be working**:
1. The check `if (!hasProfilePhoto(freshCandidate))` might be **incorrectly detecting** existing photos
2. The `extractProfilePhotoFromPdfUsingAI` might be throwing errors silently
3. The candidate document might not be available yet

### **Option 2: Use Alternative Face Detection Library**

Replace MediaPipe with a lightweight, headless-compatible alternative:

#### Install `face-recognition` (Python)
```bash
# Add to python-parser/requirements.txt
face-recognition>=1.3.0
```

This library works headless and doesn't require OpenCV GUI.

#### Update `extract_profile_photo_from_pdf` function
```python
import face_recognition
from PIL import Image

def extract_profile_photo_from_pdf(pdf_content: bytes, attachment_id: str) -> Optional[str]:
    try:
        # Render PDF to image
        pdf_document = fitz.open(stream=pdf_content, filetype="pdf")
        first_page = pdf_document[0]
        pix = first_page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img_data = pix.tobytes("png")
        pil_img = Image.open(io.BytesIO(img_data))
        pdf_document.close()
        
        # Convert to numpy array for face_recognition
        img_array = np.array(pil_img)
        
        # Detect faces
        face_locations = face_recognition.face_locations(img_array)
        
        if not face_locations:
            logger.info(f"[PHOTO_EXTRACT] No faces detected for {attachment_id}")
            return None
        
        # Get the first (usually largest/best) face
        top, right, bottom, left = face_locations[0]
        
        # Crop with padding
        padding = 50
        face_img = pil_img.crop((
            max(0, left - padding),
            max(0, top - padding),
            min(pil_img.width, right + padding),
            min(pil_img.height, bottom + padding)
        ))
        
        # Resize to 512x512
        face_img = face_img.resize((512, 512), Image.Resampling.LANCZOS)
        
        # Convert to JPEG bytes
        buffer = BytesIO()
        face_img.save(buffer, format='JPEG', quality=95)
        photo_bytes = buffer.getvalue()
        
        # Upload to Supabase
        photo_url = upload_photo_to_supabase(photo_bytes, attachment_id, "jpg")
        return photo_url
        
    except Exception as e:
        logger.warning(f"[PHOTO_EXTRACT] Failed: {e}")
        return None
```

### **Option 3: Rely Solely on Backend AI Extraction (Simplest)**

1. **Remove** photo extraction entirely from Python parser
2. **Ensure** backend AI extraction always runs and works correctly
3. **Benefit**: No dependency issues, most reliable

## 🔨 Immediate Fix (Quick Win)

Let's verify the backend AI extraction is working and fix any issues:

### Step 1: Check if AI extraction is being called

Add debugging logs to see if the code path is executed:

```typescript
// In cvParserWorker.ts around line 600
console.log(`[CVParser] DEBUG - Checking photo extraction for candidate ${newCandidate.id}`, {
  hasFreshCandidate: !!freshCandidate,
  photo_received: freshCandidate?.photo_received,
  profile_photo_bucket: freshCandidate?.profile_photo_bucket,  
  profile_photo_path: freshCandidate?.profile_photo_path,
  profile_photo_url: freshCandidate?.profile_photo_url,
  hasProfilePhoto: hasProfilePhoto(freshCandidate),
});
```

### Step 2: Verify the AI extraction service works

Test the `extractProfilePhotoFromPdfUsingAI` function directly:

```typescript
// backend/test-photo-extraction.ts
import { extractProfilePhotoFromPdfUsingAI } from './src/services/aiProfilePhotoExtractionService';

async function test() {
  try {
    const result = await extractProfilePhotoFromPdfUsingAI({
      candidateId: 'YOUR_CANDIDATE_ID',
      documentId: 'OPTIONAL_DOCUMENT_ID',
    });
    console.log('✅ Photo extraction successful:', result);
  } catch (error) {
    console.error('❌ Photo extraction failed:', error);
  }
}

test();
```

### Step 3: Check OpenAI API configuration

Ensure these environment variables are set in Railway:
```env
OPENAI_API_KEY=sk-...
```

### Step 4: Monitor logs

Watch for these log messages:
```bash
# Success
[CVParser] No profile photo found for candidate XXX. Extracting from CV PDF...
[CVParser] ✅ Extracted profile photo from CV PDF

# Failure  
[CVParser] CV photo extraction failed: <error message>
```

## 📋 Testing Plan

### Test 1: Upload a New CV
```bash
# Upload a CV with a clear profile photo
curl -X POST http://localhost:3000/api/inbox/upload \
  -F "file=@test-cv-with-photo.pdf" \
  -F "source=web"
```

**Expected Result**:
- CV gets parsed ✅
- Candidate created ✅
- Backend AI photo extraction runs ✅
- Photo appears in `candidates.profile_photo_url` ✅

### Test 2: Check Database
```sql
-- Check recent candidates
SELECT 
  id,
  name,
  profile_photo_url,
  created_at
FROM candidates
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Test 3: Verify Backend Logs
```bash
# Check backend logs
railway logs --service backend

# Look for:
# "[CVParser] Extracting from CV PDF..."
# "[CVParser] ✅ Extracted profile photo"
```

## 🚀 Long-Term Solution

Once the immediate fix is working, consider:

1. **Add automated photo quality checks** in backend
2. **Implement retry logic** if first extraction fails
3. **Add manual photo upload** option in UI
4. **Store extraction metadata** (confidence, method used, etc.)

## 📊 Success Metrics

After implementing the fix, monitor:

```sql
-- Photo extraction rate
SELECT 
  COUNT(*) FILTER (WHERE profile_photo_url IS NOT NULL) * 100.0 / COUNT(*) as photo_rate_percent,
  COUNT(*) as total_candidates,
  COUNT(*) FILTER (WHERE profile_photo_url IS NOT NULL) as candidates_with_photos
FROM candidates
WHERE created_at > NOW() - INTERVAL '7 days';

-- Recent extractions
SELECT 
  candidate_code,
  name,
  profile_photo_url IS NOT NULL as has_photo,
  created_at
FROM candidates
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 20;
```

## ⚠️ Important Notes

1. **Python parser photo extraction is intentionally disabled** - don't try to re-enable MediaPipe
2. **Backend AI extraction is the only working method** - ensure it's functioning
3. **Check Railway environment variables** - OPENAI_API_KEY must be set
4. **Monitor costs** - OpenAI Vision API costs money per image

## 🎯 Next Steps

1. ✅ **Verify** backend AI extraction is being called (add debug logs)
2. ✅ **Test** with a sample CV that has a clear photo
3. ✅ **Monitor** logs to see if extraction succeeds
4. ✅ **Fix** any errors in the extraction service
5. ✅ **Document** the working solution

---

**Status**: Ready for implementation  
**Priority**: High  
**Estimated Time**: 1-2 hours
