# Certificate Misclassification Fix

## Problem Summary

Muhammad Nabeel shows TWO related issues:
1. ✅ **CV folder marked green** (`cv_received = true`) - Should be FALSE
2. ❌ **Profession not showing** - Should be "Construction Worker"

## Root Cause

The AI misclassified the **Police Certificate** and/or **Construction Worker Certificate** as `category = 'cv'` instead of `category = 'certificate'`.

This caused a cascade of issues:

### Issue 1: CV Received Flag Set Incorrectly
```typescript
// Line 1066 - documentVerificationWorker.ts
if (aiResult.category === 'cv_resume' || aiResult.category === 'cv') {
  documentSource = 'cv';  // ❌ WRONG! This was a certificate
}
```

When `documentSource = 'cv'`, the progressive enrichment service sets:
```typescript
cv_received: true  // ✅ Green folder appears
```

### Issue 2: Profession Inference Skipped
```typescript
// Line 1122 - documentVerificationWorker.ts
if (documentSource === 'certificate' && currentCandidate && !currentCandidate.position) {
  const professionInferred = inferProfessionFromCertificate(...);
  // ❌ This NEVER RUNS because documentSource = 'cv', not 'certificate'
}
```

## The Same Root Cause as Government Email

This is related to but different from the government email issue:
- **Government Email Issue**: Multiple creation paths without filtering
- **This Issue**: AI misclassification causing wrong document routing

Both stem from **trusting AI output without validation**.

## Solution Options

### Option 1: Secondary Filename-Based Classification (RECOMMENDED)
Add a secondary check when AI classifies something as CV but filename suggests certificate:

```typescript
// After AI classification
let finalCategory = aiResult.category;

// Secondary validation: If AI says "CV" but filename contains certificate keywords
if ((finalCategory === 'cv' || finalCategory === 'cv_resume') && fileName) {
  const certKeywords = ['certificate', 'diploma', 'training', 'course', 'qualification', 
                        'police', 'construction', 'electrician', 'plumber', 'mechanic'];
  const filenameLower = fileName.toLowerCase();
  
  if (certKeywords.some(keyword => filenameLower.includes(keyword))) {
    console.log(`⚠️ AI classified as CV but filename suggests certificate: ${fileName}`);
    console.log(`   Overriding: cv → certificate`);
    finalCategory = 'certificate';
  }
}
```

### Option 2: Fallback Profession Inference
Even if misclassified as CV, try to infer profession from filename:

```typescript
// After checking documentSource === 'certificate'
// Add fallback for misclassified certificates
if (!currentCandidate.position && (documentSource === 'cv' || documentSource === 'certificate')) {
  const professionInferred = inferProfessionFromCertificate(aiResult.category, fileName);
  if (professionInferred) {
    console.log(`[DocumentVerification] ✅ Inferred profession from filename: ${professionInferred}`);
    // Update candidate...
  }
}
```

### Option 3: Post-Processing Correction
Add validation in document update that checks if `cv_received = true` but no actual CV exists:

```typescript
// After document processing
if (candidate.cv_received) {
  const actualCVs = await countDocumentsByType(candidateId, 'cv');
  if (actualCVs === 0) {
    console.log('⚠️ cv_received=true but no CV documents found. Correcting...');
    await updateCandidate({ cv_received: false });
  }
}
```

## Recommended Implementation

**Implement ALL THREE**:
1. Secondary filename-based classification correction (prevents the issue)
2. Fallback profession inference (fixes existing data)
3. Post-processing validation (catches edge cases)

## Testing Required

1. Upload a certificate with "Construction Worker" in filename
2. Verify:
   - Document classified as 'certificate' (not 'cv')
   - `cv_received` remains FALSE
   - `certificate_received` set to TRUE
   - `position` inferred to "Construction Worker"

## Related Issues

- Same pattern likely affects other candidates
- Need to audit all documents where `category = 'cv'` but `original_filename` contains certificate keywords
- Need to reprocess Muhammad Nabeel's documents after fix

## Files to Modify

1. `backend/src/workers/documentVerificationWorker.ts`
   - Add secondary classification validation
   - Add fallback profession inference
   - Add post-processing cv_received validation

## Status

- [ ] Secondary classification validation implemented
- [ ] Fallback profession inference implemented  
- [ ] Post-processing validation implemented
- [ ] Muhammad Nabeel data corrected
- [ ] Tested with new certificate uploads
