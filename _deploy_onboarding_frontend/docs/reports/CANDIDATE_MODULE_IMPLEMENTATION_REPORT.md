# Candidate Module Functionality - Implementation Summary

## ✅ COMPLETED FEATURES (Backend + Frontend)

### 1. View Profile Button ✅
**Status:** READY TO TEST - Endpoint already exists

**Backend:**
- `GET /api/candidates/:id` - Returns full candidate data
- Location: `backend/src/controllers/candidateController.ts` → `getCandidateController`
- Service: `backend/src/services/candidateService.ts` → `getCandidateById`

**Frontend:**
- Component: `CandidateManagement_ENHANCED.tsx` → `handleViewProfile()`
- Opens CandidateDetailsModal with full candidate data
- API Client: `apiClient.getCandidate(id)` (already exists)

**Test:** Click "View Profile" on any candidate → Modal opens with name, email, phone, documents

---

### 2. Download CV Button ✅
**Status:** FULLY IMPLEMENTED - Endpoint created

**Backend:**
- **NEW**: `GET /api/candidates/:id/documents/cv/download`
- Returns: `{ download_url: string, filename: string, document_id: string }`
- Location: `backend/src/controllers/candidateController.ts` → `getCandidateCVDownloadController`
- Generates 5-minute signed URL from Supabase Storage
- Returns 404 if no CV found

**Frontend:**
- Updated: `handleDownloadCV()` uses new endpoint
- Handles 404 gracefully: "No CV found for this candidate. Please upload a CV first."
- Auto-downloads file with correct filename
- API Client: NEW `apiClient.getCandidateCVDownload(candidateId)`

**Test:** 
- Click "Download CV" for candidate WITH CV → Downloads file
- Click "Download CV" for candidate WITHOUT CV → Shows error message

---

### 3. Camera Button (Profile Photo Upload) ✅
**Status:** FULLY IMPLEMENTED

**Database:**
- **NEW**: Migration 013 adds profile photo fields:
  - `profile_photo_bucket` (TEXT)
  - `profile_photo_path` (TEXT)
  - `profile_photo_url` (TEXT)
- Updates `photo_received` and `photo_received_at` flags

**Backend:**
- **NEW**: `POST /api/candidates/:id/photo`
- Accepts: `multipart/form-data` with `photo` field
- Stores in: Supabase Storage `candidates/{id}/photo/profile_{timestamp}.{ext}`
- Returns: `{ message: string, photo_url: string, photo_path: string }`
- File size limit: 5MB
- Allowed types: JPEG, PNG, WebP
- Location: `backend/src/controllers/candidateController.ts` → `uploadCandidatePhotoController`
- Route: `backend/src/routes/candidates.ts` with multer middleware

**Frontend:**
- Updated: `handlePhotoUpload()` uses new endpoint
- Validates file size (5MB max)
- Shows success/error alerts
- Refreshes candidate list after upload
- API Client: NEW `apiClient.uploadCandidatePhoto(candidateId, file)`

**Test:**
- Click camera button → Select photo → Upload → Success message
- Refresh page → Photo visible on card (if profile_photo_url displayed)

---

### 4. Document Auto-Linking 🚧
**Status:** NOT YET IMPLEMENTED (Task 5)

**Database:**
- **NEW**: Migration 013 creates `unmatched_documents` table
- Fields: match_reason, match_details (JSONB), document_id, extracted fields (CNIC/email/phone/name/father_name)
- Resolution tracking: reviewed_at, reviewed_by, resolution_action, linked_candidate_id

**Backend:** (TODO)
- Need to integrate DocumentClassifier + CandidateMatcher into upload
- Priority matching: CNIC > Email > Phone > Name+Father (0.92 threshold)
- Single match → auto-link + update checklist flags
- Multiple/no matches → insert into unmatched_documents
- Cross-candidate conflict → manual review

**Frontend:**
- Document card handlers already call `apiClient.uploadDocument()`
- Need to handle auto-linking response

