# CV Extraction Flow Testing

## Issue Fixed
- **Problem**: ExtractionReviewModal was receiving wrong props (expected `candidateId` string, receiving `candidate` object)
- **Solution**: Updated CandidateDetailsModal to pass correct props to ExtractionReviewModal

## Changes Made

### 1. CandidateDetailsModal.tsx
- Fixed modal props: `candidateId={candidate.id}` instead of `candidate={candidate}`
- Added `onClose` callback (required by modal)
- Updated `onReject` to accept notes parameter
- Improved document upload flow to upload file first, then extract

### 2. ExtractionService.ts (Backend)
- Enhanced `callPythonParser()` to handle storage paths
- Now converts storage paths to signed URLs automatically
- Supports both local file paths and HTTP URLs

## Test Flow

### Step 1: Upload CV Document
```bash
curl -X POST http://localhost:3000/api/documents \
  -F "file=@Ibtehaj Uddin Ahmed Siddiqui.pdf" \
  -F "candidate_id=<CANDIDATE_ID>" \
  -F "doc_type=CV" \
  -F "is_primary=true"
```

Expected Response:
```json
{
  "document": {
    "id": "...",
    "storage_path": "candidates/<id>/documents/CV/...",
    "file_name": "Ibtehaj Uddin Ahmed Siddiqui.pdf"
  }
}
```

### Step 2: Trigger Extraction
```bash
curl -X POST http://localhost:3000/api/candidates/<ID>/extract \
  -H "Content-Type: application/json" \
  -d {
    "cvUrl": "candidates/<id>/documents/CV/..."
  }
```

Expected Response (96% confidence):
```json
{
  "success": true,
  "data": {
    "nationality": "...",
    "position": "...",
    "experience_years": ...,
    "extraction_confidence": {
      "nationality": 0.96,
      ...
    }
  }
}
```

### Step 3: Frontend Modal Display
✅ Modal should now display with all extracted fields and confidence scores
- Green: >90% confidence
- Yellow: 70-90% confidence  
- Orange: <70% confidence

### Step 4: User Approval
User can edit fields and click "Approve" to save extracted data to database

## Verification Checklist

- [x] ExtractionReviewModal props match interface
- [x] CandidateDetailsModal passes correct props
- [x] Document upload returns storage_path
- [x] Extraction service converts storage paths to signed URLs
- [x] Backend compiles without errors
- [x] Frontend compiles without errors
- [ ] Manual test: Upload CV and verify modal displays
- [ ] Manual test: Approve extraction and verify database update

## Next Steps
1. Deploy updated backend and frontend
2. Test full extraction flow
3. Verify confidence scores display correctly
4. Test field editing and approval
