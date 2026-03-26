# 🔧 Fix Approved Photos (Retroactive Update)

## Problem

You approved Muhammad Adnan's photo **before** the auto-update feature was deployed.

- ✅ Photo document status: `verified`
- ❌ Candidate `profile_photo_url`: `NULL`

**Result:** Photo doesn't appear in card or CV

---

## Solution

I've created a **retroactive fix** that:
1. Finds all candidates with `verified` photo documents
2. Checks if `profile_photo_url` is empty
3. Updates the candidate's `profile_photo_url` with the photo file URL

---

## How to Fix

### Option 1: Run PowerShell Script (Easiest) ⭐

```powershell
.\fix-photos.ps1
```

This script:
- ✅ Calls the backend API
- ✅ Shows you which candidates were fixed
- ✅ Works from your local machine

### Option 2: Call API Directly

```bash
curl -X POST https://recruitment-portal-backend-production-2475.up.railway.app/api/documents/fix-approved-photos
```

### Option 3: From Browser Console

```javascript
fetch('https://recruitment-portal-backend-production-2475.up.railway.app/api/documents/fix-approved-photos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(d => console.log(d));
```

---

## After Running the Fix

1. ✅ **Refresh your browser**
2. ✅ **Check Muhammad Adnan's card** → Photo should appear
3. ✅ **Download his CV** → Photo should be in sidebar

---

## What Was Deployed

### New Endpoint
**POST** `/api/documents/fix-approved-photos`

**Response:**
```json
{
  "success": true,
  "message": "Fixed 1 candidate(s)",
  "fixed": 1,
  "alreadySet": 0,
  "total": 1,
  "candidates": [
    {
      "id": "...",
      "name": "MR. MUHAMMAD ADNAN",
      "photo_url": "https://...",
      "document": "Muhammad Adnan - Profile Photo [12345].pdf"
    }
  ]
}
```

### Files Created
- ✅ `src/controllers/fixApprovedPhotosController.ts` - API endpoint
- ✅ `scripts/fix-approved-photos.js` - Node.js script (requires .env)
- ✅ `scripts/fix-approved-photos.sql` - SQL script (manual)
- ✅ `fix-photos.ps1` - PowerShell script (easiest to run)

---

## Deployment Status

- ✅ **Commit:** `08f1f83`
- ⏳ **Railway deploying** (~2-3 minutes)

---

## Timeline

### What Happened:
1. **Before:** You approved photo → Old code didn't set `profile_photo_url`
2. **Deploy 1:** New code auto-updates `profile_photo_url` on approval
3. **Deploy 2:** Retroactive fix endpoint to update old approvals
4. **Now:** Run fix script → Muhammad Adnan gets his photo

---

## After Deployment (in ~3 minutes):

1. **Run the fix script:**
   ```powershell
   .\fix-photos.ps1
   ```

2. **Output should show:**
   ```
   ✅ Success!
   
   📊 Summary:
      Fixed: 1 candidate(s)
      Already set: 0 candidate(s)
      Total processed: 1 photo document(s)
   
   👥 Fixed Candidates:
      ✓ MR. MUHAMMAD ADNAN
        Document: Muhammad Adnan - Profile Photo [12345].pdf
   
   🎉 Photos will now appear in candidate cards and CVs!
   💡 Refresh your browser to see the changes.
   ```

3. **Refresh browser** → Photo appears everywhere! 📸

---

## Future Approvals

**Good news:** This is a one-time fix!

From now on, when you click "Approve" on any photo:
- ✅ Photo is automatically set on the candidate
- ✅ Photo appears in card immediately
- ✅ Photo appears in CV immediately
- ✅ No manual fix needed!

---

## Technical Details

### Controller Logic
```typescript
// Find verified photos with no profile_photo_url
const photos = await db
  .from('candidate_documents')
  .select('*')
  .eq('category', 'photos')
  .eq('verification_status', 'verified');

// Update each candidate
for (const photo of photos) {
  await db
    .from('candidates')
    .update({
      profile_photo_url: photo.file_url,
      photo_received: true
    })
    .eq('id', photo.candidate_id);
}
```

### Why This Happened
- Photos were approved **before** the auto-update code was deployed
- Old approval code only updated document status
- New approval code (commit `eadbc4f`) also updates candidate
- This fix script bridges the gap for old approvals

---

## ✅ Status: Ready to Fix

**Next Step:** Wait ~3 minutes for Railway, then run `.\fix-photos.ps1` 🚀
