# Document Categorization Fix - Implementation TODO List

**Date**: February 4, 2026  
**Status**: Ready for Implementation  
**Priority**: HIGH

⚠️ **CRITICAL: READ [CRITICAL_IMPLEMENTATION_NOTES.md](CRITICAL_IMPLEMENTATION_NOTES.md) BEFORE STARTING**

---

## 🚨 Pre-Implementation Requirements

**YOU MUST READ BEFORE STARTING:**
- 📄 [CRITICAL_IMPLEMENTATION_NOTES.md](CRITICAL_IMPLEMENTATION_NOTES.md) - Mandatory reading
  - PostgreSQL enum ordering constraints
  - Storage folder 1:1 mapping requirements
  - Business rule: Certificates category restrictions
  - Mandatory multi-document test case

**Key Points:**
- ✅ Add enum values at END only (PostgreSQL limitation)
- ✅ Create storage folders: `/educational_documents/`, `/experience_certificates/`, `/navttc_reports/`
- ✅ Certificates folder = Professional/IT certs ONLY (not degrees, not experience letters)
- ✅ Test with multi-document PDF (degree + experience + police + NAVTTC) before closing task

---

## 📋 Implementation Checklist

### Phase 1: Database Schema Updates ✅

#### TODO 1.1: Create Migration File
- [ ] Create `backend/migrations/027_split_certificates_category.sql`
- [ ] Add `educational_documents` enum value
- [ ] Add `experience_certificates` enum value
- [ ] Add `navttc_reports` enum value
- [ ] Update `get_document_category_display_name()` function
- [ ] Add migration rollback script
- [ ] Test migration on local database

**⚠️ CRITICAL - ENUM ORDERING**:
- ✅ Add new enum values at the END only (PostgreSQL limitation)
- ❌ DO NOT rename existing enum values
- ❌ DO NOT remove 'certificates' enum
- ❌ DO NOT change enum order
- Enums CANNOT be reordered after creation in Postgres

**Estimated Time**: 30 minutes

**Files to Create**:
- `backend/migrations/027_split_certificates_category.sql`

