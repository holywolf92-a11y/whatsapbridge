# Debugging Plan - Base64 Encoding Issue

## Problem
Python parser receives raw text (`CV\nJohn Doe=`) instead of base64 (`Q1YKSm9obiBEb2U=`).

## Comprehensive Logging Added

### Backend (documentVerificationWorker.ts)
1. ✅ Log fileData type and Blob check
2. ✅ Log raw content as hex (first 50 bytes)
3. ✅ Log raw content as text (first 50 bytes)
4. ✅ Log base64 preview (first 50 chars)
5. ✅ Log base64 length
6. ✅ Validate base64 contains only valid characters
7. ✅ Log before JSON.stringify
8. ✅ Verify JSON.parse doesn't corrupt base64

### Python Parser (main.py)
1. ✅ Log file_content type and length
2. ✅ Log first 100 chars received
3. ✅ Log last 20 chars received
4. ✅ Log after whitespace cleaning
5. ✅ Log if base64 pattern validation fails with detailed error

## Next Steps

1. **Wait for Railway deployment** (2-5 minutes)
2. **Run a single test** to generate logs
3. **Check backend logs** for:
   - What base64 is generated
   - If JSON.stringify corrupts it
   - Raw file content vs base64
4. **Check Python parser logs** for:
   - What it actually receives
   - If it's base64 or raw text
   - Where the corruption happens

## Expected Findings

### If backend logs show correct base64:
- Issue is in transmission (network/JSON)
- Or Python parser is receiving wrong data

### If backend logs show raw text:
- Issue is in file download from Supabase
- Or file storage is corrupted

### If Python receives different data than backend sends:
- Issue is in network transmission
- Or JSON parsing issue

## Hypothesis to Test

**Most Likely**: Supabase storage `.download()` might be auto-decoding text files. If the file is stored as text/plain, Supabase might return it as a decoded string instead of binary Blob.

**Test**: Check if `fileData instanceof Blob` is false for text files.
