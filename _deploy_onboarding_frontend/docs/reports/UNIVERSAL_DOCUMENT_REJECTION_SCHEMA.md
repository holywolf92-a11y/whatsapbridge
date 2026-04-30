# Universal Document Verification Failure Handling - Schema & Implementation Plan

## Overview
Comprehensive system for handling verification failures for **ALL document types** (CV, Passport, CNIC, Certificate, Medical, Driving License, etc.) with detailed rejection reasons, UI popups, and admin override capabilities.

---

## Document Types Supported

1. **CV / Resume** (`cv_resume`)
2. **Passport** (`passport`)
3. **CNIC / ID Card** (`cnic` - via `certificates` category)
4. **Certificates** (`certificates`)
5. **Medical Reports** (`medical_reports`)
6. **Driving License** (via `certificates` category)
7. **Contracts** (`contracts`)
8. **Photos** (`photos`)
9. **Other Documents** (`other_documents`)

---

## STEP 1: Universal Rejection Reason Codes Schema

### 1.1 Rejection Reason Codes (Document-Type Agnostic)

**File**: `backend/src/config/documentCategories.ts`

```typescript
/**
 * Universal rejection reason codes applicable to all document types
 */
export const REJECTION_REASON_CODES = {
  // Identity Mismatch (All Documents)
  NAME_MISMATCH: 'NAME_MISMATCH',
  CNIC_MISMATCH: 'CNIC_MISMATCH',
  PASSPORT_MISMATCH: 'PASSPORT_MISMATCH',
  DOB_MISMATCH: 'DOB_MISMATCH',
  EMAIL_MISMATCH: 'EMAIL_MISMATCH',
  PHONE_MISMATCH: 'PHONE_MISMATCH',
  FATHER_NAME_MISMATCH: 'FATHER_NAME_MISMATCH',
  
  // Document-Specific Expiry (Passport, Medical, License, Certificate)
  EXPIRED_DOCUMENT: 'EXPIRED_DOCUMENT', // Generic expiry
  EXPIRED_PASSPORT: 'EXPIRED_PASSPORT',
  EXPIRED_MEDICAL: 'EXPIRED_MEDICAL',
  EXPIRED_LICENSE: 'EXPIRED_LICENSE',
  EXPIRED_CERTIFICATE: 'EXPIRED_CERTIFICATE',
  
  // Quality Issues (All Documents)
  LOW_OCR_CONFIDENCE: 'LOW_OCR_CONFIDENCE',
  UNREADABLE_DOCUMENT: 'UNREADABLE_DOCUMENT',
  BLURRED_IMAGE: 'BLURRED_IMAGE',
  POOR_QUALITY: 'POOR_QUALITY',
  
  // Security & Integrity (All Documents)
  DOCUMENT_TAMPERED: 'DOCUMENT_TAMPERED',
  PHOTO_MISMATCH: 'PHOTO_MISMATCH', // For ID documents
  SIGNATURE_MISMATCH: 'SIGNATURE_MISMATCH',
  
  // Processing Errors (All Documents)
  AI_PROCESSING_FAILED: 'AI_PROCESSING_FAILED',
  OCR_FAILED: 'OCR_FAILED',
  VISION_API_ERROR: 'VISION_API_ERROR',
  EXTRACTION_FAILED: 'EXTRACTION_FAILED',
  
  // Content Issues (Document-Specific)
  INVALID_FORMAT: 'INVALID_FORMAT', // Wrong document format
  WRONG_DOCUMENT_TYPE: 'WRONG_DOCUMENT_TYPE', // CV uploaded as passport, etc.
  INCOMPLETE_DOCUMENT: 'INCOMPLETE_DOCUMENT', // Missing pages/sections
  DUPLICATE_DOCUMENT: 'DUPLICATE_DOCUMENT', // Already exists
  
  // Matching Issues (All Documents)
  NO_ID_FOUND: 'NO_ID_FOUND', // No identity fields extracted
  MULTIPLE_CANDIDATES: 'MULTIPLE_CANDIDATES', // Matches multiple candidates
  CANDIDATE_NOT_FOUND: 'CANDIDATE_NOT_FOUND', // No matching candidate
  
  // CV-Specific
  CV_INCOMPLETE: 'CV_INCOMPLETE', // Missing required sections
  CV_FORMAT_ERROR: 'CV_FORMAT_ERROR',
  
  // Certificate-Specific
  CERTIFICATE_INVALID: 'CERTIFICATE_INVALID',
  ISSUING_AUTHORITY_MISMATCH: 'ISSUING_AUTHORITY_MISMATCH',
  
  // Medical-Specific
  MEDICAL_INVALID: 'MEDICAL_INVALID',
  MEDICAL_EXPIRED: 'MEDICAL_EXPIRED',
  
  // Generic
  LOW_CONFIDENCE: 'LOW_CONFIDENCE',
  MANUAL_REVIEW_REQUIRED: 'MANUAL_REVIEW_REQUIRED',
} as const;

export type RejectionReasonCode = typeof REJECTION_REASON_CODES[keyof typeof REJECTION_REASON_CODES];

/**
 * Map rejection codes to human-readable messages
 * Document-type aware messages
 */
export function getRejectionReasonMessage(
  code: RejectionReasonCode,
  documentCategory?: DocumentCategory,
  context?: {
    extractedValue?: string;
    candidateValue?: string;
    fieldName?: string;
    expiryDate?: string;
  }
): string {
  const category = documentCategory || 'other_documents';
  const docType = DOCUMENT_CATEGORY_DISPLAY_NAMES[category as DocumentCategory] || 'Document';
  
  switch (code) {
    // Identity Mismatches
    case REJECTION_REASON_CODES.NAME_MISMATCH:
      return `${docType} name "${context?.extractedValue || 'N/A'}" does not match candidate name "${context?.candidateValue || 'N/A'}"`;
    
    case REJECTION_REASON_CODES.CNIC_MISMATCH:
      return `CNIC number in ${docType.toLowerCase()} does not match candidate's CNIC`;
    
    case REJECTION_REASON_CODES.PASSPORT_MISMATCH:
      return `Passport number in ${docType.toLowerCase()} does not match candidate's passport`;
    
    case REJECTION_REASON_CODES.DOB_MISMATCH:
      return `Date of birth in ${docType.toLowerCase()} does not match candidate's date of birth`;
    
    case REJECTION_REASON_CODES.EMAIL_MISMATCH:
      return `Email in ${docType.toLowerCase()} does not match candidate's email`;
    
    case REJECTION_REASON_CODES.PHONE_MISMATCH:
      return `Phone number in ${docType.toLowerCase()} does not match candidate's phone`;
    
    case REJECTION_REASON_CODES.FATHER_NAME_MISMATCH:
      return `Father's name in ${docType.toLowerCase()} does not match candidate's father's name`;
    
    // Expiry
    case REJECTION_REASON_CODES.EXPIRED_DOCUMENT:
      return `${docType} expired on ${context?.expiryDate || 'unknown date'}`;
    
    case REJECTION_REASON_CODES.EXPIRED_PASSPORT:
      return `Passport expired on ${context?.expiryDate || 'unknown date'}`;
    
    case REJECTION_REASON_CODES.EXPIRED_MEDICAL:
      return `Medical report expired on ${context?.expiryDate || 'unknown date'}`;
    
    case REJECTION_REASON_CODES.EXPIRED_LICENSE:
      return `Driving license expired on ${context?.expiryDate || 'unknown date'}`;
    
    case REJECTION_REASON_CODES.EXPIRED_CERTIFICATE:
      return `Certificate expired on ${context?.expiryDate || 'unknown date'}`;
    
    // Quality
    case REJECTION_REASON_CODES.LOW_OCR_CONFIDENCE:
      return `${docType} quality is too low for reliable text extraction`;
    
    case REJECTION_REASON_CODES.UNREADABLE_DOCUMENT:
      return `${docType} is unreadable or corrupted`;
    
    case REJECTION_REASON_CODES.BLURRED_IMAGE:
      return `${docType} image is blurred and cannot be processed`;
    
    case REJECTION_REASON_CODES.POOR_QUALITY:
      return `${docType} quality is insufficient for verification`;
    
    // Security
    case REJECTION_REASON_CODES.DOCUMENT_TAMPERED:
      return `${docType} shows signs of tampering or manipulation`;
    
    case REJECTION_REASON_CODES.PHOTO_MISMATCH:
      return `Photo in ${docType.toLowerCase()} does not match candidate's profile photo`;
    
    case REJECTION_REASON_CODES.SIGNATURE_MISMATCH:
      return `Signature in ${docType.toLowerCase()} does not match candidate's signature`;
    
    // Processing
    case REJECTION_REASON_CODES.AI_PROCESSING_FAILED:
      return `AI processing failed for ${docType.toLowerCase()}`;
    
    case REJECTION_REASON_CODES.OCR_FAILED:
      return `OCR extraction failed for ${docType.toLowerCase()}`;
    
    case REJECTION_REASON_CODES.VISION_API_ERROR:
      return `Vision API error while processing ${docType.toLowerCase()}`;
    
    case REJECTION_REASON_CODES.EXTRACTION_FAILED:
      return `Failed to extract data from ${docType.toLowerCase()}`;
    
    // Content
    case REJECTION_REASON_CODES.INVALID_FORMAT:
      return `${docType} format is invalid or unsupported`;
    
    case REJECTION_REASON_CODES.WRONG_DOCUMENT_TYPE:
      return `Document type mismatch: expected ${docType.toLowerCase()}, got different type`;
    
    case REJECTION_REASON_CODES.INCOMPLETE_DOCUMENT:
      return `${docType} is incomplete or missing required sections`;
    
    case REJECTION_REASON_CODES.DUPLICATE_DOCUMENT:
      return `Duplicate ${docType.toLowerCase()} already exists for this candidate`;
    
    // Matching
    case REJECTION_REASON_CODES.NO_ID_FOUND:
      return `No identity fields found in ${docType.toLowerCase()}`;
    
    case REJECTION_REASON_CODES.MULTIPLE_CANDIDATES:
      return `${docType} matches multiple candidates`;
    
    case REJECTION_REASON_CODES.CANDIDATE_NOT_FOUND:
      return `No matching candidate found for ${docType.toLowerCase()}`;
    
    // CV-Specific
    case REJECTION_REASON_CODES.CV_INCOMPLETE:
      return `CV is missing required sections`;
    
    case REJECTION_REASON_CODES.CV_FORMAT_ERROR:
      return `CV format error or unsupported structure`;
    
    // Certificate-Specific
    case REJECTION_REASON_CODES.CERTIFICATE_INVALID:
      return `Certificate is invalid or not recognized`;
    
    case REJECTION_REASON_CODES.ISSUING_AUTHORITY_MISMATCH:
      return `Issuing authority does not match expected authority`;
    
    // Medical-Specific
    case REJECTION_REASON_CODES.MEDICAL_INVALID:
      return `Medical report is invalid or not recognized`;
    
    case REJECTION_REASON_CODES.MEDICAL_EXPIRED:
      return `Medical report has expired`;
    
    // Generic
    case REJECTION_REASON_CODES.LOW_CONFIDENCE:
      return `Low confidence in ${docType.toLowerCase()} verification`;
    
    case REJECTION_REASON_CODES.MANUAL_REVIEW_REQUIRED:
      return `${docType} requires manual review`;
    
    default:
      return `${docType} verification failed: ${code}`;
  }
}
```

---

## STEP 2: Database Schema (Universal)

### 2.1 Migration: Add Rejection Details to candidate_documents

**File**: `backend/migrations/015_add_universal_rejection_details.sql`

```sql
-- Migration: Add universal rejection handling for all document types
-- Supports CV, Passport, CNIC, Certificate, Medical, License, etc.

