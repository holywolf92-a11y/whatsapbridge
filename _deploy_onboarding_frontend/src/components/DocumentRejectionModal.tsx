import React from 'react';
import { X, AlertCircle, AlertTriangle, Info, RefreshCw, Shield, CheckCircle, XCircle, Clock } from 'lucide-react';

export interface DocumentRejectionDetails {
  rejection_code?: string;
  rejection_reason?: string;
  mismatch_fields?: string[];
  ai_confidence?: number;
  ocr_confidence?: number;
  error_stage?: 'OCR' | 'Vision' | 'Matching' | 'Extraction' | 'Categorization';
  retry_possible?: boolean;
  retry_count?: number;
  max_retries?: number;
  document_expiry_date?: string;
  rejection_context?: {
    mismatch_fields?: string[];
    extracted_values?: Record<string, any>;
    candidate_values?: Record<string, any>;
  };
}

interface DocumentRejectionModalProps {
  documentId: string;
  documentName: string;
  documentCategory: 'CV' | 'Passport' | 'Certificate' | 'Contract' | 'Medical' | 'Photo' | 'Other' | string;
  rejectionDetails: DocumentRejectionDetails;
  verificationStatus: 'rejected_mismatch' | 'failed';
  onClose: () => void;
  onRequestOverride?: () => void; // Callback when user requests admin override
  onRetry?: () => void; // Callback when user requests retry
  isAdmin?: boolean; // Whether current user is admin (to show override button)
}

// Map rejection codes to human-readable messages
const getRejectionMessage = (code?: string, category?: string): string => {
  if (!code) return 'Unknown rejection reason';
  
  const messages: Record<string, string> = {
    // Wrong document type (e.g. not a passport when uploaded as passport)
    WRONG_DOCUMENT_TYPE: category === 'Passport'
      ? 'This is not a passport. Please upload a valid passport document.'
      : category?.toLowerCase().includes('cnic') || category === 'CNIC'
      ? 'This is not a CNIC / national ID. Please upload a valid CNIC document.'
      : category?.toLowerCase().includes('driving')
      ? 'This is not a driving license. Please upload a valid driving license document.'
      : category?.toLowerCase().includes('character') || category === 'PCC'
      ? 'This is not a police character certificate. Please upload a valid PCC document.'
      : category === 'Certificate'
      ? 'This is not a certificate or degree. Please upload a valid certificate document.'
      : category === 'Medical Report'
      ? 'This is not a medical report. Please upload a valid medical certificate.'
      : category === 'Photo'
      ? 'This is not a valid photo. Please upload a clear profile photo.'
      : category === 'CV/Resume'
      ? 'This is not a CV or resume. Please upload a valid CV/resume document.'
      : `This document does not appear to be a valid ${(category || 'document').toLowerCase()}. Please upload the correct document type.`,
    
    // Identity mismatches
    CNIC_MISMATCH: `The CNIC number in this ${category || 'document'} does not match the candidate's CNIC.`,
    PASSPORT_MISMATCH: `The passport number in this ${category || 'document'} does not match the candidate's passport.`,
    DOB_MISMATCH: `The date of birth in this ${category || 'document'} does not match the candidate's date of birth.`,
    NAME_MISMATCH: `The name in this ${category || 'document'} does not match the candidate's name.`,
    EMAIL_MISMATCH: `The email in this ${category || 'document'} does not match the candidate's email.`,
    PHONE_MISMATCH: `The phone number in this ${category || 'document'} does not match the candidate's phone.`,
    FATHER_NAME_MISMATCH: `The father's name in this ${category || 'document'} does not match the candidate's father's name.`,
    
    // Document validity
    EXPIRED_PASSPORT: `This passport expired on ${category || 'the expiry date'}.`,
    EXPIRED_MEDICAL: `This medical certificate expired on ${category || 'the expiry date'}.`,
    EXPIRED_LICENSE: `This driving license expired on ${category || 'the expiry date'}.`,
    EXPIRED_CERTIFICATE: `This certificate expired on ${category || 'the expiry date'}.`,
    
    // Quality issues
    LOW_OCR_CONFIDENCE: 'The document quality is too low for reliable text extraction. The text may be blurred, damaged, or unreadable.',
    LOW_AI_CONFIDENCE: 'The AI could not confidently categorize or extract information from this document.',
    DOCUMENT_TAMPERED: 'This document appears to have been tampered with or altered.',
    PHOTO_MISMATCH: 'The photo in this document does not match the candidate\'s profile photo.',
    
    // Processing errors
    OCR_FAILED: 'Failed to extract text from the document using OCR.',
    VISION_FAILED: 'Failed to process the document image using AI vision.',
    MATCHING_FAILED: 'Failed to match this document with the candidate.',
    EXTRACTION_FAILED: 'Failed to extract required information from the document.',
    CATEGORIZATION_FAILED: 'Failed to categorize this document type.',
    
    // Identity not found
    NO_ID_FOUND: 'No identity information (name, CNIC, passport, email, phone) could be found in this document.',
    NO_CNIC_FOUND: 'CNIC number not found in this document.',
    NO_PASSPORT_FOUND: 'Passport number not found in this document.',
    NO_NAME_FOUND: 'Name not found in this document.',
    
    // Multiple candidates
    CNIC_BELONGS_TO_ANOTHER: 'This CNIC number belongs to another candidate in the system.',
    PASSPORT_BELONGS_TO_ANOTHER: 'This passport number belongs to another candidate in the system.',
  };
  
  return messages[code] || `Document rejected: ${code.replace(/_/g, ' ').toLowerCase()}`;
};

