# Quick Fix Guide: AI Document Verification - NO_ID_FOUND Issue

## The Problem

All documents are getting status `needs_review` with reason `NO_ID_FOUND`. This means the AI is not extracting identity fields (CNIC, passport, email, phone) from your test documents.

## Root Cause

The worker checks if `extracted_identity` has any non-null values:
```typescript
if (aiResult.extracted_identity && Object.keys(aiResult.extracted_identity).length > 0) {
  // Run identity matching
} else {
  // Status: needs_review (NO_ID_FOUND)
}
```

If all identity fields are `null`, it goes to the else block and sets `NO_ID_FOUND`.

## Solution 1: Test with Real Identity Data (RECOMMENDED)

**The most common issue**: Your test documents don't contain actual identity information.

### Create a Test Document with Identity

Create a file `test-cv-with-identity.txt`:

```
CURRICULUM VITAE

Personal Information:
Name: Muhammad Ali
Father's Name: Muhammad Hassan
CNIC: 12345-1234567-1
Passport Number: AB1234567
Email: muhammad.ali@example.com
Phone: +92-300-1234567
Date of Birth: 1990-05-15

PROFESSIONAL SUMMARY
Software Engineer with 5 years of experience...
```

**Important**: Make sure the candidate in your database has matching:
- CNIC: `12345-1234567-1` (normalized)
- OR Email: `muhammad.ali@example.com`
- OR Phone: `+92-300-1234567` (normalized)

### Upload and Test

1. Upload this document for a candidate that has matching identity
2. Wait 10-30 seconds for processing
3. Check status - should be `verified` if identity matches

## Solution 2: Check Python Parser Logs

Check if text extraction is working:

```bash
railway logs --service recruitment-portal-python-parser | grep "DocumentCategorization"
```

Look for:
- `Extracted X characters` - Should be > 0
- `Extracted identity fields: [...]` - Should show which fields were found
- `No identity fields extracted` - This means AI didn't find any identity

## Solution 3: Verify Database

Check what was actually extracted:

```sql
SELECT 
  id,
  file_name,
  verification_status,
  verification_reason_code,
  extracted_identity_json
FROM candidate_documents
ORDER BY created_at DESC
LIMIT 5;
```

If `extracted_identity_json` is:
- `null` → Python parser didn't return identity
- `{}` → Empty object, no fields extracted
- `{"name": null, "cnic": null, ...}` → All null values, AI didn't find identity

## Solution 4: Check Candidate Record

Make sure the candidate has identity fields in the database:

```sql
SELECT 
  id,
  name,
  cnic,
  cnic_normalized,
  passport,
  passport_normalized,
  email,
  phone,
  phone_normalized
FROM candidates
WHERE id = '<your-candidate-id>';
```

For identity matching to work, the candidate needs:
- `cnic_normalized` OR
- `passport_normalized` OR  
- `email` + `name` OR
- `phone_normalized` + `name`

## Solution 5: Run Diagnostic Script

I've created a diagnostic script to help identify the issue:

```bash
cd "Recruitment Automation Portal (2)/backend"
node scripts/diagnose-document-verification.js <candidate-id>
```

This will:
1. Check backend health
2. Test document upload with identity info
3. Poll for verification status
4. Show verification logs
5. Diagnose issues

## Expected Behavior

### When Identity is Found and Matches:
- Status: `verified`
- Reason: `VERIFIED`
- Category: Auto-assigned (e.g., `cv_resume`)

### When Identity is Found but Doesn't Match:
- Status: `rejected_mismatch`
- Reason: `CNIC_MISMATCH` or `PASSPORT_MISMATCH` or `IDENTITY_MISMATCH`
- Mismatch fields: Shows which fields don't match

### When No Identity is Found:
- Status: `needs_review`
- Reason: `NO_ID_FOUND`
- Category: May be `other_documents` if confidence is low

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| All documents get NO_ID_FOUND | Test files don't have identity | Use documents with CNIC/passport/email |
| Text extraction shows 0 characters | PDF is image-based | Use OCR or text-based PDFs |
| Identity extracted but status is needs_review | Candidate record missing identity | Add CNIC/email/phone to candidate |
| Worker not processing | RUN_WORKER not set | Set `RUN_WORKER=true` in Railway |

## Next Steps

1. **Test with a document that has actual identity information**
2. **Verify the candidate record has matching identity fields**
3. **Check Python parser logs to see what was extracted**
4. **Run the diagnostic script to identify specific issues**

## Need More Help?

See the full troubleshooting guide: `AI_DOCUMENT_VERIFICATION_TROUBLESHOOTING.md`
