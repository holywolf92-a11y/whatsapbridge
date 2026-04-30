# Profile Photo Issue - Current Status

## ✅ What's Working

### Backend AI Extraction
- Photos are being extracted from PDFs successfully
- Photos are uploaded to Supabase storage (`documents` bucket)
- Database is updated with photo information

### Database Proof
**Candidate**: Tehzeeb Ali (FL-2026-889)  
**ID**: `e04c1cb1-3d3a-4f41-b25a-c28ce9dc7d74`

```json
{
  "profile_photo_url": "https://...supabase.co/storage/v1/object/sign/documents/candidates/.../profile_photos/ai_extracted_....jpg?token=...",
  "profile_photo_path": "candidates/.../profile_photos/ai_extracted_....jpg",
  "profile_photo_bucket": "documents"
}
```

✅ URL exists in database  
✅ Path exists in database  
✅ Photo uploaded to storage

---

## ❌ What's Broken

### Frontend Display
Photos are **NOT showing** on the candidate profile page despite URLs existing in database.

**Screenshot Evidence**: Profile shows placeholder "TA" initials instead of photo.

---

## 🔍 Possible Causes

### 1. Frontend Field Name Mismatch
Frontend might be checking for:
- `profile_photo_signed_url` (which backend generates dynamically)
- But we're saving to: `profile_photo_url`

**Check**: Frontend code that displays candidate photos

### 2. URL Expiration
Signed URLs expire. If frontend caches old data, URL might be expired.

**Check**: URL expiration time (currently set to long-lived in our fix)

### 3. CORS/Storage Permissions
Supabase storage might not allow frontend to access images from `documents` bucket.

**Check**: 
- Supabase storage bucket policies
- Browser console for CORS errors

### 4. Frontend Not Re-fetching
Frontend might still have cached candidate data without photo URL.

**Check**: 
- Hard refresh (Ctrl+F5)
- Check network tab for API response

---

## 🔧 Quick Tests to Run

### Test 1: Check URL Directly
Copy the URL from database and paste in browser:
```
https://hncvsextwmvjydcukdwx.supabase.co/storage/v1/object/sign/documents/candidates/...
```

**Expected**: Photo displays  
**If fails**: Storage permissions issue

### Test 2: Check API Response
Open browser DevTools → Network tab → Reload page → Find API call to `/api/candidates/:id`

**Check response JSON for**:
- `profile_photo_url` field
- `profile_photo_signed_url` field

**Expected**: Should contain photo URL  
**If missing**: Backend not returning it

### Test 3: Check Frontend Code
Search frontend codebase for where candidate photo is displayed.

**Look for**:
```javascript
candidate.profile_photo_url
candidate.profile_photo_signed_url
candidate.profilePhotoUrl
```

**Expected**: Should map to correct field from API

---

## 🐛 Two Separate Issues

### Issue 1: Frontend Not Displaying (CURRENT)
- Backend: ✅ Working
- Database: ✅ Has URL
- Frontend: ❌ Not showing photo

### Issue 2: Python Parser X11 (ONGOING)
- Python parser can't load face-recognition library
- Error: `libX11.so.6: cannot open shared object file`
- Railway not installing X11 dependencies from nixpacks.toml
- **Workaround**: Backend AI extraction works fine

---

## 📋 To Share with Another Developer

"Backend is successfully extracting photos from CVs and saving URLs to the database (`profile_photo_url` field), but the frontend is not displaying them. The candidate profile page shows placeholder initials instead.

Database has:
- `profile_photo_url`: Full signed URL
- `profile_photo_bucket`: 'documents'
- `profile_photo_path`: 'candidates/.../profile_photos/ai_extracted_....jpg'

Need to check:
1. What field the frontend is reading for photos
2. If there are CORS issues accessing Supabase storage
3. If the frontend needs a hard refresh to see new data"

---

## 🔍 Next Investigation Steps

1. Check browser DevTools console for errors
2. Check browser DevTools network tab for API response
3. Test photo URL directly in browser
4. Review frontend candidate display component
5. Check Supabase storage bucket permissions