BEGIN;

-- Add rejection tracking columns to candidate_documents
ALTER TABLE candidate_documents
  -- Rejection details (applicable to all document types)
  ADD COLUMN IF NOT EXISTS rejection_code TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS mismatch_fields JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  ADD COLUMN IF NOT EXISTS ocr_confidence DECIMAL(3,2) CHECK (ocr_confidence >= 0 AND ocr_confidence <= 1),
  
  -- Retry tracking
  ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_retries INT DEFAULT 2,
  
  -- Verification metadata
  ADD COLUMN IF NOT EXISTS verified_against JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS verification_source TEXT DEFAULT 'ai_verification',
  ADD COLUMN IF NOT EXISTS error_stage TEXT, -- 'OCR', 'Vision', 'Matching', 'Extraction'
  ADD COLUMN IF NOT EXISTS retry_possible BOOLEAN DEFAULT false,
  
  -- Admin override tracking
  ADD COLUMN IF NOT EXISTS override_reason TEXT,
  ADD COLUMN IF NOT EXISTS overridden_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS overridden_at TIMESTAMPTZ,
  
  -- Document-specific expiry (for passport, medical, license, certificate)
  ADD COLUMN IF NOT EXISTS document_expiry_date DATE,
  
  -- Additional context for rejection
  ADD COLUMN IF NOT EXISTS rejection_context JSONB DEFAULT '{}'::jsonb;

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_candidate_documents_rejection_code 
  ON candidate_documents(rejection_code) 
  WHERE rejection_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_candidate_documents_verification_source 
  ON candidate_documents(verification_source);

