================================================================================
RAILWAY ENVIRONMENT VARIABLES CONFIGURATION
================================================================================

PROJECT: gleaming-healing
ENVIRONMENT: production

================================================================================
BACKEND SERVICE VARIABLES
================================================================================
Service: recruitment-portal-backend-production-d1f7
Port: 4000
URL: https://recruitment-portal-backend-production-d1f7.up.railway.app

VARIABLES TO ADD:
─────────────────────────────────────────────────────────────────────────────

1. RUN_WORKER
   Value: true
   Purpose: Enable CV Parser Worker process

2. REDIS_URL
   Value: redis://default:sBtnDrpJrbASwbGejzqByuCroCidLUVI@redis.railway.internal:6379
   Purpose: Connect to Redis queue for BullMQ

3. PYTHON_CV_PARSER_URL
   Value: https://recruitment-portal-python-parser-production.up.railway.app
   Purpose: URL of the Python CV extraction service

4. PYTHON_HMAC_SECRET
   Value: Itbfr/p8ky/dRMAHLdi/DIiQRLEJtm2SqyNfwuXa3r0=
   Purpose: HMAC secret for signing requests to Python parser

5. SUPABASE_URL
   Value: https://hncvsextwmvjydcukdwx.supabase.co
   Purpose: Supabase database connection

6. SUPABASE_ANON_KEY
   Value: sb_publishable_5qD27qPFc04oqSmS61s1tw_lgt8FhBV
   Purpose: Public Supabase API key

7. SUPABASE_SERVICE_ROLE_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuY3ZzZXh0d212anlkY3VrZHd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI2NzMyOSwiZXhwIjoyMDgyODQzMzI5fQ.X0XKEnH8pUqthf0tziaRWFAsRIaeU6am0qtWDxuR6mQ
   Purpose: Private Supabase service role (admin access)

8. NODE_ENV
   Value: production
   Purpose: Set application to production mode

9. PORT
   Value: 4000
   Purpose: Backend API server port

================================================================================
FRONTEND SERVICE VARIABLES
================================================================================
Project: exquisite-surprise (DIFFERENT PROJECT!)
Service: exquisite-surprise-production
Port: 8080
URL: https://exquisite-surprise-production.up.railway.app

VARIABLES TO ADD:
─────────────────────────────────────────────────────────────────────────────

1. VITE_API_BASE_URL
   Value: https://recruitment-portal-backend-production-d1f7.up.railway.app/api
   Purpose: Backend API endpoint for frontend to call

2. VITE_SUPABASE_URL
   Value: https://hncvsextwmvjydcukdwx.supabase.co
   Purpose: Supabase URL for frontend

3. VITE_SUPABASE_ANON_KEY
   Value: sb_publishable_5qD27qPFc04oqSmS61s1tw_lgt8FhBV
   Purpose: Public Supabase key for frontend

================================================================================
PYTHON PARSER SERVICE VARIABLES (if needed)
================================================================================
Service: recruitment-portal-python-parser-production
Port: 8000
URL: https://recruitment-portal-python-parser-production.up.railway.app

VARIABLES TO ADD:
─────────────────────────────────────────────────────────────────────────────

1. HMAC_SECRET
   Value: Itbfr/p8ky/dRMAHLdi/DIiQRLEJtm2SqyNfwuXa3r0=
   Purpose: HMAC secret (MUST MATCH backend PYTHON_HMAC_SECRET)

2. OPENAI_API_KEY
   Value: [Your OpenAI API key]
   Purpose: OpenAI API for CV parsing

================================================================================
STEP-BY-STEP INSTRUCTIONS
================================================================================

STEP 1: Add Backend Variables (gleaming-healing project)
────────────────────────────────────────────────────────
1. Go to: https://railway.app/project/54e09ca0-5643-4b5e-a172-8704293ae095
2. Click on "recruitment-portal-backend-production-d1f7" service
3. Click "Variables" tab
4. Add each variable from the BACKEND SERVICE VARIABLES section above
5. Click "Deploy" to restart the service with new variables

STEP 2: Add Frontend Variables (exquisite-surprise project)
────────────────────────────────────────────────────────────
1. Go to: https://railway.app/project/[EXQUISITE-SURPRISE-PROJECT-ID]
2. Click on "exquisite-surprise-production" service
3. Click "Variables" tab
4. Add each variable from the FRONTEND SERVICE VARIABLES section above
5. Click "Deploy" to rebuild the frontend

STEP 3: Verify Worker is Running
──────────────────────────────────
1. Go to backend service logs
2. Look for message: "CV Parser worker started"
3. When you upload a CV, job status should change from "queued" to "processing"

================================================================================
WHAT HAPPENS WHEN YOU ADD THESE VARIABLES
================================================================================

✅ Backend Service Will:
   - Start the CV Parser Worker process
   - Connect to Redis queue
   - Listen for CV parsing jobs
   - Send requests to Python parser service
   - Update job status in database

✅ Frontend Will:
   - Know how to call the backend API
   - Connect to Supabase for real-time updates
   - Upload CVs to backend successfully
   - Display parsing results

✅ CV Parsing Workflow Will:
   1. User uploads CV in frontend
   2. Frontend sends to backend API
   3. Backend creates parsing job (status: "queued")
   4. Worker picks up job from Redis
   5. Worker calls Python parser service
   6. Python parser returns extracted data
   7. Backend updates job status to "completed"
   8. Frontend displays results in real-time

================================================================================
