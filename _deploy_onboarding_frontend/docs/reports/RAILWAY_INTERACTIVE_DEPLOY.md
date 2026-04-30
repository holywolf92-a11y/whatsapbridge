# 🚀 Railway Deployment - Complete Interactive Guide

**Last Updated:** January 12, 2026  
**Status:** Ready to Deploy  
**Project:** gleaming-healing (585a6314-92d3-4312-8476-0cf8d388488b)

---

## ✅ What's Ready

Your entire stack is built and pushed to GitHub:

```
✓ Backend Service
  - Express.js + TypeScript
  - BullMQ queue system configured
  - Redis integration ready
  - All endpoints tested
  - GitHub: recruitment-portal-backend

✓ Frontend Service  
  - Vite + React
  - API client wired to backend
  - Parsing job UI implemented
  - GitHub: recruitment-portal-frontend

✓ Configuration
  - Environment templates created
  - HMAC secret generated
  - Health endpoints ready
  - Smoke tests documented
```

---

## 🎯 Your Task (5 Steps, ~15 minutes)

### Step 1: Open Railway Dashboard

**URL:** https://railway.app/project/585a6314-92d3-4312-8476-0cf8d388488b

This is your project dashboard where you'll add services and configure variables.

**In the dashboard:**
- You'll see "New" button in top right
- This is your main control center

---

### Step 2: Add Backend Service

```
1. Click "New" button (top right)
2. Select "GitHub Repo" option
3. Search for: recruitment-portal-backend
4. Select it from the list
5. Click "Deploy"
6. Railway will:
   - Detect Node.js project
   - Auto-build from package.json
   - Start deployment (2-3 minutes)
   - Show green checkmark when done
```

**What happens:**
- GitHub repo connects
- Node.js automatically detected
- Dependencies installed (npm install)
- TypeScript compiled
- Service starts running
- Gets a unique URL like: `https://gleaming-healing-production-abc123.railway.app`

**Status:** ☐ Complete

---

### Step 3: Add Redis Database

```
1. Click "New" button again
2. Select "Database" option
3. Select "Redis" from the database list
4. Wait for setup to complete (1-2 minutes)
5. Click the Redis service when it appears
6. Go to "Variables" tab
7. Copy the value of REDIS_URL
   Example: redis://default:password@redis.railway.internal:6379
8. Save this value - you'll need it next
```

**What it does:**
- Creates a Redis instance
- Provides secure internal connection URL
- Redis is auto-configured
- No setup needed - it just works

**Status:** ☐ Complete

**Your REDIS_URL:** `___________________________` (save it here)

---

### Step 4: Configure Backend Service

```
1. Click the Backend service in the left sidebar
2. Go to "Variables" tab
3. Add these NEW variables (copy exactly):

Variable Name         | Value to Enter
--------------------|---------------------------------------
RUN_WORKER          | true
REDIS_URL           | [paste the value from Step 3]
PYTHON_HMAC_SECRET  | Itbfr/p8ky/dRMAHLdi/DIiQRLEJtm2SqyNfwuXa3r0=
PYTHON_CV_PARSER_URL| https://parser.railway.app

4. Scroll down and verify these exist from Week 3:
   ☐ DATABASE_URL (should exist)
   ☐ SUPABASE_URL (should exist)
   ☐ SUPABASE_ANON_KEY (should exist)
   ☐ SUPABASE_SERVICE_ROLE_KEY (should exist)
   ☐ GOOGLE_OAUTH_CLIENT_ID (should exist)
   ☐ GOOGLE_OAUTH_CLIENT_SECRET (should exist)
   ☐ OPENAI_API_KEY (should exist)

5. Click "Deploy" button at top right
6. Wait for restart (1-2 minutes)
7. Backend service will restart with new variables
```

**Important Notes:**
- Each variable is added one by one in the UI
- Copy values exactly (case-sensitive)
- If a variable already exists, update it - don't add twice
- HMAC_SECRET must be exact: `Itbfr/p8ky/dRMAHLdi/DIiQRLEJtm2SqyNfwuXa3r0=`

**Status:** ☐ Complete

---

### Step 5: Add Frontend Service

```
1. Click "New" button
2. Select "GitHub Repo"
3. Search for: recruitment-portal-frontend
4. Select it from the list
5. Click "Deploy"
6. Wait for deployment (2-3 minutes)
7. You'll see it building and deploying
8. Once done, click the Frontend service
9. Go to "Variables" tab
10. Add this variable:

Variable Name        | Value
--------------------|--------------------------------------------------
VITE_API_BASE_URL   | https://[backend-url]/api

Where [backend-url] is your actual backend service URL
Example: https://gleaming-healing-production-abc123.railway.app/api

⚠️  IMPORTANT: Must include /api at the end!

11. Click "Deploy" button
12. Wait for rebuild
```