---

## 📁 FILES MODIFIED/CREATED

### Backend Files Created:
1. `backend/migrations/013_profile_photos_and_unmatched_docs.sql` ✅
   - Adds profile photo columns to candidates table
   - Creates unmatched_documents table with RLS policies

### Backend Files Modified:
1. `backend/src/controllers/candidateController.ts` ✅
   - Added `getCandidateCVDownloadController` (line ~200)
   - Added `uploadCandidatePhotoController` (line ~250)

2. `backend/src/routes/candidates.ts` ✅
   - Imported multer for photo uploads
   - Added `GET /:id/documents/cv/download` route
   - Added `POST /:id/photo` route with multer middleware
   - Exported new controllers

### Frontend Files Modified:
1. `src/lib/apiClient.ts` ✅
   - Added `getCandidateCVDownload(candidateId)` method
   - Added `uploadCandidatePhoto(candidateId, file)` method

2. `src/components/CandidateManagement_ENHANCED.tsx` ✅
   - Updated `handleDownloadCV()` to use new CV download endpoint
   - Updated `handlePhotoUpload()` with 5MB validation
   - Both handlers now use new API methods

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Run Migration on Supabase
```sql
-- Execute in Supabase SQL Editor
-- File: backend/migrations/013_profile_photos_and_unmatched_docs.sql
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS profile_photo_bucket TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS profile_photo_path TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

CREATE TABLE IF NOT EXISTS unmatched_documents (...);
```

### Step 2: Deploy Backend to Railway
```bash
cd backend
npm run build
git add .
git commit -m "Add CV download endpoint, photo upload, and migration 013"
git push railway main
```

### Step 3: Deploy Frontend to Railway
```bash
cd ..
npm run build
git add .
git commit -m "Update CandidateManagement to use new CV download and photo upload endpoints"
git push railway main
```

### Step 4: Verify Deployment
- Backend logs: `railway logs -s backend`
- Frontend URL: https://exquisite-surprise-production.up.railway.app
- Backend URL: https://recruitment-portal-backend-production-d1f7.up.railway.app

---

## ✅ QUICK TEST CHECKLIST

### Test 1: View Profile ✅ (Should already work)
1. Open Candidate Management at https://exquisite-surprise-production.up.railway.app
2. Click "View Profile" on Usman Khan (or any candidate)
3. **Expected:** Modal opens with full data (name, email, phone, position, etc.)
4. Close modal, repeat for 2 more candidates
5. **Result:** ____________

### Test 2: Download CV ✅ (New endpoint)
1. Find a candidate WITH a CV uploaded (check cv_received flag)
2. Click "Download CV" button
3. **Expected:** File downloads with correct filename
4. Find a candidate WITHOUT a CV
5. Click "Download CV" button
6. **Expected:** Alert "No CV found for this candidate. Please upload a CV first."
7. **Result:** ____________

### Test 3: Profile Photo Upload ✅ (New endpoint)
1. Click camera button on any candidate card
2. Select a JPEG/PNG photo < 5MB
3. **Expected:** "Photo uploaded successfully!" alert
4. Refresh page
5. **Expected:** Photo appears on card (if frontend displays profile_photo_url)
6. **Result:** ____________

### Test 4: Document Cards Interactive ⚠️ (Partially working)
1. Click on a document card (CV, Passport, Certificate, Photo, Medical)
2. If document exists: **Expected:** Opens in new tab (uses existing viewDocument handler)
3. If document missing: **Expected:** File picker opens (uses existing uploadDocument handler)
4. Upload a document → **Expected:** Success alert + card updates
5. **Result:** ____________
6. **Note:** Auto-linking NOT YET implemented - documents upload but don't auto-match

---

## 🔍 KNOWN ISSUES & LIMITATIONS