**SQL Changes**:
```sql
-- Add new enum values AT THE END (PostgreSQL enums cannot be reordered)
ALTER TYPE document_category_enum ADD VALUE 'educational_documents';
ALTER TYPE document_category_enum ADD VALUE 'experience_certificates';
ALTER TYPE document_category_enum ADD VALUE 'navttc_reports';

-- Update display function
CREATE OR REPLACE FUNCTION get_document_category_display_name(cat document_category_enum)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE cat
    WHEN 'educational_documents' THEN 'Educational Documents'
    WHEN 'experience_certificates' THEN 'Experience Certificates'
    WHEN 'navttc_reports' THEN 'NAVTTC Reports'
    WHEN 'police_character_certificate' THEN 'Police Certificate'
    WHEN 'certificates' THEN 'Professional Certificates'
    -- ... rest unchanged
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

### Phase 2: Backend Configuration Updates ✅

#### TODO 2.1: Update Document Categories Config
- [ ] Update `backend/src/config/documentCategories.ts`
- [ ] Add `EDUCATIONAL_DOCUMENTS` constant
- [ ] Add `EXPERIENCE_CERTIFICATES` constant
- [ ] Add `NAVTTC_REPORTS` constant
- [ ] Update `DOCUMENT_CATEGORY_DISPLAY_NAMES` mapping
- [ ] Update TypeScript types
- [ ] Verify no TypeScript compilation errors

**Estimated Time**: 20 minutes

**File**: `backend/src/config/documentCategories.ts`

**Changes**:
```typescript
export const DOCUMENT_CATEGORIES = {
  CV_RESUME: 'cv_resume',
  PASSPORT: 'passport',
  CNIC: 'cnic',
  DRIVING_LICENSE: 'driving_license',
  POLICE_CHARACTER_CERTIFICATE: 'police_character_certificate',
  EDUCATIONAL_DOCUMENTS: 'educational_documents',         // NEW
  EXPERIENCE_CERTIFICATES: 'experience_certificates',     // NEW
  NAVTTC_REPORTS: 'navttc_reports',                      // NEW
  CERTIFICATES: 'certificates',  // Professional/skill only
  CONTRACTS: 'contracts',
  MEDICAL_REPORTS: 'medical_reports',
  PHOTOS: 'photos',
  OTHER_DOCUMENTS: 'other_documents',
} as const;
```

#### TODO 2.2: Update Split Upload Service
- [ ] Update `backend/src/services/splitUploadService.ts`
- [ ] Add new category mappings to `DOC_TYPE_TO_FOLDER`
- [ ] Add variations: degree, diploma, transcript, marksheet → educational_documents
- [ ] Add variations: experience_certificate, employment_certificate → experience_certificates
- [ ] Add variations: navttc, navtic, nvtc → navttc_reports
- [ ] Add variations: police_certificate, police_clearance → police_character_certificate
- [ ] **VERIFY storage folder structure matches categories (see below)**

**🔐 STORAGE FOLDER STRUCTURE (1:1 Mapping Required)**:
```
Supabase Storage Buckets must have folders:
/educational_documents          ← NEW
/experience_certificates        ← NEW
/navttc_reports                ← NEW
/police_character_certificate  ← Already exists, verify routing
/certificates                  ← Professional/skill certs ONLY
```

**⚠️ BUSINESS RULE - CERTIFICATES CATEGORY**:
✅ ONLY store in `/certificates` folder:
  - Professional certifications (CCNA, AWS, PMP)
  - IT certifications (Microsoft, Cisco, Oracle)
  - Industry skill certificates
  - Non-academic, non-government certificates

❌ DO NOT store in `/certificates` folder:
  - Degrees, diplomas → `/educational_documents`
  - Experience letters → `/experience_certificates`
  - NAVTTC certs → `/navttc_reports`
  - Police certificates → `/police_character_certificate`

**Estimated Time**: 30 minutes

**File**: `backend/src/services/splitUploadService.ts`

**Changes**:
```typescript
export const DOC_TYPE_TO_FOLDER: Record<string, string> = {
  passport: 'passport',
  driving_license: 'driving_license',
  national_id: 'cnic',
  cnic: 'cnic',
  police_character_certificate: 'police_character_certificate',
  police_certificate: 'police_character_certificate',      // NEW
  police_clearance: 'police_character_certificate',        // NEW
  character_certificate: 'police_character_certificate',   // NEW
  pcc: 'police_character_certificate',                     // NEW
  
  educational_documents: 'educational_documents',          // NEW
  educational_document: 'educational_documents',           // NEW
  degree: 'educational_documents',                         // NEW
  diploma: 'educational_documents',                        // NEW
  transcript: 'educational_documents',                     // NEW
  marksheet: 'educational_documents',                      // NEW
  academic_certificate: 'educational_documents',           // NEW
  
  experience_certificate: 'experience_certificates',       // NEW
  experience_certificates: 'experience_certificates',      // NEW
  employment_certificate: 'experience_certificates',       // NEW
  experience_letter: 'experience_certificates',            // NEW
  service_certificate: 'experience_certificates',          // NEW
  
  navttc_report: 'navttc_reports',                        // NEW
  navttc_reports: 'navttc_reports',                       // NEW
  navtic_report: 'navttc_reports',                        // NEW
  nvtc_report: 'navttc_reports',                          // NEW
  navttc: 'navttc_reports',                               // NEW
  vocational_certificate: 'navttc_reports',               // NEW
  
  cv_resume: 'cv_resume',
  certificate: 'certificates',  // Professional/skill certificates
  certificates: 'certificates',
  medical_certificate: 'medical_reports',
  medical_reports: 'medical_reports',
  contract: 'contracts',
  contracts: 'contracts',
  photos: 'other_documents',
  other_documents: 'other_documents',
};
```

#### TODO 2.3: Update Candidate Document Service
- [ ] Update `backend/src/services/candidateDocumentService.ts`
- [ ] Update `categoryMap` in `uploadCandidateDocument()` function
- [ ] Update `docTypeMap` for database constraint compatibility
- [ ] Add new categories to upload category mapping
- [ ] Update document received flags logic (if needed)

**Estimated Time**: 30 minutes

**File**: `backend/src/services/candidateDocumentService.ts`

**Changes**: Update category mappings around line 290 and line 470

#### TODO 2.4: Update CV Parser Worker
- [ ] Update `backend/src/workers/cvParserWorker.ts`
- [ ] Update `categoryMap` in worker processing
- [ ] Update `docTypeMap` for new categories
- [ ] Test worker processing with new categories

**Estimated Time**: 20 minutes

**File**: `backend/src/workers/cvParserWorker.ts`

---

### Phase 3: Python Parser Updates ✅

#### TODO 3.1: Update Split and Categorize Script
- [ ] Update `python-parser/split_and_categorize.py`
- [ ] Add new categories to `DOC_CATEGORIES` list
- [ ] Update `normalize_doc_type()` function with new mappings
- [ ] Update `VISION_PROMPT` with clear category definitions
- [ ] Add examples for each new category
- [ ] Test locally with sample documents

**Estimated Time**: 45 minutes

**File**: `python-parser/split_and_categorize.py`

**Changes**:
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

def normalize_doc_type(category: str) -> str:
    normalization_map = {
        # ... existing mappings ...
        
        # Educational documents
        "degree": "educational_documents",
        "diploma": "educational_documents",
        "transcript": "educational_documents",
        "marksheet": "educational_documents",
        "academic_certificate": "educational_documents",
        
        # Experience certificates
        "experience_certificate": "experience_certificates",
        "employment_certificate": "experience_certificates",
        "experience_letter": "experience_certificates",
        "service_certificate": "experience_certificates",
        
        # NAVTTC reports
        "navttc": "navttc_reports",
        "navtic": "navttc_reports",
        "nvtc": "navttc_reports",
        "vocational_certificate": "navttc_reports",
        "trade_certificate": "navttc_reports",
    }
```

