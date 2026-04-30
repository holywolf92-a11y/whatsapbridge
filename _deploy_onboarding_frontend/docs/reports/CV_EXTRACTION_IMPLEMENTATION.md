# CV Extraction Implementation Plan - Week 4+

## 🎯 Overview
Complete AI-powered CV extraction system that extracts candidate data from CVs and stores in database with confidence scores.

---

## 📊 Extracted Data Fields vs Database

### ✅ Fields Already Supported
- ✓ `name` - Full name
- ✓ `email` - Email address  
- ✓ `phone` - Phone number
- ✓ `passportNumber` (as `passport_normalized`)
- ✓ `dateOfBirth` (as `date_of_birth`)

### ✨ NEW Fields Added to Database (Migration 011)
| Field | Type | Database Column | UI Component |
|-------|------|-----------------|--------------|
| Nationality | string | `nationality` | Text input |
| Position | string | `position` | Text input |
| Experience (years) | integer | `experience_years` | Number input |
| Country of Interest | string | `country_of_interest` | Dropdown select |
| Skills | text | `skills` | Comma-separated / tags |
| Languages | text | `languages` | Comma-separated / tags |
| Education | string | `education` | Dropdown (Matric, Intermediate, Bachelor, etc) |
| Certifications | text | `certifications` | Multi-line text |
| Previous Employment | text | `previous_employment` | Multi-line text |
| Passport Expiry | date | `passport_expiry` | Date picker |
| Professional Summary | text | `professional_summary` | Multi-line text |
| Extraction Confidence | jsonb | `extraction_confidence` | Progress bars per field |
| Extraction Source | string | `extraction_source` | Read-only (WhatsApp/Email/Web) |
| Extracted At | timestamp | `extracted_at` | Read-only timestamp |

### 🆕 New Table: `extraction_history`
Tracks all extraction attempts and approvals:
```sql
CREATE TABLE extraction_history (
  id UUID PRIMARY KEY,
  candidate_id UUID -- References candidates
  extracted_data JSONB -- Full extracted data
  confidence_scores JSONB -- Confidence per field
  extracted_at TIMESTAMP
  reviewed_by UUID -- Who reviewed
  reviewed_at TIMESTAMP
  approved BOOLEAN -- Approved/rejected
  notes TEXT -- Reviewer notes
)
```

---

## 🔧 Backend Implementation Tasks

### 1. Database Migration ✅ CREATED
**File:** `backend/migrations/011_add_cv_extraction_fields.sql`
**Status:** Ready to execute
**Steps:**
```bash
# Execute migration
npm run migrate -- 011
```

### 2. API Endpoints (Need to create/update)

#### POST `/api/parsing-jobs`
- **Purpose:** Create parsing job for CV extraction
- **Input:** `{ attachment_id: string }`
- **Output:** `{ job_id: string, status: 'queued' }`
- **Implementation:** Already exists via `parsingJobsController`

#### GET `/api/parsing-jobs/:id`
- **Purpose:** Poll parsing job status
- **Output:** Includes `progress`, `status`, `result` (extracted data)
- **Status:** Already exists

#### POST `/api/candidates` (Update)
- **Purpose:** Create candidate from extracted data
- **Input:** ExtractedData + extraction_source
- **Implementation:** 
  - Map extraction fields to database columns
  - Store confidence scores in `extraction_confidence` JSONB
  - Set `extracted_at` timestamp
  - Link to original CV document

#### PATCH `/api/candidates/:id` (Update)
- **Purpose:** Save edited extracted data
- **Preserve:** Original extracted data in `extraction_history`

---

## 🎨 Frontend Implementation Tasks

### 1. CVParser Component (Update) ✅ PARTIAL
**File:** `src/components/CVParser.tsx`
**Status:** Interfaces updated, UI needs work

**Tasks:**
- [ ] Update review form to show all 15 new fields
- [ ] Add confidence score badges per field
- [ ] Implement field validation on edit
- [ ] Add "Approve" vs "Edit Required" buttons
- [ ] Show extraction_source badge (WhatsApp/Email/Web)
- [ ] Add confirmation before saving to candidates

