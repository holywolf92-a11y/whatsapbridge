# Document Categorization System - Analysis & Gap Report

**Date**: February 4, 2026  
**Issue**: Document categorization is too broad - critical document types are being mixed under "Certificates"  
**Impact**: HIGH - Affects recruitment workflow, document organization, and compliance

---

## 🔴 Critical Problems Identified

### Problem 1: No Dedicated "Educational Documents" Category

**Current State**: ❌ Educational documents (degrees, diplomas, transcripts, marksheets) are being stored under **"Certificates"**

**Why This Is Wrong**:
- Educational documents are PRIMARY recruitment documents
- They need separate verification workflows
- Different expiry/validation rules than professional certificates
- Critical for qualification verification

**Impact**:
- Cannot quickly filter/view educational qualifications
- Mixed with professional certifications
- Confusing for HR teams and auditors

---

### Problem 2: No Dedicated "NAVTTC/NAVTIC Report" Category

**Current State**: ❌ NAVTTC reports (National Vocational & Technical Training Commission) are stored under **"Certificates"**

**Why This Is Wrong**:
- NAVTTC reports are OFFICIAL GOVERNMENT CERTIFICATIONS
- Extremely sensitive and important for skilled labor
- Different verification process than generic certificates
- Critical for trade/technical positions (electricians, welders, plumbers, etc.)

**Impact**:
- Cannot track NAVTTC-certified candidates separately
- No dedicated workflow for NAVTTC verification
- Compliance risk for government contracts requiring NAVTTC workers

---

### Problem 3: No Dedicated "Police Certificate" Folder

**Current State**: ⚠️ Police character certificate detection EXISTS in code, but NO separate folder/category in UI

**Code Evidence**:
```typescript
// Backend has this category defined:
POLICE_CHARACTER_CERTIFICATE: 'police_character_certificate',

// Python parser detects it:
police_character_certificate: Police character certificate or clearance certificate
```

**Why This Is Wrong**:
- Police certificates are MANDATORY for overseas employment
- Require special handling and verification
- Have strict expiry dates (usually 6 months)
- Critical for visa processing

**Impact**:
- Detection works ✅ but documents land in wrong folder ❌
- Cannot track police certificate status per candidate
- No expiry tracking for police certificates

---

### Problem 4: No Dedicated "Experience Certificates" Category

**Current State**: ❌ Experience certificates are mixed under **"Certificates"**

**Why This Is Wrong**:
- Experience certificates prove work history
- Different verification process (employer reference checks)
- Critical for experience-level matching
- Should be separate from educational/professional certificates

**Impact**:
- Cannot distinguish between skill certificates and experience proofs
- Difficult to verify employment history
- Confusing document organization

---

## ✅ What Currently Works

### Existing Categories (Properly Implemented)

1. **CV / Resume** (`cv_resume`) ✅
   - Detection: ✅ Working
   - Storage: ✅ Dedicated folder
   - UI: ✅ Proper display

2. **Passport** (`passport`) ✅
   - Detection: ✅ Working
   - Storage: ✅ Dedicated folder
   - UI: ✅ Proper display

3. **CNIC** (`cnic`) ✅
   - Detection: ✅ Working
   - Storage: ✅ Dedicated folder
   - UI: ✅ Proper display

4. **Driving License** (`driving_license`) ✅
   - Detection: ✅ Working
   - Storage: ✅ Dedicated folder
   - UI: ✅ Proper display

5. **Contracts** (`contracts`) ✅
   - Detection: ✅ Working
   - Storage: ✅ Dedicated folder
   - UI: ✅ Proper display

6. **Medical Reports** (`medical_reports`) ✅
   - Detection: ✅ Working
   - Storage: ✅ Dedicated folder
   - UI: ✅ Proper display

7. **Photos** (`photos`) ✅
   - Detection: ✅ Working
   - Storage: ✅ Other documents folder
   - UI: ✅ Proper display

---

## 🔍 Technical Analysis

### Current Database Schema

**File**: `backend/migrations/018_add_missing_document_categories.sql`

```sql
-- Current document_category_enum values:
'cv_resume'
'passport'
'cnic'
'driving_license'
'police_character_certificate'  -- ✅ EXISTS but not used properly
'certificates'                   -- ❌ TOO BROAD
'contracts'
'medical_reports'
'photos'
'other_documents'
```

**Problem**: `certificates` is a catch-all for:
- Educational documents (degrees, diplomas)
- Professional certificates (skill certifications)
- Experience certificates (employment proofs)
- NAVTTC reports (government vocational certs)
- Training certificates
- Other certificates

---

### Current Backend Configuration

**File**: `backend/src/config/documentCategories.ts`

