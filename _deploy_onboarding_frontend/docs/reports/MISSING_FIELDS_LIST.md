# Missing Fields List - Excel Browser Fields

The system checks these fields to determine if data is missing. These fields are based on the **Excel Browser** requirements (the "bible" for missing data tracking).

## Field Categories

### 📋 Basic View Fields (Always Visible)

| Field Name | Display Label | Database Column | Notes |
|------------|---------------|-----------------|-------|
| `name` | Name | `name` | **Required** - Minimum field for candidate creation |
| `position` | Position | `position` | Job title/position |
| `age` | Age | *(calculated)* | **Special**: Calculated from `date_of_birth` |
| `nationality` | Nationality | `nationality` | Country of origin/citizenship |
| `country_of_interest` | Country | `country_of_interest` | Target country for employment |
| `phone` | Phone | `phone` | Contact phone number |
| `email` | Email | `email` | Contact email address |
| `experience_years` | Experience | `experience_years` | Years of work experience |
| `status` | Status | `status` | Candidate status (Applied, Pending, Deployed, Cancelled) |
| `ai_score` | AI Score | `ai_score` | AI matching score (0-10) |

### 📊 Detailed View Fields (Additional Information)

| Field Name | Display Label | Database Column | Notes |
|------------|---------------|-----------------|-------|
| `religion` | Religion | `religion` | Religious affiliation |
| `marital_status` | Marital | `marital_status` | Single, Married, etc. |
| `salary_expectation` | Salary Exp. | `salary_expectation` | Expected salary |
| `available_from` | Available | `available_from` | Availability date |
| `interview_date` | Interview | `interview_date` | Scheduled interview date |
| `passport` | Passport # | `passport_normalized` | **Special**: Checks `passport_normalized` column |
| `passport_expiry` | Pass. Expiry | `passport_expiry` | Passport expiration date |
| `medical_expiry` | Medical Exp. | `medical_expiry` | Medical certificate expiration |
| `driving_license` | License | `driving_license` | Driving license number |
| `gcc_years` | GCC Years | `gcc_years` | Years of GCC experience |
| `languages` | Languages | `languages` | **Special**: Not checked (used for English/Arabic extraction) |
| `address` | Location | `address` | Physical address/location |
| `created_at` | Applied | `created_at` | Application date (auto-set) |

### 🆔 Identity Fields (Additional)

| Field Name | Display Label | Database Column | Notes |
|------------|---------------|-----------------|-------|
| `father_name` | Father Name | `father_name` | Father's name (for matching) |
| `cnic` | CNIC | `cnic_normalized` | **Special**: Checks `cnic_normalized` column |
| `date_of_birth` | Date of Birth | `date_of_birth` | **Required for Age calculation** |

---

## Special Field Handling

### 1. **Age** (`age`)
- **Not stored directly** - Calculated from `date_of_birth`
- If `date_of_birth` is missing, `age` is marked as missing
- System checks: `date_of_birth` → if missing, adds to missing fields

### 2. **Passport** (`passport`)
- **Database column**: `passport_normalized` (not `passport`)
- System checks `passport_normalized` column
- If missing, field is marked as missing

### 3. **CNIC** (`cnic`)
- **Database column**: `cnic_normalized` (not `cnic`)
- System checks `cnic_normalized` column
- If missing, field is marked as missing

### 4. **Languages** (`languages`)
- **Not checked for missing** - This field is used for extracting English/Arabic levels
- Skipped in missing fields calculation
- Not required for Excel Browser display

### 5. **Created At** (`created_at`)
- **Auto-set** - Automatically populated when candidate is created
- Usually not missing, but checked for completeness

---

## Missing Field Detection Logic

A field is considered **missing** if:
- Value is `NULL`
- Value is `undefined`
- Value is empty string `''`
- Value is whitespace-only string (after trim)

### Example:
```typescript
// Missing:
nationality: null
email: undefined
phone: ''
address: '   '  // whitespace only

// Not Missing:
nationality: 'Pakistani'
email: 'test@example.com'
phone: '+923001234567'
```

---

## Total Fields Checked

**Total: 25 fields** (excluding `age` which is calculated, and `languages` which is skipped)

### Breakdown:
- **Basic View**: 10 fields
- **Detailed View**: 13 fields (excluding `languages`)
- **Identity Fields**: 3 fields

---

## How Missing Fields Are Updated

1. **After Document Upload**: When a document (CV, Passport, etc.) is processed, missing fields are recalculated
2. **After Manual Update**: When a field is manually updated, missing fields are recalculated
3. **After Enrichment**: After progressive data completion enriches a candidate, missing fields are updated

---

## Source of Truth

The field list is defined in:
```
backend/src/services/progressiveDataCompletionService.ts
```

Constant: `EXCEL_BROWSER_FIELDS`

This is the **"bible"** for missing data tracking - any changes to required fields should be made here.

---

**Last Updated**: 2026-01-22
