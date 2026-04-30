# ✅ Document Upload Endpoint Verification

## Flow Verification

### 1. Upload Endpoint ✅
- **Route:** `POST /api/documents/candidate-documents`
- **Controller:** `uploadCandidateDocumentController`
- **Service:** `uploadCandidateDocument`
- **Status:** ✅ Connected correctly

### 2. Database Tables Used ✅

#### On Upload:
- **`candidate_documents`** table ✅ (NEW SYSTEM)
  - Creates document record
  - Sets `verification_status = 'pending_ai'`
  - Stores file metadata

#### During AI Processing:
- **`candidates`** table ✅ (CORRECT)
  - Worker searches by: CNIC, email, phone, name, father_name
  - Uses `CandidateMatcher.findCandidate()` which queries `candidates` table
  - Matches extracted identity from document to candidate record

#### After AI Processing:
- **`candidate_documents`** table ✅ (CORRECT)
  - Updates `verification_status` (verified/needs_review/rejected)
  - Updates `category`, `confidence`, `verification_reason_code`
  - Updates `extracted_identity_json`

- **`candidates`** table ✅ (CORRECT)
  - Updates document flags: `cv_received`, `passport_received`, etc.
  - Updates timestamps: `cv_received_at`, `passport_received_at`, etc.

### 3. Job Queue ✅
- **Queue Name:** `document-verification`
- **Job Type:** `verify-document`
- **Enqueued:** After document upload ✅
- **Processed By:** `documentVerificationWorker` ✅

### 4. AI Identity Matching ✅

The worker uses **`candidates`** table for matching:

```typescript
// Worker extracts identity from document
const extractedIdentity = {
  name: "...",
  cnic: "...",
  passport_no: "...",
  email: "...",
  phone: "..."
};

// Searches candidates table
const candidateMatch = await CandidateMatcher.findCandidate({
  cnic: extractedIdentity.cnic,
  email: extractedIdentity.email,
  phone: extractedIdentity.phone,
  name: extractedIdentity.name,
  fatherName: extractedIdentity.father_name
});

// CandidateMatcher queries candidates table:
// - Priority 1: CNIC match (cnic_normalized)
// - Priority 2: Email match
// - Priority 3: Phone match
// - Priority 4: Name + Father Name match
```

### 5. Verification ✅

**All database queries use the correct tables:**
- ✅ `candidate_documents` - for document records (NEW SYSTEM)
- ✅ `candidates` - for identity matching (CORRECT)
- ✅ `document_verification_logs` - for audit trail

**No old tables are used:**
- ❌ `documents` table - NOT used (old system, deprecated)

## Potential Issues

### Issue 1: Worker Not Running
**Symptom:** Documents stay "Pending"
**Check:**
1. Railway logs for "Document Verification worker started"
2. Environment variables: `RUN_WORKER=true`, `REDIS_URL`, `PYTHON_CV_PARSER_URL`, `PYTHON_HMAC_SECRET`

### Issue 2: Jobs Not Being Queued
**Symptom:** No jobs in queue after upload
**Check:**
1. Redis connection
2. Queue initialization
3. Upload endpoint logs

### Issue 3: Jobs Failing
**Symptom:** Jobs in "Failed" state
**Check:**
1. Railway logs for error messages
2. Python parser service accessibility
3. HMAC secret matching

### Issue 4: Identity Not Matching
**Symptom:** Documents marked "needs_review" even when correct
**Check:**
1. Candidate data in `candidates` table (CNIC, email, phone, name)
2. Extracted identity from document (check `extracted_identity_json` in `candidate_documents`)
3. Normalization (CNIC, passport, phone are normalized before matching)

## Testing

Run the diagnostic script:
```bash
cd backend
node scripts/trace-document-upload.js
```

This will show:
- Recent document uploads
- Candidate records
- Verification logs
- Queue status

## Conclusion

✅ **All endpoints are connected correctly**
✅ **AI is searching in the right database (`candidates` table)**
✅ **New system (`candidate_documents`) is being used**
✅ **No old endpoints are being used**

**The issue is likely:**
- Worker not running (check Railway logs)
- Jobs not being processed (check queue status)
- Worker errors (check Railway logs)
