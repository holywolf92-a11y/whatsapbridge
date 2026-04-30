# 🔌 Employee Task Log - Developer API Reference

## Base URL
```
http://localhost:3000/api/employee-logs
https://your-production-domain/api/employee-logs
```

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 📌 Employee Logs Endpoints

### Create Log Entry
**POST** `/logs`

Creates a new daily work log for the authenticated employee.

**Request Body:**
```json
{
  "candidate_id": "550e8400-e29b-41d4-a716-446655440000",
  "task_type_id": "760e8400-e29b-41d4-a716-446655440001",
  "description": "Detailed description of work performed",
  "time_spent_minutes": 30,
  "status": "completed"
}
```

**Required Fields:**
- `candidate_id` (string, UUID)
- `task_type_id` (string, UUID)
- `description` (string, min 10 chars)

**Optional Fields:**
- `time_spent_minutes` (number, default 0)
- `status` (string, default "completed", enum: ["completed", "pending", "cancelled"])

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "employee_id": "550e8400-e29b-41d4-a716-446655440003",
    "candidate_id": "550e8400-e29b-41d4-a716-446655440000",
    "task_type_id": "760e8400-e29b-41d4-a716-446655440001",
    "description": "Detailed description of work performed",
    "time_spent_minutes": 30,
    "status": "completed",
    "log_date": "2026-02-05",
    "is_flagged": false,
    "created_at": "2026-02-05T10:30:00Z",
    "updated_at": "2026-02-05T10:30:00Z"
  }
}
```

**Error Responses:**
- `400` - Missing required fields
- `401` - Unauthenticated
- `500` - Server error

---

### Get Employee's Logs
**GET** `/logs`

Retrieves logs for the authenticated employee with optional filters.

**Query Parameters:**
```
?startDate=2026-02-01&endDate=2026-02-05&candidateId=uuid&taskTypeId=uuid&status=completed&limit=50&offset=0
```

| Parameter | Type | Default | Example |
|-----------|------|---------|---------|
| `startDate` | date | - | 2026-02-01 |
| `endDate` | date | - | 2026-02-05 |
| `candidateId` | UUID | - | 550e8400-... |
| `taskTypeId` | UUID | - | 760e8400-... |
| `status` | string | - | completed |
| `limit` | number | 50 | 100 |
| `offset` | number | 0 | 50 |

**Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "employee_id": "550e8400-e29b-41d4-a716-446655440003",
      "candidate_id": "550e8400-e29b-41d4-a716-446655440000",
      "candidate_name": "John Doe",
      "task_type": "CV screening",
      "description": "Reviewed CV and contacted candidate",
      "time_spent_minutes": 30,
      "status": "completed",
      "log_date": "2026-02-05",
      "created_at": "2026-02-05T10:30:00Z"
    }
  ],
  "count": 25
}
```

---

### Get Specific Log
**GET** `/logs/:id`

Retrieves a single log entry by ID (employee can only view their own).

**Response (200):**
```json
{
  "success": true,
  "data": { /* log object */ }
}
```

**Error Responses:**
- `404` - Log not found or unauthorized

---

### Update Log
**PUT** `/logs/:id`

Updates an existing log (same-day edits only).

**Request Body:**
```json
{
  "description": "Updated description",
  "time_spent_minutes": 45,
  "status": "pending"
}
```

**Enforced Rules:**
- ❌ Cannot change `candidate_id` or `task_type_id`
- ❌ Cannot change `log_date` (only same-day)
- ❌ Cannot update logs from previous days

**Response (200):**
```json
{
  "success": true,
  "data": { /* updated log */ }
}
```

**Error Responses:**
- `403` - Cannot edit logs from other days
- `404` - Log not found
- `400` - Invalid update

---

### Delete Log
**DELETE** `/logs/:id`

Deletes a log (admin only). Prefer using flag instead of delete.

**Response (200):**
```json
{
  "success": true,
  "message": "Log deleted successfully"
}
```

**Error Responses:**
- `403` - Only admins can delete
- `404` - Log not found

---

## 👥 Team Management Endpoints

### Get Team Logs
**GET** `/team/logs`

Retrieves all team logs (manager/admin only).

