# How to Get Python Parser Logs

Since Railway CLI authentication is having issues, here's how to get the logs:

## Option 1: Railway Dashboard (Easiest)

1. Go to https://railway.app
2. Login
3. Select project: **"gleaming-healing"**
4. Find service: **"recruitment-portal-python-parser"**
5. Click **"Logs"** tab
6. Copy the recent logs (last 100-200 lines)

## Option 2: Railway CLI (In Your Terminal)

Run these commands in **your own terminal** (not through me):

```powershell
cd "D:\falisha\Recruitment Automation Portal (2)\python-parser"
railway logs --tail 100
```

Or to filter for errors:
```powershell
railway logs --tail 200 | Select-String -Pattern "error|Error|ERROR|ValueError|ModuleNotFoundError|Failed" -Context 3
```

## Option 3: Check Environment Variables

In Railway Dashboard:
1. Go to **"gleaming-healing"** project
2. Click **"recruitment-portal-python-parser"** service
3. Go to **"Variables"** tab
4. Check if these are set:
   - `PYTHON_HMAC_SECRET`
   - `OPENAI_API_KEY`

## What to Look For

### Common Errors:
- `ValueError: PYTHON_HMAC_SECRET environment variable is required`
- `ValueError: OPENAI_API_KEY environment variable is required`
- `ModuleNotFoundError: No module named 'fastapi'`
- `Failed to start`
- `Port already in use`

### Success Messages:
- `INFO: Started server process`
- `INFO: Application startup complete`
- `INFO: Uvicorn running on http://0.0.0.0:8000`

## Share the Logs

Once you have the logs, share them with me and I'll analyze what's causing the crash!