```typescript
export const DOCUMENT_CATEGORIES = {
  CV_RESUME: 'cv_resume',
  PASSPORT: 'passport',
  CNIC: 'cnic',
  DRIVING_LICENSE: 'driving_license',
  POLICE_CHARACTER_CERTIFICATE: 'police_character_certificate',  // ✅ Defined
  CERTIFICATES: 'certificates',  // ❌ TOO BROAD
  CONTRACTS: 'contracts',
  MEDICAL_REPORTS: 'medical_reports',
  PHOTOS: 'photos',
  OTHER_DOCUMENTS: 'other_documents',
} as const;
```

**Missing Categories**:
- `EDUCATIONAL_DOCUMENTS`
- `EXPERIENCE_CERTIFICATES`
- `NAVTTC_REPORTS`

---

### Current Python Parser Detection

**File**: `python-parser/split_and_categorize.py`

```python
VISION_PROMPT = """
1. Document category (choose ONE):
   - certificates: Educational certificates, degrees, diplomas, training certificates
   # ❌ This is too broad - mixing multiple critical document types
```

**Problem**: AI is told to lump everything into "certificates"

---

### Current Frontend Display

**File**: `src/components/DocumentUploadVerification.tsx`

```typescript
const DOCUMENT_CATEGORIES = {
  police_character_certificate: { label: 'Police Character Certificate', icon: Shield, color: 'teal' },
  certificates: { label: 'Certificates', icon: Award, color: 'green' },
  // ❌ Missing: educational_documents, experience_certificates, navttc_reports
};
```

**Problem**: Frontend only shows generic "Certificates" folder

---

## 📋 What Needs to Be Updated

### 1. Database (Supabase)

**Files to Modify**:
- Create new migration: `backend/migrations/027_split_certificates_category.sql`

**Changes Required**:
```sql
-- Add new enum values:
ALTER TYPE document_category_enum ADD VALUE 'educational_documents';
ALTER TYPE document_category_enum ADD VALUE 'experience_certificates';
ALTER TYPE document_category_enum ADD VALUE 'navttc_reports';

-- Update display function:
CREATE OR REPLACE FUNCTION get_document_category_display_name(cat document_category_enum)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE cat
    WHEN 'educational_documents' THEN 'Educational Documents'
    WHEN 'experience_certificates' THEN 'Experience Certificates'
    WHEN 'navttc_reports' THEN 'NAVTTC Reports'
    WHEN 'police_character_certificate' THEN 'Police Certificate'
    -- ... rest unchanged
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

### 2. Backend Configuration

**File**: `backend/src/config/documentCategories.ts`

```typescript
export const DOCUMENT_CATEGORIES = {
  // ... existing ...
  EDUCATIONAL_DOCUMENTS: 'educational_documents',         // NEW
  EXPERIENCE_CERTIFICATES: 'experience_certificates',     // NEW
  NAVTTC_REPORTS: 'navttc_reports',                      // NEW
  POLICE_CHARACTER_CERTIFICATE: 'police_character_certificate',  // Already exists
  CERTIFICATES: 'certificates',  // Keep for professional/skill certificates only
} as const;

