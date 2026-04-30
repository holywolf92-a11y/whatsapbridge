# 🔧 Troubleshooting: storageBucket Error

## Current Status
- **Backend**: ✅ Ready and waiting
- **Frontend Code**: ✅ Fixed and pushed (commit 0e8a34a)
- **Frontend Deployment**: 🔄 Auto-deploying on Railway (1-2 min)

---

## Solution: 3 Easy Steps

### Step 1: Hard Refresh Browser ⚡ (CRITICAL!)
Clear all cached files from your browser:

**Windows/Linux/Chrome/Edge/Firefox:**
```
Ctrl + Shift + R
```

**Mac/Safari/Chrome/Firefox:**
```
Cmd + Shift + R
```

**Why?** The browser cached the OLD frontend code that doesn't send `storageBucket`. Hard refresh loads the NEW code.

---

### Step 2: Wait for Frontend Deployment ⏳
Railway auto-deploys within 1-2 minutes after git push.

Check status at: https://dashboard.railway.app
- Look for "recruitment-portal-frontend" 
- Wait until status shows "Running" (not "Deploying")

---

### Step 3: Test Upload 🚀
Go to CV Inbox and try uploading a file:
1. Navigate to CV Inbox page
2. Click "Upload CV Manually"
3. Select a PDF file
4. **Expected Result**: ✅ **Success! No error!**

---

## Why You're Seeing the Error

### The Problem Flow:
```
Browser loads OLD cached code
    ↓
Frontend sends upload request WITHOUT storage_bucket
    ↓
Backend receives invalid request
    ↓
Backend says "storageBucket is required!"
    ↓
400 VALIDATION_ERROR
```

### The Fix Flow:
```
Browser loads NEW fresh code from Railway
    ↓
Frontend sends upload WITH storage_bucket: 'documents'
    ↓
Backend receives valid request
    ↓
Backend uploads file to Supabase ✅
    ↓
200 Success
```

---

## What Actually Changed

**File**: `src/components/CVInbox.tsx` (line 149)

**Before (Broken):**
```typescript
const attachment = await api.uploadAttachment(message.id, {
  file_base64: base64,
  file_name: file.name,
  mime_type: file.type || 'application/octet-stream',
  attachment_type: 'manual_upload',
  // ❌ Missing storage_bucket parameter!
});
```

**After (Fixed):**
```typescript
const attachment = await api.uploadAttachment(message.id, {
  file_base64: base64,
  file_name: file.name,
  mime_type: file.type || 'application/octet-stream',
  attachment_type: 'manual_upload',
  storage_bucket: 'documents',          // ✅ ADDED
  storage_path: `inbox/${file.name}`,   // ✅ ADDED
});
```

**Git Commit**: `0e8a34a` - Pushed to frontend repository

---

## Verification Checklist

- [ ] **Hard refreshed** browser (Ctrl+Shift+R or Cmd+Shift+R)
- [ ] **Waited** 2+ minutes for Railway to finish deploying
- [ ] **Checked** Railway dashboard - frontend shows "Running"
- [ ] **Tried uploading** a file again
- [ ] ✅ **Upload succeeded** without error!

---

## Still Having Issues?

### If Error Persists After Hard Refresh + 5 Minutes:

**Step 1: Check if New Code is Being Used**
1. Open browser Developer Tools (F12)
2. Go to **Network** tab
3. Try uploading a file
4. Find the POST request to `/api/cv-inbox/*/attachments`
5. Click it and check **"Request Payload"** (or Body)
6. Look for: `"storage_bucket": "documents"`

**Results:**
- ✅ `storage_bucket` IS present → Fix working, wait for backend to respond
- ❌ `storage_bucket` NOT present → Frontend hasn't redeployed, wait 5 more minutes

### If storageBucket IS Being Sent But Still Error:

Check the error message in Network tab → Response
- If it says something else (not storageBucket error) → Different issue
- If it's still storageBucket error → Contact backend support

---

## Timeline

| Time | Action |
|------|--------|
| 2026-01-13 XX:XX | Frontend code fixed |
| 2026-01-13 XX:XX | Pushed to GitHub |
| 2026-01-13 XX:XX | Railway starts auto-deploy |
| 2026-01-13 XX:XX+2min | **Deploy complete** |
| NOW | Hard refresh and test! |

---

## Quick Links

- **Railway Dashboard**: https://dashboard.railway.app
- **Frontend Service**: recruitment-portal-frontend
- **Backend Service**: recruitment-portal-backend-production
- **GitHub Frontend**: https://github.com/holywolf92-a11y/recruitment-portal-frontend

---

## Summary

```
FIX DEPLOYED ✅
HARD REFRESH NEEDED ✅
READY TO TEST ✅
```

**Do this now:**
1. Press: **Ctrl+Shift+R** (or Cmd+Shift+R on Mac)
2. Try uploading a CV
3. Should work! 🎉
