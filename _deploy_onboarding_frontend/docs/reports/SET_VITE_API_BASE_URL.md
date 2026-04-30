# Set VITE_API_BASE_URL Environment Variable

## Problem
The frontend is showing `ERR_CONNECTION_REFUSED` because it can't connect to the backend. This is because `VITE_API_BASE_URL` is not set in Railway.

## Solution: Set Environment Variable in Railway Dashboard

### Step 1: Open Railway Dashboard
1. Go to https://railway.app
2. Navigate to your frontend project: **exquisite-surprise**
3. Click on the frontend service

### Step 2: Add Environment Variable
1. Click on the **"Variables"** tab
2. Click **"New Variable"** or **"Raw Editor"**
3. Add the following variable:

**Key:** `VITE_API_BASE_URL`  
**Value:** `https://recruitment-portal-backend-production-d1f7.up.railway.app/api`

### Step 3: Save and Redeploy
1. Click **"Save"** or **"Update Variables"**
2. Railway will automatically trigger a redeploy
3. Wait for the deployment to complete

### Step 4: Verify
1. After deployment, refresh your frontend
2. Check the browser console - you should see:
   ```
   [API Client] API_BASE_URL: https://recruitment-portal-backend-production-d1f7.up.railway.app/api
   ```
3. The `ERR_CONNECTION_REFUSED` error should be gone

## Alternative: Using Railway CLI (if authenticated)

If you're authenticated with Railway CLI, you can run:

```bash
railway variables --set "VITE_API_BASE_URL=https://recruitment-portal-backend-production-d1f7.up.railway.app/api" --service 10b59aee-074a-49e4-b7b5-d303b953ce4f
```

## Important Notes

- **VITE_** prefix is required for Vite to expose the variable to the frontend
- The URL must include `/api` at the end
- After setting the variable, Railway will automatically redeploy
- The deployment may take 2-5 minutes

## Current Configuration

- **Frontend Project:** exquisite-surprise
- **Frontend Service ID:** 10b59aee-074a-49e4-b7b5-d303b953ce4f
- **Backend URL:** https://recruitment-portal-backend-production-d1f7.up.railway.app
- **Required Variable:** `VITE_API_BASE_URL=https://recruitment-portal-backend-production-d1f7.up.railway.app/api`
