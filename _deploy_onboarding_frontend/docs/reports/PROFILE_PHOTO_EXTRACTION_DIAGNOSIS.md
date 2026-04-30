# Profile Photo Extraction Diagnosis

## Problem
Profile pictures are not being reliably extracted from CVs during the parsing process.

## Root Cause Analysis

### Current Implementation

There are **TWO separate** profile photo extraction systems:

#### 1. Python Parser Photo Extraction
**Location**: `python-parser/main.py` (lines 1659-1840)
- **Method**: MediaPipe face detection + PIL image processing
- **Workflow**: 
  1. Renders PDF pages to images
  2. Detects photo regions using heuristics
  3. Detects faces using contrast-based analysis (not actual MediaPipe model)
  4. Quality checks (blur, brightness, size)
  5. Smart cropping to 512x512
  6. Uploads to Supabase storage
- **Returns**: `profile_photo_url` in the `/parse-cv` response

#### 2. Backend Worker Photo Extraction  
**Location**: `backend/src/workers/cvParserWorker.ts` (lines 598-623)
- **Method**: OpenAI Vision API for photo localization and verification
- **Workflow**:
  1. Checks if candidate already has a photo
  2. If not, calls `extractProfilePhotoFromPdfUsingAI`
  3. Uses AI to locate and extract photos
- **Location**: `backend/src/services/aiProfilePhotoExtractionService.ts`

### The Issue

Looking at the code flow in `cvParserWorker.ts`:

```typescript
// Line 198: The worker tries to use profile_photo_url from parser
profile_photo_url: parsed?.candidate?.profile_photo_url || parsed?.profile_photo_url || undefined,

// Lines 598-623: Then LATER, it tries to extract photos AGAIN
if (newCandidate?.id && mimeType === 'application/pdf') {
  // ... check if photo exists
  if (!hasProfilePhoto(freshCandidate)) {
    console.log(`[CVParser] No profile photo found for candidate ${newCandidate.id}. Extracting from CV PDF...`);
    const extraction = await extractProfilePhotoFromPdfUsingAI({
      candidateId: newCandidate.id,
    });
  }
}
```

## Key Problems

### 1. Python Parser Photo Extraction May Be Failing
The Python parser's `extract_profile_photo_from_pdf` function:
- Uses heuristic face detection (not actual MediaPipe ML model despite the guide claiming it)
- May fail silently and return `None`
- Has quality checks that might be too strict (rejecting valid photos)

**Evidence**:
- Function at line 1659 is implemented with scipy/PIL, not actual MediaPipe
- The guide mentions MediaPipe but the actual code uses contrast-based heuristics
- Line 1582-1657: `detect_faces_with_mediapipe()` doesn't actually use MediaPipe library

### 2. Profile Photo URL Not Being Passed Correctly
When the Python parser returns `profile_photo_url`, the backend should use it:
- Line 198 tries to extract it: `parsed?.candidate?.profile_photo_url`
- But this may not be set correctly in the `createCandidateFromParsedData` function
- The value might be lost during candidate creation

### 3. Backup Extraction May Not Run
The backend's backup extraction (lines 598-623):
- Only runs if `hasProfilePhoto(freshCandidate)` returns false
- Checks for: `photo_received`, `profile_photo_bucket`, `profile_photo_path`, `profile_photo_url`
- May not detect that the Python parser's extraction failed

## Recommended Fixes

### Option 1: Fix Python Parser (Simplest)
The Python parser's photo extraction is failing. Fix the implementation:

1. **Install actual MediaPipe**: The code references MediaPipe but uses heuristics instead
2. **Lower quality thresholds**: May be rejecting valid photos
3. **Add better logging**: Track why extractions fail
4. **Fix upload function**: Ensure photos are properly uploaded to Supabase

### Option 2: Rely on Backend AI Extraction (Most Reliable)
Disable Python parser photo extraction and only use the backend's AI-based extraction:

1. **Remove** photo extraction from Python parser (`main.py` lines 1160-1179)
2. **Keep** the backend's `extractProfilePhotoFromPdfUsingAI` method
3. **Benefit**: OpenAI Vision API is much more accurate than heuristic detection

### Option 3: Hybrid Approach (Best User Experience)
Use both systems with proper fallback:

1. **Try Python parser first** (faster, no API costs)
2. **If fails**, use backend AI extraction (slower but more accurate)
3. **Ensure proper logging** at each step

## Immediate Actions

### 1. Check Python Parser Logs
Look for these log entries when CVs are being parsed:

```
[PHOTO_EXTRACT] candidate_id=xxx action=START
[PHOTO_EXTRACT] candidate_id=xxx action=SKIP reason=XXX
[PHOTO_EXTRACT] candidate_id=xxx SUCCESS uploaded_as=https://...
```

### 2. Verify Python Parser Dependencies
Check if MediaPipe is actually installed:

```bash
cd python-parser
pip list | grep mediapipe
```

If not installed, the face detection will definitely fail.

### 3. Test with Sample CV
Upload a CV with a clear photo and check:
- Python parser logs
- Backend worker logs  
- Database: `candidates.profile_photo_url` field
- Storage bucket: Check if files were uploaded

### 4. Check Supabase Upload Function
Verify `upload_photo_to_supabase` (line 1842):
- Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Check if uploads are succeeding
- Verify bucket permissions

## Quick Test Script

Run this to check if photo extraction is working:

```bash
# Upload a test CV
curl -X POST http://localhost:3000/api/inbox/upload \
  -F "file=@test-cv.pdf" \
  -F "source=web"

# Check parsing job result
# Look for profile_photo_url in the result JSON
```

## Monitoring Queries

```sql
-- Check how many candidates have profile photos
SELECT 
  COUNT(*) as total_candidates,
  COUNT(profile_photo_url) as with_photos,
  ROUND(100.0 * COUNT(profile_photo_url) / COUNT(*), 2) as photo_percentage
FROM candidates
WHERE created_at > NOW() - INTERVAL '7 days';

-- Check recent parsing jobs
SELECT 
  id,
  status,
  created_at,
  result_json->'profile_photo_url' as photo_url_from_parser
FROM parsing_jobs
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 10;
```

## Conclusion

The profile photo extraction is **implemented but likely failing** in the Python parser due to:
1. Missing MediaPipe dependency (or not using it properly)
2. Overly strict quality checks
3. Upload failures to Supabase storage

**Recommended immediate action**: 
- Check Python parser logs to see why `extract_profile_photo_from_pdf` is returning `None`
- Verify MediaPipe is installed
- Consider using the backend AI extraction as it's more reliable