**UI Layout:**
```
┌─────────────────────────────────────────┐
│ CV Extraction Review                    │ (1/5)
├─────────────────────────────────────────┤
│ Personal Information                    │
│ ├─ Name: Ahmed Hassan          [99%] ✓  │
│ ├─ Email: ahmed@email.com      [95%] ⚠  │
│ ├─ Phone: +92 300 1234567      [92%] ✓  │
│ ├─ Nationality: Pakistani       [88%] ✓  │
│ └─ DOB: 1992-05-15             [85%] ⚠  │
│                                         │
│ Job Information                         │
│ ├─ Position: Construction Worker [92%] │
│ ├─ Experience: 5 years          [95%] │
│ ├─ Country of Interest: Saudi   [85%] │
│ └─ Skills: Masonry, Carpentry   [80%] │
│                                        │
│ Education & Languages                 │
│ ├─ Education: Matric           [92%]  │
│ ├─ Languages: Urdu, English    [88%]  │
│ └─ Certifications: Safety Cert [75%]  │
│                                        │
│ [← Back] [Edit Fields] [Save & Create] │
└─────────────────────────────────────────┘
```

### 2. Candidate Details Modal (Update)
**File:** `src/components/CandidateDetailsModal.tsx`
**Tasks:**
- [ ] Display all 15 extraction fields
- [ ] Show `extraction_source` (WhatsApp/Email/Web)
- [ ] Show `extracted_at` timestamp
- [ ] Add edit mode for all fields
- [ ] Display confidence scores if available
- [ ] Add extraction history timeline

### 3. Candidate Management (Update)
**File:** `src/components/CandidateManagement.tsx`
**Tasks:**
- [ ] Add filter by extraction_source
- [ ] Add filter by experience_years range
- [ ] Add filter by country_of_interest
- [ ] Add column: Position (job title)
- [ ] Add column: Experience (years)
- [ ] Add column: Country of Interest
- [ ] Add "Confidence" indicator column

### 4. New Component: ExtractionReviewModal
**Purpose:** Review and approve extracted CVs before creating candidate
**Props:**
```typescript
interface ExtractionReviewModalProps {
  extraction: ExtractedData;
  confidenceScores: Record<string, number>;
  source: 'WhatsApp' | 'Email' | 'Web';
  onApprove: (data: ExtractedData) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  onEdit: (data: ExtractedData) => void;
}
```

---

## 🤖 AI Extraction Setup (Backend Worker)

### Current Status
- ✅ Python parser running on Railway
- ✅ Backend has CV Parser Worker queued
- ✅ Parsing jobs table created

### Implementation Needed
**File:** `backend/src/workers/cvParserWorker.ts`

```typescript
async function processCVParsingJob(job: ParsingJob) {
  try {
    // 1. Get attachment from inbox
    const attachment = await getAttachment(job.attachment_id);
    
    // 2. Download file from Supabase Storage
    const cvFile = await downloadFromStorage(attachment.storage_path);
    
    // 3. Call Python parser API
    const extracted = await fetch(`${PYTHON_PARSER_URL}/api/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/pdf' },
      body: cvFile.buffer
    });
    
    // 4. Save extracted data
    const result = await extracted.json();
    
    // 5. Update job
    await updateParsingJob(job.id, {
      status: 'completed',
      result: result.extracted_data,
      progress: 100
    });
    
  } catch (error) {
    await updateParsingJob(job.id, {
      status: 'failed',
      error_message: error.message
    });
  }
}
```

### Python Parser (OpenAI Integration)
**File:** `python-parser/main.py`

Current status: Needs implementation

**Required:**
```python
from fastapi import FastAPI
from openai import OpenAI
import PyPDF2

app = FastAPI()
client = OpenAI(api_key=os.environ['OPENAI_API_KEY'])

