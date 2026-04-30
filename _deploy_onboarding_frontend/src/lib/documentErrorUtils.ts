/**
 * Document Error Visualization Utilities
 * Provides error analysis, categorization, and visual representations for documents
 */

import {
  AlertTriangle,
  AlertCircle,
  Clock,
  FileQuestion,
  XCircle,
  CheckCircle,
} from 'lucide-react';

export interface DocumentError {
  code: string;
  reason: string;
  severity: 'critical' | 'warning' | 'info';
  icon: typeof AlertTriangle;
  bgColor: string;
  textColor: string;
  borderColor: string;
  description: string;
  mismatchFields?: string[];
}

export interface DocumentHealth {
  status: 'verified' | 'rejected' | 'needs_review' | 'processing';
  totalDocs: number;
  verifiedCount: number;
  rejectedCount: number;
  needsReviewCount: number;
  errors: DocumentError[];
  errorsByDoc: Record<string, DocumentError | null>;
  overallSeverity: 'critical' | 'warning' | 'info' | 'healthy';
}

/**
 * Map rejection codes to user-friendly error information
 */
const ERROR_MESSAGES: Record<string, Omit<DocumentError, 'code'>> = {
  EXPIRED_PASSPORT: {
    reason: 'Expired Passport',
    severity: 'critical',
    icon: Clock,
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
    description: 'Passport has expired. Please update with valid document.',
  },
  EXPIRED_MEDICAL: {
    reason: 'Expired Medical Certificate',
    severity: 'critical',
    icon: Clock,
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
    description: 'Medical certificate has expired. Requires renewal.',
  },
  EXPIRED_CERTIFICATE: {
    reason: 'Expired Certificate',
    severity: 'critical',
    icon: Clock,
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
    description: 'Certificate has expired. Please provide updated document.',
  },
  EXPIRED_DOCUMENT: {
    reason: 'Document Expired',
    severity: 'critical',
    icon: Clock,
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
    description: 'This document has expired.',
  },
  PASSPORT_MISMATCH: {
    reason: 'Passport Mismatch',
    severity: 'warning',
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-300',
    description: 'Passport details don\'t match candidate information.',
  },
  CNIC_MISMATCH: {
    reason: 'CNIC Mismatch',
    severity: 'warning',
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-300',
    description: 'CNIC details don\'t match candidate information.',
  },
  DOB_MISMATCH: {
    reason: 'DOB Mismatch',
    severity: 'warning',
    icon: AlertCircle,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-300',
    description: 'Date of birth doesn\'t match candidate records.',
  },
  NAME_MISMATCH: {
    reason: 'Name Mismatch',
    severity: 'warning',
    icon: AlertCircle,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-300',
    description: 'Name doesn\'t match candidate information.',
  },
  LOW_OCR_CONFIDENCE: {
    reason: 'Poor Quality',
    severity: 'warning',
    icon: AlertCircle,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300',
    description: 'Document quality is poor. OCR reading may be inaccurate.',
  },
  LOW_CONFIDENCE: {
    reason: 'Needs Review',
    severity: 'info',
    icon: FileQuestion,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300',
    description: 'Document needs manual review for verification.',
  },
  DOCUMENT_TAMPERED: {
    reason: 'Document Tampered',
    severity: 'critical',
    icon: XCircle,
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
    description: 'Document appears to be tampered or forged.',
  },
  PHOTO_MISMATCH: {
    reason: 'Photo Mismatch',
    severity: 'critical',
    icon: AlertTriangle,
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
    description: 'Photo does not match candidate profile.',
  },
};

/**
 * Analyze a single document and return error information
 */
export function analyzeDocumentError(document: any): DocumentError | null {
  // Not an error if verified
  if (document.verification_status === 'verified') {
    return null;
  }

  const code = document.verification_reason_code || document.rejection_code;
  if (!code) {
    return null;
  }

  const baseError = ERROR_MESSAGES[code];
  if (!baseError) {
    // Fallback for unknown error codes
    return {
      code,
      reason: 'Requires Review',
      severity: 'info',
      icon: FileQuestion,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-300',
      description: 'Document requires review.',
      mismatchFields: document.rejection?.mismatch_fields,
    };
  }

  return {
    code,
    ...baseError,
    mismatchFields: document.rejection?.mismatch_fields,
  };
}

/**
 * Analyze all documents for a candidate and return overall health
 */
export function analyzeDocumentHealth(documents: any[] = []): DocumentHealth {
  const errors: DocumentError[] = [];
  const errorsByDoc: Record<string, DocumentError | null> = {};
  let verifiedCount = 0;
  let rejectedCount = 0;
  let needsReviewCount = 0;

  for (const doc of documents) {
    const categoryKey = doc.category || doc.doc_type || 'unknown';
    const error = analyzeDocumentError(doc);

    if (error) {
      errors.push(error);
      errorsByDoc[categoryKey] = error;

      if (doc.verification_status === 'rejected_mismatch' || 
          doc.verification_status === 'failed') {
        rejectedCount++;
      } else if (doc.verification_status === 'needs_review' || 
                 doc.verification_status === 'pending_ai') {
        needsReviewCount++;
      }
    } else {
      errorsByDoc[categoryKey] = null;
      if (doc.verification_status === 'verified') {
        verifiedCount++;
      }
    }
  }

  // Determine overall severity
  let overallSeverity: 'critical' | 'warning' | 'info' | 'healthy' = 'healthy';
  if (errors.some(e => e.severity === 'critical')) {
    overallSeverity = 'critical';
  } else if (errors.some(e => e.severity === 'warning')) {
    overallSeverity = 'warning';
  } else if (errors.length > 0) {
    overallSeverity = 'info';
  }

  return {
    status: rejectedCount > 0 ? 'rejected' : 
            needsReviewCount > 0 ? 'needs_review' : 
            documents.length > 0 ? 'verified' : 'processing',
    totalDocs: documents.length,
    verifiedCount,
    rejectedCount,
    needsReviewCount,
    errors,
    errorsByDoc,
    overallSeverity,
  };
}

/**
 * Get a summary badge for overall document health
 */
export function getHealthBadgeInfo(health: DocumentHealth): {
  label: string;
  bgColor: string;
  textColor: string;
  icon: typeof CheckCircle;
} {
  switch (health.overallSeverity) {
    case 'critical':
      return {
        label: `⚠️ ${health.rejectedCount} Critical Issues`,
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        icon: XCircle,
      };
    case 'warning':
      return {
        label: `⚠️ ${health.needsReviewCount} Warnings`,
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        icon: AlertTriangle,
      };
    case 'info':
      return {
        label: `ℹ️ ${health.needsReviewCount} Need Review`,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        icon: FileQuestion,
      };
    default:
      return {
        label: `✓ All Verified (${health.verifiedCount}/${health.totalDocs})`,
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        icon: CheckCircle,
      };
  }
}

/**
 * Format mismatch fields for display
 */
export function formatMismatchFields(fields?: string[]): string {
  if (!fields || fields.length === 0) {
    return 'Verification mismatch';
  }
  return `Mismatch in: ${fields.join(', ')}`;
}
