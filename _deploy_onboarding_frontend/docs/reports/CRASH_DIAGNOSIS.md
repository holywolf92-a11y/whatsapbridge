# Backend Crash Diagnosis Guide

## Common Crash Causes

### 1. Missing Environment Variables ⚠️ MOST COMMON

The backend **requires** `SUPABASE_SERVICE_ROLE_KEY` to start. If missing, it will crash immediately:

```typescript
// src/config/env.ts line 16-18
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required and must be set via environment variables');
}
```

**Fix**: Add `SUPABASE_SERVICE_ROLE_KEY` to Railway environment variables.

### 2. Redis Connection Failure (if RUN_WORKER=true)

If `RUN_WORKER=true` is set but Redis is not accessible, workers will fail to start and may crash the server.

**Fix**: 
- Verify `REDIS_URL` is set correctly in Railway
- Check Redis service is running
- Or set `RUN_WORKER=false` to disable workers

### 3. Python Parser Connection Failure

If workers are enabled but Python parser is not accessible:
- `PYTHON_CV_PARSER_URL` missing or incorrect
- `PYTHON_HMAC_SECRET` missing or incorrect

**Fix**: Verify Python parser service is running and environment variables are set.

### 4. Port Already in Use

If port 3000 (or configured PORT) is already in use, server will crash.

**Fix**: Railway automatically assigns ports, but check if there's a conflict.

### 5. TypeScript Compilation Errors

If there are TypeScript errors, the build will fail and server won't start.

**Fix**: Run `npm run build` locally to check for errors.

### 6. Missing Dependencies

If `node_modules` is not installed, server will crash on startup.

**Fix**: Railway should run `npm install` automatically, but verify in deployment logs.

## How to Diagnose

### Step 1: Check Railway Logs

```bash
cd "D:\falisha\Recruitment Automation Portal (2)\backend"
railway logs --tail 100
```

Look for:
- `Error: SUPABASE_SERVICE_ROLE_KEY is required`
- `Failed to start workers`
- `Server failed to start`
- `EADDRINUSE` (port conflict)
- `Cannot find module` (missing dependency)

### Step 2: Run Diagnostic Script

```bash
cd "D:\falisha\Recruitment Automation Portal (2)\backend"
node scripts/diagnose-crash.js
```

This will check:
- Backend health endpoint
- Supabase connection
- API endpoints

### Step 3: Check Environment Variables

In Railway dashboard, verify these are set:
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (REQUIRED)
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `PORT` (optional, defaults to 3000)
- ⚠️ `RUN_WORKER` (if true, also need REDIS_URL, PYTHON_CV_PARSER_URL, PYTHON_HMAC_SECRET)

### Step 4: Check Build Logs

In Railway deployment logs, look for:
- Build success/failure
- TypeScript compilation errors
- npm install errors

## Quick Fixes

### Fix 1: Add Missing Environment Variable

1. Go to Railway dashboard
2. Select backend service
3. Go to Variables tab
4. Add `SUPABASE_SERVICE_ROLE_KEY` with your Supabase service role key
5. Redeploy

### Fix 2: Disable Workers (Temporary)

If workers are causing issues:
1. Set `RUN_WORKER=false` in Railway
2. Redeploy

### Fix 3: Check Service Status

```bash
railway status
```

Should show:
- Project: gleaming-healing
- Service: [service-name]
- Status: Deployed

## Emergency Recovery

If backend is completely down:

1. **Check Railway Dashboard**
   - Go to Railway dashboard
   - Check deployment status
   - Review recent deployments

2. **Redeploy**
   - Trigger a new deployment
   - Or push a commit to trigger auto-deploy

3. **Rollback** (if needed)
   - In Railway, go to Deployments
   - Find last working deployment
   - Click "Redeploy"

## Prevention

1. ✅ Always set required environment variables before deployment
2. ✅ Test builds locally: `npm run build`
3. ✅ Check logs after deployment
4. ✅ Use health endpoints to monitor status
5. ✅ Set up Railway monitoring/alerts

## Next Steps

1. Run the diagnostic script
2. Check Railway logs
3. Verify environment variables
4. Check deployment status in Railway dashboard
