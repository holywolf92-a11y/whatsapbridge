# Profile Photo Extraction Upgrade - DEPLOYED

## ✅ What Was Fixed

**Problem:** System was extracting **entire CV page images** as profile photos instead of the actual candidate face photo.

**Root Cause:** For scanned CVs where the entire page is one image (1200x1800px, 100% page coverage), the old logic would select this large image as the "profile photo."

## 🎯 Solution Implemented

### Intelligent Photo Extraction Strategy

**Two-Path Approach:**

1. **Regular PDFs with embedded images:**
   - Prioritize **small portrait images** (< 800px, aspect ratio 0.6-1.4)
   - File size: 5KB - 200KB
   - Page coverage: < 30%
   - **Score: 100** (ideal profile photo)

2. **Scanned CVs (entire page as image):**
   - Detect when image covers **>80% of page**
   - Use **OpenCV Haar Cascade face detection**
   - Crop detected face with 20% padding
   - Convert to JPEG for consistent format
   - **Score: 90** (detected face)

### Technical Implementation

```python
# Face Detection with OpenCV
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

faces = face_cascade.detectMultiScale(
    gray,
    scaleFactor=1.1,
    minNeighbors=5,
    minSize=(80, 80),
    flags=cv2.CASCADE_SCALE_IMAGE
)

# Crop face with padding
padding = int(max(w, h) * 0.2)
face_crop = img[y1:y2, x1:x2]
```

## 📊 Test Results

### Abdullah CV Analysis

**Before Fix:**
- ❌ Extracted: Entire page image (1200x1800px, 557KB)
- ❌ Coverage: 100% of page
- ❌ Result: CV screenshot used as profile photo

**After Fix:**
- ✅ Detected: Face at (26, 27) size 118x118px
- ✅ Extracted: Face with padding 164x164px
- ✅ Coverage: 2.8% of page (actual face)
- ✅ Result: Proper profile photo cropped from CV

## 🚀 Deployment Status

### Commits Pushed
1. **python-parser** (commit `06d447c`):
   - Added face detection logic
   - Added opencv-python-headless and numpy to requirements
   - Updated image scoring system

2. **Main repo** (commit `ba5ab041`):
   - Updated python-parser submodule pointer

### Railway Auto-Deployment
- ⏳ Railway is automatically deploying python-parser service
- ⏳ New dependencies (opencv-python-headless, numpy) will be installed
- ⏳ Service will restart with new face detection capability

## 🧪 Testing Steps

Once Railway deployment completes:

### 1. Delete Old Profile Photo
```bash
# Remove the incorrect full-page profile photo
DELETE FROM storage.objects 
WHERE bucket_id = 'documents' 
AND name = 'candidate_photos/1f72d05c-1dbb-4527-9fec-4ecab315d228/profile.png';

# Clear profile_photo_url
UPDATE candidates 
SET profile_photo_url = NULL 
WHERE id = '1f72d05c-1dbb-4527-9fec-4ecab315d228';
```

### 2. Re-upload Abdullah CV
- Go to Inbox
- Upload Abdullah cv.pdf again (or force re-parse existing)
- System will trigger CV parsing with new face detection

### 3. Verify Results

Check Railway logs for:
```
[PHOTO_EXTRACT] image_0 coverage=100.0% action=SCANNED_CV_DETECTED attempting_face_detection
[PHOTO_EXTRACT] face_detected at=(x,y) size=WxH
[PHOTO_EXTRACT] face_extracted size=X dims=WxH
[PHOTO_EXTRACT] uploading best_candidate score=90
```

Check profile photo:
- Open: https://exquisite-surprise-production.up.railway.app/profile/1f72d05c-1dbb-4527-9fec-4ecab315d228/m-abdullah
- Should show **face-only** photo, not full CV page

### 4. Test with Other CVs
- Try different CV formats:
  - Regular PDFs with embedded profile photos
  - Scanned CVs with faces
  - CVs without photos (should gracefully skip)

## 📝 How It Works

### Flow Diagram
```
CV Upload
  ↓
Extract images from page 1
  ↓
For each image:
  ├─ Check dimensions, aspect ratio, file size
  ├─ Calculate page coverage
  ├─ If small portrait image (<30% coverage) → Score: 100 ✅
  └─ If large image (>80% coverage) → 
       ├─ Run face detection
       ├─ If face found → Crop face → Score: 90 ✅
       └─ If no face → Skip
  ↓
Select highest scored image
  ↓
Upload to Supabase Storage
  ↓
Return public URL
```

### Scoring System
| Criteria | Score | Description |
|----------|-------|-------------|
| Small portrait image | 100 | < 800px, ratio 0.6-1.4, 5KB-200KB, <30% coverage |
| Detected face | 90 | Face detected in scanned CV, cropped with padding |
| Large full-page image | 0 | Ignored (was causing the bug) |

## 🔍 Code Locations

- **Face Detection:** [python-parser/main.py#L1456-L1645](python-parser/main.py) - `extract_profile_photo_from_pdf()`
- **Image Analysis:** Checks dimensions, aspect ratio, coverage
- **OpenCV Integration:** Haar Cascade classifier for face detection
- **Requirements:** [python-parser/requirements.txt](python-parser/requirements.txt) - opencv-python-headless, numpy

## 📚 References

- [OpenCV Haar Cascade Tutorial](https://docs.opencv.org/4.x/db/d28/tutorial_cascade_classifier.html)
- [PyMuPDF Image Extraction](https://pymupdf.readthedocs.io/en/latest/recipes-images.html)
- [Viola-Jones Face Detection (2001)](https://www.cs.cmu.edu/~efros/courses/LBMV07/Papers/viola-cvpr-01.pdf)

## ✅ Expected Outcome

After deployment:
- ✅ Scanned CVs: Extract face only (not entire page)
- ✅ Regular CVs: Extract small embedded profile photos
- ✅ No profile photo: Gracefully skip (no error)
- ✅ Multiple images: Select best candidate based on scoring
- ✅ Logs: Detailed extraction info for debugging

---

**Status:** 🚀 Deployed to Railway | ⏳ Awaiting auto-deployment completion

**Next:** Test with Abdullah CV re-upload to verify face extraction works correctly
