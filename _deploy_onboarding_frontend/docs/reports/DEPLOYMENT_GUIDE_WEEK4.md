# Week 4 Deployment Guide - Railway

## Railway Project Credentials
- **Project Name:** gleaming-healing
- **Project ID:** 585a6314-92d3-4312-8476-0cf8d388488b
- **Account Token:** 46f5f85f-ba9b-4c7d-80aa-1f75441d6040

---

## Backend Deployment (Express + BullMQ + Supabase)

### Step 1: Connect Backend Repository
1. Go to: https://railway.app/project/585a6314-92d3-4312-8476-0cf8d388488b
2. Click **"New"** → **"GitHub Repo"**
3. Select **`recruitment-portal-backend`** (already pushed)
4. Railway will auto-detect `package.json` and `Dockerfile` (if exists)
5. Click **Deploy**

### Step 2: Configure Backend Environment Variables

```env
# Database (already configured from Week 3)
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Week 4 Queue System (NEW)
REDIS_URL=redis://...  # See Redis Setup below
PYTHON_CV_PARSER_URL=https://your-python-service.railway.app
PYTHON_HMAC_SECRET=generate-random-secret-key
RUN_WORKER=true

# Email & Auth (from Week 1-3)
GMAIL_SERVICE_ACCOUNT_EMAIL=...
GMAIL_PRIVATE_KEY=...
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
OPENAI_API_KEY=...
JWT_SECRET=your-jwt-secret

# Environment
NODE_ENV=production
PORT=3000
```

### Step 3: Deploy Redis
**Option A: Railway Redis Plugin (Recommended)**
1. In Railway project, click **"New"** → **"Database"** → **"Redis"**
2. Copy `REDIS_URL` from the Redis service config
3. Add to backend environment variables
4. Restart backend service

**Option B: Upstash (Alternative)**
1. Go to https://upstash.com
2. Create Redis database
3. Copy connection URL (format: `redis://default:password@host:port`)
4. Add as `REDIS_URL` in Railway backend config

---

## Frontend Deployment (Vite + React)

### Step 1: Connect Frontend Repository
1. In Railway project, click **"New"** → **"GitHub Repo"**
2. Select **`recruitment-portal-frontend`** (already pushed)
3. Railway will auto-detect `package.json` and `vite.config.ts`
4. Click **Deploy**

### Step 2: Configure Frontend Environment Variables

```env
# API Connection (NEW for Week 4)
VITE_API_BASE_URL=https://your-backend.railway.app/api

# Keep existing configs if any
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

### Step 3: Build & Deploy
- Railway auto-builds with `npm run build`
- Serves from `dist/` folder
- Auto-redeploys on git push

---

## Python CV Parser Service (Week 4 Day 2 Task)

### Pre-Deployment Checklist
- [ ] Python FastAPI service created
- [ ] `requirements.txt` generated
- [ ] `Dockerfile` created (see template below)
- [ ] Code pushed to separate GitHub repo

### Dockerfile Template for Python Service

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Deployment Steps
1. Create GitHub repo: `recruitment-portal-python-parser`
2. Push code with `Dockerfile` and `requirements.txt`
3. In Railway project: **New** → **GitHub Repo** → Select Python repo
4. Set environment variables:
   ```env
   OPENAI_API_KEY=your-key
   HMAC_SECRET=matches-backend-PYTHON_HMAC_SECRET
   ENVIRONMENT=production
   ```
5. Railway auto-deploys

---

## Verification Checklist

### Backend Checks
- [ ] Service running at `https://your-backend.railway.app`
- [ ] Health check: `GET /api/health` → 200 OK
- [ ] Queue health: `GET /api/health/queue` → 200 OK
- [ ] Inbox API: `GET /api/cv-inbox/attachments` → 200 OK

### Frontend Checks
- [ ] Frontend loading at `https://your-frontend.railway.app`
- [ ] Login page displays
- [ ] API calls hitting correct backend URL

### Integration Checks
- [ ] Upload CV via inbox
- [ ] POST to `/api/cv-inbox/attachments/:id/process` succeeds
- [ ] Job ID returned in response
- [ ] GET `/api/parsing-jobs/:jobId` returns status

### Python Service Checks (Once Deployed)
- [ ] Health check: `GET /health` → 200 OK
- [ ] Parse endpoint: `POST /parse-cv` accepts requests
- [ ] HMAC signature validation working
- [ ] OpenAI integration functional

---

## Environment Variable Mapping

| Variable | Source | Backend | Frontend |
|----------|--------|---------|----------|
| `REDIS_URL` | Railway Redis | ✓ | - |
| `DATABASE_URL` | Railway PostgreSQL | ✓ | - |
| `OPENAI_API_KEY` | OpenAI Dashboard | ✓ Backend + Python | - |
| `PYTHON_CV_PARSER_URL` | Python service URL | ✓ | - |
| `PYTHON_HMAC_SECRET` | Random generated | ✓ Backend + Python | - |
| `VITE_API_BASE_URL` | Backend URL | - | ✓ |
| `NODE_ENV` | - | production | - |
| `RUN_WORKER=true` | - | ✓ (for worker process) | - |

---

## Auto-Deploy Configuration

Both services will auto-deploy when you:
1. Push to GitHub main branch
2. Railway detects code changes
3. Auto-builds and deploys (takes 2-5 minutes)

**No manual deployment needed after initial setup!**

---

## Troubleshooting

### Redis Connection Issues
```bash
# Test Redis connection
redis-cli -u $REDIS_URL PING
# Should return: PONG
```

### Queue Not Processing
1. Check `RUN_WORKER=true` is set in backend
2. Verify `REDIS_URL` is correct
3. Check worker logs in Railway dashboard
4. Ensure Python service URL is reachable

### Frontend Not Connecting
1. Verify `VITE_API_BASE_URL` includes `/api` suffix
2. Check CORS settings in backend
3. Verify backend is running
4. Check browser console for network errors

### Python Service Errors
1. Verify `HMAC_SECRET` matches backend config
2. Check OpenAI API key is valid
3. Verify file download URLs are accessible
4. Check timeout settings (60s default)

---

## Next Steps

1. **Set up Redis** (Railway or Upstash)
2. **Deploy backend service** to Railway
3. **Deploy frontend service** to Railway
4. **Start Python parser service** development (Week 4 Day 2)
5. **Configure Python service** environment and deploy
6. **Run end-to-end tests** from smoke test scripts

---

**Estimated Deployment Time:** 15-20 minutes total