### 1. Auto-Linking Not Implemented
- **Issue:** Document uploads work BUT don't run auto-matching logic
- **Impact:** Documents uploaded via document cards don't automatically link to candidates based on CNIC/email/phone
- **Solution:** Need to implement Task 5 (integrate DocumentClassifier + CandidateMatcher)
- **Workaround:** Currently, documents link directly to specified candidate_id (manual linking)

### 2. Profile Photo Display
- **Issue:** Frontend may not display uploaded profile photos on cards
- **Cause:** CandidateManagement component might not render profile_photo_url field
- **Solution:** Add profile photo rendering to candidate cards
- **Test:** Check if photo_received flag updates after upload

### 3. CandidateDetailsModal Type Mismatch
- **Issue:** Modal expects different Candidate type (from mockData)
- **Impact:** TypeScript error (non-blocking)
- **Solution:** Update CandidateDetailsModal to import Candidate from apiClient instead of mockData

### 4. Migration 013 Not Yet Executed
- **Critical:** Must run migration BEFORE photo upload will work
- **Error if skipped:** Photo upload will fail (columns don't exist)
- **Action:** Execute SQL in Supabase dashboard first

---

## 📊 FEATURE COMPLETION STATUS

| Feature | Backend | Frontend | Database | Tested | Status |
|---------|---------|----------|----------|--------|--------|
| View Profile | ✅ Existing | ✅ Working | ✅ Ready | ⏳ Pending | READY |
| Download CV | ✅ NEW | ✅ Updated | ✅ Ready | ⏳ Pending | READY |
| Photo Upload | ✅ NEW | ✅ Updated | ⚠️ Migration | ⏳ Pending | READY* |
| Document Cards | ✅ Existing | ✅ Working | ✅ Ready | ⏳ Pending | PARTIAL |
| Auto-Linking | ❌ Not Impl | ⏳ Ready | ✅ Ready | ❌ N/A | TODO |

*Ready after running migration 013

---

## 🎯 NEXT STEPS (Priority Order)

### IMMEDIATE (Required for full functionality):
1. **Run Migration 013** on Supabase
   - Execute `013_profile_photos_and_unmatched_docs.sql` in SQL Editor
   - Verify columns added: `SELECT profile_photo_bucket FROM candidates LIMIT 1;`

2. **Deploy Backend to Railway**
   - Commit changes: `git commit -m "Add CV download & photo upload endpoints"`
   - Push to Railway: `git push railway main`
   - Monitor logs: `railway logs`

3. **Deploy Frontend to Railway**
   - Commit changes: `git commit -m "Update CandidateManagement for new endpoints"`
   - Push to Railway: `git push railway main`

4. **Run Test Checklist (Tests 1-3)**
   - Test View Profile (should work immediately)
   - Test Download CV (new endpoint)
   - Test Photo Upload (new endpoint)

### HIGH PRIORITY (Core functionality):
5. **Implement Auto-Linking (Task 5)**
   - Create/integrate DocumentClassifier service
   - Create/integrate CandidateMatcher service with priority logic
   - Update POST /documents endpoint to run matching
   - Update checklist flags (passport_received, cnic_received, etc.)
   - Handle ambiguous matches → unmatched_documents table

6. **Test Auto-Linking (Test 4)**
   - Upload passport with CNIC → auto-links correctly
   - Upload document with email → auto-links by email
   - Upload ambiguous doc → goes to manual review

### LOWER PRIORITY (Polish):
7. **Fix CandidateDetailsModal Type Issue**
   - Update import to use Candidate from apiClient
   - Ensure modal displays real data from backend

8. **Add Profile Photo Display**
   - Render profile_photo_url on candidate cards
   - Show default avatar if no photo
   - Add photo preview in View Profile modal

---

## 🐛 TROUBLESHOOTING

### Error: "Failed to upload photo"
- **Check:** Migration 013 executed? Run `SELECT profile_photo_bucket FROM candidates LIMIT 1;`
- **Check:** File size < 5MB? File type JPEG/PNG/WebP?
- **Check:** Supabase Storage "documents" bucket has correct permissions

### Error: "CV not found for this candidate"
- **Expected:** Candidate has no CV uploaded
- **Solution:** Upload CV via document card or CVInbox first

### Error: "Failed to download CV"
- **Check:** Backend logs for storage errors
- **Check:** candidate_documents table has CV record with storage_path
- **Check:** Supabase Storage signed URL generation working

### Download CV button downloads but file is empty/corrupt
- **Check:** storage_path in candidate_documents matches actual file location
- **Check:** Supabase Storage file exists and is accessible

---

## 📝 API REFERENCE

### GET /api/candidates/:id/documents/cv/download
**Purpose:** Get signed download URL for candidate's CV

**Request:**
```
GET /api/candidates/abc-123-def/documents/cv/download
```

**Response (200):**
```json
{
  "download_url": "https://supabase.co/storage/signed/xyz...",
  "filename": "John_Doe_CV.pdf",
  "document_id": "doc-uuid-123"
}
```

**Response (404):**
```json
{
  "error": "CV not found for this candidate"
}
```

---

### POST /api/candidates/:id/photo
**Purpose:** Upload profile photo for candidate

**Request:**
```
POST /api/candidates/abc-123-def/photo
Content-Type: multipart/form-data

photo: <binary file data>
```

**Constraints:**
- Max file size: 5MB
- Allowed types: image/jpeg, image/png, image/webp
- Field name MUST be "photo"

**Response (200):**
```json
{
  "message": "Photo uploaded successfully",
  "photo_path": "candidates/abc-123-def/photo/profile_1703001234567.jpg",
  "photo_url": "https://supabase.co/storage/signed/abc..."
}
```

**Response (400):**
```json
{
  "error": "No photo file uploaded"
}
```

**Response (404):**
```json
{
  "error": "Candidate not found"
}
```

---

## 💡 IMPLEMENTATION NOTES

### Why separate CV download endpoint?
- **Performance:** Direct CV download without listing all documents first
- **Security:** Can add CV-specific access controls later
- **Simplicity:** Frontend just needs candidate ID, not document ID
- **User Experience:** Clearer error messages ("CV not found" vs "Document not found")

### Why separate photo upload endpoint?
- **Type Safety:** Photo-specific validation (image types only, 5MB limit)
- **Storage Location:** Photos go to `candidates/{id}/photo/` not generic documents folder
- **Database Fields:** Updates profile_photo_* fields, not candidate_documents table
- **Checklist Auto-Update:** Automatically sets photo_received flag

### Why unmatched_documents table?
- **Manual Review:** Stores ambiguous matches for human review
- **Audit Trail:** Tracks why document couldn't be auto-linked
- **Resolution Tracking:** Records how issue was resolved
- **Match Context:** JSONB field stores potential matches for reviewer

---

## 📈 METRICS TO TRACK

After deployment, monitor:
1. **CV Download Success Rate** - Ratio of 200 vs 404 responses
2. **Photo Upload Success Rate** - Failed uploads might indicate storage issues
3. **Auto-Linking Accuracy** (once implemented) - % of documents auto-linked correctly
4. **Manual Review Queue Size** - Number of unmatched_documents needing review
5. **Response Times** - CV download endpoint latency (should be < 500ms)

---

## 🎬 CONCLUSION

**What's Working Now:**
- ✅ View Profile (no changes needed, already works)
- ✅ Download CV (new endpoint ready)
- ✅ Photo Upload (new endpoint ready, needs migration)
- ⚠️ Document Cards (partially - upload works, auto-linking pending)

**What's Pending:**
- ❌ Auto-Linking Logic (Task 5 - biggest feature, needs separate implementation)

**Next Action:**
1. Run migration 013 on Supabase
2. Deploy backend + frontend to Railway
3. Run tests 1-3 from checklist
4. Report results
5. Implement auto-linking if tests pass

**Estimated Time to Full Deployment:** 15-20 minutes
**Estimated Time to Complete Auto-Linking:** 2-3 hours (separate task)
