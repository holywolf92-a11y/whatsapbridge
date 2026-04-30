# ⚡ Quick Start - After Deployment

**Status**: Code deployed (commit 47059774 + 19774bdc)  
**Timeline**: Do these in the next 30-60 minutes

---

## Step 1: Verify Deployment (5 minutes)

```bash
# Check Railway logs
# URL: https://railway.app/[your-project-id]
# 
# Look for:
# ✅ python-parser service running
# ✅ No ModuleNotFoundError for mediapipe
# ✅ Service listening on port 5000 (or your port)

# If you have Railway CLI:
railway logs --service python-parser --tail 50
```

**Expected log output**:
```
Starting FastAPI server...
Successfully loaded mediapipe models
Connected to Supabase
Listening on port 5000
Ready to process CVs
```

**If you see errors**:
- `ModuleNotFoundError: mediapipe` → Railway still installing, wait 2-3 more minutes
- `Failed to import scipy` → Same, wait for rebuild
- `Supabase connection timeout` → Check .env variables

---

## Step 2: Re-trigger Abdullah's CV (10 minutes)

**Goal**: Test if new pipeline extracts his photo successfully

### Option A: Via Database (Recommended)
```bash
cd backend

# Open Node REPL and re-queue the job:
node

// Inside Node:
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Abdullah's job ID (from earlier investigation)
const jobId = 'c7c29d40-17f4-4cee-86d0-260f5d571dcc';

sb.from('parsing_jobs')
  .update({ status: 'queued', updated_at: new Date() })
  .eq('id', jobId)
  .then(() => {
    console.log('✅ Job re-queued!');
    process.exit(0);
  });
```

### Option B: Via API Call
```bash
# If you have a reparse endpoint:
curl -X POST http://localhost:3000/api/reparse/c7c29d40-17f4-4cee-86d0-260f5d571dcc \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Step 3: Monitor Parsing (15 minutes)

```bash
# Watch python-parser logs in real-time:
railway logs --service python-parser --follow

# OR manually check every 30 seconds:
while true; do 
  echo "=== $(date) ===" 
  railway logs --service python-parser --tail 5
  sleep 30
done
```

**Look for these log lines**:
```
[PHOTO_EXTRACT] candidate_id=cd9ea373... page_rendered dims=960x1440
[PHOTO_EXTRACT] Found photo region at (X,Y) size=WxH
  OR
[PHOTO_EXTRACT] Using full page (no photo region detected)

[FACE_DETECT] Face at (X,Y) size=WxH confidence=0.XX
  OR
[PHOTO_EXTRACT] action=SKIP reason=NO_FACES_DETECTED

[QUALITY_CHECK] is_blurry=False
[QUALITY_CHECK] is_too_dark_or_bright=False
[PHOTO_EXTRACT] SUCCESS uploaded_as=https://...
```

---

## Step 4: Verify in Database (5 minutes)

```bash
# Check if profile_photo_url was populated
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

sb.from('candidates')
  .select('id, candidate_code, first_name, last_name, profile_photo_url')
  .eq('candidate_code', 'FL-2026-887')
  .single()
  .then(({data}) => {
    console.log('Abdullah Record:');
    console.log('  Code:', data.candidate_code);
    console.log('  Name:', data.first_name, data.last_name);
    console.log('  Photo URL:', data.profile_photo_url);
    console.log('');
    console.log(data.profile_photo_url 
      ? '✅ PHOTO EXTRACTED SUCCESSFULLY!' 
      : '❌ Photo URL is still NULL');
  });
"
```

**Expected output**:
```
Abdullah Record:
  Code: FL-2026-887
  Name: Abdullah Ali
  Photo URL: https://hncv...storage.../candidate_photos/cd9ea373.jpg

✅ PHOTO EXTRACTED SUCCESSFULLY!
```

---

## Step 5: Verify in UI (2 minutes)

Visit the public profile:
```
http://localhost:3000/candidate/FL-2026-887
  OR
https://your-production-url.com/candidate/FL-2026-887
```

**Expected**: 
- Profile photo shows in header
- Face is centered and square (512x512)
- Image quality is good (JPEG 95)

---

## Step 6: Check Metrics (5 minutes)

```bash
# Count successful extractions (should see MediaPipe entries):
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Count photos extracted
sb.from('candidates')
  .select('id', {count: 'exact'})
  .not('profile_photo_url', 'is', null)
  .then(({count}) => {
    console.log('Photos extracted: ' + count);
  });

// Count total candidates
sb.from('candidates')
  .select('id', {count: 'exact'})
  .then(({count}) => {
    console.log('Total candidates: ' + count);
    console.log('Success rate: ' + Math.round(100 * count / count) + '%');
  });
