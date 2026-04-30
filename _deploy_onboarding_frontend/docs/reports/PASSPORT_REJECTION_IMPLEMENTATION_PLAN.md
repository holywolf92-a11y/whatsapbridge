# Passport Verification Failure Handling - Implementation Plan

## Overview
Comprehensive system for handling passport verification failures with detailed rejection reasons, UI popups, and admin override capabilities.

---

## STEP 1: Backend - Diagnose & Persist Rejection Reasons

### 1.1 Standardize Rejection Reason Codes
**File**: `backend/src/config/documentCategories.ts`

**Action**: Add rejection reason codes enum:
```typescript
export enum REJECTION_REASON_CODES {
  NAME_MISMATCH = 'NAME_MISMATCH',
  CNIC_MISMATCH = 'CNIC_MISMATCH',
  DOB_MISMATCH = 'DOB_MISMATCH',
  EXPIRED_PASSPORT = 'EXPIRED_PASSPORT',
  LOW_OCR_CONFIDENCE = 'LOW_OCR_CONFIDENCE',
  PHOTO_MISMATCH = 'PHOTO_MISMATCH',
  DOCUMENT_TAMPERED = 'DOCUMENT_TAMPERED',
  UNREADABLE_DOCUMENT = 'UNREADABLE_DOCUMENT',
  AI_PROCESSING_FAILED = 'AI_PROCESSING_FAILED',
  PASSPORT_MISMATCH = 'PASSPORT_MISMATCH', // Already exists
}
```

**Helper Function**: Create `getRejectionReasonMessage(code: string): string` to map codes to human-readable messages.

---

### 1.2 Database Schema Updates
**File**: `backend/migrations/015_add_rejection_details.sql`

**Action**: Add columns to `candidate_documents`:
```sql
ALTER TABLE candidate_documents
  ADD COLUMN IF NOT EXISTS rejection_code TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS mismatch_fields JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2),
  ADD COLUMN IF NOT EXISTS verified_against JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS verification_source TEXT DEFAULT 'ai_verification',
  ADD COLUMN IF NOT EXISTS override_reason TEXT,
  ADD COLUMN IF NOT EXISTS overridden_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS overridden_at TIMESTAMPTZ;

-- Index for rejection queries
CREATE INDEX IF NOT EXISTS idx_candidate_documents_rejection_code 
  ON candidate_documents(rejection_code) 
  WHERE rejection_code IS NOT NULL;
```

**Action**: Create `admin_override_logs` table:
```sql
CREATE TABLE IF NOT EXISTS admin_override_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES candidate_documents(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  action TEXT NOT NULL DEFAULT 'ADMIN_OVERRIDE',
  previous_status TEXT NOT NULL,
  override_reason TEXT NOT NULL,
  overridden_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_override_logs_document 
  ON admin_override_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_admin_override_logs_candidate 
  ON admin_override_logs(candidate_id);
```

---

### 1.3 Update Identity Matching Service
**File**: `backend/src/services/identityMatchingService.ts`

**Action**: Update `matchIdentity()` return type to include detailed rejection:
```typescript
interface IdentityMatchResult {
  matched: boolean;
  matched_on: string[];
  confidence: number;
  reason_code: string;
  mismatch_fields?: string[];
  rejection_code?: string; // NEW
  rejection_reason?: string; // NEW
  candidate_fields: {...};
  notes?: string;
}
```

**Action**: When passport/CNIC mismatch occurs, set:
- `rejection_code`: `REJECTION_REASON_CODES.PASSPORT_MISMATCH` or `CNIC_MISMATCH`
- `rejection_reason`: Human-readable message
- `mismatch_fields`: Array of mismatched fields

---

### 1.4 Update Document Verification Worker
**File**: `backend/src/workers/documentVerificationWorker.ts`

**Action**: When status is `rejected_mismatch` or `failed`, persist:
```typescript
await db
  .from('candidate_documents')
  .update({
    verification_status: finalStatus,
    rejection_code: matchResult?.rejection_code || 'AI_PROCESSING_FAILED',
    rejection_reason: matchResult?.rejection_reason || getRejectionReasonMessage(rejection_code),
    mismatch_fields: mismatchFields || [],
    ai_confidence: aiResult.confidence || 0,
    verified_against: {
      candidate_id: candidateId,
      source: 'passport'
    }
  })
  .eq('id', documentId);
```

**Action**: Add expiry check:
```typescript
if (identity.passport_expiry) {
  const expiryDate = new Date(identity.passport_expiry);
  if (expiryDate < new Date()) {
    finalStatus = VERIFICATION_STATUS.REJECTED_MISMATCH;
    rejection_code = REJECTION_REASON_CODES.EXPIRED_PASSPORT;
    rejection_reason = `Passport expired on ${expiryDate.toISOString().split('T')[0]}`;
  }
}
```

---

### 1.5 API Response Contract
**File**: `backend/src/controllers/documentController.ts`

**Action**: Update `listCandidateDocumentsControllerNew` response:
```typescript
{
  documents: [{
    ...doc,
    rejection: doc.rejection_code ? {
      code: doc.rejection_code,
      reason: doc.rejection_reason,
      fields: doc.mismatch_fields || [],
      confidence: doc.ai_confidence || 0
    } : null,
    error_stage: doc.verification_status === 'failed' ? 'OCR' | 'Vision' | 'Matching' : null,
    retry_possible: doc.verification_status === 'failed' ? true : false
  }]
}
```

---

## STEP 2: Frontend - UI Popups & Admin Override