**What to use for [backend-url]:**
- Go to Backend service
- Look at the "Deployments" or "URL" section
- It will be something like: `https://gleaming-healing-production-abc123.railway.app`
- Add `/api` at the end
- Full example: `https://gleaming-healing-production-abc123.railway.app/api`

**Status:** ☐ Complete

---

## ✅ Verification (After All Steps)

### Test 1: Backend Health Check
```
curl https://[backend-url]/api/health

Expected Response:
{"status":"ok"}

Status: ☐ Pass
```

### Test 2: Queue Health Check
```
curl https://[backend-url]/api/health/queue

Expected Response:
{"status":"ok","queue":"redis"}

Status: ☐ Pass
```

### Test 3: Frontend Loading
```
1. Open in browser: https://[frontend-url]
2. Should see login page
3. Page loads without errors

Status: ☐ Pass
```

### Test 4: End-to-End Integration
```
1. Login to frontend
2. Go to "CV Inbox" section
3. Upload a test CV file
4. Click "Process" button
5. Should trigger parsing job
6. Status should update

Status: ☐ Pass
```

---

## 📋 Reference: Your URLs (After Deployment)

You'll get URLs like these:

```
Backend:  https://gleaming-healing-production-xyz.railway.app
Frontend: https://gleaming-healing-production-abc.railway.app
```

Replace `[backend-url]` in instructions with your actual backend URL.

---

## 🔧 If Something Goes Wrong

### Backend Won't Start
**Check:**
- Click Backend service → Deployments tab
- Look at the latest deployment
- Click "Logs" to see what failed
- Common issues:
  - REDIS_URL incorrect format
  - RUN_WORKER not set to true
  - Database connection failed

**Fix:**
- Update the Variables
- Click Deploy again
- Check logs

### Frontend Can't Connect to API
**Check:**
- Open browser → F12 (DevTools)
- Go to Network tab
- Try uploading a CV
- Look for failed requests
- Check the URL - should match VITE_API_BASE_URL

**Fix:**
- Update VITE_API_BASE_URL
- Make sure it includes `/api` at the end
- Click Deploy
- Hard refresh browser (Ctrl+Shift+R)

### Queue Returns Error
**Check:**
- Redis service is running
- REDIS_URL is correct
- Backend service logs show Redis connection

**Fix:**
- Restart Redis service
- Restart Backend service
- Check REDIS_URL spelling

---

## 📞 Support

If deployment gets stuck:

1. **Check Railway Dashboard** - Click service → Deployments → Latest → Logs
2. **Verify Variables** - Go to Variables tab, check all values are correct
3. **Restart Services** - Click Deploy button again
4. **Check GitHub** - Verify repos are pushed (they are)

---

## ⏭️ What's Next (Week 4 Day 2)

Once deployment is verified and working:

1. **Test end-to-end flow:**
   - Upload CV via frontend
   - Check if job processes
   - Verify Redis queue working

2. **Build Python Parser Service (Day 2):**
   - Create FastAPI project
   - Implement CV text extraction
   - Add OpenAI integration
   - Deploy to Railway

3. **Week 4 Day 5: Add Resilience:**
   - Circuit breaker pattern
   - Monitoring & logging
   - Production ready

---

## 📊 Quick Status Check

| Component | Status | Notes |
|-----------|--------|-------|
| Backend Code | ✅ Ready | Pushed to GitHub |
| Frontend Code | ✅ Ready | Pushed to GitHub |
| Redis Config | ✅ Ready | Will create in Step 3 |
| HMAC Secret | ✅ Ready | Pre-generated |
| Documentation | ✅ Complete | See other files |

---

## 🎯 Summary

**What you do:**
1. Go to Railway dashboard
2. Follow 5 steps above
3. Takes ~15 minutes
4. All services deployed

**What happens after:**
- Backend runs with queue system
- Frontend connects to backend
- Ready to add Python parser
- Auto-deploy on git push enabled

**You're ready!** Start with Step 1. 🚀

---

**Questions?** See the other deployment guides in your repo:
- `RAILWAY_QUICK_DEPLOY.md` - Quick reference
- `DEPLOYMENT_GUIDE_WEEK4.md` - Detailed guide
- `RAILWAY_ENV_VARIABLES.md` - Variable explanations
