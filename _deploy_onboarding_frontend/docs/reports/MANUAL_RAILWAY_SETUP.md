# ✅ MANUAL RAILWAY ENVIRONMENT VARIABLES SETUP

## 📋 STEP 1: Check Existing Variables on Backend

**URL:** https://railway.app/project/54e09ca0-5643-4b5e-a172-8704293ae095

1. Click on **recruitment-portal-backend-production-d1f7** service (in the left sidebar)
2. Click on the **Variables** tab at the top
3. **Screenshot/Note down all existing variables** - you should see:
   - SUPABASE_URL (likely already exists)
   - SUPABASE_ANON_KEY (likely already exists)
   - SUPABASE_SERVICE_ROLE_KEY (might already exist)
   - Others?

**These are the MISSING ones** we need to add (check if they exist):
- [ ] `RUN_WORKER` 
- [ ] `REDIS_URL`
- [ ] `PYTHON_CV_PARSER_URL`
- [ ] `PYTHON_HMAC_SECRET`
- [ ] `NODE_ENV`
- [ ] `PORT`

---

## ➕ STEP 2: Add Missing Variables to Backend

In the **Variables** tab of **recruitment-portal-backend-production-d1f7**:

### Add Variable #1
- **Key:** `RUN_WORKER`
- **Value:** `true`
- Click Add

### Add Variable #2
- **Key:** `REDIS_URL`
- **Value:** `redis://default:sBtnDrpJrbASwbGejzqByuCroCidLUVI@redis.railway.internal:6379`
- Click Add

### Add Variable #3
- **Key:** `PYTHON_CV_PARSER_URL`
- **Value:** `https://recruitment-portal-python-parser-production.up.railway.app`
- Click Add

### Add Variable #4
- **Key:** `PYTHON_HMAC_SECRET`
- **Value:** `Itbfr/p8ky/dRMAHLdi/DIiQRLEJtm2SqyNfwuXa3r0=`
- Click Add

### Add Variable #5
- **Key:** `NODE_ENV`
- **Value:** `production`
- Click Add

### Add Variable #6
- **Key:** `PORT`
- **Value:** `4000`
- Click Add

**IMPORTANT:** After adding all 6 variables, scroll down and click the **Deploy** button

---

## 🔄 STEP 3: Check Deployment Status

1. After clicking Deploy, you should see the service restarting
2. Wait 1-2 minutes for the service to come back online
3. Click on the **Deployments** tab to see the build progress
4. Once complete, click on **Logs** tab and look for:
   ```
   CV Parser worker started
   Document Link worker started
   ```

If you see these messages, the worker is running! ✅

---

## ➕ STEP 4: Add Variables to Frontend (exquisite-surprise project)

**URL:** Go to your exquisite-surprise project (different project!)

1. Click on **exquisite-surprise-production** service
2. Click **Variables** tab
3. Add these 3 variables:

### Add Variable #1
- **Key:** `VITE_API_BASE_URL`
- **Value:** `https://recruitment-portal-backend-production-d1f7.up.railway.app/api`
- Click Add

### Add Variable #2
- **Key:** `VITE_SUPABASE_URL`
- **Value:** `https://hncvsextwmvjydcukdwx.supabase.co`
- Click Add

### Add Variable #3
- **Key:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `sb_publishable_5qD27qPFc04oqSmS61s1tw_lgt8FhBV`
- Click Add

**IMPORTANT:** After adding, scroll down and click **Deploy** to rebuild the frontend

---

## ✅ STEP 5: Verify Everything Works

### Test 1: Check Backend Logs
1. Go to gleaming-healing project → recruitment-portal-backend service
2. Click **Logs** tab
3. Look for: "CV Parser worker started" ✅

### Test 2: Check Backend Health
Open in browser: 
```
https://recruitment-portal-backend-production-d1f7.up.railway.app/api/health
```
Expected response: `{"status":"ok"}`

### Test 3: Load Frontend
Open in browser:
```
https://exquisite-surprise-production.up.railway.app
```
Expected: Login page loads ✅

### Test 4: Test CV Upload
1. Login to frontend
2. Go to CV Inbox
3. Upload a test CV
4. Check that job status changes from "queued" to "processing" ✅

---

## 🔍 If Something Goes Wrong

### Backend Worker Not Starting?
1. Check backend logs for errors
2. Verify all 6 variables are set correctly
3. Make sure REDIS_URL, PYTHON_CV_PARSER_URL, and PYTHON_HMAC_SECRET are spelled correctly
4. Redeploy the backend service

### Frontend Can't Connect to Backend?
1. Verify VITE_API_BASE_URL is exactly: `https://recruitment-portal-backend-production-d1f7.up.railway.app/api`
2. Check that backend health endpoint works
3. Rebuild frontend

### Red Error in Railway Dashboard?
1. Check the error message in the logs
2. Most common: typo in a variable value
3. Double-check the value and correct it
4. Redeploy

---

## 📝 CHECKLIST

### Backend (gleaming-healing)
- [ ] Checked existing variables
- [ ] Added RUN_WORKER = true
- [ ] Added REDIS_URL
- [ ] Added PYTHON_CV_PARSER_URL
- [ ] Added PYTHON_HMAC_SECRET
- [ ] Added NODE_ENV = production
- [ ] Added PORT = 4000
- [ ] Clicked Deploy
- [ ] Waited for restart
- [ ] Verified logs show "CV Parser worker started"

### Frontend (exquisite-surprise)
- [ ] Added VITE_API_BASE_URL
- [ ] Added VITE_SUPABASE_URL
- [ ] Added VITE_SUPABASE_ANON_KEY
- [ ] Clicked Deploy
- [ ] Waited for rebuild
- [ ] Verified frontend loads

### Verification
- [ ] Backend health check passes
- [ ] Frontend loads successfully
- [ ] Can upload CV and see job status change

---

## 🎉 SUCCESS!

Once all checkmarks are done, your CV parsing pipeline is fully operational:
- User uploads CV → Frontend sends to Backend → Backend enqueues job → Worker processes → Results shown ✅
