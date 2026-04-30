# AI Document Verification - Troubleshooting Guide

## Problem: All Documents Getting `needs_review (NO_ID_FOUND)` Status

### Symptoms
- Documents upload successfully ✅
- Worker processes them ✅
- AI categorization works ✅
- But all documents end with status: `needs_review` with reason: `NO_ID_FOUND`
- No identity fields are extracted from documents

### Root Cause Analysis

The verification workflow has these steps:
1. **Document Upload** → Creates record with `verification_status = pending_ai`
2. **Worker Picks Up Job** → Downloads document from storage
3. **AI Categorization** → Calls Python parser `/categorize-document` endpoint
4. **Identity Extraction** → Python parser uses OpenAI to extract identity fields
5. **Identity Matching** → Matches extracted fields against candidate record
6. **Status Update** → Sets final status (verified, needs_review, rejected_mismatch)

**The issue is at Step 4-5**: Identity extraction is not finding any fields, so identity matching can't run.

### Possible Causes

#### 1. **Test Documents Don't Have Identity Information**
- If you're testing with simple text files without CNIC, passport, email, or phone numbers
- The AI can't extract what doesn't exist in the document

**Solution**: Test with documents that contain:
- CNIC number (format: 12345-1234567-1)
- Passport number
- Email address
- Phone number
- Full name

#### 2. **Python Parser Not Extracting Text Properly**
- PDF text extraction might be failing
- Document content might be too short or unclear

**Check**: Look at Railway logs for Python parser:
```bash
railway logs --service recruitment-portal-python-parser
```

Look for:
- `[DocumentCategorization] Extracted X characters from filename`
- If character count is 0 or very low, text extraction failed

#### 3. **OpenAI Response Format Mismatch**
- Python parser expects `extracted_identity` in response
- But OpenAI might be returning `identity_fields` instead

**Check**: The Python parser has TWO functions:
- Line 81: `categorize_document_with_ai(content, filename, candidate_data)` - uses `identity_fields`
- Line 566: `categorize_document_with_ai(file_content, file_name, mime_type)` - uses `extracted_identity` ✅ (This is the one being used)

The endpoint at line 716 calls the correct function (line 566).

#### 4. **OpenAI Not Finding Identity in Document**
- Document might be an image without OCR
- Text might be too unclear
- Document might not contain identity information

**Solution**: Check the extracted text length in Python parser logs

### Diagnostic Steps

#### Step 1: Check Worker is Running
```bash
railway logs --service recruitment-portal-backend | grep "DocumentVerificationWorker"
```

Should see: `[DocumentVerificationWorker] Worker started, listening for jobs...`

#### Step 2: Check Python Parser Logs
```bash
railway logs --service recruitment-portal-python-parser | grep "DocumentCategorization"
```

Look for:
- `Extracted X characters` - Should be > 0
- `Categorized as: X (confidence: Y)` - Should show category and confidence

#### Step 3: Check a Recent Document
Query the database:
```sql
SELECT 
  id,
  file_name,
  verification_status,
  verification_reason_code,
  category,
  confidence,
  extracted_identity_json,
  ai_processing_started_at,
  ai_processing_completed_at
FROM candidate_documents
ORDER BY created_at DESC
LIMIT 5;
```

Check:
- `extracted_identity_json` - Is it null or empty?
- `verification_reason_code` - Is it `NO_ID_FOUND`?

#### Step 4: Run Diagnostic Script
```bash
cd "Recruitment Automation Portal (2)/backend"
node scripts/diagnose-document-verification.js <candidate-id>
```

This will:
- Check backend health
- Test document upload with identity info
- Poll for verification status
- Show verification logs
- Diagnose issues

### Solutions

#### Solution 1: Test with Document Containing Identity

Create a test document with actual identity information:

