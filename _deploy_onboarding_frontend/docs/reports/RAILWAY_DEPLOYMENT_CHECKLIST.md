# Railway Deployment - Manual Checklist

**Your Project:** https://railway.app/project/585a6314-92d3-4312-8476-0cf8d388488b

---

## ✅ Pre-Deployment Verification

- [x] Backend code pushed to GitHub (recruitment-portal-backend)
- [x] Frontend code pushed to GitHub (recruitment-portal-frontend)
- [x] BullMQ + Redis queues configured locally
- [x] API endpoints tested and working
- [x] Environment variables documented
- [x] HMAC secret generated: `Itbfr/p8ky/dRMAHLdi/DIiQRLEJtm2SqyNfwuXa3r0=`

---

## 🚀 STEP-BY-STEP DEPLOYMENT

### STEP 1: Backend Service (3 min)
```
Go to: https://railway.app/project/585a6314-92d3-4312-8476-0cf8d388488b

1. Click "New" button (top right)
2. Select "GitHub Repo"
3. Find and select: recruitment-portal-backend
4. Click "Deploy"
5. Wait for green checkmark (2-3 min)
```

Status: ☐ Complete

---

### STEP 2: Redis Database (2 min)
```
1. Click "New" button again
2. Select "Database"
3. Select "Redis"
4. Wait for setup (1-2 min)
5. Note the REDIS_URL from Variables
```

Status: ☐ Complete

**Get REDIS_URL:**
- Click Redis service in sidebar
- Click "Variables" tab
- Copy the value of REDIS_URL
- Example: `redis://default:password@redis.railway.internal:6379`

---

### STEP 3: Configure Backend (2 min)
```
1. Click Backend service in sidebar
2. Click "Variables" tab
3. Add NEW variables:
```

| Variable | Value |
|----------|-------|
| `RUN_WORKER` | `true` |
| `REDIS_URL` | [Paste from Redis Variables] |
| `PYTHON_HMAC_SECRET` | `Itbfr/p8ky/dRMAHLdi/DIiQRLEJtm2SqyNfwuXa3r0=` |
| `PYTHON_CV_PARSER_URL` | `https://cv-parser.railway.app` |

**Also verify these exist (from Week 3):**
- DATABASE_URL
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- GOOGLE_OAUTH_CLIENT_ID
- GOOGLE_OAUTH_CLIENT_SECRET
- OPENAI_API_KEY

```
4. After adding all variables, click "Deploy" button
5. Wait for restart (1-2 min)
```

Status: ☐ Complete

---

### STEP 4: Frontend Service (2 min)
```
1. Click "New" button
2. Select "GitHub Repo"
3. Find and select: recruitment-portal-frontend
4. Click "Deploy"
5. Wait for green checkmark (2-3 min)
```

Status: ☐ Complete

---

### STEP 5: Configure Frontend (1 min)
```
1. Click Frontend service in sidebar
2. Click "Variables" tab
3. Add this variable:

   VITE_API_BASE_URL = https://[BACKEND-URL]/api

   WHERE [BACKEND-URL] is your backend service URL
   
   Example: https://gleaming-healing-production-xxxx.railway.app/api

4. Click "Deploy" button
5. Wait for rebuild
```

Status: ☐ Complete

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Test 1: Backend Health
```
curl https://[BACKEND-URL]/api/health

Expected: {"status":"ok"}
Status: ☐ Pass
```

### Test 2: Queue Health
```
curl https://[BACKEND-URL]/api/health/queue

Expected: {"status":"ok","queue":"redis"}
Status: ☐ Pass
```

### Test 3: Frontend Loads
```
Open in browser: https://[FRONTEND-URL]

Expected: Login page displays
Status: ☐ Pass
```

### Test 4: API Integration
```
1. Login to frontend
2. Go to CV Inbox
3. Upload a test CV
4. Should trigger parsing job
5. Status should update

Status: ☐ Pass
```

---

## 🔧 TROUBLESHOOTING

### Issue: Backend won't start
**Check:**
- Click Backend → Deployments → Latest deployment
- View logs for errors
- Verify REDIS_URL is correct
- Verify RUN_WORKER=true is set

**Fix:**
- Update variables and click Deploy again

### Issue: Frontend shows blank page
**Check:**
- Open browser console (F12)
- Check Network tab for API calls
- Verify VITE_API_BASE_URL includes `/api` suffix

**Fix:**
- Update VITE_API_BASE_URL and click Deploy

### Issue: API returns 404
**Check:**
- Verify backend URL matches VITE_API_BASE_URL
- Check backend health endpoint works
- Verify database connection

**Fix:**
- Restart backend service
- Check logs for database errors

---

## 📋 Your Service URLs (After Deployment)

You'll see URLs like these in Railway dashboard:

```
Backend:  https://gleaming-healing-production-abc123.railway.app
Frontend: https://gleaming-healing-production-def456.railway.app
Redis:    (Internal - auto-configured)
```

---

## 🎯 Next Steps

After deployment is verified:

1. **Test end-to-end flow:**
   - Upload CV
   - Trigger job
   - Check status

2. **Week 4 Day 2: Build Python Parser**
   - Create FastAPI service
   - Implement CV parsing
   - Deploy to Railway

3. **Week 4 Day 5: Add Circuit Breaker**
   - Implement resilience
   - Add monitoring
   - Production ready

---

## 📞 Quick Reference

| What | Link |
|------|------|
| Railway Dashboard | https://railway.app/project/585a6314-92d3-4312-8476-0cf8d388488b |
| Backend Repo | https://github.com/holywolf92-a11y/recruitment-portal-backend |
| Frontend Repo | https://github.com/holywolf92-a11y/recruitment-portal-frontend |
| Documentation | See RAILWAY_QUICK_DEPLOY.md |

---

**Status:** Ready to Deploy ✅  
**Estimated Time:** 15 minutes  
**Date:** January 12, 2026