CREATE INDEX IF NOT EXISTS idx_candidate_documents_expiry 
  ON candidate_documents(document_expiry_date) 
  WHERE document_expiry_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_candidate_documents_status_category 
  ON candidate_documents(verification_status, category) 
  WHERE verification_status IN ('rejected_mismatch', 'failed');

-- Add constraint for verification_source
ALTER TABLE candidate_documents
  ADD CONSTRAINT check_verification_source 
  CHECK (verification_source IN ('ai_verification', 'admin_override', 'manual_review'));

-- Add constraint for error_stage
ALTER TABLE candidate_documents
  ADD CONSTRAINT check_error_stage 
  CHECK (error_stage IS NULL OR error_stage IN ('OCR', 'Vision', 'Matching', 'Extraction', 'Categorization'));

COMMENT ON COLUMN candidate_documents.rejection_code IS 'Universal rejection reason code applicable to all document types';
COMMENT ON COLUMN candidate_documents.rejection_reason IS 'Human-readable rejection reason message';
COMMENT ON COLUMN candidate_documents.mismatch_fields IS 'Array of field names that did not match (e.g., ["name", "passport"])';
COMMENT ON COLUMN candidate_documents.ai_confidence IS 'AI confidence score (0-1) for document categorization. Standardized to 0-1 scale, convert to percentage in UI only.';
COMMENT ON COLUMN candidate_documents.ocr_confidence IS 'OCR confidence score (0-1) for text extraction. Standardized to 0-1 scale, convert to percentage in UI only.';
COMMENT ON COLUMN candidate_documents.retry_count IS 'Number of retry attempts made for this document';
COMMENT ON COLUMN candidate_documents.max_retries IS 'Maximum allowed retry attempts (default: 2)';
COMMENT ON COLUMN candidate_documents.verified_against IS 'JSON object with candidate_id and source document type';
COMMENT ON COLUMN candidate_documents.verification_source IS 'Source of verification: ai_verification, admin_override, or manual_review';
COMMENT ON COLUMN candidate_documents.error_stage IS 'Stage where error occurred: OCR, Vision, Matching, Extraction, or Categorization';
COMMENT ON COLUMN candidate_documents.retry_possible IS 'Whether the verification can be retried';
COMMENT ON COLUMN candidate_documents.document_expiry_date IS 'Expiry date for documents with validity period (passport, medical, license, certificate)';
COMMENT ON COLUMN candidate_documents.rejection_context IS 'Additional context for rejection (extracted values, candidate values, etc.)';

