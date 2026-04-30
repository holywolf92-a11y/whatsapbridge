# Week 4: Document Auto-Linking System - Implementation Complete

## Overview
Comprehensive document auto-linking system has been fully implemented with all core infrastructure in place. The system automatically classifies, matches, and links supporting documents (passport, CNIC, degree, medical, visa) to candidates using intelligent priority-based matching.

## Implementation Status: ✅ COMPLETE (Core) | ⏳ PENDING (Database Migration)

### What's Been Implemented

#### 1. **Core Services** ✅
- **DocumentClassifier** (`src/services/documentClassifier.ts`)
  - Classifies attachments as CV, document, or unknown based on filename and email subject
  - Identifies specific document types (passport, CNIC, degree, medical, visa, certificate)
  - Extracts metadata from filenames (CNIC numbers, phone numbers, candidate names)
  - Generates appropriate storage paths based on classification

- **CandidateMatcher** (`src/services/candidateMatcher.ts`)
  - Implements strict priority-based matching: CNIC → Email → Phone → Name+Father
  - Uses Levenshtein distance algorithm for name matching (0.92 similarity threshold)
  - Detects multiple matches and flags for manual review
  - Returns match confidence scores

- **DocumentLinkService** (`src/services/documentLinkService.ts`)
  - Orchestrates complete document linking workflow
  - Handles file movement in Supabase Storage
  - Manages both automatic linking and unmatched document storage
  - Implements reconciliation for documents arriving before CV
  - Updates candidate document checklist automatically

#### 2. **Queue & Worker Infrastructure** ✅
- **DocumentLinkQueue** (`src/queues/documentLinkQueue.ts`)
  - BullMQ-based queue for asynchronous document processing
  - Automatic retry with exponential backoff (3 attempts)
  - Job retention: 24h for successful, 7 days for failed

- **DocumentLinkWorker** (`src/workers/documentLinkWorker.ts`)
  - Processes document linking jobs from queue
  - Skips CVs (handled by separate CV parser flow)
  - Extracts metadata from email source
  - Concurrency: 3 jobs | Rate limit: 10 jobs/min

#### 3. **Automatic Triggers** ✅
- **Attachment Ingestion** (`src/services/inboxAttachmentService.ts`)
  - Classifies all attachments immediately upon upload
  - Stores classification metadata (attachment_kind, document_type)
  - Auto-enqueues documents for linking
  - Prevents duplicate uploads via SHA256 hashing

- **Candidate Creation** (`src/services/candidateService.ts`)
  - Triggers document reconciliation when new candidate is created
  - Attempts to link any pending unmatched documents
  - Handles "documents arrive before CV" scenario

#### 4. **API Routes** ✅
New endpoints added to `/api/documents`:

```
GET  /api/documents/candidates/:candidateId/documents
  → Returns all matched documents for a candidate with download URLs
  
GET  /api/documents/unmatched
  → Returns pending unmatched documents with pagination and filters
  
POST /api/documents/unmatched/:documentId/link
  → Manually link an unmatched document to a candidate
  
GET  /api/documents/checklist/:candidateId
  → Returns document receipt checklist status (passport, CNIC, degree, etc.)
```

#### 5. **Worker Integration** ✅
- Document link worker added to server startup in `src/server.ts`
- Runs alongside existing CV parser worker
- Only starts when `RUN_WORKER=true` and Redis is configured

#### 6. **Database Migration** ⏳ READY TO RUN
Migration file: `backend/migrations/010_add_document_linking_support.sql`

**Creates:**
- `inbox_attachments` extended with:
  - `attachment_kind` (cv | document | unknown)
  - `document_type` (passport | cnic | degree | medical | visa | certificate)
  - `linked_candidate_id` (foreign key to candidates)
  - `received_at` (timestamp)

- `candidate_documents` table for matched documents
  - Stores document type, storage path, source, status
  - Linked to candidate via foreign key
  - Automatic trigger updates candidate checklist

- `unmatched_documents` table for pending links
  - Stores extracted metadata (email, phone, name, CNIC)
  - Flags ambiguous cases for manual review
  - Reconciliation attempts with link history

- `candidates` table extended with:
  - Document receipt flags: `passport_received`, `cnic_received`, `degree_received`, `medical_received`, `visa_received`
  - Receipt timestamps: `*_received_at` fields
  - `father_name` field for improved name matching

**Trigger:**
- `update_candidate_document_checklist()` automatically updates receipt flags when documents are linked

---

## System Architecture

```
Email/WhatsApp Attachment
         ↓
   InboxAttachmentService
         ↓
   DocumentClassifier → Extract metadata
         ↓
   [Classify: CV vs Document]
         ↓
    ├─→ CV → inbox/ → CV Parser → Candidate Creation
    │                                    ↓
    │                        reconcileDocumentsForCandidate()
    │                                    ↓
    │                          [Try linking unmatched docs]
    │
    └─→ Document → unmatched/ → DocumentLinkQueue
                                      ↓
                            DocumentLinkWorker
                                      ↓
                              CandidateMatcher
                                      ↓
              [Single match] → LinkToCandidate → candidates/
              [No match] → Stays in unmatched/ 
              [Multiple matches] → Mark needs_manual_review
                                      ↓
                            Manual Admin Review
```