export const DOCUMENT_CATEGORY_DISPLAY_NAMES: Record<DocumentCategory, string> = {
  [DOCUMENT_CATEGORIES.EDUCATIONAL_DOCUMENTS]: 'Educational Documents',
  [DOCUMENT_CATEGORIES.EXPERIENCE_CERTIFICATES]: 'Experience Certificates',
  [DOCUMENT_CATEGORIES.NAVTTC_REPORTS]: 'NAVTTC Reports',
  [DOCUMENT_CATEGORIES.POLICE_CHARACTER_CERTIFICATE]: 'Police Certificate',
  [DOCUMENT_CATEGORIES.CERTIFICATES]: 'Professional Certificates',  // Clarify purpose
};
```

---

### 3. Backend Service Mappings

**Files to Update**:
- `backend/src/services/candidateDocumentService.ts`
- `backend/src/services/splitUploadService.ts`
- `backend/src/workers/cvParserWorker.ts`

**Example Update** (`splitUploadService.ts`):
```typescript
export const DOC_TYPE_TO_FOLDER: Record<string, string> = {
  // ... existing ...
  educational_documents: 'educational_documents',          // NEW
  educational_document: 'educational_documents',
  degree: 'educational_documents',
  diploma: 'educational_documents',
  transcript: 'educational_documents',
  marksheet: 'educational_documents',
  
  experience_certificate: 'experience_certificates',       // NEW
  experience_certificates: 'experience_certificates',
  employment_certificate: 'experience_certificates',
  
  navttc_report: 'navttc_reports',                        // NEW
  navttc_reports: 'navttc_reports',
  navtic_report: 'navttc_reports',
  nvtc_report: 'navttc_reports',
  
  police_certificate: 'police_character_certificate',      // ALREADY EXISTS
  police_clearance: 'police_character_certificate',
  character_certificate: 'police_character_certificate',
  
  certificate: 'certificates',  // Professional/skill certificates only
  certificates: 'certificates',
};
```

---

### 4. Python Parser Updates

**File**: `python-parser/split_and_categorize.py`

**Update DOC_CATEGORIES**:
```python
DOC_CATEGORIES = [
    "cv_resume", 
    "passport", 
    "cnic", 
    "driving_license", 
    "police_character_certificate",
    "educational_documents",          # NEW
    "experience_certificates",        # NEW
    "navttc_reports",                # NEW
    "certificates",                  # Professional/skill only
    "contracts", 
    "medical_reports", 
    "photos", 
    "other_documents",
]
```

**Update VISION_PROMPT**:
```python
VISION_PROMPT = """You are a document classification AI. Analyze this page and categorize:

1. Document category (choose ONE - BE SPECIFIC):
   
   🎓 EDUCATIONAL DOCUMENTS:
   - educational_documents: Degrees (Bachelor's, Master's, PhD), Diplomas, 
     Academic Transcripts, Marksheets, School/College/University Certificates
   
   👷 VOCATIONAL/TECHNICAL:
   - navttc_reports: NAVTTC certificates, NAVTIC reports, NVTC vocational training,
     Government technical training certificates, Trade test certificates
   
   💼 WORK EXPERIENCE:
   - experience_certificates: Employment certificates, Experience letters,
     Work reference letters, Service certificates, NOC from previous employer
   
   👮 GOVERNMENT CLEARANCES:
   - police_character_certificate: Police clearance, Character certificate,
     Background check certificate, PCC
   
   📜 PROFESSIONAL/SKILL CERTIFICATES:
   - certificates: Professional certifications (CCNA, AWS, PMP, etc.),
     Skill certificates, Training certificates (non-NAVTTC)
   
   ... rest of categories unchanged ...
```

---

### 5. Frontend Components

**Files to Update**:
- `src/components/DocumentUploadVerification.tsx`
- `src/components/CandidateDetailsModal.tsx`
- `src/components/DocumentManagement.tsx`

**Example Update** (`DocumentUploadVerification.tsx`):
```typescript
import { GraduationCap, Briefcase, Shield, Award } from 'lucide-react';

const DOCUMENT_CATEGORIES = {
  // ... existing ...
  educational_documents: { 
    label: 'Educational Documents', 
    icon: GraduationCap, 
    color: 'blue',
    description: 'Degrees, diplomas, transcripts, marksheets'
  },
  experience_certificates: { 
    label: 'Experience Certificates', 
    icon: Briefcase, 
    color: 'emerald',
    description: 'Employment certificates, experience letters'
  },
  navttc_reports: { 
    label: 'NAVTTC Reports', 
    icon: Award, 
    color: 'amber',
    description: 'NAVTTC vocational training certificates'
  },
  police_character_certificate: { 
    label: 'Police Certificate', 
    icon: Shield, 
    color: 'teal',
    description: 'Police character certificate, clearance'
  },
  certificates: { 
    label: 'Professional Certificates', 
    icon: Award, 
    color: 'green',
    description: 'Skill certifications, professional certs'
  },
};
```

---

## 📊 Impact Summary

### Before Fix:
```
Certificates Folder (Generic)
  ├─ Educational Documents ❌
  ├─ NAVTTC Reports ❌
  ├─ Police Certificates ❌ (detection exists, but wrong folder)
  ├─ Experience Certificates ❌
  └─ Professional Certificates (Mixed)
```

### After Fix:
```
Document Categories (Organized)
  ├─ 🎓 Educational Documents (NEW)
  ├─ 👷 NAVTTC Reports (NEW)
  ├─ 👮 Police Certificate (EXISTS, needs proper routing)
  ├─ 💼 Experience Certificates (NEW)
  └─ 📜 Professional Certificates (Refined)
```

---

## 🎯 Business Value

1. **Compliance**: Separate tracking for government-required documents (NAVTTC, Police)
2. **Efficiency**: HR can quickly locate specific document types
3. **Accuracy**: Proper categorization improves AI detection
4. **Reporting**: Can generate category-specific reports (e.g., "How many candidates have NAVTTC certificates?")
5. **Workflow**: Different verification workflows for different document types

---

## ⚠️ Migration Risks

### Low Risk:
- Database enum extension (PostgreSQL allows adding enum values)
- Backend config additions (no breaking changes)

### Medium Risk:
- Python parser updates (need to retrain/test AI classification)
- Frontend UI changes (need to update all document display components)

### Mitigation:
- Keep `certificates` category for backward compatibility
- Migrate existing documents gradually (optional data migration script)
- Test thoroughly with sample documents before production

---

## 📝 Next Steps

See the detailed TODO list for implementation steps.

**Estimated Effort**: 4-6 hours for complete implementation + testing

**Priority**: HIGH - This affects core recruitment document management