**Update VISION_PROMPT** with clear categories:
```python
VISION_PROMPT = """You are a document classification AI. Be SPECIFIC:

🎓 EDUCATIONAL DOCUMENTS (academic qualifications):
- educational_documents: Degrees (BSc, MSc, BA, MA, PhD), Diplomas, 
  Academic Transcripts, Marksheets, University Certificates, 
  School/College Certificates, Academic Records

👷 NAVTTC VOCATIONAL REPORTS (government technical training):
- navttc_reports: NAVTTC certificates, NAVTIC training reports,
  NVTC vocational certificates, Government technical training,
  Trade test certificates, Skill development certificates

💼 EXPERIENCE CERTIFICATES (employment proof):
- experience_certificates: Employment certificates, Experience letters,
  Service certificates, Work reference letters, NOC from employer,
  Relieving letters, Employment verification

👮 POLICE CLEARANCE:
- police_character_certificate: Police clearance certificate,
  Character certificate, Background check, PCC, Police verification

📜 PROFESSIONAL CERTIFICATES (skill/industry certs):
- certificates: CCNA, AWS, PMP, Microsoft, Cisco, Professional licenses,
  Industry certifications, Skill training (non-NAVTTC)

... rest of categories unchanged ...
"""
```

#### TODO 3.2: Update Main Parser
- [ ] Update `python-parser/main.py` if needed
- [ ] Update any CV extraction prompts mentioning certificates
- [ ] Test parser with sample documents

**Estimated Time**: 20 minutes

---

### Phase 4: Frontend Updates ✅

#### TODO 4.1: Update Document Upload Component
- [ ] Update `src/components/DocumentUploadVerification.tsx`
- [ ] Add new categories to `DOCUMENT_CATEGORIES` const
- [ ] Add appropriate icons (GraduationCap, Briefcase, Shield, Award)
- [ ] Add descriptions for each category
- [ ] Update color coding
- [ ] Test upload UI

**Estimated Time**: 30 minutes

**File**: `src/components/DocumentUploadVerification.tsx`

**Changes**:
```typescript
import { GraduationCap, Briefcase, Shield, Award, FileText, Heart, Image as ImageIcon, FileQuestion } from 'lucide-react';

const DOCUMENT_CATEGORIES = {
  cv_resume: { label: 'CV / Resume', icon: FileText, color: 'blue' },
  passport: { label: 'Passport', icon: Shield, color: 'purple' },
  cnic: { label: 'CNIC (National ID)', icon: Shield, color: 'indigo' },
  driving_license: { label: 'Driving License', icon: Shield, color: 'cyan' },
  
  // NEW CATEGORIES
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
    description: 'Police clearance, character certificate'
  },
  certificates: { 
    label: 'Professional Certificates', 
    icon: Award, 
    color: 'green',
    description: 'Skill certifications, professional licenses'
  },
  
  contracts: { label: 'Contracts', icon: Briefcase, color: 'orange' },
  medical_reports: { label: 'Medical Reports', icon: Heart, color: 'red' },
  photos: { label: 'Photos', icon: ImageIcon, color: 'pink' },
  other_documents: { label: 'Other Documents', icon: FileQuestion, color: 'gray' },
};
```

#### TODO 4.2: Update Candidate Details Modal
- [ ] Update `src/components/CandidateDetailsModal.tsx`
- [ ] Update document categories info section
- [ ] Add new category folders to document display
- [ ] Update document grouping logic
- [ ] Test document display

**Estimated Time**: 30 minutes

**File**: `src/components/CandidateDetailsModal.tsx`