"
```

---

## If Everything Works ✅

**Congratulations!** The new pipeline is working!

**Next**:
1. Contact Sharafat → "Please re-upload your CV"
2. Monitor his re-parse job (should extract photo now)
3. Check success rate improvement over next 24 hours
4. Update documentation with actual results

---

## If Something Fails ❌

### Issue: Logs show "ModuleNotFoundError: mediapipe"
**Solution**: 
```bash
# Railway is still installing dependencies
# Wait 2-3 more minutes and check logs again
# If still failing after 5 minutes:
railway logs --service python-parser --tail 100
# Look for actual error message
```

### Issue: Logs show "NO_FACES_DETECTED" for Abdullah
**Meaning**: MediaPipe couldn't find a face in Abdullah's CV  
**Next steps**:
```bash
# Check if image is valid
railway logs --service python-parser --grep "page_rendered dims="
# If dims are very small, PDF isn't rendering correctly

# Check if photo region was detected
railway logs --service python-parser --grep "PHOTO_EXTRACT"
# Look for "Found photo region" vs "Using full page"

# Manual test:
# Extract Abdullah's PDF and look at it visually
# If PDF is corrupted or has no photo: issue is with source file
```

### Issue: Logs show "BLURRY" or "TOO_DARK"
**Meaning**: Quality checks rejected the crop  
**Next steps**:
```bash
# This is actually working as designed (quality control)
# Thresholds can be adjusted in python-parser/main.py:
#   - is_image_blurry: threshold=100 (lower = stricter)
#   - is_image_too_dark_or_bright: dark=30, bright=220

# For now, note that the quality checks are working
# If needed, we can loosen thresholds in next iteration
```

### Issue: "SUCCESS" but profile_photo_url still NULL
**Meaning**: Photo uploaded but database didn't update  
**Investigation**:
```bash
# 1. Check if file exists in storage
railway logs --service python-parser --grep "uploaded_as="
# Look for the URL returned

# 2. Check if database update ran
# Parsing job should have called:
#   UPDATE candidates SET profile_photo_url = X WHERE id = Y

# 3. Manual verification
curl "https://...storage.../candidate_photos/cd9ea373.jpg"
# Should return the image (200 OK)
```

---

## Quick Reference: Log Levels

| Log Pattern | Meaning |
|------------|---------|
| `[PHOTO_EXTRACT] SUCCESS` | ✅ Photo extracted and uploaded |
| `[PHOTO_EXTRACT] SKIP reason=` | ⚠️ Skipped (see reason) |
| `[FACE_DETECT] Face at` | ℹ️ Face found |
| `[QUALITY_CHECK]` | ℹ️ Running quality checks |
| `ModuleNotFoundError` | ❌ Dependency missing |
| `[ERROR]` | ❌ Critical error |

---

## Timeline

| Time | Action | Status |
|------|--------|--------|
| Now | Check Railway logs | ▶️ In Progress |
| +5 min | Re-trigger Abdullah's job | ▶️ To Do |
| +20 min | Monitor parsing logs | ▶️ To Do |
| +30 min | Verify database updated | ▶️ To Do |
| +35 min | Check public profile | ▶️ To Do |
| +40 min | Contact Sharafat | ▶️ To Do |

**Goal: Everything ✅ by 1 hour from now**

---

## Success Checklist

- [ ] Railway logs show "Service running" (no errors)
- [ ] Abdullah's parsing job shows "SUCCESS" in logs
- [ ] profile_photo_url populated in database
- [ ] Public profile shows photo
- [ ] Logs contain `[FACE_DETECT]` entries (MediaPipe working)
- [ ] No `[ERROR]` entries in logs

**All checked ✅** = Deployment successful! 🎉

---

## Need Help?

1. **Check logs first**: `railway logs --service python-parser --tail 100`
2. **Reference guide**: [CODE_CHANGES_REFERENCE.md](CODE_CHANGES_REFERENCE.md)
3. **Full testing guide**: [PROFILE_PHOTO_TESTING_GUIDE.md](PROFILE_PHOTO_TESTING_GUIDE.md)
4. **24h checklist**: [PROFILE_PHOTO_UPGRADE_24H_CHECKLIST.md](PROFILE_PHOTO_UPGRADE_24H_CHECKLIST.md)
5. **Best practices doc**: [PROFILE_PHOTO_BEST_PRACTICE_DEPLOYMENT.md](PROFILE_PHOTO_BEST_PRACTICE_DEPLOYMENT.md)

---

**Let's get this deployed!** 🚀
