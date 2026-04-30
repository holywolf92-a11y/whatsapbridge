# 🧪 Quick Test Checklist - Candidate Module Features

**Frontend URL:** https://exquisite-surprise-production.up.railway.app  
**Test Date:** January 14, 2026

---

## ✅ Test 1: View Profile Button

**Steps:**
1. Go to Candidate Management page
2. Click "View Profile" button on any candidate
3. Modal should open with full candidate details
4. Close modal, repeat with 2-3 different candidates

**Expected Result:**
- ✅ Modal opens immediately
- ✅ Shows real data (name, email, phone, position, etc.)
- ✅ No console errors
- ✅ Modal closes properly

**Actual Result:** _______________

---

## ✅ Test 2: Download CV Button

**Steps:**
1. Find a candidate WITH a CV (check if cv_received is true)
2. Click "Download CV" button
3. File should download
4. Find a candidate WITHOUT a CV
5. Click "Download CV" button
6. Should show error message

**Expected Result:**
- ✅ Candidate WITH CV: File downloads with correct filename
- ✅ Candidate WITHOUT CV: Alert "No CV found for this candidate. Please upload a CV first."
- ✅ No console errors

**Actual Result:** _______________

---

## ✅ Test 3: Profile Photo Upload

**Steps:**
1. Click camera button on any candidate card
2. Select a JPEG/PNG photo (< 5MB)
3. Wait for upload
4. Should see success message
5. Refresh the page
6. Check if photo appears or photo_received flag updated

**Expected Result:**
- ✅ File picker opens when camera clicked
- ✅ Success message: "Photo uploaded successfully!"
- ✅ No errors during upload
- ✅ After refresh: photo_received flag should be true

**Actual Result:** _______________

---

## ✅ Test 4: Document Cards Interactive (Partial)

**Steps:**
1. Click on a document card that has a document (green checkmark)
2. Should open document in new tab
3. Click on a document card that's missing (red X)
4. Should open file picker
5. Upload a document
6. Should see success message

**Expected Result:**
- ✅ Existing documents open in new tab
- ✅ Missing documents show file picker
- ✅ Upload succeeds with success message
- ✅ Card updates after upload

**Note:** Auto-linking NOT YET implemented - documents link to specific candidate only

**Actual Result:** _______________

---

## 🔍 Backend Health Check

Before testing, verify backend is up:

```
GET https://recruitment-portal-backend-production-d1f7.up.railway.app/health
```

Expected: `{"status": "ok"}` or similar

**Backend Status:** _______________

---

## 📝 Console Errors Check

Open browser DevTools (F12) → Console tab while testing

**Any Errors?** _______________

**Network Errors?** _______________

---

## 🎯 Summary

| Test | Status | Notes |
|------|--------|-------|
| View Profile | ⏳ | |
| Download CV | ⏳ | |
| Photo Upload | ⏳ | |
| Document Cards | ⏳ | |
| No Errors | ⏳ | |

---

## 🐛 If Something Fails

### Download CV shows 404:
- Check: Is migration 013 executed? (profile_photo_bucket column exists?)
- Check: Does candidate have CV in candidate_documents table?
- Check: Backend logs in Railway

### Photo upload fails:
- Check: Migration 013 executed successfully?
- Check: File size < 5MB?
- Check: File type is JPEG/PNG/WebP?
- Check: Backend logs for storage errors

### View Profile doesn't work:
- Check: GET /api/candidates/:id endpoint working?
- Check: Network tab - is request successful?
- Check: Console for JavaScript errors

---

## 📊 Expected Outcome

All 4 tests should **PASS** except auto-linking (not implemented yet).

If tests pass → **Phase 1 COMPLETE** ✅  
If tests fail → Check troubleshooting section above