## Matching Priority

1. **CNIC (99% confidence)** - Most reliable identifier
2. **Email (95% confidence)** - Email from message source
3. **Phone (90% confidence)** - Phone number extracted from metadata
4. **Name + Father Name (85% confidence, requires 92%+ similarity)** - Last resort

If multiple candidates match at any priority level → flag for manual review

---

## Data Flow Examples

### Scenario A: CV Arrives, Then Passport
```
1. CV uploaded → Classified as CV → Goes to inbox/
2. CV parsed → Candidate "Ahmad" created with email ahmad@example.com
3. reconcileDocumentsForCandidate() runs → Finds unmatched passport
4. Passport has extracted email "ahmad@example.com"
5. CandidateMatcher finds single match → Auto-links!
6. candidates/[id]/documents/passport/[filename] created
7. candidates.passport_received = true, passport_received_at updated
```

### Scenario B: Passport Arrives, Then CV
```
1. Passport uploaded → Classified as document
2. DocumentLinkWorker tries to link → No candidates exist yet
3. No match found → Stored in unmatched_documents with extracted_email
4. Later: CV uploaded → Candidate "Ahmad" created
5. reconcileDocumentsForCandidate() finds passport in unmatched
6. Email matches! → Passport moved to candidates/[id]/documents/
7. Unmatched document deleted, candidate checklist updated
```

### Scenario C: Ambiguous Document
```
1. Document uploaded with CNIC "12345-6789012-3"
2. CandidateMatcher searches candidates by normalized CNIC
3. Finds 2 candidates with same CNIC (duplicate data error!)
4. Sets needs_manual_review = true
5. Admin UI shows document with conflict info
6. Admin selects correct candidate → Document linked manually
```

---

## Deployment Status

### ✅ Deployed to Railway
- Backend service rebuilt and pushed
- Worker infrastructure ready
- API routes available

### ⏳ Requires Manual Action
1. **Run Database Migration**
   - Go to: https://supabase.com/dashboard/project/hncvsextwmvjydcukdwx/sql/new
   - Copy entire `backend/migrations/010_add_document_linking_support.sql`
   - Paste and click "Run"
   - Verify all tables created successfully

2. **Verify Environment Variables** (Already Configured)
   - `RUN_WORKER=true` (enables document link worker)
   - `REDIS_URL` (for BullMQ)
   - `PYTHON_CV_PARSER_URL` (for CV parsing)
   - `PYTHON_HMAC_SECRET` (for secure communication)

---

## Testing Checklist

### Test A: CV Then Supporting Document
```
1. Upload "Ahmad CV.pdf" (CV)
   ✓ Parsed → Candidate created
   ✓ candidate.id = [id_1]

2. Upload "ahmad-passport.pdf" (document with extracted email matching Ahmad)
   ✓ Automatically linked to candidate [id_1]
   ✓ Created: candidates/[id_1]/documents/passport/ahmad-passport.pdf
   ✓ candidates.passport_received = true
   ✓ GET /api/documents/checklist/[id_1] shows passport_received: true
```

### Test B: Supporting Document Then CV (Reconciliation)
```
1. Upload "CNIC-12345.pdf" (document, CNIC extracted)
   ✓ No candidate exists → Stored in unmatched_documents
   ✓ GET /api/documents/unmatched returns the document

2. Upload "ahmad-cv.pdf" (CV with CNIC 12345)
   ✓ Candidate "Ahmad" created with cnic_normalized = "12345"
   ✓ reconcileDocumentsForCandidate() runs
   ✓ Finds unmatched CNIC document
   ✓ CNIC matches! → Auto-links
   ✓ Document moved to candidates/[id]/documents/cnic/
   ✓ Removed from unmatched_documents
   ✓ candidates.cnic_received = true
```

### Test C: Duplicate Detection & Manual Review
```
1. Create Candidate A: name="Ahmad", cnic="1234567890123"
2. Create Candidate B: name="Ahmad Khan", cnic="1234567890123" (same CNIC!)
3. Upload document with same CNIC
   ✓ CandidateMatcher finds 2 matches
   ✓ Document marked needs_manual_review = true
   ✓ Stored in unmatched_documents
   ✓ GET /api/documents/unmatched?status=needs_review returns document
4. Admin API call: POST /api/documents/unmatched/[id]/link with candidateId=A
   ✓ Document linked to Candidate A
   ✓ Removed from unmatched_documents
   ✓ Candidate A checklist updated
```

### Test D: Multiple Document Types
```
1. Upload CV → Candidate created
2. Upload Passport, CNIC, Degree, Medical, Visa documents
   ✓ All automatically linked using different match methods
   ✓ GET /api/documents/checklist shows all 5 received = true
3. Download links work via signed URLs (1-hour expiry)
4. Storage organized: candidates/[id]/documents/[type]/[filename]
```

---

## API Response Examples

