# Investigation Summary - Base64 Encoding Issue

## Problem
Tests are failing because Python parser receives raw text (`CV\nJohn Doe=`) instead of base64 (`Q1YKSm9obiBEb2U=`).

## Expected Flow
1. File uploaded as Buffer → Supabase Storage (binary)
2. File downloaded from Supabase Storage → Blob
3. Blob → ArrayBuffer → Buffer → base64 string
4. base64 string → JSON body → Python parser
5. Python parser validates and decodes base64

## Current Status

### Backend Code (documentVerificationWorker.ts)
- ✅ Downloads file from Supabase as Blob
- ✅ Converts Blob → ArrayBuffer → Buffer
- ✅ Converts Buffer → base64 using `buffer.toString('base64')`
- ✅ Logs base64 preview (first 50 chars)
- ✅ Sends base64 in JSON body: `{file_content: base64Content, ...}`

### Python Parser Code (main.py)
- ✅ Receives JSON body
- ✅ Extracts `file_content` from payload
- ✅ Validates base64 pattern (A-Z, a-z, 0-9, +, /, =)
- ✅ Adds padding if needed
- ✅ Decodes base64 to bytes

## Issue Found
Python parser logs show it's receiving raw text:
```
first 50 chars: CV
  John Doe=
```

This suggests:
1. **Either**: Backend is sending raw text instead of base64
2. **Or**: File download from Supabase is returning text instead of binary
3. **Or**: JSON.stringify is corrupting the base64 string

## Next Steps to Investigate

1. ✅ Check backend logs for base64 preview (should show `Q1YKSm9obiBEb2U=`)
2. ✅ Check Python parser logs for what it receives
3. ⏳ Verify file is stored correctly in Supabase (binary, not text)
4. ⏳ Test if JSON.stringify corrupts base64 (shouldn't, but verify)
5. ⏳ Check if Supabase download returns text for .txt files
6. ⏳ Add more detailed logging at each step

## Hypothesis
**Most Likely**: Supabase storage `.download()` might be auto-decoding text files to UTF-8 strings instead of returning binary Blob. This would explain why we get raw text instead of base64.

## Fix Strategy
1. Force binary download from Supabase (if possible)
2. Or: Re-encode text files as binary before base64 encoding
3. Or: Check file mime_type and handle text files differently
