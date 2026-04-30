# Photo Display Issue - Simple Explanation

## The Problem
Photos show placeholder initials ("TA", "DR") instead of actual photos on candidate profile pages.

## What's Working ✅
1. **Backend extraction**: Successfully extracts photos from PDF CVs
2. **Storage upload**: Photos uploaded to Supabase storage (documents bucket)
3. **Database**: URLs correctly saved to `profile_photo_url` field

## What's Broken ❌
**Frontend not displaying the photos** even though URLs exist in database

## Test This First
Open browser, paste this candidate's photo URL to see if it loads:
-  Check database for candidate ID: `e04c1cb1-3d3a-4f41-b25a-c28ce9dc7d74`
- Get their `profile_photo_url` field
- Paste URL in browser

**If photo loads in browser but not in app** = Frontend issue  
**If photo doesn't load in browser** = Storage/permissions issue

## Most Likely Causes

### 1. Frontend Looking for Wrong Field
Frontend code might be checking:
```javascript
candidate.profile_photo_signed_url  // ❌ Wrong
```
Instead of:
```javascript
candidate.profile_photo_url  // ✅ Correct
```

### 2. Storage Bucket Not Public
Supabase storage `documents` bucket might not allow public access.

**Fix**: Go to Supabase Dashboard → Storage → documents bucket → Make public

### 3. Frontend Cache
Frontend might have old cached data without photo URLs.

**Fix**: Hard refresh (Ctrl+F5) or clear browser cache

## Quick Debug Steps
1. Open browser DevTools (F12)
2. Go to Network tab
3. Reload candidate page
4. Find API call to `/api/candidates/e04c1cb1-3d3a-4f41-b25a-c28ce9dc7d74`
5. Check response - does it include `profile_photo_url`?

## Backend is Fine
The backend code is working correctly:
- Extracting photos ✅
- Saving to storage ✅  
- Saving URLs to database ✅

**This is purely a frontend display issue.**

---

## Bonus Issue: Python Parser X11

Python parser has separate issue (not blocking):
- Error: `libX11.so.6: cannot open shared object file`
- Railway not installing system dependencies from nixpacks.toml
- **Workaround**: Backend AI extraction works fine

**To fix**: Need to ensure Railway uses nixpacks.toml properly (currently being ignored)
