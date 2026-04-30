# How to Get Railway Logs for Diagnosis

## Quick Commands to Run

Copy and paste these commands in your terminal (one at a time):

### 1. Backend Logs - Document Verification Errors
```powershell
cd "D:\falisha\Recruitment Automation Portal (2)\backend"
railway logs --tail 100 | Select-String -Pattern "DocumentVerification|Python|AI|error|failed|HMAC" -Context 3
```

### 2. Backend Environment Variables
```powershell
railway variables | Select-String -Pattern "PYTHON|HMAC|WORKER"
```

### 3. Python Parser Logs
```powershell
cd "D:\falisha\Recruitment Automation Portal (2)\python-parser"
railway logs --tail 50 | Select-String -Pattern "error|Error|ERROR|failed|Failed|categorize|request" -Context 2
```

### 4. Backend Worker Status
```powershell
cd "D:\falisha\Recruitment Automation Portal (2)\backend"
railway logs --tail 200 | Select-String -Pattern "Worker|worker|RUN_WORKER|DocumentVerificationWorker" -Context 2
```

## What to Look For

### In Backend Logs:
- `[DocumentVerification] Error processing document`
- `AI categorization failed`
- `HMAC signature` errors
- `Failed to call AI service`
- `Python service error`

### In Python Parser Logs:
- `[CategorizeDocument] Error`
- `HMAC verification error`
- `OpenAI categorization error`
- Incoming POST requests to `/categorize-document`

### Environment Variables to Check:
- `PYTHON_CV_PARSER_URL` - Should be: `https://recruitment-portal-python-parser-production.up.railway.app`
- `PYTHON_HMAC_SECRET` - Must match in both backend and python-parser
- `RUN_WORKER` - Should be `true` for backend
- `REDIS_URL` - Required if RUN_WORKER=true

## Share the Output

Copy the output from these commands and share it with me. I'll analyze what's causing the AI processing failures.