**Changes**: Update document categories display section (around line 1400):
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-700">
  <div>📄 CV / Resume</div>
  <div>🛂 Passport</div>
  <div>🎓 Educational Documents</div>  {/* NEW */}
  <div>💼 Experience Certificates</div>  {/* NEW */}
  <div>👷 NAVTTC Reports</div>  {/* NEW */}
  <div>👮 Police Certificate</div>  {/* NEW */}
  <div>📜 Professional Certificates</div>  {/* UPDATED */}
  <div>📋 Contracts</div>
  <div>🏥 Medical Reports</div>
  <div>📷 Photos</div>
</div>
```

#### TODO 4.3: Update Document Management Component
- [ ] Update `src/components/DocumentManagement.tsx`
- [ ] Add new categories to filter dropdown
- [ ] Update category statistics
- [ ] Update category icons
- [ ] Update category colors
- [ ] Test filtering and display

**Estimated Time**: 30 minutes

**File**: `src/components/DocumentManagement.tsx`

**Changes**: Update category filter dropdown (around line 260):
```tsx
<select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
  <option value="all">All Categories</option>
  <option value="CV">CVs</option>
  <option value="Passport">Passports</option>
  <option value="Educational">Educational Documents</option>  {/* NEW */}
  <option value="Experience">Experience Certificates</option>  {/* NEW */}
  <option value="NAVTTC">NAVTTC Reports</option>  {/* NEW */}
  <option value="Police">Police Certificate</option>  {/* NEW */}
  <option value="Certificate">Professional Certificates</option>  {/* UPDATED */}
  <option value="Contract">Contracts</option>
  <option value="Medical">Medical</option>
  <option value="Photo">Photos</option>
  <option value="Other">Other</option>
</select>
```

#### TODO 4.4: Update Document Review Interface (if exists)
- [ ] Check if `src/components/DocumentReviewInterface.tsx` exists
- [ ] Update category dropdown
- [ ] Test review interface

**Estimated Time**: 15 minutes

---

### Phase 5: Testing & Validation ✅

#### TODO 5.1: Database Migration Testing
- [ ] Run migration on local database
- [ ] Verify enum values added successfully
- [ ] Check display function returns correct names
- [ ] Test with sample INSERT statements
- [ ] Verify no data corruption

**Estimated Time**: 20 minutes

#### TODO 5.2: Backend API Testing
- [ ] Test document upload API with new categories
- [ ] Test split-upload with educational document
- [ ] Test split-upload with experience certificate
- [ ] Test split-upload with NAVTTC report
- [ ] Test split-upload with police certificate
- [ ] Verify correct folder routing
- [ ] Check database records have correct category

**Estimated Time**: 45 minutes

**Test Cases**:
```bash
# Test 1: Educational document
curl -X POST http://localhost:1000/api/documents/split-upload \
  -F "candidate_id=<id>" \
  -F "file=@degree_certificate.pdf"
# Expected: category = "educational_documents"

# Test 2: Experience certificate
curl -X POST http://localhost:1000/api/documents/split-upload \
  -F "candidate_id=<id>" \
  -F "file=@experience_letter.pdf"
# Expected: category = "experience_certificates"

# Test 3: NAVTTC report
curl -X POST http://localhost:1000/api/documents/split-upload \
  -F "candidate_id=<id>" \
  -F "file=@navttc_certificate.pdf"
# Expected: category = "navttc_reports"

# Test 4: Police certificate
curl -X POST http://localhost:1000/api/documents/split-upload \
  -F "candidate_id=<id>" \
  -F "file=@police_clearance.pdf"