**Query Parameters:**
```
?startDate=2026-02-01&endDate=2026-02-05&employeeId=uuid&candidateId=uuid&taskTypeId=uuid&limit=100&offset=0
```

| Parameter | Type | Default |
|-----------|------|---------|
| `startDate` | date | - |
| `endDate` | date | - |
| `employeeId` | UUID | - |
| `candidateId` | UUID | - |
| `taskTypeId` | UUID | - |
| `limit` | number | 100 |
| `offset` | number | 0 |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "employee_name": "Jane Smith",
      "candidate_name": "John Doe",
      "task_type": "Candidate call",
      "description": "Conducted initial screening call",
      "time_spent_minutes": 20,
      "log_date": "2026-02-05",
      "status": "completed",
      "is_flagged": false
    }
  ],
  "count": 150
}
```

**Permissions:**
- Manager: View team members' logs only
- Admin: View all employees' logs

---

### Get Employee Daily Summary
**GET** `/team/summary`

Retrieves daily summary metrics for reporting.

**Query Parameters:**
```
?startDate=2026-02-01&endDate=2026-02-05&employeeId=uuid
```

**Response (200):**
```json
[
  {
    "employee_id": "550e8400-e29b-41d4-a716-446655440003",
    "employee_name": "Jane Smith",
    "log_date": "2026-02-05",
    "total_logs": 8,
    "unique_candidates": 5,
    "total_time_spent": 240
  },
  {
    "employee_id": "550e8400-e29b-41d4-a716-446655440004",
    "employee_name": "Bob Johnson",
    "log_date": "2026-02-05",
    "total_logs": 6,
    "unique_candidates": 4,
    "total_time_spent": 180
  }
]
```

---

## 🎯 Candidate Activity Endpoints

### Get Candidate Activity Log
**GET** `/candidate/:candidateId/activity`

Retrieves all employee logs for a specific candidate.

**Path Parameters:**
```
:candidateId (UUID) - Target candidate
```

**Query Parameters:**
```
?limit=100&offset=0
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "log_date": "2026-02-05",
      "employee_name": "Jane Smith",
      "task_type": "CV screening",
      "description": "Reviewed CV and sent interview invite",
      "time_spent_minutes": 15,
      "status": "completed",
      "created_at": "2026-02-05T14:30:00Z"
    }
  ],
  "count": 12
}
```

---

## 📋 Task Types Endpoints

### List Task Types
**GET** `/task-types`

Retrieves available task types (active only by default).

**Query Parameters:**
```
?includeInactive=false
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "760e8400-e29b-41d4-a716-446655440001",
      "name": "CV screening",
      "description": "Screening and review of candidate CV",
      "is_active": true,
      "created_at": "2026-01-01T00:00:00Z"
    },
    {
      "id": "760e8400-e29b-41d4-a716-446655440002",
      "name": "Candidate call",
      "description": "Phone or video call with candidate",
      "is_active": true,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### Create Task Type
**POST** `/task-types`

Creates a new task type (admin only).

**Request Body:**
```json
{
  "name": "Custom Task Type",
  "description": "Description of this task type"
}
```

**Required Fields:**
- `name` (string, unique)

**Optional Fields:**
- `description` (string)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "760e8400-e29b-41d4-a716-446655440010",
    "name": "Custom Task Type",
    "description": "Description of this task type",
    "is_active": true,
    "created_at": "2026-02-05T10:30:00Z"
  }
}
```

**Error Responses:**
- `403` - Only admins can create task types
- `400` - Name already exists or invalid input

---

## 🔐 Error Handling

### Standard Error Response
```json
{
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Log retrieved |
| 201 | Created | Log created |
| 400 | Bad Request | Missing required field |
| 401 | Unauthorized | No auth token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Log doesn't exist |
| 500 | Server Error | Database error |

---

## 📝 Code Examples

### JavaScript/Fetch

**Create Log:**
```javascript
const response = await fetch('/api/employee-logs/logs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    candidate_id: candidateId,
    task_type_id: taskTypeId,
    description: 'Work description here',
    time_spent_minutes: 30
  })
});

const result = await response.json();
console.log(result.data);
```

**Get Employee Logs:**
```javascript
const response = await fetch('/api/employee-logs/logs?limit=50&startDate=2026-02-05', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data, count } = await response.json();
console.log(`Retrieved ${data.length} logs, ${count} total`);
```

### React Hook Example

```typescript
const [logs, setLogs] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/employee-logs/logs', {
        params: {
          startDate: '2026-02-05',
          limit: 50
        }
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchLogs();
}, []);
```

---

## 🧪 Testing Requests

### Using cURL

**Create Log:**
```bash
curl -X POST http://localhost:3000/api/employee-logs/logs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": "550e8400-e29b-41d4-a716-446655440000",
    "task_type_id": "760e8400-e29b-41d4-a716-446655440001",
    "description": "Screened CV and sent interview invite",
    "time_spent_minutes": 30
  }'
```

**Get Today's Logs:**
```bash
curl -X GET "http://localhost:3000/api/employee-logs/logs?startDate=2026-02-05&endDate=2026-02-05" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Team Logs:**
```bash
curl -X GET "http://localhost:3000/api/employee-logs/team/logs?startDate=2026-02-01&endDate=2026-02-05" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔄 Data Flow

```
Employees (Frontend)
    │
    ├─ DailyLogForm.tsx
    │   └─ POST /logs → employeeLogsController.createEmployeeLogController()
    │       └─ employeeLogsService.createEmployeeLog()
    │           └─ Supabase: INSERT into employee_logs
    │
    ├─ EmployeeDashboard.tsx
    │   └─ GET /logs → employeeLogsController.getEmployeeLogsController()
    │       └─ employeeLogsService.getEmployeeLogs()
    │           └─ Supabase: SELECT from employee_logs
    │
    └─ TeamLogs.tsx (Manager/Admin)
        └─ GET /team/logs → employeeLogsController.getTeamLogsController()
            └─ employeeLogsService.getTeamLogs()
                └─ Supabase: SELECT from employee_logs (all)

CandidateActivityLog.tsx (In Profile)
    └─ GET /candidate/:id/activity → employeeLogsController.getCandidateEmployeeActivityController()
        └─ employeeLogsService.getEmployeeLogsForCandidate()
            └─ Supabase: SELECT from employee_logs WHERE candidate_id = :id
```

---

## 📌 Database Constraints

### Foreign Keys:
- `employee_id` → `users(id)`
- `candidate_id` → `candidates(id)`
- `task_type_id` → `task_types(id)`
- `created_by` → `users(id)`
- `reviewed_by` → `users(id)`

### Unique Constraints:
- `task_types(name)` - Task type names must be unique

### Indexes (Performance):
- `employee_logs(employee_id)`
- `employee_logs(candidate_id)`
- `employee_logs(task_type_id)`
- `employee_logs(log_date)`
- `employee_logs(employee_id, log_date)`
- `employee_logs(candidate_id, log_date)`

---

## 🚀 Performance Tips

1. **Always paginate** with `limit` and `offset` for large datasets
2. **Use date filters** to reduce query scope
3. **Index on common filters** already configured
4. **Batch operations** via frontend (not API batch endpoint yet)
5. **Cache task types** (unlikely to change often)

---

## 📊 Reporting Queries

Get daily summary stats:
```sql
SELECT
  el.employee_id,
  u.name,
  el.log_date,
  COUNT(*) as logs_count,
  COUNT(DISTINCT el.candidate_id) as candidates_handled,
  SUM(el.time_spent_minutes) as total_minutes
FROM employee_logs el
JOIN users u ON el.employee_id = u.id
WHERE el.log_date BETWEEN '2026-02-01' AND '2026-02-05'
GROUP BY el.employee_id, u.name, el.log_date
ORDER BY el.log_date DESC, u.name;
```

---

## 🔗 Related Documentation

- [Implementation Guide](./EMPLOYEE_LOG_IMPLEMENTATION_GUIDE.md)
- [Quick Reference](./EMPLOYEE_LOG_QUICK_REFERENCE.md)
- [Database Schema](./EMPLOYEE_LOG_IMPLEMENTATION_GUIDE.md#-database-schema)

---

**API Version:** 1.0  
**Last Updated:** Feb 05, 2026  
**Status:** Production Ready
