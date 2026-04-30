# 🔍 Employee Logs - Quick Troubleshooting Guide

## ⚡ Quick Start Testing

### 1. Verify Database Setup
Run these queries in Supabase SQL Editor:

```sql
-- Check tables exist
SELECT COUNT(*) as task_types_count FROM task_types;
SELECT COUNT(*) as employee_logs_count FROM employee_logs;

-- Check RLS is on
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('task_types', 'employee_logs');

-- Check task types
SELECT id, name FROM task_types LIMIT 5;
```

**Expected:**
- ✓ task_types shows 9 rows
- ✓ employee_logs shows 0 rows initially
- ✓ rowsecurity = true for both

---

### 2. Check Backend Routes

**File:** `/backend/src/routes/index.ts`  
**Line 41 should have:**
```typescript
router.use('/employee-logs', employeeLogsRoutes);
```

**If missing:** Add it and restart backend

---

### 3. Test API Endpoints

#### Test Get Task Types (No auth needed)
```bash
curl -X GET http://localhost:3000/api/employee-logs/task-types
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "CV screening",
      "description": "...",
      "is_active": true
    },
    // ... 8 more
  ]
}
```

**If 404:** Route not registered. Check Step 2 above.  
**If 500:** Database error. Check migrations ran.

---

#### Test Create Log (With auth)
```bash
curl -X POST http://localhost:3000/api/employee-logs/logs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": "550e8400-e29b-41d4-a716-446655440000",
    "task_type_id": "test-uuid-here",
    "description": "Test log",
    "time_spent_minutes": 30
  }'
```

**Expected (201):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "employee_id": "...",
    "candidate_id": "...",
    "description": "Test log",
    "created_at": "2026-02-05T..."
  }
}
```

**If 401:** No valid token. Check authentication.  
**If 400:** Missing field. Check required fields.  
**If 500:** Database constraint error.

---

## 🐛 Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| **404 on /api/employee-logs/task-types** | Route not registered | Add route to index.ts, restart server |
| **ERR_CONNECT_REFUSED** | Backend not running | `npm start` in backend directory |
| **401 Unauthorized** | Invalid/missing token | Use real JWT from login |
| **400 Missing fields** | Forgot required field | Check `candidate_id`, `task_type_id`, `description` |
| **Foreign key violation** | IDs don't exist | Use real UUID from database |
| **RLS policy violation** | User role mismatch | Check user role in auth metadata |

---

## ✅ Endpoint Checklist

### Must Work ✓
- [ ] GET /api/employee-logs/task-types → 200 with array
- [ ] POST /api/employee-logs/logs → 201 (auth required)
- [ ] GET /api/employee-logs/logs → 200 with array (auth required)
- [ ] GET /api/employee-logs/team/logs → 200 (manager/admin only)

### Should Work ✓
- [ ] GET /api/employee-logs/logs/:id → 200 with object
- [ ] PUT /api/employee-logs/logs/:id → 200 with updated object
- [ ] GET /api/employee-logs/team/summary → 200 with array
- [ ] GET /api/employee-logs/candidate/:id/activity → 200 with array

---

## 💻 Frontend Check

### In Browser (After `npm run dev`)

**Check 1: Sidebar has "Employees"**
- Open app
- Look for "Employees" button in sidebar
- Should be under "OPERATIONS" section
- ✓ Click it

**Check 2: Dashboard Tab**
- Click "Employees"
- Should show "My Daily Log" tab by default
- Should show 4 stat cards (today's data)
- ✓ See "Add Daily Log" button

**Check 3: Form Opens**
- Click "Add Daily Log"
- Modal/dialog should appear
- Should have dropdowns for:
  - Candidate (searchable)
  - Task Type
- ✓ Should have description input
- ✓ Should have time input

**Check 4: Form Works**
- Select a candidate
- Select a task type
- Enter description
- Enter time
- Click submit
- ✓ Should see success
- ✓ Modal closes
- ✓ Log appears in dashboard

---

## 🔧 Debug Steps

### If something fails, check:

**1. Is backend running?**
```bash
curl http://localhost:3000/api/candidates
```
Should return JSON (or auth error), not connection error.

**2. Are migrations applied?**
```sql
SELECT * FROM task_types;
```
Should return 9 rows.

**3. Are routes registered?**
Check `/backend/src/routes/index.ts` line 41.

**4. Are controllers present?**
File should exist: `/backend/src/controllers/employeeLogsController.ts`

**5. Are services present?**
File should exist: `/backend/src/services/employeeLogsService.ts`

**6. Is auth working?**
```bash
curl -X GET http://localhost:3000/api/employee-logs/task-types
```
Should work without token (public endpoint).

**7. Is database connected?**
Check `.env` has `SUPABASE_URL` and `SUPABASE_KEY`.

---

## 📝 Testing Workflow

### Step 1: Backend Tests
```bash
# Run in PowerShell
.\test-employee-logs-api.ps1

# Or use cURL for each endpoint
```

### Step 2: Database Tests
```sql
-- In Supabase SQL Editor

-- Check task types
SELECT * FROM task_types;

-- Try to insert a test log
INSERT INTO employee_logs (
  employee_id, candidate_id, task_type_id, 
  description, log_date
) VALUES (
  'user-id', 'candidate-id', 'task-id',
  'Test', CURRENT_DATE
);

-- Check it was inserted
SELECT * FROM employee_logs;
```

### Step 3: Frontend Tests
```bash
# Start dev server
npm run dev

# Then manually test in browser:
# 1. Go to Employees tab
# 2. Click Add Daily Log
# 3. Fill form
# 4. Submit
# 5. Check database with SQL above
```

---

## 🎯 Success Criteria

You'll know it's working when:

✅ **Database**
- Tables exist: `task_types`, `employee_logs`
- Task types populated: 9 entries
- RLS enabled
- Views created

✅ **API**
- GET /task-types returns 200 with 9 items
- POST /logs returns 201 with created log
- GET /logs returns logs
- GET /team/logs works (manager/admin)

✅ **Frontend**
- "Employees" in sidebar
- Dashboard shows stats
- "Add Daily Log" button works
- Form submits and shows in dashboard

When all these work → **System is ready!** 🚀

---

## 📞 Quick Reference

| Command | Purpose |
|---------|---------|
| `curl http://localhost:3000/api/employee-logs/task-types` | Test API |
| `npm start` | Start backend |
| `npm run dev` | Start frontend |
| Supabase SQL Editor | Run migrations |

---

**Everything ready to test! Let's go! 🚀**