### GET /api/documents/candidates/:candidateId/documents
```json
{
  "documents": [
    {
      "id": "doc-uuid-1",
      "document_type": "passport",
      "file_name": "ahmad-passport.pdf",
      "storage_path": "candidates/[id]/documents/passport/ahmad-passport.pdf",
      "received_at": "2025-01-13T10:30:00Z",
      "source": "gmail",
      "downloadUrl": "https://..."
    }
  ]
}
```

### GET /api/documents/unmatched
```json
{
  "documents": [
    {
      "id": "unmatched-uuid-1",
      "document_type": "cnic",
      "file_name": "cnic-scan.pdf",
      "storage_path": "unmatched-documents/cnic-scan.pdf",
      "extracted_metadata": {
        "cnic": "1234567890123",
        "name": "Ahmad Khan"
      },
      "needs_manual_review": false,
      "downloadUrl": "https://..."
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

### GET /api/documents/checklist/:candidateId
```json
{
  "checklist": {
    "passport": {
      "received": true,
      "receivedAt": "2025-01-13T10:30:00Z"
    },
    "cnic": {
      "received": true,
      "receivedAt": "2025-01-13T10:45:00Z"
    },
    "degree": {
      "received": false,
      "receivedAt": null
    },
    "medical": {
      "received": false,
      "receivedAt": null
    },
    "visa": {
      "received": false,
      "receivedAt": null
    }
  }
}
```

---

## Frontend UI Work Remaining

### Phase 1: Candidate Profile Enhancement
- [x] Backend API routes ready
- [ ] DocumentsChecklist widget (show passport/CNIC/degree/medical/visa status with dates)
- [ ] UploadedDocumentsList table (document type, filename, date, source, download button)
- [ ] Integrate into CandidateDetailsModal.tsx

### Phase 2: Admin Dashboard
- [ ] UnmatchedDocumentsTable (list pending documents, filter by needs_review)
- [ ] LinkDocumentModal (search candidate, show match suggestions)
- [ ] Bulk actions (link to candidate, delete, re-queue)
- [ ] Integrate into Dashboard.tsx or new Documents admin page

### Phase 3: Optional Enhancements
- [ ] Document verification workflow (verified, expired, rejected statuses)
- [ ] Expiry tracking for time-sensitive documents (medical, visa)
- [ ] Batch upload with progress tracking
- [ ] Document preview (PDF.js integration)

---

## Important Notes

1. **Migration Must Run First**
   - Database schema must be created before system can operate
   - Worker will fail if tables don't exist

2. **File Movement**
   - Documents physically moved in Supabase Storage bucket `documents/`
   - Paths automatically organized by candidate and document type
   - Signed URLs generated on-demand for 1-hour access windows

3. **Error Handling**
   - Failed matches → stored in unmatched_documents for retry
   - Multiple matches → marked needs_manual_review
   - File move failures → logged but don't block linking
   - Worker has 3 retry attempts before giving up

4. **Performance**
   - Worker concurrency: 3 jobs (configurable)
   - Rate limit: 10 jobs/min (prevents resource exhaustion)
   - Database indexes on common queries (attachment_kind, candidate_id, status)

5. **Security**
   - File access via Supabase Storage with signed URLs
   - HMAC signature validation for worker communication
   - Row-level security (if enabled) applied to all queries

---

## Next Immediate Steps

1. **Run Migration**
   ```sql
   -- Execute backend/migrations/010_add_document_linking_support.sql
   -- in Supabase SQL editor
   ```

2. **Verify Deployment**
   - Check Railway backend service health
   - Verify worker started: `POST /api/health` should show workers running

3. **Test Core Flow**
   - Upload test CV
   - Upload test supporting document
   - Verify automatic linking works

4. **Build Frontend** (when ready)
   - Start with DocumentsChecklist widget
   - Add to existing candidate profile
   - Later: UnmatchedDocuments admin UI

---

## Code Files Reference

| File | Purpose | Status |
|------|---------|--------|
| `src/services/documentClassifier.ts` | Classification logic | ✅ Complete |
| `src/services/candidateMatcher.ts` | Priority matching | ✅ Complete |
| `src/services/documentLinkService.ts` | Workflow orchestration | ✅ Complete |
| `src/queues/documentLinkQueue.ts` | BullMQ queue | ✅ Complete |
| `src/workers/documentLinkWorker.ts` | Document processor | ✅ Complete |
| `src/services/inboxAttachmentService.ts` | Classification at ingestion | ✅ Updated |
| `src/services/candidateService.ts` | Reconciliation trigger | ✅ Updated |
| `src/server.ts` | Worker startup | ✅ Updated |
| `src/routes/documents.ts` | API routes | ✅ Complete |
| `migrations/010_add_document_linking_support.sql` | Database schema | ⏳ Pending |

---

## Deployment Command History

```bash
# Build backend
npm run build --prefix backend

# Commit changes
git add -A
git commit -m "Week 4: Complete document auto-linking implementation"

# Push to GitHub (auto-deploys to Railway)
cd backend && git push origin main
```

Status: ✅ Deployed, ⏳ Awaiting database migration execution

---

**Last Updated:** 2025-01-13  
**Implemented By:** GitHub Copilot  
**Next Review:** After database migration and API testing
