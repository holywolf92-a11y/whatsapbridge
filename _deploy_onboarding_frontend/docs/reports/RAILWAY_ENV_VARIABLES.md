# Railway Environment Variables Template

## Backend Service Configuration

```env
# ===== DATABASE & SUPABASE (from Week 3) =====
DATABASE_URL=postgresql://postgres:password@host:5432/recruitment_portal
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# ===== WEEK 4: QUEUE SYSTEM (CRITICAL) =====
# Redis connection
REDIS_URL=redis://:password@host:6379
# or for Railway Redis Plugin:
# REDIS_URL=redis://default:password@redis.railway.internal:6379

# Python parser service
PYTHON_CV_PARSER_URL=https://cv-parser-production-xxxx.railway.app
PYTHON_HMAC_SECRET=your-generated-secret-key-min-32-chars

# Worker process
RUN_WORKER=true

# Gmail polling worker (optional)
# Default behavior in code is disabled unless explicitly set to true.
RUN_GMAIL_POLLING=false

# ===== AUTHENTICATION & EXTERNAL SERVICES =====
# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_OAUTH_REFRESH_TOKEN=1//0gxxx

# Gmail Service
GMAIL_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GMAIL_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIE...

# OpenAI (for Python parser)
OPENAI_API_KEY=sk-proj-xxxxx

# JWT
JWT_SECRET=your-jwt-secret-key

# ===== APPLICATION SETTINGS =====
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# ===== FEATURE FLAGS (Optional) =====
ENABLE_CV_PARSING=true
ENABLE_QUEUE_MONITORING=true
```

---

## Frontend Service Configuration

```env
# ===== API CONNECTION (CRITICAL) =====
# Must include /api suffix
VITE_API_BASE_URL=https://your-backend.railway.app/api

# ===== OPTIONAL SUPABASE CLIENT (if needed) =====
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# ===== BUILD SETTINGS =====
VITE_ENVIRONMENT=production
```

---

## Python Parser Service Configuration (Week 4 Day 2)

```env
# ===== SERVER =====
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=production

# ===== SECURITY (HMAC MUST MATCH BACKEND) =====
HMAC_SECRET=your-generated-secret-key-min-32-chars

# ===== EXTERNAL APIs =====
OPENAI_API_KEY=sk-proj-xxxxx
OPENAI_MODEL=gpt-4  # or gpt-3.5-turbo for cost savings

# ===== PARSING CONFIGURATION =====
PARSING_TIMEOUT=60
MAX_FILE_SIZE=10485760  # 10MB in bytes
SUPPORTED_FORMATS=pdf,doc,docx

# ===== LOGGING =====
LOG_LEVEL=info
```

---

## How to Set Variables in Railway

### Method 1: Railway Dashboard UI
1. Go to your service in Railway
2. Click "Variables" tab
3. Add each variable:
   - Click "New Variable"
   - Enter key and value
   - Save

### Method 2: Railway CLI (once installed)
```bash
railway variable add REDIS_URL "redis://..."
railway variable add RUN_WORKER "true"
# etc.
```

### Method 3: .env File (for local development)
```bash
# Create .env file in root
cp .env.example .env
# Edit .env with actual values
# NOTE: Never commit .env to git!
```

---

## Important Notes

### REDIS_URL Format Examples

**Railway Redis Plugin:**
```
redis://default:PASSWORD@redis.railway.internal:6379
```

**Upstash:**
```
redis://default:PASSWORD@HOSTNAME:6379
```

**Local Redis (development):**
```
redis://127.0.0.1:6379
```

### PYTHON_HMAC_SECRET

Must be:
- ✓ Identical on backend and Python service
- ✓ Minimum 32 characters
- ✓ Random and secure
- ✓ NOT hardcoded in git

Generate a secure key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: abc123def456... (copy this as PYTHON_HMAC_SECRET)
```

### VITE_API_BASE_URL

**MUST include /api suffix:**
```
✓ https://your-backend.railway.app/api
✗ https://your-backend.railway.app
```

This matches the backend route structure:
```
GET  https://your-backend.railway.app/api/cv-inbox/attachments
POST https://your-backend.railway.app/api/cv-inbox/attachments/:id/process
GET  https://your-backend.railway.app/api/parsing-jobs/:id
```

---

## Verification Script

After setting variables, test connectivity:

```bash
# Test Backend
curl https://your-backend.railway.app/api/health

# Test Frontend
curl https://your-frontend.railway.app

# Test Redis (from backend logs)
# Should see: "Redis connected successfully"

# Test Python Parser (after deployment)
curl https://your-parser.railway.app/health
```

---

## Secret Management Best Practices

1. **Never commit secrets to git**
   - Use `.env.example` with placeholder values
   - Add `.env` to `.gitignore`

2. **Rotate secrets regularly**
   - OpenAI API keys: rotate monthly
   - HMAC secrets: rotate when service is updated
   - Database passwords: rotate quarterly

3. **Use Railway Secrets for sensitive data**
   - All API keys stored in Railway dashboard
   - Not visible in logs or error messages
   - Rotated without code changes

4. **Monitor for leaks**
   - GitHub secret scanning enabled
   - AWS Secrets Manager optional
   - Regular audit logs

---

## Troubleshooting Variables

| Problem | Check |
|---------|-------|
| Service won't start | Check `REDIS_URL` connection string |
| 500 errors from backend | Check `SUPABASE_SERVICE_ROLE_KEY` |
| Frontend shows errors | Check `VITE_API_BASE_URL` (must end with `/api`) |
| Worker not processing | Check `RUN_WORKER=true` is set |
| Python service fails | Check `HMAC_SECRET` matches backend |
| OpenAI errors | Check `OPENAI_API_KEY` is valid |

---

**Last Updated:** January 12, 2026  
**Week:** 4 - CV Processing Queue
