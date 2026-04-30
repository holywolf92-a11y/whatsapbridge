# Deployment Overview

## Git Remotes
- Frontend repo: `frontend` remote → https://github.com/holywolf92-a11y/recruitment-portal-frontend.git (branch: main)
- Backend submodule: `backend` remote → https://github.com/holywolf92-a11y/recruitment-portal-backend.git (branch: main)
- Python Parser: `origin` remote → https://github.com/holywolf92-a11y/recruitment-portal-python-parser.git (branch: main)

## Current Code Revisions
- Frontend HEAD: 81c20a7c60f1661dbd3dcd0605231dcfbf49493f (includes CV Inbox delete UI)
- Backend submodule: 6e3c74a (maps all CV extraction fields)
- Python Parser: 4e9e76a (improved extraction with nationality, position, skills, country_of_interest)

## Deployments
- **Backend service:** Railway project `gleaming-healing` / service `recruitment-portal-backend`
  - Latest deploy: 6e3c74a - Maps all CV extraction fields from Python parser
  - Build logs: https://railway.com/project/54e09ca0-5643-4b5e-a172-8704293ae095/service/7c9d5772-56f3-41a2-b2a8-a94952c39ffb

- **Python Parser service:** Railway project `gleaming-healing` / service `recruitment-portal-python-parser`
  - Latest deploy: 4e9e76a - Enhanced CV extraction (nationality, position, skills, country_of_interest with "missing" default)
  - Build logs: https://railway.com/project/54e09ca0-5643-4b5e-a172-8704293ae095/service/2f85c008-6730-4731-bb41-8c3ef59f90ae

- **Frontend:** Railway project `exquisite-surprise` / service `exquisite-surprise`
  - Latest deploy: 81c20a7 - CV Inbox delete action
  - Build logs: https://railway.com/project/f6697836-a039-4c9c-aa26-c659dc634b86/service/10b59aee-074a-49e4-b7b5-d303b953ce4f

## CV Extraction Improvements (Latest)
**What was fixed:**
1. ✅ Added extraction of **nationality** (country of origin/citizenship)
2. ✅ Added extraction of **position** (desired job position/profession)
3. ✅ Enhanced **skills** extraction with explicit instructions to capture ALL skills
4. ✅ Added **country_of_interest** with "missing" default if not found
5. ✅ Backend worker now maps all extracted fields to candidate record

**Python Parser Enhancements:**
- Updated prompt to explicitly request nationality, position, experience_years, country_of_interest
- Added comprehensive skills extraction instructions (technical, soft skills, tools, frameworks)
- Added "missing" default for country_of_interest when null/empty
- Calculates experience_years from work history if not explicitly stated

**Backend Worker Updates:**
- Maps nationality, position, country_of_interest from Python parser
- Converts skills array to comma-separated string
- Converts languages array to comma-separated string
- Builds education summary from education array
- Converts certifications array to comma-separated string
- Falls back to "missing" for country_of_interest

## Commands
- Deploy backend: `cd backend && railway up`
- Deploy Python parser: `cd python-parser && railway up`
- Deploy frontend: `railway up` (from repo root)
- Tail backend logs: `cd backend && railway logs --service recruitment-portal-backend`
- Tail parser logs: `cd python-parser && railway logs --service recruitment-portal-python-parser`

## Notes
- Push to frontend uses `frontend` remote (not `origin`)
- Python parser push to GitHub failed (403 permission error) but Railway deployment succeeded via `railway up`
- All three services are in Railway project `gleaming-healing` except frontend which is in `exquisite-surprise`
