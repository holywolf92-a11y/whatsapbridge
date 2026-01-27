# Photo Verification & Matching System Guide

## Current Implementation Status

### ✅ IMPLEMENTED Features

1. **Photo Extraction from CVs**
   - Automatically extracts profile photos from uploaded PDF CVs
   - Uses PyMuPDF (fitz) to find largest image (5KB-1MB range)
   - Uploads to Supabase Storage at `candidates/{id}/photo/{filename}`
   - Updates `candidates.profile_photo_url`, `profile_photo_path`, `profile_photo_bucket`

2. **Photo Document Category**
   - Separate "photos" document category exists
   - AI categorizes documents as `photos` when appropriate
   - Photos stored in `candidate_documents` table with category='photos'

3. **Photo Document Flags**
   - `candidates.photo_received` = true when photo document uploaded
   - `candidates.photo_received_at` = timestamp of upload
   - Automatically updated via `updateDocumentFlagsController`

4. **Photo Verification Logic**
   - **Line 740-783** in `documentVerificationWorker.ts`:
     - Photos don't require identity field extraction
     - Auto-VERIFIED if:
       - AI confidence >= 0.70 AND
       - `candidate_id` is provided during upload
     - Set to `NEEDS_REVIEW` if low confidence or no candidate_id

5. **Photo Rejection Code Defined**
   - `PHOTO_MISMATCH` rejection code exists in `documentCategories.ts` (line 77, 218)
   - Message: "Photo in {document} does not match candidate's profile photo"
   - **Currently defined but NOT actively used** (no facial recognition yet)

---

## ❌ NOT YET IMPLEMENTED

### **Facial Recognition / Photo Matching**

**Why Muhammad Adnan's Photo is `pending_ai`:**
- The photo document `split_photos_1769355582362.pdf` was likely:
  - Uploaded without a `candidate_id` link, OR
  - AI confidence was below 0.70 threshold
- **Solution:** Manually verify the photo in admin panel OR re-upload with candidate linked

**To Implement Photo Matching (Future Enhancement):**

```typescript
// Pseudo-code for facial recognition service
interface FacialRecognitionService {
  /**
   * Compare candidate's profile photo with photo from ID document
   * @param profilePhotoUrl - URL of candidate's profile photo
   * @param documentPhotoUrl - URL of photo extracted from passport/CNIC/license
   * @returns Match result with confidence score
   */
  comparePhotos(
    profilePhotoUrl: string,
    documentPhotoUrl: string
  ): Promise<{
    matched: boolean;
    confidence: number; // 0.0 - 1.0
    similarity_score: number; // 0-100
  }>;
}

// Recommended Services:
// 1. AWS Rekognition - CompareFaces API
// 2. Azure Face API - Verify API
// 3. Google Cloud Vision - Face Detection + Custom ML
// 4. face-api.js (open-source, browser/Node.js)
```

**Integration Points:**

1. **In `documentVerificationWorker.ts` (after line 740):**
   ```typescript
   // For passport, CNIC, driving_license documents
   if (
     (category === 'passport' || category === 'cnic' || category === 'driving_license') &&
     candidate.profile_photo_url
   ) {
     // Extract photo from document (already done by AI/OCR)
     const documentPhotoUrl = aiResult.extracted_identity?.photo_url;
     
     if (documentPhotoUrl) {
       // Compare photos
       const faceMatch = await facialRecognitionService.comparePhotos(
         candidate.profile_photo_url,
         documentPhotoUrl
       );
       
       if (!faceMatch.matched || faceMatch.confidence < 0.80) {
         // PHOTO MISMATCH - Reject or flag for review
         finalStatus = VERIFICATION_STATUS.REJECTED_MISMATCH;
         reasonCode = REJECTION_REASON_CODES.PHOTO_MISMATCH;
         mismatchFields.push('photo');
       }
     }
   }
   ```

2. **Manual Override System:**
   - Admin can override `PHOTO_MISMATCH` rejection
   - `is_overridable: true` (already defined in rejection system)
   - Requires `admin` role (or `super_admin` for security-critical cases)

---

## Current Photo System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PHOTO UPLOAD FLOW                         │
└─────────────────────────────────────────────────────────────────┘

1. CV PDF Uploaded
   ↓
2. Python Parser extracts largest image (5KB-1MB)
   ↓
3. Upload to Supabase Storage: candidates/{id}/photo/{filename}
   ↓
4. Update candidates table:
   - profile_photo_url
   - profile_photo_path
   - profile_photo_bucket
   ↓
