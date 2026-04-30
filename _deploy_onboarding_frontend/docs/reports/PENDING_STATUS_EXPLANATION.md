# 📋 Document "Pending" Status Explanation

## What "Pending" Means

The **"Pending"** status you see in the document list refers to the **verification_status**, which is different from the **document flags** (green/red icons) in the card.

### Two Different Systems:

1. **Document Flags** (Green/Red Icons in Card)
   - `cv_received`, `passport_received`, `certificate_received`, etc.
   - Shows whether a document EXISTS for that type
   - Should be **green immediately** after upload
   - **Fixed**: Now checks filename immediately, not waiting for AI

2. **Verification Status** (Pending/Verified in Document List)
   - `verification_status: pending_ai`, `verified`, `needs_review`, etc.
   - Shows whether AI has VERIFIED the document matches the candidate
   - Starts as "Pending" and updates after AI processing
   - This is **normal** - it means AI verification is in progress

## Why It Shows "Pending"

1. Document is uploaded → `verification_status: pending_ai`
2. AI verification job is enqueued
3. AI worker processes the document:
   - Categorizes the document (passport, CV, etc.)
   - Extracts identity information
   - Matches against candidate record
   - Updates status to `verified`, `needs_review`, or `rejected_mismatch`

## What's Fixed

✅ **Flags now set immediately** based on filename:
- `Muhammad_Farhan_Passport.pdf` → `passport_received = true` immediately
- Green icon shows in card right away
- Doesn't wait for AI categorization

## What's Still "Pending"

The verification status will remain "Pending" until:
1. AI worker processes the document (usually within seconds/minutes)
2. AI categorizes and verifies the document
3. Status updates to "Verified" or "Needs Review"

## If Status Stays "Pending" Too Long

If the document stays "Pending" for more than a few minutes, check:

1. **Is the AI worker running?**
   - Check Railway logs for `documentVerificationWorker`
   - Look for errors in worker logs

2. **Is Redis configured?**
   - AI jobs use BullMQ which requires Redis
   - Check `REDIS_URL` environment variable

3. **Is AI service configured?**
   - Check AI service endpoint configuration
   - Verify API keys are set

4. **Manual Reprocess:**
   - Use the "Reprocess" button in the document list
   - Or call: `POST /api/documents/candidate-documents/:id/reprocess`

## Summary

- ✅ **Flags (green/red icons)**: Fixed - show immediately
- ⏳ **Verification Status (Pending)**: Normal - updates after AI processes
- 🔄 **After AI completes**: Status will change to "Verified" or "Needs Review"

The card icons should now show green immediately after upload, even if verification status is still "Pending".
