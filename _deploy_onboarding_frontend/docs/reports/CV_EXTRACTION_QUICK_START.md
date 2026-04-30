# CV Extraction - Quick Start Guide

## ⚡ Quick Implementation Summary

### What's Been Built
✅ **Database**: 14 new CV extraction fields + history table (Migration 011 - VERIFIED)  
✅ **Backend API**: 3 extraction endpoints with controllers and service layer  
✅ **Python Parser**: OpenAI GPT-4 powered extraction from PDF/DOCX  
✅ **Frontend UI**: Complete review modal with confidence indicators  

---

## 🚀 How to Use (3 Steps)

### 1. Add OpenAI API Key
```bash
# In python-parser/.env (create if not exists)
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 2. Test Python Parser
```bash
cd python-parser
pip install -r requirements.txt
python extract_cv.py "https://example.com/test-cv.pdf"
```

### 3. Integrate in Frontend
```tsx
import { ExtractionReviewModal } from './components/ExtractionReviewModal';

// Trigger extraction
const handleExtract = async () => {
  const result = await apiClient.extractCandidateData(
    candidate.id,
    candidate.cv_url
  );
  setExtractedData(result.data);
  setShowModal(true);
};

// Show review modal
{showModal && (
  <ExtractionReviewModal
    candidateId={candidate.id}
    extractedData={extractedData}
    onClose={() => setShowModal(false)}
    onApprove={async (data, notes) => {
      await apiClient.updateExtraction(candidate.id, data, true, notes);
      // Refresh candidate data
    }}
    onReject={async (notes) => {
      await apiClient.updateExtraction(candidate.id, {}, false, notes);
    }}
  />
)}
```

---

## 📊 API Endpoints

### Extract CV Data
```bash
POST /api/candidates/:id/extract
Body: { "cvUrl": "https://storage.url/cv.pdf" }

Response: {
  "success": true,
  "data": {
    "nationality": "Indian",
    "position": "Software Engineer",
    "experience_years": 5,
    "skills": ["Python", "JavaScript"],
    "extraction_confidence": { "nationality": 0.95, ... }
  }
}
```

### Update Extraction (Approve/Reject)
```bash
PUT /api/candidates/:id/extraction
Body: {
  "extractedData": { ... },
  "approved": true,
  "notes": "Verified all fields"
}
```

### View History
```bash
GET /api/candidates/:id/extraction-history

Response: {
  "history": [
    {
      "extraction_source": "automated",
      "extracted_at": "2025-01-13T10:30:00Z",
      "notes": "Initial extraction"
    }
  ]
}
```

---

## 🎯 Extracted Fields (14 Total)

| Field | Type | Description |
|-------|------|-------------|
| `nationality` | string | Candidate's nationality |
| `position` | string | Desired job position/title |
| `experience_years` | number | Total years of work experience |
| `country_of_interest` | string | Preferred work country |
| `skills` | array | Technical/professional skills |
| `languages` | array | Spoken/written languages |
| `education` | string | Highest education qualification |
| `certifications` | array | Professional certifications |
| `previous_employment` | string | Work history summary |
| `passport_expiry` | date | Passport expiration date |
| `professional_summary` | string | Brief career summary |
| `extraction_confidence` | object | Confidence scores (0.0-1.0) |
| `extraction_source` | string | automated / human-reviewed |
| `extracted_at` | timestamp | Extraction timestamp |

---

## 🎨 Confidence Indicators

The UI shows color-coded confidence levels:

- 🟢 **Green (≥90%)**: High confidence - Data explicitly stated
- 🟡 **Yellow (70-89%)**: Medium confidence - Data inferred  
- 🔴 **Red (<70%)**: Low confidence - Data uncertain

Users can edit any field before approving.

---

## 🔧 Files Reference

### Backend
- **Routes**: `backend/src/routes/candidates.ts` (lines with `/extract`, `/extraction`, `/extraction-history`)
- **Controllers**: `backend/src/controllers/candidateController.ts` (3 new functions at bottom)
- **Service**: `backend/src/services/extractionService.ts` (complete extraction logic)

### Python
- **Parser**: `python-parser/extract_cv.py` (main extraction script)
- **Dependencies**: `python-parser/requirements.txt` (includes python-docx, requests)

### Frontend
- **Modal**: `src/components/ExtractionReviewModal.tsx` (complete review UI)
- **API Client**: `src/lib/apiClient.ts` (3 new methods at bottom)

---

## ⚠️ Important Notes

### Environment Setup
1. **Backend already has** Supabase credentials in `.env` ✅
2. **Python needs** OpenAI API key in `python-parser/.env` ⚠️
3. **Database migration 011** is already executed ✅

### Deployment
- Backend routes are ready (no rebuild needed if using nodemon)
- Python parser runs locally via child_process
- Frontend needs rebuild to include new modal

### Testing Checklist
- [ ] Add OPENAI_API_KEY to python-parser/.env
- [ ] Install Python dependencies: `pip install -r requirements.txt`
- [ ] Test parser: `python extract_cv.py "test-cv-url"`
- [ ] Restart backend if needed
- [ ] Test POST /candidates/:id/extract endpoint
- [ ] Test frontend review modal
- [ ] Verify extraction history saves

---

## 🐛 Common Issues

**"Python not found"**
→ Install Python 3.8+ and ensure it's in PATH

**"OpenAI API error"**
→ Check OPENAI_API_KEY is set and valid

**"No text extracted from PDF"**
→ PDF may be image-based (needs OCR) or corrupted

**"Confidence scores all low"**
→ CV may be poorly formatted or missing information

**"History not loading"**
→ Check extraction_history table exists (migration 011)

---

## 📈 Next Actions

1. **Add OpenAI key** → Enable actual AI extraction
2. **Test with real CV** → Verify extraction accuracy
3. **Add "Extract" button** → In candidate profile UI
4. **Deploy to Railway** → Update both backend and frontend
5. **Monitor usage** → Track OpenAI API costs

---

**Quick Status Check:**
```bash
# Database ready?
✅ Migration 011 executed (verified 14/14 columns)

# Backend ready?
✅ Routes, controllers, services all implemented

# Python ready?
✅ Script created, dependencies listed
⚠️ Needs: OPENAI_API_KEY in .env

# Frontend ready?
✅ Modal component created, API client updated
⏳ Needs: Integration in candidate profile page
```

---

For complete details, see: [CV_EXTRACTION_IMPLEMENTATION_COMPLETE.md](./CV_EXTRACTION_IMPLEMENTATION_COMPLETE.md)
