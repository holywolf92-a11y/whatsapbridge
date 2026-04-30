# Case Study: Profile Photo Extraction Failure - Tehzeeb Ali (FL-2026-889)

## Executive Summary

**Status**: ❌ Photo extraction partially working but not displaying  
**Root Causes Identified**: 2 critical issues  
**Candidate**: Tehzeeb Ali (FL-2026-889)  
**Timestamp**: 2026-02-03 18:23-18:24 UTC

---

## Issue #1: Python Parser - X11 Dependencies NOT Installed ❌

### Evidence
```
[PHOTO_EXTRACT] face-recognition library not available: libX11.so.6: cannot open shared object file
```

### Root Cause
The `nixpacks.toml` configuration file was created and pushed to GitHub, but Railway is **NOT using it**. The deployment is still missing X11 libraries.

### Why nixpacks.toml Didn't Work

Railway may be using a **Dockerfile** or **Procfile** instead of nixpacks. When these files exist, Railway ignores `nixpacks.toml`.

### Solution Required
Check python-parser directory for:
- `Dockerfile` (takes priority over nixpacks.toml)
- `Procfile` (takes priority over nixpacks.toml)

If either exists, we need to add X11 dependencies there instead.

---

## Issue #2: Backend AI Extraction Success BUT Photo Not Displaying ⚠️

### Evidence - AI Extraction WORKED
```
[AIProfilePhotoExtraction] Success | {
  "candidateId":"c6407762-6110-45f0-ab87-a5ce40e92e63",
  "pageUsed":1,
  "confidence":0.665,
  "storagePath":"candidates/c6407762-6110-45f0-ab87-a5ce40e92e63/profile_photos/ai_extracted_1770143084972_12e4e9b9-865e-4a22-a523-9d674b237974.jpg",
  "ms":46454
}
```

### Photo Was Successfully:
✅ Extracted from page 1  
✅ Confidence: 66.5% (acceptable)  
✅ Saved to Supabase storage  
✅ Storage path confirmed  

### Critical Question: Was Database Updated?

The logs show **extraction success** but do NOT show:
```
Updated candidate profile_photo_url
```

### Root Cause Hypothesis

The `aiProfilePhotoExtractionService.ts` successfully:
1. Extracts photo from PDF
2. Uploads to Supabase storage
3. Gets storage path

BUT may be failing to:
4. **Update the database** with the photo URL

### Database Query Needed

```sql
SELECT 
  id,
  name,
  candidate_code,
  profile_photo_url,
  profile_photo_bucket,
  profile_photo_path,
  created_at
FROM candidates
WHERE candidate_code = 'FL-2026-889';
```

Expected result:
- `profile_photo_url`: Should contain a signed URL
- `profile_photo_bucket`: Should be 'candidates'  
- `profile_photo_path`: Should match the storage path from logs

---

## Detailed Timeline - Tehzeeb Ali Upload

### 18:23:11 - CV Parsing Started
```
Successfully parsed CV: 110f34bd-6d63-4298-b9b1-e6ef29393190
```

### 18:23:11 - Face Detection Attempted
```
[PHOTO_EXTRACT] face-recognition library not available: libX11.so.6
```
❌ Python parser photo extraction failed

### 18:23:27 - Candidate Created
```
Created candidate c6407762-6110-45f0-ab87-a5ce40e92e63
```

### 18:23:59 - Backend AI Extraction Started
```
[AIProfilePhotoExtraction] Start | {
  "candidateId":"c6407762-6110-45f0-ab87-a5ce40e92e63",
  "maxPages":5
}
```

### 18:24:11 - Photo Found on Page 1
```
Page scanned | {
  "pageNumber":1,
  "found":true,
  "confidence":0.95
}
```

### 18:24:19-18:24:44 - Pages 2-5 Scanned
All returned `"found":false` - only page 1 had a photo

### 18:24:46 - AI Extraction SUCCESS ✅
```
[AIProfilePhotoExtraction] Success | {
  "candidateId":"c6407762-6110-45f0-ab87-a5ce40e92e63",
  "pageUsed":1,
  "confidence":0.665,
  "storagePath":"candidates/.../profile_photos/ai_extracted_....jpg"
}
```

### 18:24:46 - Backend Confirms
```
✅ Extracted profile photo from CV PDF {
  candidateId: 'c6407762-6110-45f0-ab87-a5ce40e92e63',
  pageUsed: 1,
  confidence: 0.665
}
```

### Missing Log Entry ❌
Expected but NOT seen:
```
Updated candidate c6407762-6110-45f0-ab87-a5ce40e92e63 with profile_photo_url
```

---

## Diagnosis: Why Photo Not Displaying

### Hypothesis 1: Database Not Updated (MOST LIKELY)
The `aiProfilePhotoExtractionService.ts` might be:
- Saving photo to storage ✅
- Getting storage path ✅
- **NOT updating candidate.profile_photo_url** ❌

### Hypothesis 2: URL Generation Issue
The service might be:
- Updating database ✅
- But using wrong URL format (public vs signed) ❌

### Hypothesis 3: Frontend Not Re-fetching
- Database updated ✅
- Frontend cache showing old data ❌

---

## Required Actions

### Immediate: Check Database
```sql
SELECT 
  profile_photo_url,
  profile_photo_bucket,
  profile_photo_path
FROM candidates
WHERE id = 'c6407762-6110-45f0-ab87-a5ce40e92e63';
```

### If NULL: Fix Database Update
Review `aiProfilePhotoExtractionService.ts`:
- Line where it should call `supabase.from('candidates').update()`
- Verify it's actually executing
- Check for silent errors

### If NOT NULL: Check URL Format
- Is it a signed URL or public URL?
- Does it match: `candidates/.../profile_photos/ai_extracted_....jpg`?
- Try accessing URL directly

### Long-term: Fix Python Parser
Railway is ignoring `nixpacks.toml`. Need to:
1. Check for Dockerfile/Procfile in python-parser
2. Add X11 dependencies to whichever file Railway is using
3. Or remove Dockerfile/Procfile to force nixpacks usage

---

## References

- Storage path: `candidates/c6407762-6110-45f0-ab87-a5ce40e92e63/profile_photos/ai_extracted_1770143084972_12e4e9b9-865e-4a22-a523-9d674b237974.jpg`
- Candidate ID: `c6407762-6110-45f0-ab87-a5ce40e92e63`
- Candidate Code: `FL-2026-889`
- Document ID: `0da3e736-daa7-477b-9f58-c985fbd9dcef`
- Confidence: 66.5%
- Extraction time: 46.4 seconds

---

**Next Step**: Query the database to determine if `profile_photo_url` was set.