5. Photo now available for:
   - Candidate profile display
   - Public profile page
   - Employer-Safe CV (if enabled)


┌─────────────────────────────────────────────────────────────────┐
│                   PHOTO DOCUMENT UPLOAD FLOW                     │
└─────────────────────────────────────────────────────────────────┘

1. User uploads document via "Add Document" in candidate modal
   ↓
2. AI categorizes as "photos" (category detection)
   ↓
3. Document stored in candidate_documents table
   ↓
4. Verification Worker checks:
   - Is category = 'photos'?
   - Is AI confidence >= 0.70?
   - Is candidate_id provided?
   ↓
5. If YES to all: VERIFIED ✅
   If NO: NEEDS_REVIEW ⚠️ (pending_ai status)
   ↓
6. Update candidates.photo_received = true


┌─────────────────────────────────────────────────────────────────┐
│              PHOTO MATCHING (NOT YET IMPLEMENTED)                │
└─────────────────────────────────────────────────────────────────┘

Future Flow:
1. Passport/CNIC uploaded with embedded photo
   ↓
2. Extract photo from document
   ↓
3. Compare with candidate.profile_photo_url
   ↓
4. If mismatch (confidence < 80%):
   - Set status: REJECTED_MISMATCH
   - Reason: PHOTO_MISMATCH
   - Allow manual override
   ↓
5. Admin can approve/reject with notes
```

---

## How to Fix Muhammad Adnan's Photo Issue

### **Option 1: Manual Verification (Quick Fix)**

1. Go to Admin Panel → Candidates
2. Find "MR. MUHAMMAD ADNAN" (Driver HTV)
3. Open candidate details modal
4. Go to "Documents" tab
5. Find `split_photos_1769355582362.pdf` (status: pending_ai)
6. Click "Verify" or "Approve" button
7. Photo status changes to VERIFIED ✅

### **Option 2: Backend SQL Manual Update**

```sql
-- Find the photo document
SELECT id, candidate_id, file_name, verification_status, category
FROM candidate_documents
WHERE file_name LIKE '%split_photos%'
  AND candidate_id = (SELECT id FROM candidates WHERE name ILIKE '%MUHAMMAD ADNAN%');

-- Manually verify the photo document
UPDATE candidate_documents
SET verification_status = 'verified',
    reason_code = NULL,
    updated_at = NOW()
WHERE file_name = 'split_photos_1769355582362.pdf'
  AND candidate_id = (SELECT id FROM candidates WHERE name ILIKE '%MUHAMMAD ADNAN%');
```

### **Option 3: Re-upload Photo with Candidate Link**

1. Download `split_photos_1769355582362.pdf`
2. In candidate modal, click "Add Document"
3. Select "Photos" category
4. Upload the file again
5. This time `candidate_id` will be automatically linked
6. AI will verify if confidence >= 0.70

---

## Database Schema Reference

### **candidates table (photo-related columns)**

```sql
-- Profile photo (extracted from CV)
profile_photo_url TEXT          -- Signed URL or public URL
profile_photo_path TEXT          -- Storage path
profile_photo_bucket TEXT        -- Storage bucket name

-- Photo document flags
photo_received BOOLEAN           -- Has photo document been uploaded?
photo_received_at TIMESTAMPTZ    -- When was photo uploaded?
```

### **candidate_documents table**

```sql
-- Document info
id UUID PRIMARY KEY
candidate_id UUID                -- FK to candidates
category document_category_enum  -- 'photos' for photo documents
file_name TEXT
storage_path TEXT
storage_bucket TEXT

-- Verification status
verification_status document_verification_status_enum
  -- 'pending_ai', 'verified', 'needs_review', 'rejected_mismatch', 'failed'