### 2.1 Rejection Popup Component
**File**: `src/components/PassportRejectionModal.tsx`

**Props**:
```typescript
interface PassportRejectionModalProps {
  document: {
    id: string;
    fileName: string;
    rejection: {
      code: string;
      reason: string;
      fields: string[];
      confidence: number;
    };
    status: 'rejected_mismatch' | 'failed';
  };
  onClose: () => void;
  onRequestOverwrite: () => void;
}
```

**UI Structure**:
- Title: "❌ Passport Verification Failed"
- Reason section (dynamic)
- Mismatch Fields list
- AI Confidence display
- Status badge
- Actions: Close, Request Overwrite (if admin)

---

### 2.2 Admin Override Modal Component
**File**: `src/components/AdminOverrideModal.tsx`

**Props**:
```typescript
interface AdminOverrideModalProps {
  document: {
    id: string;
    fileName: string;
    rejection: {
      code: string;
      reason: string;
    };
  };
  onClose: () => void;
  onConfirm: (password: string, justification: string) => Promise<void>;
}
```

**UI Structure**:
- Title: "⚠️ Admin Override Required"
- Warning message
- Admin password input
- Justification textarea (required)
- Actions: Cancel, Confirm Overwrite (disabled until both filled)

---

### 2.3 Integration into CandidateDetailsModal
**File**: `src/components/CandidateDetailsModal.tsx`

**Action**: 
1. Check if document has `rejection` object
2. Show `PassportRejectionModal` when document status is `rejected_mismatch` or `failed`
3. On "Request Overwrite", show `AdminOverrideModal`
4. Call override API on confirm

---

### 2.4 API Client Method
**File**: `src/lib/apiClient.ts`

**Action**: Add method:
```typescript
async overrideCandidateDocument(
  documentId: string, 
  password: string, 
  justification: string
): Promise<{ document: any; message: string }> {
  return await this.request(`/candidate-documents/${documentId}/override`, {
    method: 'POST',
    body: JSON.stringify({ password, justification })
  });
}
```

---

### 2.5 Override Badge Display
**File**: `src/components/CandidateDetailsModal.tsx`

**Action**: In document list, show badge if `verification_source === 'admin_override'`:
```tsx
{doc.verification_source === 'admin_override' && (
  <Tooltip content={`Overridden by ${doc.overridden_by_name} on ${doc.overridden_at}. Reason: ${doc.override_reason}`}>
    <Badge variant="warning">Overridden by Admin</Badge>
  </Tooltip>
)}
```

---

## STEP 3: Backend - Override Endpoint & Security

### 3.1 Override Endpoint
**File**: `backend/src/controllers/documentController.ts`

**Action**: Create `overrideCandidateDocumentController`:
```typescript
export async function overrideCandidateDocumentController(req: Request, res: Response) {
  // 1. Verify admin role (use RBAC middleware)
  // 2. Verify password (re-authentication)
  // 3. Validate justification (required, min length)
  // 4. Get current document status
  // 5. Update document status to 'verified'
  // 6. Set verification_source to 'admin_override'
  // 7. Store override_reason, overridden_by, overridden_at
  // 8. Create admin_override_logs entry
  // 9. Return updated document
}
```

---

### 3.2 Route Registration
**File**: `backend/src/routes/documents.ts`

**Action**: Add route:
```typescript
router.post(
  '/candidate-documents/:id/override',
  requireAuth,
  requireRole(['admin']), // RBAC middleware
  overrideCandidateDocumentController
);
```

---

### 3.3 Service Logic
**File**: `backend/src/services/candidateDocumentService.ts`

**Action**: Create `overrideCandidateDocument()`:
```typescript
export async function overrideCandidateDocument(
  documentId: string,
  adminUserId: string,
  justification: string
): Promise<CandidateDocument> {
  // 1. Get document
  // 2. Store previous status
  // 3. Update document
  // 4. Create audit log
  // 5. Return updated document
}
```

---

## Testing Checklist

- [ ] Test rejection with NAME_MISMATCH
- [ ] Test rejection with PASSPORT_MISMATCH
- [ ] Test rejection with EXPIRED_PASSPORT
- [ ] Test rejection popup displays correctly
- [ ] Test admin override flow (with valid admin)
- [ ] Test admin override blocked for non-admin
- [ ] Test override audit log creation
- [ ] Test override badge display
- [ ] Test API response includes rejection details
- [ ] Test error_stage and retry_possible fields

---

## Files to Create/Modify

### Backend
1. `backend/src/config/documentCategories.ts` - Add rejection codes
2. `backend/migrations/015_add_rejection_details.sql` - Database schema
3. `backend/src/services/identityMatchingService.ts` - Detailed rejection
4. `backend/src/workers/documentVerificationWorker.ts` - Persist rejection
5. `backend/src/controllers/documentController.ts` - Override endpoint
6. `backend/src/services/candidateDocumentService.ts` - Override logic
7. `backend/src/routes/documents.ts` - Override route

### Frontend
1. `src/components/PassportRejectionModal.tsx` - NEW
2. `src/components/AdminOverrideModal.tsx` - NEW
3. `src/components/CandidateDetailsModal.tsx` - Integrate modals
4. `src/lib/apiClient.ts` - Override API method

---

## Success Criteria

✅ Every rejection has a clear reason code and human-readable message
✅ Rejection details are stored in database
✅ UI shows rejection popup with all details
✅ Admin can override with authentication and justification
✅ Override is fully audited
✅ Override badge shows on documents
✅ API contract is consistent and complete
