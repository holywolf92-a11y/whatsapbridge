import React from 'react';
import { CheckCircle, AlertCircle, Clock, XCircle, Info } from 'lucide-react';

interface VerificationStatusBadgeProps {
  status: 'pending_ai' | 'verified' | 'needs_review' | 'rejected_mismatch' | 'failed';
  reasonCode?: string;
  mismatchFields?: string[];
  confidence?: number;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const STATUS_CONFIG = {
  pending_ai: {
    label: 'Processing',
    icon: Clock,
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-300',
    iconColor: 'text-yellow-600',
    description: 'AI is analyzing the document and verifying identity',
  },
  verified: {
    label: 'Verified',
    icon: CheckCircle,
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-300',
    iconColor: 'text-green-600',
    description: 'Identity confirmed - document is authentic',
  },
  needs_review: {
    label: 'Needs Review',
    icon: AlertCircle,
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-300',
    iconColor: 'text-orange-600',
    description: 'Manual review required - no strong identity fields found or low AI confidence',
  },
  rejected_mismatch: {
    label: 'Rejected',
    icon: XCircle,
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
    iconColor: 'text-red-600',
    description: 'Identity mismatch detected - document belongs to a different person',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
    iconColor: 'text-red-600',
    description: 'AI processing failed - please try uploading again',
  },
};

const REASON_CODE_LABELS: Record<string, string> = {
  VERIFIED: 'Identity successfully verified',
  IDENTITY_MISMATCH: 'Identity does not match candidate record',
  CNIC_MISMATCH: 'CNIC belongs to a different person',
  PASSPORT_MISMATCH: 'Passport belongs to a different person',
  EMAIL_MISMATCH: 'Email address does not match',
  NAME_MISMATCH: 'Name does not match candidate record',
  LOW_CONFIDENCE: 'AI confidence below threshold (70%)',
  NO_ID_FOUND: 'No identity fields found in document',
  NO_TEXT_EXTRACTED: 'Unable to extract text from document',
  MULTIPLE_CANDIDATES: 'Document matches multiple candidates',
  OCR_FAILED: 'Text extraction failed',
  AI_PROCESSING_ERROR: 'AI service encountered an error',
};

export default function VerificationStatusBadge({
  status,
  reasonCode,
  mismatchFields,
  confidence,
  size = 'md',
  showTooltip = true,
}: VerificationStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className="relative inline-block group">
      <div
        className={`inline-flex items-center space-x-1.5 rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]} font-medium`}
      >
        <Icon className={`${iconSizes[size]} ${config.iconColor}`} />
        <span>{config.label}</span>
        {confidence !== undefined && status === 'verified' && (
          <span className="text-xs opacity-75">
            ({(confidence * 100).toFixed(0)}%)
          </span>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          <div className="space-y-1">
            <p className="font-medium">{config.description}</p>
            {reasonCode && (
              <p className="text-gray-300">
                {REASON_CODE_LABELS[reasonCode] || reasonCode}
              </p>
            )}
            {mismatchFields && mismatchFields.length > 0 && (
              <p className="text-red-300">
                Mismatched fields: {mismatchFields.join(', ')}
              </p>
            )}
            {confidence !== undefined && (
              <p className="text-gray-300">
                AI Confidence: {(confidence * 100).toFixed(1)}%
              </p>
            )}
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for tables
export function VerificationStatusIcon({
  status,
  size = 'md',
}: {
  status: 'pending_ai' | 'verified' | 'needs_review' | 'rejected_mismatch' | 'failed';
  size?: 'sm' | 'md' | 'lg';
}) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div className="relative inline-block group">
      <Icon className={`${iconSizes[size]} ${config.iconColor}`} />
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        {config.label}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
          <div className="border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );
}
