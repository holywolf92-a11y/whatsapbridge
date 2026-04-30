# 🔧 Inbox CV Document Flag Fix

## Issue

When a CV is uploaded from the inbox (email/Gmail), the document flags (green/red icons) on the candidate card are **not set immediately**. The system doesn't recognize the inbox CV as a document until flags are manually updated.

## Root Cause

The CV parser worker (`cvParserWorker.ts`) creates a candidate and links the inbox attachment, but **doesn't call `updateDocumentFlagsController`** to set the `cv_received` flag. This means:

1. CV is uploaded to inbox → stored in `inbox_attachments` with `attachment_kind = 'cv'`
2. CV parser worker processes it → creates candidate → links attachment
3. **Missing step**: Flags are never set, so card shows no document icons

## Fix

**File**: `Recruitment Automation Portal (2)/backend/src/workers/cvParserWorker.ts`

**Change**: After creating a candidate from parsed CV data, immediately call `updateDocumentFlagsController` to set the `cv_received` flag.

### Code Added

```typescript
// After creating candidate from parsed data
const newCandidate = await createCandidateFromParsedData(parsed, attachmentId);

// IMPORTANT: Set cv_received flag immediately after candidate is created from inbox CV
if (newCandidate?.id) {
  try {
    const { updateDocumentFlagsController } = await import('../controllers/candidateController');
    const mockReq = { params: { id: newCandidate.id }, body: {} } as any;
    const mockRes = {
      status: (code: number) => ({ 
        json: (data: any) => {
          if (code >= 400) {
            console.error(`[CVParser] Flag update failed (${code}):`, data);
          } else {
            console.log(`[CVParser] Document flags updated for candidate ${newCandidate.id} (CV from inbox)`);
          }
          return mockRes;
        }
      }),
    } as any;
    
    await updateDocumentFlagsController(mockReq, mockRes);
    console.log(`[CVParser] Successfully set cv_received flag for candidate ${newCandidate.id}`);
  } catch (flagError: any) {
    // Log but don't fail the parsing job if flag update fails
    console.error(`[CVParser] Failed to update document flags for candidate ${newCandidate.id}:`, flagError?.message);
  }
}
```

## How It Works

1. **CV uploaded to inbox** → stored in `inbox_attachments` with `attachment_kind = 'cv'`
2. **CV parser worker processes** → creates candidate → links attachment
3. **NEW**: Calls `updateDocumentFlagsController` which:
   - Checks `inbox_attachments` for `attachment_kind = 'cv'`
   - Sets `cv_received = true` and `cv_received_at = now()` in `candidates` table
4. **Result**: Card immediately shows green CV icon ✅

## Expected Behavior

### Before Fix:
- CV uploaded from inbox → Candidate created
- Card shows **no document icons** (flags not set)
- User must manually refresh or wait for some other process

### After Fix:
- CV uploaded from inbox → Candidate created
- **Immediately** calls `updateDocumentFlagsController`
- Card shows **green CV icon** right away ✅
- Document list shows "1 files" with CV icon

## Testing

1. **Upload a CV to inbox** (via email/Gmail)
2. **Wait for CV parser to process** (usually 10-30 seconds)
3. **Check candidate card**:
   - Should show green CV icon immediately
   - Document list should show "1 files"
   - CV icon should be green with checkmark

4. **Check Railway logs** for:
   ```
   [CVParser] Created candidate ... for attachment ...
   [CVParser] Document flags updated for candidate ... (CV from inbox)
   [CVParser] Successfully set cv_received flag for candidate ...
   [UpdateDocumentFlags] Found 1 inbox attachments for candidate ...
   ```

## Notes

- The flag update is **non-blocking** - if it fails, the CV parsing job still succeeds
- Uses dynamic import to avoid circular dependencies
- The `updateDocumentFlagsController` already checks `inbox_attachments.attachment_kind = 'cv'`, so it will correctly identify inbox CVs
- This fix ensures **all inbox CVs** get flags set immediately, not just manually uploaded ones

## Related Files

- `backend/src/workers/cvParserWorker.ts` - CV parser worker (modified)
- `backend/src/controllers/candidateController.ts` - `updateDocumentFlagsController` (already checks inbox_attachments)
- `backend/src/services/candidateService.ts` - `createCandidate` function
