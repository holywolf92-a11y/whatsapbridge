# Missing String Value Fix

## Issue Identified

The system was storing the string `"missing"` as actual data in the database instead of `NULL`. This caused the missing fields calculation to incorrectly treat these fields as populated.

### Example from Farhan's Record:
- `country_of_interest`: `"missing"` (string) ❌
- Should be: `NULL` ✅

## Root Cause

The Excel Browser displays `"missing"` as a fallback when values are `NULL`, but somehow `"missing"` got stored as an actual value in the database. This could happen if:
1. Manual data entry saved "missing" as a value
2. A bug in data import/export
3. Frontend form submission with "missing" as default

## Fix Applied

### 1. Updated Missing Fields Calculation
**File**: `backend/src/services/progressiveDataCompletionService.ts`

```typescript
// Now checks for string "missing" as well
if (value === null || value === undefined || value === '' || 
    (typeof value === 'string' && (value.trim() === '' || value.toLowerCase() === 'missing'))) {
  missing.push(field);
}
```

### 2. Database Migration
**File**: `backend/migrations/014_cleanup_missing_strings.sql`

Replaces all `"missing"` string values with `NULL` in the candidates table.

### 3. Cleanup Script
**File**: `backend/scripts/cleanup-missing-strings.js`

Script to:
- Find all candidates with `"missing"` string values
- Replace them with `NULL`
- Recalculate `missing_fields` for all candidates

## How to Run Cleanup

### Option 1: Run SQL Migration
```sql
-- Run migration/014_cleanup_missing_strings.sql in Supabase SQL Editor
```

### Option 2: Run Node.js Script
```bash
cd backend
node scripts/cleanup-missing-strings.js
```

## Prevention

### Excel Browser Display
The Excel Browser **only displays** `"missing"` as a fallback - it never saves it:
```typescript
{candidate.nationality || 'missing'}  // Display only, not saved
```

### Data Validation
All API endpoints should validate that `"missing"` is never accepted as a valid value. If received, it should be converted to `NULL`.

## Fields Affected

All fields in `EXCEL_BROWSER_FIELDS` could potentially have this issue:
- `name`, `position`, `nationality`, `country_of_interest`
- `phone`, `email`, `experience_years`, `date_of_birth`
- `passport_normalized`, `passport_expiry`, `father_name`
- `cnic_normalized`, `address`, `religion`, `marital_status`
- `salary_expectation`, `available_from`, `interview_date`
- `medical_expiry`, `driving_license`, `gcc_years`

## Verification

After cleanup, verify with:
```sql
SELECT candidate_code, name, country_of_interest, nationality
FROM candidates
WHERE 
  LOWER(country_of_interest) = 'missing' OR
  LOWER(nationality) = 'missing'
LIMIT 10;
```

Should return 0 rows.

---

**Last Updated**: 2026-01-22
