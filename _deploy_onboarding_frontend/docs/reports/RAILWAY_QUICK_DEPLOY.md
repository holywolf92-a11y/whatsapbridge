# Quick Deploy to Railway - Step by Step

**Your Project:** https://railway.app/project/585a6314-92d3-4312-8476-0cf8d388488b

---

## 🚀 QUICK START (5-10 minutes)

### Step 1: Deploy Backend Service (2 min)
```
1. Go to: https://railway.app/project/585a6314-92d3-4312-8476-0cf8d388488b
2. Click "New" → "GitHub Repo"
3. Select: recruitment-portal-backend
4. Click "Deploy"
5. Wait for green checkmark
```

### Step 2: Create Redis Database (2 min)
```
1. Click "New" → "Database"
2. Select "Redis"
3. Wait for setup
4. Note the REDIS_URL from Variables tab
```

### Step 3: Configure Backend (2 min)
```
1. Click Backend service
2. Go to Variables tab
3. Add these NEW variables:

   RUN_WORKER = true
   REDIS_URL = [paste from Redis service]
   PYTHON_CV_PARSER_URL = https://parser.railway.app
   PYTHON_HMAC_SECRET = Itbfr/p8ky/dRMAHLdi/DIiQRLEJtm2SqyNfwuXa3r0=

4. Click "Deploy" button
```

### Step 4: Deploy Frontend Service (2 min)
```
1. Click "New" → "GitHub Repo"
2. Select: recruitment-portal-frontend
3. Click "Deploy"
4. Wait for green checkmark
```

### Step 5: Configure Frontend (1 min)
```
1. Click Frontend service
2. Go to Variables tab
3. Add this variable:

   VITE_API_BASE_URL = https://[BACKEND-URL]/api

   ⚠️  Replace [BACKEND-URL] with your actual backend service URL
   Example: https://gleaming-healing-production-xyz.railway.app/api

4. Click "Deploy" button
```

---

## ✅ TEST DEPLOYMENT (1 min)

```bash
# Test Backend Health
curl https://[BACKEND-URL]/api/health
# Should return: {"status":"ok"}

# Test Queue Health
curl https://[BACKEND-URL]/api/health/queue
# Should return: {"status":"ok","queue":"redis"}

# Test Frontend
Open in browser: https://[FRONTEND-URL]
# Should show login page
```

---

## 🔑 CRITICAL VALUES

**PYTHON_HMAC_SECRET (for backend):**
```
Itbfr/p8ky/dRMAHLdi/DIiQRLEJtm2SqyNfwuXa3r0=
```

**REDIS_URL:**
- Get from Redis service Variables tab
- Format: `redis://default:PASSWORD@HOST:6379`

**VITE_API_BASE_URL (for frontend):**
- Must end with `/api`
- Example: `https://gleaming-healing-production-xyz.railway.app/api`

---

## ⚠️ COMMON ISSUES

| Issue | Fix |
|-------|-----|
| Backend won't start | Check REDIS_URL is correct, RUN_WORKER=true |
| Frontend shows blank page | Check VITE_API_BASE_URL has `/api` suffix |
| Queue health returns error | Verify Redis is running, restart backend |
| "Backend rejected connection" | Check VITE_API_BASE_URL matches your backend URL |

---

## 📱 URLS YOU'LL GET

After deployment, Railway will assign URLs like:
- **Backend:** `https://gleaming-healing-production-abc123.railway.app`
- **Frontend:** `https://gleaming-healing-production-def456.railway.app`
- **Redis:** Auto-configured internally

---

## 🎯 NEXT STEPS

After deployment works:
1. Test uploading a CV via frontend
2. Check parsing job triggers
3. Build Python parser service (Week 4 Day 2)
4. Configure circuit breaker (Week 4 Day 5)

---

**Status:** Ready to Deploy ✅  
**Estimated Time:** 10-15 minutes  
**Date:** January 12, 2026
