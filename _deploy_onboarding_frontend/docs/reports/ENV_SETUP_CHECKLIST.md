# 🚀 RAILWAY DEPLOYMENT - ENV VARIABLES CHECKLIST

## Project Structure
```
gleaming-healing project (54e09ca0-5643-4b5e-a172-8704293ae095)
├── recruitment-portal-backend-production-d1f7 (Port 4000) ← ADD VARS HERE
├── recruitment-portal-python-parser-production (Port 8000)
└── Redis (redis.railway.internal:6379)

exquisite-surprise project
└── exquisite-surprise-production (Port 8080) ← ADD VARS HERE
```

---

## ✅ BACKEND VARIABLES (gleaming-healing)

### Service: recruitment-portal-backend-production-d1f7

Copy and paste these into the Variables tab:

```env
RUN_WORKER=true
REDIS_URL=redis://default:sBtnDrpJrbASwbGejzqByuCroCidLUVI@redis.railway.internal:6379
PYTHON_CV_PARSER_URL=https://recruitment-portal-python-parser-production.up.railway.app
PYTHON_HMAC_SECRET=Itbfr/p8ky/dRMAHLdi/DIiQRLEJtm2SqyNfwuXa3r0=
SUPABASE_URL=https://hncvsextwmvjydcukdwx.supabase.co
SUPABASE_ANON_KEY=sb_publishable_5qD27qPFc04oqSmS61s1tw_lgt8FhBV
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ
NODE_ENV=production
PORT=4000
```

**Steps:**
- [ ] Go to https://railway.app/project/54e09ca0-5643-4b5e-a172-8704293ae095
- [ ] Click recruitment-portal-backend-production-d1f7 service
- [ ] Click "Variables" tab
- [ ] Add each variable above
- [ ] Click "Deploy"
- [ ] Wait for service to restart (~1-2 min)
- [ ] Check logs for: "CV Parser worker started" ✅

---

## ✅ FRONTEND VARIABLES (exquisite-surprise)

### Service: exquisite-surprise-production

Copy and paste these into the Variables tab:

```env
VITE_API_BASE_URL=https://recruitment-portal-backend-production-d1f7.up.railway.app/api
VITE_SUPABASE_URL=https://hncvsextwmvjydcukdwx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_5qD27qPFc04oqSmS61s1tw_lgt8FhBV
```

**Steps:**
- [ ] Go to exquisite-surprise project dashboard
- [ ] Click exquisite-surprise-production service
- [ ] Click "Variables" tab
- [ ] Add each variable above
- [ ] Click "Deploy"
- [ ] Wait for rebuild (~2-3 min)

---

## ✅ VERIFICATION

### Test 1: Backend Health
```bash
curl https://recruitment-portal-backend-production-d1f7.up.railway.app/api/health
```
Expected: `{"status":"ok"}`

### Test 2: Worker Status
Check backend logs for:
```
CV Parser worker started
Document Link worker started
```

### Test 3: Frontend Loads
Open: https://exquisite-surprise-production.up.railway.app
Expected: Login page displays

### Test 4: CV Parsing End-to-End
1. Login to frontend
2. Upload a test CV
3. Check job status (should change from "queued" to "processing")
4. Wait for results

---

## 🔍 TROUBLESHOOTING

If worker doesn't start:
1. Check backend logs for errors
2. Verify RUN_WORKER=true is set
3. Verify REDIS_URL, PYTHON_CV_PARSER_URL, and PYTHON_HMAC_SECRET are set
4. Redeploy backend service

If frontend can't reach backend:
1. Verify VITE_API_BASE_URL is correct
2. Check if backend is responding: curl https://recruitment-portal-backend-production-d1f7.up.railway.app/api/health
3. Rebuild frontend with new URL

---

## 📊 Expected Result

Once all variables are set and services restart:

```
User Uploads CV
    ↓
Frontend sends to Backend API
    ↓
Backend creates parsing_job (status: queued)
    ↓
Worker picks up job from Redis
    ↓
Worker sends to Python Parser Service
    ↓
Parser extracts CV data
    ↓
Backend updates job (status: completed)
    ↓
Frontend shows results
```

That's it! The CV parsing system will be fully operational. 🎉
