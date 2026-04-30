# Using Railway API Token

The Railway CLI might need the token configured differently. Here are alternative ways to use it:

## Option 1: Update Railway Config

The token can be added to the Railway config file. However, the CLI might still need project linking.

## Option 2: Use Railway API Directly

Instead of CLI, we can use the Railway REST API with your token:

```bash
# Get deployment logs
curl -H "Authorization: Bearer a0e017f6-4126-4f99-8bdc-e3911c357d82" \
  "https://api.railway.app/v1/deployments/{deployment_id}/logs"
```

## Option 3: Manual Check (Easiest)

Since the CLI is having issues, the easiest way is:

1. Go to Railway Dashboard: https://railway.app
2. Login with your account
3. Select project: "gleaming-healing"
4. Check backend service logs
5. Share the error messages you see

## What to Look For

In the Railway dashboard logs, look for:
- Errors containing "DocumentVerification"
- Errors containing "Python" or "AI"
- Errors containing "HMAC"
- Errors containing "failed" or "error"
- Messages about workers starting/stopping

## Environment Variables to Check

In Railway Dashboard → Backend Service → Variables:
- `PYTHON_CV_PARSER_URL` - Should match Python parser URL
- `PYTHON_HMAC_SECRET` - Must match Python parser secret
- `RUN_WORKER` - Should be `true`
- `REDIS_URL` - Required for workers
