# CRITICAL FIXES APPLIED - Implementation Checklist

## ✅ Fix 1: Priority-Based Mismatch Resolution
**Status**: Fixed in schema

**Changes**:
- Added `REJECTION_PRIORITY_ORDER` array
- Capture ALL mismatches in `mismatchFields` array
- Select highest priority code but keep all mismatches
- Priority: CNIC > Passport > DOB > Name > Email > Phone > Father Name

**Implementation Required**:
- [ ] Implement priority-based logic in `DocumentRejectionService.determineRejectionCode()`
- [ ] Test with multiple mismatches (e.g., name + CNIC + DOB)
- [ ] Verify all mismatches are captured in `mismatchFields`

---

## ✅ Fix 2: Confidence Scale Standardization
**Status**: Fixed in schema

**Changes**:
- Standardized to 0-1 scale everywhere in database
- Added CHECK constraints: `CHECK (ai_confidence >= 0 AND ai_confidence <= 1)`
- Convert to percentage (0-100) ONLY in UI layer
- Updated all comments to clarify 0-1 scale

**Implementation Required**:
- [ ] Ensure all confidence values stored as 0-1 in database
- [ ] Update UI components to convert 0-1 to percentage for display
- [ ] Update API responses to use 0-1 scale
- [ ] Add validation in service layer to enforce 0-1 range

---

## ✅ Fix 3: Non-Overridable Rejection Codes Guard
**Status**: Fixed in schema

**Changes**:
- Added `NON_OVERRIDABLE_CODES` array: `DOCUMENT_TAMPERED`, `PHOTO_MISMATCH`
- Added `isOverridable` flag to rejection result
- Added `getRequiredOverrideRole()` method
- Updated override endpoint to check required role dynamically
- Added `required_role` field to `admin_override_logs`

**Implementation Required**:
- [ ] Implement `isOverridable()` check in `DocumentRejectionService`
- [ ] Update override endpoint to check required role
- [ ] Require `super_admin` role for non-overridable codes
- [ ] Update UI to show different message for non-overridable rejections
- [ ] Add `required_role` to override audit log

---

## ✅ Fix 4: Retry Semantics Enhancement
**Status**: Fixed in schema

**Changes**:
- Added `retry_count INT DEFAULT 0`
- Added `max_retries INT DEFAULT 2`
- Added `can_retry` computed field: `retry_possible && retry_count < max_retries`
- Updated retry logic to check count before allowing retry

**Implementation Required**:
- [ ] Add `retry_count` and `max_retries` columns in migration
- [ ] Increment `retry_count` on each retry attempt
- [ ] Block retry if `retry_count >= max_retries`
- [ ] Update UI to show retry count and disable retry button when limit reached
- [ ] Add retry limit message in rejection modal

---

## ✅ Fix 5: Mandatory Rejection Code Enforcement
**Status**: Added to schema

**Changes**:
- Added hard error if `rejection_code` is missing
- Enforced in override endpoint
- Enforced in document verification worker

**Implementation Required**:
- [ ] Add validation in `documentVerificationWorker` to ensure `rejection_code` is set
- [ ] Throw error if document reaches `rejected_mismatch` or `failed` without `rejection_code`
- [ ] Add validation in override endpoint
- [ ] Add database constraint (if possible) or application-level check

---

## Implementation Order

1. **Database Migration** (Fix 2, 4)
   - Add confidence constraints
   - Add retry columns
   - Add required_role to admin_override_logs

2. **Backend Service** (Fix 1, 3, 5)
   - Implement `DocumentRejectionService` with priority logic
   - Add non-overridable checks
   - Add mandatory rejection_code enforcement

3. **API Layer** (Fix 2, 3)
   - Update responses to use 0-1 confidence scale
   - Add dynamic role checking in override endpoint
   - Add retry count checks

4. **Frontend** (Fix 2, 3, 4)
   - Convert confidence 0-1 to percentage for display
   - Show non-overridable message
   - Show retry count and disable when limit reached

---

## Testing Checklist

### Fix 1: Priority-Based Mismatch
- [ ] Upload document with name + CNIC + DOB mismatch
- [ ] Verify CNIC_MISMATCH is selected (highest priority)
- [ ] Verify all three fields are in `mismatchFields` array
- [ ] Verify rejection reason mentions CNIC mismatch

### Fix 2: Confidence Scale
- [ ] Verify confidence stored as 0.85 (not 85) in database
- [ ] Verify UI displays "85%" (converted from 0.85)
- [ ] Verify API returns 0.85 (not 85)
- [ ] Test with confidence = 0.0, 0.5, 1.0

### Fix 3: Non-Overridable Codes
- [ ] Upload tampered document (DOCUMENT_TAMPERED)
- [ ] Verify override button requires super_admin
- [ ] Verify admin role cannot override
- [ ] Verify super_admin can override
- [ ] Verify audit log shows `required_role: 'super_admin'`

### Fix 4: Retry Semantics
- [ ] Upload document with LOW_OCR_CONFIDENCE
- [ ] Retry once (retry_count = 1)
- [ ] Retry again (retry_count = 2)
- [ ] Verify retry button disabled (retry_count >= max_retries)
- [ ] Verify error message shows retry limit reached

### Fix 5: Mandatory Rejection Code
- [ ] Test document verification without rejection_code
- [ ] Verify error is thrown
- [ ] Verify document cannot reach rejected_mismatch without code
- [ ] Verify override endpoint rejects documents without rejection_code