@app.post("/api/extract")
async def extract_cv(file: UploadFile):
    """Extract CV data using GPT-4-Vision"""
    # 1. Read PDF/DOCX
    text = extract_text_from_pdf(file.file)
    
    # 2. Call OpenAI
    response = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[{
            "role": "system",
            "content": CV_EXTRACTION_PROMPT,  # See below
        }, {
            "role": "user",
            "content": text
        }],
        temperature=0.2,
        response_format={"type": "json_object"}
    )
    
    # 3. Parse and return
    extracted = json.loads(response.choices[0].message.content)
    return {
        "extracted_data": extracted,
        "confidence_scores": calculate_confidence(extracted),
        "model": "gpt-4-turbo",
        "tokens_used": response.usage.total_tokens
    }

CV_EXTRACTION_PROMPT = """
Extract the following information from the CV text and return as JSON:
- name: Full name
- email: Email address
- phone: Phone number with country code
- nationality: Country of citizenship
- dateOfBirth: Birth date (YYYY-MM-DD format)
- position: Current job title or desired position
- experience: Years of experience (numeric)
- countryOfInterest: Where they want to work
- skills: Comma-separated list
- languages: Comma-separated list
- education: Highest education level
- certifications: Comma-separated list
- previousEmployment: Work history
- passportNumber: Passport number (if visible)
- passportExpiry: Expiry date (YYYY-MM-DD format)
- summary: 2-3 sentence professional summary

For each field, include confidence (0-100).
Return ONLY valid JSON.
"""
```

---

## 📋 Testing Checklist

### Unit Tests
- [ ] ExtractedData interface validation
- [ ] Confidence score calculation
- [ ] Database column mapping
- [ ] Field normalization (phone format, date format)

### Integration Tests
- [ ] Upload CV → Extract → Review → Save flow
- [ ] Verify all 15 fields stored in database
- [ ] Test with different CV formats (PDF/DOCX)
- [ ] Test with different languages
- [ ] Confidence scores persisted correctly

### E2E Tests
- [ ] User uploads CV from Web Form
- [ ] Data appears in CV Inbox
- [ ] Click "Extract Data" → Shows review form
- [ ] Review all 15 fields with confidence
- [ ] Edit one field → Save changes
- [ ] Confirm candidate created with all fields
- [ ] Check Candidate Management shows extracted data

---

## 🚀 Deployment Plan

### Phase 1: Database
1. Execute migration 011
2. Verify new columns exist in Supabase
3. Backup database

### Phase 2: Backend
1. Update API endpoints (if needed)
2. Deploy backend to Railway
3. Test endpoints with sample data

### Phase 3: Frontend
1. Update TypeScript interfaces ✅ DONE
2. Update CVParser component
3. Update CandidateDetailsModal
4. Update CandidateManagement
5. Test UI end-to-end
6. Deploy frontend to Railway

### Phase 4: Python Parser
1. Set up Python environment
2. Install OpenAI SDK
3. Implement extraction logic
4. Test with sample CVs
5. Deploy to Railway

---

## 💰 Costs Estimate

### OpenAI API
- GPT-4 Turbo: ~$0.03 per CV
- 1,000 CVs/month: ~$30/month

### Alternatives (if budget tight)
- GPT-3.5 Turbo: ~$0.003 per CV (~$3/month for 1,000)
- Claude 3 Haiku: ~$0.0005 per CV (faster, cheaper)

---

## 📊 Success Criteria

- [ ] All 15 fields extracted and stored
- [ ] Confidence scores show ≥85% for primary fields
- [ ] UI shows intuitive review form
- [ ] Users can edit before saving
- [ ] Extraction history tracked
- [ ] Performance: <3 seconds per CV extraction
- [ ] Mobile responsive form

---

## 📝 Next Steps

1. **Immediate:** Execute migration 011 in Supabase
2. **Backend:** Update candidate creation to handle new fields
3. **Frontend:** Build extraction review UI component
4. **Python:** Implement OpenAI integration
5. **Testing:** Run end-to-end tests
6. **Deploy:** Frontend → Backend → Python Parser

---

## 🔗 Related Files

- Migration: `backend/migrations/011_add_cv_extraction_fields.sql`
- API Types: `src/lib/apiClient.ts` ✅ UPDATED
- CV Parser: `src/components/CVParser.tsx` ✅ INTERFACES UPDATED
- Candidate Types: Backend models (need update)
- Python Parser: `python-parser/main.py` (needs creation)

