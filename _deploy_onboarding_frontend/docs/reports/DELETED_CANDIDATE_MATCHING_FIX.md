# Deleted Candidate Matching Bug - Root Cause & Fix

## Problem Description

When you deleted Adeel Anjum and re-uploaded their CV, the system was still showing the **same old data** instead of creating a fresh candidate record. This appeared to be a cache issue, but the actual cause was much deeper.

## Root Cause Analysis

### How Soft Delete Works

When a candidate is deleted in the system, it uses a **soft delete** approach:
```typescript
// candidateService.ts - deleteCandidate()
await db.from('candidates')
  .update({ status: 'Deleted' })
  .eq('id', id)
```

**The candidate record is NOT removed from the database** - only the status is changed to 'Deleted'. This leaves the record in the database with all its old data intact.

### The Matching Bug

When Adeel Anjum's CV was re-uploaded, the system attempted to auto-match the new document to an existing candidate using these priority rules:
1. CNIC matching
2. Email matching
3. Phone matching
4. Name+Father matching
5. Name-only matching

**The problem:** The matching queries in both `candidateMatcher.ts` and `identityMatchingService.ts` **did NOT filter out deleted candidates**.

```typescript
// BROKEN - Would match deleted candidates
const { data } = await db
  .from('candidates')
  .select('id')
  .eq('cnic_normalized', normalized); // No status filter!

if (data && data.length > 0) {
  // Would find the old DELETED Adeel Anjum record
  return { candidateId: data[0].id, ... };
}
```

### What Happened

1. ✅ Deleted Adeel Anjum (status = 'Deleted')
2. ✅ Uploaded new CV for Adeel Anjum
3. ❌ Auto-matching found the OLD deleted record by CNIC/email/name
4. ❌ Linked new document to the OLD deleted record
5. ❌ Old data was retained (not fresh)

The deleted record still had:
- Old email (jhelumpolice@gmail.com for Muhammad Nabeel's case)
- Old CV flags (certificate marked as CV)
- Other outdated information

## Solution

Added `.neq('status', 'Deleted')` filter to **all candidate queries** in both matching services.

### Files Fixed

#### 1. `backend/src/services/candidateMatcher.ts`

Added filter to all 5 priority matching levels:

```typescript
// Priority 1: CNIC
const { data } = await db
  .from('candidates')
  .select('id')
  .eq('cnic_normalized', normalized)
  .neq('status', 'Deleted'); // ← NEW

// Priority 2: Email
const { data } = await db
  .from('candidates')
  .select('id')
  .ilike('email', normalized)
  .neq('status', 'Deleted'); // ← NEW

// Priority 3: Phone
const { data } = await db
  .from('candidates')
  .select('id, phone')
  .not('phone', 'is', null)
  .neq('status', 'Deleted'); // ← NEW

// Priority 4: Name+Father
const { data } = await db
  .from('candidates')
  .select('id, name, father_name')
  .not('father_name', 'is', null)
  .neq('status', 'Deleted'); // ← NEW

// Priority 5: Name-only
const { data } = await db
  .from('candidates')
  .select('id, name')
  .not('name', 'is', null)
  .neq('status', 'Deleted'); // ← NEW
```

#### 2. `backend/src/services/identityMatchingService.ts`

Added filter to identity conflict checks and duplicate detection:

```typescript
// Check CNIC conflict
const { data: otherCandidate } = await db
  .from('candidates')
  .select('id, name')
  .eq('cnic_normalized', extractedCnic)
  .neq('id', candidateId)
  .neq('status', 'Deleted') // ← NEW
  .maybeSingle();

// Check passport conflict
const { data: otherCandidate } = await db
  .from('candidates')
  .select('id, name')
  .eq('passport_normalized', extractedPassport)
  .neq('id', candidateId)
  .neq('status', 'Deleted') // ← NEW
  .maybeSingle();

// Duplicate detection - CNIC
let query = db
  .from('candidates')
  .select('id, name')
  .eq('cnic_normalized', normalizedCnic)
  .neq('status', 'Deleted'); // ← NEW

// Duplicate detection - Passport
let query = db
  .from('candidates')
  .select('id, name')
  .eq('passport_normalized', normalizedPassport)
  .neq('status', 'Deleted'); // ← NEW
```

## Impact

### Before Fix
- ❌ Deleting and re-uploading a candidate would find the old deleted record
- ❌ New documents would be linked to deleted candidate records
- ❌ Old data would carry over instead of creating fresh records
- ❌ Data quality issues (old emails, incorrect flags) would persist

### After Fix
- ✅ Only ACTIVE candidates (status != 'Deleted') are considered during matching
- ✅ Deleted candidates are completely ignored in auto-matching
- ✅ Re-uploading a deleted candidate creates a NEW fresh record
- ✅ Old data is not carried over
- ✅ Clean slate for re-uploaded candidates

## How to Test

### Manual Test with Adeel Anjum

1. **Delete the deleted record (optional, for cleanup)**:
   ```sql
   -- View current state
   SELECT id, name, status, email FROM candidates WHERE name = 'Adeel Anjum';
   
   -- If you want to hard-delete the old one for testing:
   DELETE FROM candidates WHERE id = '<old_adeel_id>' AND status = 'Deleted';
   ```

2. **Re-upload Adeel Anjum's CV**:
   - System should now create a **NEW** candidate record
   - Should not find the old deleted record
   - New record will have fresh data from the new CV upload

3. **Verify in database**:
   ```sql
   SELECT id, name, status, email, cv_received, created_at 
   FROM candidates 
   WHERE name = 'Adeel Anjum' 
   ORDER BY created_at DESC;
   ```
   Should show a NEW record with recent `created_at` timestamp

### Check Database State

```sql
-- Find any deleted candidates
SELECT id, name, status, email FROM candidates WHERE status = 'Deleted';

-- Count deleted vs active
SELECT status, COUNT(*) FROM candidates GROUP BY status;
```

## Related Issues Fixed

This fix also resolves:
- Muhammad Nabeel showing jhelumpolice@gmail.com (was re-linked to old deleted record)
- Certificate incorrectly marked as CV (old data persisted)
- Missing profession inference (old blank field)

## Deployment

**Commit**: `0da6f5b` - "Critical fix: Exclude deleted candidates from all matching queries"

**Changed Files**:
- `backend/src/services/candidateMatcher.ts`
- `backend/src/services/identityMatchingService.ts`

**No Database Migration Required**: This is a pure code fix.

## Future Enhancements

### Option 1: Hard Delete (Recommended Long-term)
Instead of soft delete, actually remove the record:
```typescript
await db.from('candidates').delete().eq('id', id);
```

**Pros**: Simpler logic, no ghost records
**Cons**: No audit trail, harder to recover data

### Option 2: Better Soft Delete
Add a "uniqueness constraint" that allows duplicate values only if one is deleted:
```typescript
// Database constraint: (email, status) must be unique
// Allows deleted records without blocking new uploads
```

### Option 3: Archive Table
Move deleted candidates to a separate archive table:
```typescript
// Insert into archive
await db.from('candidate_archive').insert(candidate);
// Delete from active
await db.from('candidates').delete().eq('id', id);
```

**Pros**: Clean separation, audit trail, easy recovery
**Cons**: More complex queries

## Conclusion

The "cache issue" was actually a **deleted record reuse issue**. By filtering out deleted candidates from all matching queries, we ensure that:
1. Each re-upload of a deleted candidate creates a fresh record
2. Old data never persists from deleted records
3. Auto-matching only considers active candidates
4. The system maintains data quality and integrity

The fix is simple but critical for data quality.