COMMIT;
```

### 2.2 Admin Override Logs Table

```sql
-- Migration: Create admin override logs table
BEGIN;

CREATE TABLE IF NOT EXISTS admin_override_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES candidate_documents(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  document_category TEXT NOT NULL, -- For filtering by document type
  
  -- Override details
  action TEXT NOT NULL DEFAULT 'ADMIN_OVERRIDE',
  previous_status TEXT NOT NULL,
  previous_rejection_code TEXT,
  previous_rejection_reason TEXT,
  override_reason TEXT NOT NULL,
  required_role TEXT NOT NULL DEFAULT 'admin', -- 'admin' or 'super_admin'
  
  -- Admin info
  overridden_by UUID NOT NULL REFERENCES users(id),
  overridden_by_name TEXT, -- Denormalized for quick access
  overridden_by_role TEXT, -- Role used for override (admin/super_admin)
  overridden_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Additional context
  override_context JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_override_logs_document 
  ON admin_override_logs(document_id);

CREATE INDEX IF NOT EXISTS idx_admin_override_logs_candidate 
  ON admin_override_logs(candidate_id);

CREATE INDEX IF NOT EXISTS idx_admin_override_logs_category 
  ON admin_override_logs(document_category);

CREATE INDEX IF NOT EXISTS idx_admin_override_logs_admin 
  ON admin_override_logs(overridden_by);

CREATE INDEX IF NOT EXISTS idx_admin_override_logs_date 
  ON admin_override_logs(overridden_at DESC);

COMMENT ON TABLE admin_override_logs IS 'Audit log for all admin overrides across all document types';
COMMENT ON COLUMN admin_override_logs.document_category IS 'Document type for filtering and reporting';
COMMENT ON COLUMN admin_override_logs.override_context IS 'Additional context about the override (justification details, etc.)';

COMMIT;
```

---

## STEP 3: Document-Type Specific Rejection Logic

### 3.1 Rejection Logic by Document Type

**File**: `backend/src/services/documentRejectionService.ts` (NEW)

```typescript
import { DocumentCategory, REJECTION_REASON_CODES, getRejectionReasonMessage } from '../config/documentCategories';
import { VERIFICATION_STATUS } from '../config/documentCategories';

interface RejectionContext {
  documentCategory: DocumentCategory;
  extractedIdentity?: any;
  candidateData?: any;
  aiConfidence?: number;
  ocrConfidence?: number;
  expiryDate?: string;
  errorStage?: 'OCR' | 'Vision' | 'Matching' | 'Extraction' | 'Categorization';
}

export class DocumentRejectionService {
  /**
   * Priority order for rejection codes (highest priority first)
   * When multiple mismatches exist, use the highest priority code
   * but keep all mismatches in mismatchFields array
   */
  private static readonly REJECTION_PRIORITY_ORDER = [
    REJECTION_REASON_CODES.CNIC_MISMATCH,
    REJECTION_REASON_CODES.PASSPORT_MISMATCH,
    REJECTION_REASON_CODES.DOB_MISMATCH,
    REJECTION_REASON_CODES.NAME_MISMATCH,
    REJECTION_REASON_CODES.EMAIL_MISMATCH,
    REJECTION_REASON_CODES.PHONE_MISMATCH,
    REJECTION_REASON_CODES.FATHER_NAME_MISMATCH,
  ];
  
  /**
   * Rejection codes that cannot be overridden by admin
   * Require super-admin role for override
   */
  private static readonly NON_OVERRIDABLE_CODES = [
    REJECTION_REASON_CODES.DOCUMENT_TAMPERED,
    REJECTION_REASON_CODES.PHOTO_MISMATCH,
  ];
  
  /**
   * Determine rejection code based on document type and context
   * Uses priority-based decision to select highest priority mismatch
   * but captures all mismatches in mismatchFields array
   */
  static determineRejectionCode(context: RejectionContext): {
    code: string;
    reason: string;
    mismatchFields: string[];
    retryPossible: boolean;
    isOverridable: boolean; // NEW: Whether admin can override
  } {
    const { documentCategory, extractedIdentity, candidateData, aiConfidence, ocrConfidence, expiryDate, errorStage } = context;
    
    const mismatchFields: string[] = [];
    const mismatchCodes: string[] = []; // Track all mismatch codes
    let rejectionCode: string = REJECTION_REASON_CODES.MANUAL_REVIEW_REQUIRED;
    let retryPossible = false;
    
    // Check expiry (for passport, medical, license, certificate)
    if (expiryDate && ['passport', 'medical_reports', 'certificates'].includes(documentCategory)) {
      const expiry = new Date(expiryDate);
      if (expiry < new Date()) {
        switch (documentCategory) {
          case 'passport':
            rejectionCode = REJECTION_REASON_CODES.EXPIRED_PASSPORT;
            break;
          case 'medical_reports':
            rejectionCode = REJECTION_REASON_CODES.EXPIRED_MEDICAL;
            break;
          case 'certificates':
            rejectionCode = REJECTION_REASON_CODES.EXPIRED_CERTIFICATE;
            break;
          default:
            rejectionCode = REJECTION_REASON_CODES.EXPIRED_DOCUMENT;
        }
        return {
          code: rejectionCode,
          reason: getRejectionReasonMessage(rejectionCode as any, documentCategory, { expiryDate }),
          mismatchFields: ['expiry_date'],
          retryPossible: false, // Expiry cannot be fixed by retry
        };
      }
    }
    
    // Check OCR confidence
    if (ocrConfidence !== undefined && ocrConfidence < 0.5) {
      rejectionCode = REJECTION_REASON_CODES.LOW_OCR_CONFIDENCE;
      retryPossible = true; // Can retry with better image
      return {
        code: rejectionCode,
        reason: getRejectionReasonMessage(rejectionCode as any, documentCategory),
        mismatchFields: [],
        retryPossible,
      };
    }
    
    // Check AI confidence
    if (aiConfidence !== undefined && aiConfidence < 0.7) {
      rejectionCode = REJECTION_REASON_CODES.LOW_CONFIDENCE;
      retryPossible = true;
      return {
        code: rejectionCode,
        reason: getRejectionReasonMessage(rejectionCode as any, documentCategory),
        mismatchFields: [],
        retryPossible,
      };
    }
    
    // Check identity mismatches (if identity fields extracted)
    // FIX: Use priority-based decision - capture all mismatches but use highest priority code
    if (extractedIdentity && candidateData) {
      // CNIC mismatch (highest priority)
      if (extractedIdentity.cnic && candidateData.cnic_normalized) {
        const extractedCnic = normalizeCNIC(extractedIdentity.cnic);
        const candidateCnic = candidateData.cnic_normalized;
        if (extractedCnic !== candidateCnic) {
          mismatchFields.push('cnic');
          mismatchCodes.push(REJECTION_REASON_CODES.CNIC_MISMATCH);
        }
      }
      
      // Passport mismatch (second priority)
      if (extractedIdentity.passport_no && candidateData.passport_normalized) {
        const extractedPassport = normalizePassport(extractedIdentity.passport_no);
        const candidatePassport = candidateData.passport_normalized;
        if (extractedPassport !== candidatePassport) {
          mismatchFields.push('passport');
          mismatchCodes.push(REJECTION_REASON_CODES.PASSPORT_MISMATCH);
        }
      }
      
      // DOB mismatch (third priority)
      if (extractedIdentity.date_of_birth && candidateData.date_of_birth) {
        const extractedDOB = new Date(extractedIdentity.date_of_birth);
        const candidateDOB = new Date(candidateData.date_of_birth);
        if (extractedDOB.getTime() !== candidateDOB.getTime()) {
          mismatchFields.push('date_of_birth');
          mismatchCodes.push(REJECTION_REASON_CODES.DOB_MISMATCH);
        }
      }
      
      // Name mismatch (fourth priority)
      if (extractedIdentity.name && candidateData.name) {
        // Use fuzzy matching - if still fails, it's a mismatch
        // (This check should happen before calling this service)
        if (!fuzzyNameMatch(extractedIdentity.name, candidateData.name)) {
          mismatchFields.push('name');
          mismatchCodes.push(REJECTION_REASON_CODES.NAME_MISMATCH);
        }
      }
      
      // Email mismatch (fifth priority)
      if (extractedIdentity.email && candidateData.email) {
        const extractedEmail = extractedIdentity.email.toLowerCase().trim();
        const candidateEmail = candidateData.email.toLowerCase().trim();
        if (extractedEmail !== candidateEmail) {
          mismatchFields.push('email');
          mismatchCodes.push(REJECTION_REASON_CODES.EMAIL_MISMATCH);
        }
      }
      
      // Phone mismatch (sixth priority)
      if (extractedIdentity.phone && candidateData.phone) {
        const extractedPhone = normalizePhoneE164(extractedIdentity.phone);
        const candidatePhone = normalizePhoneE164(candidateData.phone);
        if (extractedPhone !== candidatePhone) {
          mismatchFields.push('phone');
          mismatchCodes.push(REJECTION_REASON_CODES.PHONE_MISMATCH);
        }
      }
      
      // Father name mismatch (lowest priority)
      if (extractedIdentity.father_name && candidateData.father_name) {
        if (!fuzzyNameMatch(extractedIdentity.father_name, candidateData.father_name)) {
          mismatchFields.push('father_name');
          mismatchCodes.push(REJECTION_REASON_CODES.FATHER_NAME_MISMATCH);
        }
      }
      
      // Select highest priority mismatch code (if any mismatches found)
      if (mismatchCodes.length > 0) {
        for (const priorityCode of this.REJECTION_PRIORITY_ORDER) {
          if (mismatchCodes.includes(priorityCode)) {
            rejectionCode = priorityCode;
            break; // Use first (highest priority) match
          }
        }
      }
    }
    
    // Check error stage
    if (errorStage) {
      switch (errorStage) {
        case 'OCR':
          rejectionCode = REJECTION_REASON_CODES.OCR_FAILED;
          retryPossible = true;
          break;
        case 'Vision':
          rejectionCode = REJECTION_REASON_CODES.VISION_API_ERROR;
          retryPossible = true;
          break;
        case 'Extraction':
          rejectionCode = REJECTION_REASON_CODES.EXTRACTION_FAILED;
          retryPossible = true;
          break;
        case 'Categorization':
          rejectionCode = REJECTION_REASON_CODES.AI_PROCESSING_FAILED;
          retryPossible = true;
          break;
      }
    }
    
    // Generate human-readable reason
    const reason = getRejectionReasonMessage(
      rejectionCode as any,
      documentCategory,
      {
        extractedValue: extractedIdentity?.name,
        candidateValue: candidateData?.name,
        expiryDate,
      }
    );
    
    // Check if rejection code is overridable
    const isOverridable = !this.NON_OVERRIDABLE_CODES.includes(rejectionCode as any);
    
    return {
      code: rejectionCode,
      reason,
      mismatchFields,
      retryPossible,
      isOverridable,
    };
  }
  
  /**
   * Check if a rejection code can be overridden
   * Returns true if overridable, false if requires super-admin
   */
  static isOverridable(rejectionCode: string): boolean {
    return !this.NON_OVERRIDABLE_CODES.includes(rejectionCode as any);
  }
  
  /**
   * Get required role for override
   * Returns 'super_admin' for non-overridable codes, 'admin' otherwise
   */
  static getRequiredOverrideRole(rejectionCode: string): 'admin' | 'super_admin' {
    return this.isOverridable(rejectionCode) ? 'admin' : 'super_admin';
  }
}
```

---

## STEP 4: Universal UI Components

### 4.1 Document Rejection Modal (Universal)

**File**: `src/components/DocumentRejectionModal.tsx` (Renamed from PassportRejectionModal)

```typescript
interface DocumentRejectionModalProps {
  document: {
    id: string;
    fileName: string;
    category: 'CV' | 'Passport' | 'Certificate' | 'Medical' | 'CNIC' | 'License' | 'Other';
    rejection: {
      code: string;
      reason: string;
      fields: string[];
      confidence: number;
    };
    status: 'rejected_mismatch' | 'failed';
    errorStage?: 'OCR' | 'Vision' | 'Matching' | 'Extraction';
    retryPossible?: boolean;
  };
  onClose: () => void;
  onRequestOverwrite: () => void;
  onRetry?: () => void; // If retryPossible is true
}
```

**UI**: Dynamic title based on document category:
- "❌ Passport Verification Failed"
- "❌ CV Verification Failed"
- "❌ Certificate Verification Failed"
- etc.

---

## STEP 5: API Contract (Universal)

### 5.1 Document List Response

```typescript
{
  documents: [{
    id: string;
    file_name: string;
    category: DocumentCategory;
    verification_status: VerificationStatus;
    
    // Rejection details (if rejected/failed)
    rejection?: {
      code: string;
      reason: string;
      fields: string[];
      confidence: number; // 0-1 scale (convert to percentage in UI)
      ocr_confidence?: number; // 0-1 scale (convert to percentage in UI)
      is_overridable?: boolean; // Whether admin can override
    } | null;
    
    // Error details (if failed)
    error_stage?: 'OCR' | 'Vision' | 'Matching' | 'Extraction' | 'Categorization' | null;
    retry_possible?: boolean;
    
    // Admin override (if overridden)
    verification_source?: 'ai_verification' | 'admin_override' | 'manual_review';
    override_reason?: string;
    overridden_by?: {
      id: string;
      name: string;
    };
    overridden_at?: string;
    
    // Expiry (for applicable documents)
    document_expiry_date?: string;
    
    // ... other fields
  }]
}
```

---

## Document-Type Specific Considerations

### CV/Resume
- Rejection reasons: CV_INCOMPLETE, CV_FORMAT_ERROR, NAME_MISMATCH, EMAIL_MISMATCH
- No expiry check
- Focus on content extraction and identity matching

### Passport
- Rejection reasons: EXPIRED_PASSPORT, PASSPORT_MISMATCH, NAME_MISMATCH, DOB_MISMATCH, PHOTO_MISMATCH
- Expiry check required
- Strict identity matching

### CNIC/ID Card
- Rejection reasons: CNIC_MISMATCH, NAME_MISMATCH, DOB_MISMATCH, PHOTO_MISMATCH
- No expiry (unless driving license)
- Strict identity matching

### Medical Reports
- Rejection reasons: EXPIRED_MEDICAL, MEDICAL_INVALID, NAME_MISMATCH
- Expiry check required
- Less strict identity matching (name match may be sufficient)

### Certificates
- Rejection reasons: EXPIRED_CERTIFICATE, CERTIFICATE_INVALID, ISSUING_AUTHORITY_MISMATCH
- Expiry check if applicable
- Name matching sufficient

### Driving License
- Rejection reasons: EXPIRED_LICENSE, NAME_MISMATCH, DOB_MISMATCH
- Expiry check required
- Identity matching required

---

## Success Criteria (Universal)

✅ All document types have rejection reason codes
✅ Rejection reasons are document-type aware
✅ Database schema supports all document types
✅ UI components work for all document types
✅ Admin override works for all document types
✅ Expiry checks work for applicable document types
✅ Identity matching works for all document types
✅ Audit trail covers all document types