// Get document category display name
const getCategoryDisplayName = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'cv_resume': 'CV/Resume',
    'passport': 'Passport',
    'certificates': 'Certificate',
    'contracts': 'Contract',
    'medical_reports': 'Medical Report',
    'photos': 'Photo',
    'CV': 'CV/Resume',
    'Passport': 'Passport',
    'Certificate': 'Certificate',
    'Contract': 'Contract',
    'Medical': 'Medical Report',
    'Photo': 'Photo',
  };
  return categoryMap[category] || category;
};

// Get error stage display name
const getErrorStageDisplayName = (stage?: string): string => {
  if (!stage) return 'Unknown';
  return stage.charAt(0) + stage.slice(1).toLowerCase();
};

// Format confidence as percentage
const formatConfidence = (confidence?: number): string => {
  if (confidence === undefined || confidence === null) return 'N/A';
  return `${(confidence * 100).toFixed(0)}%`;
};

// Get confidence color
const getConfidenceColor = (confidence?: number): string => {
  if (confidence === undefined || confidence === null) return 'text-gray-500';
  if (confidence >= 0.8) return 'text-green-600';
  if (confidence >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
};

export function DocumentRejectionModal({
  documentId,
  documentName,
  documentCategory,
  rejectionDetails,
  verificationStatus,
  onClose,
  onRequestOverride,
  onRetry,
  isAdmin = false,
}: DocumentRejectionModalProps) {
  const rd = rejectionDetails as Record<string, unknown>;
  const rejection_code = rd.rejection_code ?? rd.rejectionCode ?? rd.code;
  const rejection_reason = rd.rejection_reason ?? rd.rejectionReason ?? rd.reason;
  const mismatch_fields = (rd.mismatch_fields as string[]) ?? [];
  const ai_confidence = rd.ai_confidence as number | undefined;
  const ocr_confidence = rd.ocr_confidence as number | undefined;
  const error_stage = rd.error_stage as string | undefined;
  const retry_possible = (rd.retry_possible as boolean) ?? false;
  const retry_count = (rd.retry_count as number) ?? 0;
  const max_retries = (rd.max_retries as number) ?? 2;
  const document_expiry_date = rd.document_expiry_date as string | undefined;
  const rejection_context = rd.rejection_context as { mismatch_fields?: string[] } | undefined;

  const categoryDisplayName = getCategoryDisplayName(documentCategory);
  const codeStr = typeof rejection_code === 'string' ? rejection_code : undefined;
  const reasonStr = typeof rejection_reason === 'string' ? rejection_reason : undefined;
  let rejectionMessage = reasonStr || getRejectionMessage(codeStr, categoryDisplayName);
  // Never show "Unknown rejection reason": use category-based fallback when backend didn't provide code/reason
  if (rejectionMessage === 'Unknown rejection reason') {
    rejectionMessage =
      categoryDisplayName === 'Passport'
        ? 'This document was rejected. Please upload a valid passport.'
        : `This ${categoryDisplayName.toLowerCase()} was rejected. Please upload a valid document of the correct type.`;
  }
  const canRetry = retry_possible && (retry_count || 0) < (max_retries || 2);
  const isExpired = document_expiry_date && new Date(document_expiry_date) < new Date();

  // Extract mismatch fields from context if not directly provided
  const allMismatchFields = mismatch_fields.length > 0 
    ? mismatch_fields 
    : rejection_context?.mismatch_fields || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-red-50">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Document Rejection: {categoryDisplayName}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{documentName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Rejection Reason */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Rejection Reason</h3>
                <p className="text-sm text-gray-700">{rejectionMessage}</p>
                {rejection_code && (
                  <p className="text-xs text-gray-500 mt-2 font-mono">
                    Code: {rejection_code}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Mismatch Fields */}
          {allMismatchFields.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-yellow-600" />
                Mismatched Fields ({allMismatchFields.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {allMismatchFields.map((field, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium"
                  >
                    {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Confidence Scores */}
          {(ai_confidence !== undefined || ocr_confidence !== undefined) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                Confidence Scores
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {ai_confidence !== undefined && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">AI Confidence</p>
                    <p className={`text-lg font-semibold ${getConfidenceColor(ai_confidence)}`}>
                      {formatConfidence(ai_confidence)}
                    </p>
                  </div>
                )}
                {ocr_confidence !== undefined && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">OCR Confidence</p>
                    <p className={`text-lg font-semibold ${getConfidenceColor(ocr_confidence)}`}>
                      {formatConfidence(ocr_confidence)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Stage */}
          {error_stage && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-600" />
                Error Stage
              </h3>
              <p className="text-sm text-gray-700">
                The error occurred during: <span className="font-medium">{getErrorStageDisplayName(error_stage)}</span>
              </p>
            </div>
          )}

          {/* Expiry Date */}
          {document_expiry_date && (
            <div className={`border rounded-lg p-4 ${isExpired ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-600" />
                Document Expiry Date
              </h3>
              <p className="text-sm text-gray-700">
                {new Date(document_expiry_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                {isExpired && (
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                    Expired
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Retry Information */}
          {retry_possible && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-gray-600" />
                Retry Information
              </h3>
              <p className="text-sm text-gray-700">
                Retries: <span className="font-medium">{retry_count}</span> / <span className="font-medium">{max_retries}</span>
                {canRetry && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                    Can Retry
                  </span>
                )}
                {!canRetry && retry_count >= max_retries && (
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                    Max Retries Reached
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Mismatch Details (if available) */}
          {rejection_context?.extracted_values && Object.keys(rejection_context.extracted_values).length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Mismatch Details</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(rejection_context.extracted_values).map(([field, value]) => {
                  const candidateValue = rejection_context?.candidate_values?.[field];
                  return (
                    <div key={field} className="flex items-start gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-gray-700 capitalize">
                          {field.replace(/_/g, ' ')}
                        </p>
                        <p className="text-gray-600 mt-1">
                          Document: <span className="font-mono text-red-600">{String(value || 'N/A')}</span>
                        </p>
                        {candidateValue !== undefined && (
                          <p className="text-gray-600">
                            Candidate: <span className="font-mono text-green-600">{String(candidateValue || 'N/A')}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>

          <div className="flex gap-3">
            {canRetry && onRetry && (
              <button
                onClick={() => {
                  onRetry();
                  onClose(); // Close modal after initiating retry
                }}
                className="px-6 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Processing
              </button>
            )}
            {!canRetry && retry_count >= max_retries && (
              <div className="px-6 py-2 bg-gray-100 text-gray-500 rounded-lg flex items-center gap-2 cursor-not-allowed">
                <XCircle className="w-4 h-4" />
                Max Retries Reached ({retry_count}/{max_retries})
              </div>
            )}
            
            {isAdmin && onRequestOverride && (
              <button
                onClick={onRequestOverride}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Request Admin Override
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