# Expected: category = "police_character_certificate"
```

#### TODO 5.3: Python Parser Testing
- [ ] Test parser with degree certificate
- [ ] Test parser with diploma
- [ ] Test parser with transcript
- [ ] Test parser with experience letter
- [ ] Test parser with NAVTTC certificate
- [ ] Test parser with police clearance
- [ ] Verify correct category classification
- [ ] Check confidence scores

**Estimated Time**: 30 minutes

#### TODO 5.4: Frontend UI Testing
- [ ] Test document upload UI shows new categories
- [ ] Test category icons display correctly
- [ ] Test category colors are distinct
- [ ] Test document filtering by new categories
- [ ] Test candidate details modal shows documents in correct folders
- [ ] Test document management page statistics
- [ ] Check responsive design on mobile

**Estimated Time**: 30 minutes

#### TODO 5.5: End-to-End Integration Testing
- [ ] Upload sample CV with mixed documents (degree + experience + police cert)
- [ ] Verify split-upload correctly separates documents
- [ ] Check each document goes to correct category
- [ ] Verify UI displays documents in correct folders
- [ ] Test document download from each category
- [ ] Test document rejection workflow for new categories

**Estimated Time**: 45 minutes

#### TODO 5.6: 🧪 MANDATORY MULTI-DOCUMENT TEST CASE (BEFORE MARKING COMPLETE)
- [ ] **Create ONE PDF containing ALL document types:**
  - Page 1: Degree certificate (BSc/MSc)
  - Page 2: Experience letter from employer
  - Page 3: Police clearance certificate
  - Page 4: NAVTTC vocational certificate
- [ ] Upload this multi-page PDF via split-upload endpoint
- [ ] **Verify AI correctly splits into 4 separate documents**
- [ ] **Verify each document gets correct category:**
  - ✅ Degree → `educational_documents`
  - ✅ Experience → `experience_certificates`
  - ✅ Police cert → `police_character_certificate`
  - ✅ NAVTTC → `navttc_reports`
- [ ] **Verify each document stored in correct Supabase folder**
- [ ] **Verify UI shows 4 documents in 4 separate category folders**
- [ ] **Verify document grouping in candidate details modal**

**⚠️ THIS TEST MUST PASS BEFORE TASK IS CONSIDERED COMPLETE**

**Why This Matters**:
- Foundational change for entire document management system
- If this fails, employer verification logic breaks later
- Re-migration would be painful and costly
- Portal credibility depends on proper categorization

**Expected Result**:
```
Input: 1 PDF (4 pages, mixed documents)
Output:
  ├─ 🎓 Educational Documents (1)
  │   └─ degree_certificate.pdf
  ├─ 💼 Experience Certificates (1)
  │   └─ experience_letter.pdf
  ├─ 👮 Police Certificate (1)
  │   └─ police_clearance.pdf
  └─ 👷 NAVTTC Reports (1)
      └─ navttc_certificate.pdf
```

**Failure Criteria** (Task NOT done if):
- AI puts degree in "certificates" folder ❌
- Experience letter not separated ❌
- Documents not routed to correct storage folders ❌
- UI shows wrong category groupings ❌

**Estimated Time**: 30 minutes

---

### Phase 6: Documentation & Deployment ✅

#### TODO 6.1: Create Migration Guide
- [ ] Document migration steps
- [ ] Create rollback procedure
- [ ] Document breaking changes (if any)
- [ ] Create deployment checklist

**Estimated Time**: 30 minutes

**File**: Create `DOCUMENT_CATEGORY_MIGRATION_GUIDE.md`

#### TODO 6.2: Update API Documentation
- [ ] Update document upload API docs
- [ ] Document new category values
- [ ] Add examples for new categories
- [ ] Update OpenAPI/Swagger specs (if exists)

**Estimated Time**: 20 minutes

#### TODO 6.3: Create User Guide
- [ ] Document what each category is for
- [ ] Add examples of documents for each category
- [ ] Create visual guide with screenshots

**Estimated Time**: 30 minutes

#### TODO 6.4: Deploy to Production
- [ ] Run database migration on Supabase
- [ ] Deploy backend changes
- [ ] Deploy Python parser changes
- [ ] Deploy frontend changes
- [ ] Monitor for errors
- [ ] Test with real candidate documents

**Estimated Time**: 1 hour

---

## 📊 Summary

**Total Estimated Time**: 9-10 hours

**Breakdown**:
- Database: 30 min
- Backend: 2 hours
- Python Parser: 1 hour
- Frontend: 1.5 hours
- Testing: 2.5 hours
- Documentation: 1.5 hours
- Deployment: 1 hour

**Priority Order**:
1. Database schema (blocking)
2. Backend configuration (blocking)
3. Python parser updates (blocking)
4. Frontend UI updates (user-facing)
5. Testing (validation)
6. Documentation (handoff)

**Risk Level**: Medium
- Database changes are safe (adding enum values)
- Backend changes are additive (no breaking changes)
- Python parser needs careful testing
- Frontend changes are visual only

**Success Criteria**:
- [ ] All new categories work end-to-end
- [ ] Documents correctly classified by AI
- [ ] Storage folders match category enum values (1:1 mapping)
- [ ] UI displays documents in correct folders
- [ ] **MANDATORY multi-document test case passes (TODO 5.6)**
- [ ] Certificates folder ONLY contains professional/skill certs
- [ ] No regression in existing functionality
- [ ] Migration is reversible

**🔐 Final Validation Checklist**:
- [ ] Educational documents NOT in certificates folder ✅
- [ ] Experience letters NOT in certificates folder ✅
- [ ] NAVTTC reports NOT in certificates folder ✅
- [ ] Police certificates properly routed ✅
- [ ] Professional certs (AWS, CCNA, etc.) correctly in certificates folder ✅
- [ ] Multi-document PDF splits correctly (TODO 5.6) ✅
- [ ] All storage bucket folders exist and are used correctly ✅
