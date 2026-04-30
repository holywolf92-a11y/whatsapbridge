# Profile Photo Upgrade - Next 24 Hours Checklist

**Timeline**: Commit 47059774 → Test → Monitor → Verify Success

---

## Immediate (Next 30 minutes)

- [ ] Check Railway deployment status
  - Visit: https://railway.app/[project-id]
  - Look for: python-parser service rebuilding
  - Expected: 5-10 min build time for dependencies

- [ ] Verify python-parser service started
  - Check logs for: `Starting FastAPI server`
  - Check for errors: `ModuleNotFoundError: mediapipe`
  - Expected: Should start cleanly with new mediapipe dependency

- [ ] Verify database connection working
  - Logs should show Supabase connection successful

---

## Phase 1: Deployment Confirmation (30 min - 2 hours)

**Success criteria**:
```
❌ Error: ModuleNotFoundError: mediapipe
❌ Error: Failed to import scipy
❌ Service restart loop
❌ Supabase connection timeout

✅ Service started successfully
✅ All imports loaded (mediapipe, scipy, mediapipe.tasks.vision)
✅ Listening on port (ready for requests)
```

**If deployment fails**:
```bash
# Check specific error
railway logs --service python-parser --tail 100

# If import error: mediapipe not installed
# Wait 5-10 min for build to complete

# If persistent error: rollback
git revert 47059774
git push origin main
# Railway redeploys in ~5 min
```

---

## Phase 2: Test on Abdullah's CV (2-4 hours)

**Action**: Re-trigger parsing for Abdullah FL-2026-887

```bash
cd backend

# Option A: Via database
# Update parsing_jobs status back to 'queued'
# Job ID: c7c29d40-17f4-4cee-86d0-260f5d571dcc

# Option B: Via API call
curl -X POST http://localhost:3000/api/reparse/c7c29d40-17f4-4cee-86d0-260f5d571dcc

# Option C: Check current state first
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
sb.from('parsing_jobs').select('*').eq('candidate_id', 'cd9ea373-12f3-45ba-8f64-62f7d1acbf70').then(r => console.log(r.data));
"
```

**Monitor logs while parsing**:
```bash
railway logs --service python-parser --follow

# Expected output sequence:
[PHOTO_EXTRACT] candidate_id=cd9ea373... page_rendered dims=960x1440
[FACE_DETECT] Running MediaPipe face detection
[FACE_DETECT] Found face at (x,y) size=180x200
[QUALITY_CHECK] blur variance=245 is_blurry=False
[QUALITY_CHECK] brightness=125 is_too_dark=False
[PHOTO_EXTRACT] Cropping to 512x512
[PHOTO_EXTRACT] SUCCESS uploaded_as=https://...
```

**Verify database updated**:
```sql
SELECT 
  candidate_code,
  profile_photo_url,
  first_name,
  last_name
FROM candidates
WHERE candidate_code = 'FL-2026-887'
LIMIT 1;

-- Expected: profile_photo_url should have value like:
-- https://hncv....storage/v1/object/public/documents/candidate_photos/...
```

**Verify in UI**:
- Visit: `/candidate/FL-2026-887` (or your public profile URL)
- Look for: Profile photo in header
- Expected: Should show the extracted face photo

---

## Phase 3: Sharafat's CV Action (2-4 hours)

**Current Status**: File missing from storage  
**Required Action**: Get Sharafat to re-upload CV

**Steps**:
1. Contact Sharafat → "Please re-upload your CV to the system"
2. System will create new inbox_attachment record
3. Parsing job will run automatically
4. New MediaPipe pipeline will extract photo
5. Profile will show photo automatically

**OR fallback**:
If Sharafat's original file is recoverable:
```bash
# Check backup location
ls -la /backups/inbox/ | grep -i sharafat

# If found, manually restore to storage bucket
# Then re-trigger parsing job
```

---

## Phase 4: Monitoring (Next 24 hours)

**Watch for**:
1. Extraction success rate improvements
   - Before: ~60-70%
   - Expected after: ~95%