```text
CURRICULUM VITAE

Name: John Doe
Father's Name: John Senior
CNIC: 12345-1234567-1
Email: john.doe@example.com
Phone: +92-300-1234567
Date of Birth: 1990-01-15

PROFESSIONAL SUMMARY
Software Engineer with 5 years of experience...
```

Upload this document for a candidate that has matching CNIC/email/phone in the database.

#### Solution 2: Check Python Parser Response

The Python parser should return:
```json
{
  "success": true,
  "category": "cv_resume",
  "confidence": 0.95,
  "ocr_confidence": 0.90,
  "extracted_identity": {
    "name": "John Doe",
    "cnic": "12345-1234567-1",
    "email": "john.doe@example.com",
    "phone": "+92-300-1234567",
    ...
  }
}
```

If `extracted_identity` is null or empty, the AI didn't find identity fields.

#### Solution 3: Improve OpenAI Prompt

The current prompt in `python-parser/main.py` (line 606-650) asks OpenAI to extract identity. If it's not working:

1. **Increase max_tokens**: Currently 500, might need more for complex documents
2. **Improve prompt**: Make it more explicit about what to extract
3. **Add examples**: Show OpenAI what a good extraction looks like

#### Solution 4: Check Text Extraction

The Python parser extracts text from PDFs using `extract_text_from_pdf()`. If this fails:
- PDF might be image-based (needs OCR)
- PDF might be corrupted
- Text extraction library might have issues

**Check logs** for: `[DocumentCategorization] Extracted X characters`

### Expected Workflow

1. **Upload Document** → Status: `pending_ai`
2. **Worker Processes** → Downloads from storage
3. **AI Categorization** → Extracts text, calls OpenAI
4. **Identity Extraction** → Gets `extracted_identity` from OpenAI
5. **Identity Matching**:
   - If CNIC matches → Status: `verified`
   - If passport matches → Status: `verified`
   - If email + name match → Status: `verified`
   - If no IDs found → Status: `needs_review` (NO_ID_FOUND)
   - If IDs don't match → Status: `rejected_mismatch`

### Verification Status Meanings

- `pending_ai`: Document queued for AI processing
- `verified`: Identity matched successfully
- `needs_review`: No identity found or low confidence (needs manual review)
- `rejected_mismatch`: Identity found but doesn't match candidate
- `failed`: AI processing or system error

### Quick Fix Checklist

- [ ] Worker is running (`RUN_WORKER=true` set)
- [ ] Python parser service is accessible
- [ ] Test document contains actual identity information (CNIC, passport, email, phone)
- [ ] Candidate record in database has matching identity fields
- [ ] Check Python parser logs for text extraction
- [ ] Check `extracted_identity_json` in database
- [ ] Run diagnostic script to identify specific issue

### Next Steps

1. **Run the diagnostic script** to identify the exact issue
2. **Check Railway logs** for both backend and Python parser
3. **Test with a document that has actual identity information**
4. **Verify candidate record has matching CNIC/email/phone**

### Common Issues Summary

| Issue | Symptom | Solution |
|-------|---------|----------|
| No identity in document | `NO_ID_FOUND` | Use document with CNIC/passport/email |
| Text extraction failed | 0 characters extracted | Check PDF format, use OCR for images |
| OpenAI not extracting | `extracted_identity` is null | Improve prompt, increase max_tokens |
| Identity doesn't match | `REJECTED_MISMATCH` | Verify candidate record has correct data |
| Worker not running | Status stuck at `pending_ai` | Set `RUN_WORKER=true` |

### Need More Help?

1. Check verification logs:
   ```sql
   SELECT * FROM document_verification_logs 
   WHERE document_id = '<document-id>'
   ORDER BY created_at;
   ```

2. Check worker logs for errors:
   ```bash
   railway logs --service recruitment-portal-backend | grep "DocumentVerification"
   ```

3. Check Python parser logs:
   ```bash
   railway logs --service recruitment-portal-python-parser | grep "Categorization"
   ```
