# Photo Extraction - Phased Implementation Plan

## Overview
Fixing profile photo extraction in two phases to ensure reliability.

## Phase A: Disable Unreliable Heuristics ✅ IN PROGRESS

**Status**: Implementing now  
**Goal**: Stop extracting text regions as photos

### What Was Wrong
The Python parser used scipy-based heuristics that detected high-contrast regions as "photos" with false confidence. Example: Dr. Rasheed Ahmed's CV extracted text ("competent electrotherapy hospital...") instead of his actual face photo.

### Changes Made
**File**: `python-parser/main.py` (line ~1161)
```python
# DISABLED: Heuristic photo extraction  
profile_photo_url = None  # Temporarily disabled
```

### Fallback System
Backend AI extraction (OpenAI Vision API) will handle all photo extraction:
- **Location**: `backend/src/workers/cvParserWorker.ts` (lines 598-623)
- **Method**: `extractProfilePhotoFromPdfUsingAI()`
- **Technology**: OpenAI GPT-4 Vision API
- **Accuracy**: Much higher than heuristics

### Deployment
1. Commit changes to `python-parser/main.py`
2. Push to `holywolf92-a11y/recruitment-portal-python-parser`
3. Railway auto-deploys Python parser service
4. All new CV uploads will skip heuristic extraction
5. Backend AI will be the only extraction method

---

## Phase C: Install Real Face Detection 📋 PLANNED

**Status**: Not started  
**Goal**: Re-enable Python parser extraction with real ML-based face detection

### Option 1: face-recognition Library (Recommended)
**Pros:**
- Pure Python, works headless
- Uses dlib HOG/CNN face detection
- Simple API: `face_recognition.face_locations(image)`
- No OpenCV GUI dependencies

**Installation:**
```txt
# Add to python-parser/requirements.txt
face-recognition>=1.3.0
dlib>=19.24.0
```

**Implementation:**
```python
import face_recognition
from PIL import Image

def extract_profile_photo_from_pdf(pdf_content: bytes, attachment_id: str):
    # Render PDF page to image
    img_array = np.array(pil_image)
    
    # Detect faces with real ML
    face_locations = face_recognition.face_locations(img_array, model="hog")
    
    if not face_locations:
        return None
    
    # Crop first (best) face
    top, right, bottom, left = face_locations[0]
    face_img = pil_image.crop((left, top, right, bottom))
    
    # Upload and return signed URL
    return upload_photo_to_supabase(face_img_bytes, attachment_id)
```

### Option 2: MediaPipe (Original Plan - Had Issues)
**Cons:**
- Previously caused deployment crashes
- Pulls opencv-python GUI version
- Requires X11 libraries on server

**Status**: Not recommended unless deployment environment changes

### Option 3: OpenCV Haar Cascade
**Pros:**
- Lightweight, no ML dependencies
- Built into opencv-python-headless

**Cons:**
- Less accurate than modern ML
- Many false positives/negatives
- Already tried, didn't work well

### Recommended Approach: Option 1
1. Install `face-recognition` in Python parser
2. Update `extract_profile_photo_from_pdf()` to use real face detection
3. Test with 10-20 sample CVs
4. Deploy to Railway staging first
5. Monitor extraction success rate
6. If >80% success, deploy to production
7. Keep backend AI as fallback for failures

### Success Metrics
- **Face detection accuracy**: >90%
- **No text regions extracted**: 0 false positives
- **Photo quality**: All extracted photos pass blur/brightness checks
- **Deployment stability**: No crashes or dependency errors

### Timeline
- **Estimated time**: 2-4 hours implementation + testing
- **Testing**: 1-2 days monitoring
- **Rollout**: Gradual over 1 week

---

## Current State (After Phase A)

### Photo Extraction Flow
```
CV Upload
    ↓
Python Parser: TEXT ONLY (photo extraction disabled)
    ↓
Backend Worker: Receives parsed data WITHOUT photo_url
    ↓
Backend AI: Detects no photo, triggers extractProfilePhotoFromPdfUsingAI()
    ↓
OpenAI Vision: Analyzes PDF, locates face, extracts photo
    ↓
Database: Saves signed photo URL to candidates.profile_photo_url
    ↓
Frontend: Displays extracted photo
```

### Files Modified (Phase A)
- ✅ `python-parser/main.py` (line 1161) - Disabled heuristic extraction
- ✅ `backend/src/services/candidateService.ts` (lines 199-220, 760-779) - Accept CV-extracted photos

### Files to Modify (Phase C)
- `python-parser/requirements.txt` - Add face-recognition library
- `python-parser/main.py` - Replace heuristics with real face detection
- Test with sample CVs

---

## Migration Notes

### Existing Candidates with Bad Photos
Some candidates may have text regions as "photos" from before Phase A. Options:
1. **Manual fix**: Re-upload their CVs to trigger new extraction
2. **Batch fix**: Run script to re-extract photos for all candidates
3. **Leave as-is**: Only fix going forward

### Database Cleanup Query
```sql
-- Find candidates with potentially bad photos (very old URLs)
SELECT 
  id, 
  name, 
  profile_photo_url,
  created_at
FROM candidates
WHERE profile_photo_url IS NOT NULL
  AND created_at < '2026-02-03' -- Before fix was deployed
ORDER BY created_at DESC;
```

---

**Last Updated**: Feb 3, 2026, 10:25 PM GMT+5  
**Status**: Phase A in progress, Phase C planned