2. Log patterns (should see MediaPipe, not Haar Cascade)
   ```
   ✅ [FACE_DETECT] MediaPipe found X faces
   ❌ [FACE_DETECT] cascade.detectMultiScale (old method)
   ```

3. Quality check effectiveness
   ```
   [QUALITY_CHECK] action=SKIP reason=BLURRY → Good, catching poor quality
   [QUALITY_CHECK] action=SKIP reason=TOO_DARK → Expected for dark CVs
   [QUALITY_CHECK] action=SKIP reason=FACE_SIZE_BAD → Face too small/large
   ```

**Metrics to check**:
```sql
-- Daily extraction count
SELECT DATE(created_at) as date, COUNT(*) as extractions
FROM parsing_jobs
WHERE status = 'extracted'
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 7;

-- Success vs skip ratio
SELECT 
  CASE WHEN profile_photo_url IS NOT NULL THEN 'SUCCESS' ELSE 'SKIP' END as result,
  COUNT(*) as count
FROM candidates
WHERE created_at > NOW() - INTERVAL 24 HOURS
GROUP BY CASE WHEN profile_photo_url IS NOT NULL THEN 'SUCCESS' ELSE 'SKIP' END;

-- Check for any errors in logs
-- Look for [PHOTO_EXTRACT] SKIP reason=* entries
```

---

## Phase 5: Validation (End of Day)

**Green lights** ✅:
- [ ] Railway deployment completed without errors
- [ ] python-parser restarted successfully with new dependencies
- [ ] Abdullah's CV: profile_photo_url populated in database
- [ ] Public profile shows photo for Abdullah
- [ ] Logs show MediaPipe detection (not Haar Cascade)
- [ ] No error spam in logs
- [ ] Extraction rate improved (spot check)

**If all green**: **Deployment successful!** 🎉

**If any red lights**:
- Refer to troubleshooting guide in PROFILE_PHOTO_TESTING_GUIDE.md
- Check specific error logs
- Consider rollback if critical

---

## Rollback Procedure (If Needed)

```bash
# Only if critical issues discovered
git revert 47059774
git push origin main

# Railway will auto-redeploy previous version in ~5 min
# Verify via: railway logs --service python-parser
```

---

## Success Scenarios

### Scenario A: Abdullah Photo Extracts Successfully
✅ **Status**: Excellent  
✅ **Action**: Monitor for 24 hours, then close issue  
✅ **Next**: Document lessons learned  

### Scenario B: Abdullah Still Fails But Better Error Info
✅ **Status**: Expected if CV is extremely poor quality  
✅ **Action**: Log will show exact reason (BLURRY/TOO_DARK/FACE_SIZE)  
✅ **Next**: Adjust thresholds in code if needed  

### Scenario C: Deployment Fails
❌ **Status**: Rollback needed  
❌ **Action**: Run rollback procedure  
❌ **Investigate**: Check exact error in logs  

---

## Key Contacts

- **For Railway issues**: Check railway.app project dashboard
- **For database issues**: Query Supabase console
- **For photo quality**: Check log output (SKIP reason=...)
- **For reupload request**: Contact candidates via email

---

## Estimated Timeline

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Deployment | 10-20 min | 0:00 | 0:20 |
| Abdullah test | 30-60 min | 0:30 | 1:30 |
| Sharafat action | 2-4 hours | 1:00 | 5:00 |
| Monitoring | 24 hours | 0:00 | +24h |
| **Total to verification** | **~5-6 hours** | Now | By EOD |

---

## Done! What to do now:

1. ✅ Push is already done (commit 47059774)
2. ⏳ Wait for Railway auto-deployment (5-10 min)
3. 📊 Monitor python-parser logs
4. 🧪 Re-trigger Abdullah's parsing job
5. ✔️ Verify profile_photo_url populated
6. 📞 Contact Sharafat for re-upload (if needed)

**Expected outcome in 2-3 hours**: Abdullah's profile photo visible, logs showing MediaPipe success! 🎉