reason_code TEXT                 -- e.g., 'PHOTO_MISMATCH', 'NO_ID_FOUND'
ai_confidence NUMERIC(3,2)       -- 0.00 - 1.00
```

---

## Manual Override System (Already Implemented)

### **How it Works:**

1. **Rejection Context** (stored in `candidate_documents` table):
   ```json
   {
     "rejection_code": "PHOTO_MISMATCH",
     "rejection_reason": "Photo does not match profile photo",
     "retry_possible": true,
     "is_overridable": true,
     "required_role": "admin"
   }
   ```

2. **Admin Override Flow:**
   - Admin clicks "Override Rejection" button
   - Modal appears with rejection details
   - Admin provides reason for override
   - Document status changes to `verified`
   - Override logged in `document_verification_logs`

3. **Non-Overridable Rejections:**
   - `DOCUMENT_TAMPERED` - requires `super_admin`
   - `PHOTO_MISMATCH` - **IS overridable** by `admin`

### **API Endpoint for Override:**

`PUT /api/candidate-documents/:documentId/override-rejection`

**Body:**
```json
{
  "override_reason": "Photo verified manually by admin. Lighting difference acceptable.",
  "new_status": "verified"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Document rejection overridden successfully",
  "document": {
    "id": "...",
    "verification_status": "verified",
    "reason_code": null
  }
}
```

---

## Employer CV Photo Integration

### **Current Status:**

The new modern minimalist CV template (v3.0.0) **already supports photos**:

```html
<!-- In sidebar -->
${candidate.photo_url ? `<img src="${candidate.photo_url}" alt="Profile" class="profile-photo">` : ''}
```

**Photo Sources** (in priority order):

1. `candidate.profile_photo_url` - Photo extracted from CV
2. `candidate.photo_url` - Alias/fallback (same field)
3. Photo from verified "photos" category document

### **Automatic Photo Sync:**

Currently, photos from "photos" category documents are **NOT automatically synced** to `candidates.profile_photo_url`.

**To implement:**
```typescript
// In documentVerificationWorker.ts (after line 755)
// After verifying photo document, update candidate's profile_photo_url
if (finalStatus === VERIFICATION_STATUS.VERIFIED) {
  // Get storage URL for the photo document
  const { data: urlData } = await supabase.storage
    .from(storageBucket)
    .createSignedUrl(storagePath, 31536000); // 1 year
  
  if (urlData) {
    await db
      .from('candidates')
      .update({
        profile_photo_url: urlData.signedUrl,
        profile_photo_path: storagePath,
        profile_photo_bucket: storageBucket,
        photo_received: true,
        photo_received_at: new Date().toISOString()
      })
      .eq('id', candidateId);
  }
}
```

---

## Recommended Implementation Plan

### **Phase 1: Fix Current Photo Issues** (Immediate)
- [x] Understand why photos are pending
- [ ] Manually verify Muhammad Adnan's photo
- [ ] Implement automatic photo sync from "photos" documents
- [ ] Test employer CV photo display

### **Phase 2: Basic Photo Matching** (Short-term)
- [ ] Choose facial recognition service (AWS Rekognition recommended)
- [ ] Implement photo extraction from ID documents
- [ ] Add `comparePhotos()` function
- [ ] Integrate into verification worker
- [ ] Add manual override UI in admin panel

### **Phase 3: Advanced Features** (Long-term)
- [ ] Liveness detection (prevent photo spoofing)
- [ ] Age verification (check if photo is recent)
- [ ] Multi-document photo consistency check
- [ ] Photo quality assessment (blur, lighting, angle)
- [ ] Automatic photo enhancement/cropping

---

## Cost Estimates (Facial Recognition Services)

| Service | Free Tier | Pricing |
|---------|-----------|---------|
| **AWS Rekognition** | 5,000 faces/month free (1 year) | $1.00 per 1,000 faces after |
| **Azure Face API** | 30,000 transactions/month free | $1.00 per 1,000 transactions |
| **Google Cloud Vision** | 1,000 units/month free | $1.50 per 1,000 faces |
| **face-api.js** | Free (open-source) | Self-hosted (compute costs only) |

**Recommendation:** Start with **AWS Rekognition** (you already use AWS for other services, easy integration).

---

## Summary

### **Current State:**
✅ Photo extraction from CVs works  
✅ Photo documents can be uploaded  
✅ Photo verification logic exists (auto-verify if confidence >= 0.70)  
✅ Photo rejection code defined (`PHOTO_MISMATCH`)  
✅ Employer CV supports photo display  
❌ Facial recognition NOT implemented yet  
❌ Photos from "photos" documents NOT auto-synced to profile  

### **Muhammad Adnan's Issue:**
Photo is `pending_ai` because:
- Low AI confidence OR
- No candidate_id linked during upload

**Fix:** Manually verify the photo document in admin panel.

### **Next Steps:**
1. Fix Muhammad Adnan's photo (manual verification)
2. Implement auto-sync of verified photos to `candidates.profile_photo_url`
3. Test employer CV photo display
4. (Optional) Implement facial recognition in Phase 2

---

Generated: 2026-01-27
Version: 1.0.0
System: Recruitment Portal - Photo Verification
