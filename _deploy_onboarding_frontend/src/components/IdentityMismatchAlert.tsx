import React, { useEffect, useState } from 'react';
import { AlertTriangle, XCircle, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { apiClient } from '../lib/apiClient';

interface IdentityMismatchAlertProps {
  documentId: string;
  mismatchFields?: string[];
  reasonCode?: string;
  extractedIdentity?: any;
  candidateId?: string;
}

const FIELD_LABELS: Record<string, string> = {
  cnic: 'CNIC',
  passport: 'Passport Number',
  passport_no: 'Passport Number',
  email: 'Email Address',
  phone: 'Phone Number',
  name: 'Full Name',
  father_name: "Father's Name",
  date_of_birth: 'Date of Birth',
};

const REASON_CODE_MESSAGES: Record<string, { title: string; severity: 'error' | 'warning' | 'info' }> = {
  CNIC_MISMATCH: {
    title: 'CNIC Mismatch Detected',
    severity: 'error',
  },
  PASSPORT_MISMATCH: {
    title: 'Passport Number Mismatch',
    severity: 'error',
  },
  EMAIL_MISMATCH: {
    title: 'Email Address Mismatch',
    severity: 'warning',
  },
  NAME_MISMATCH: {
    title: 'Name Mismatch',
    severity: 'warning',
  },
  IDENTITY_MISMATCH: {
    title: 'Identity Verification Failed',
    severity: 'error',
  },
  LOW_CONFIDENCE: {
    title: 'Low AI Confidence',
    severity: 'warning',
  },
  NO_ID_FOUND: {
    title: 'No Identity Fields Found',
    severity: 'info',
  },
};

export default function IdentityMismatchAlert({
  documentId,
  mismatchFields = [],
  reasonCode,
  extractedIdentity,
  candidateId,
}: IdentityMismatchAlertProps) {
  const [candidateData, setCandidateData] = useState<any>(null);
  const [verificationLogs, setVerificationLogs] = useState<any[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (candidateId) {
      fetchCandidateData();
    }
    fetchVerificationLogs();
  }, [candidateId, documentId]);

  const fetchCandidateData = async () => {
    try {
      const response = await apiClient.get(`/candidates/${candidateId}`);
      setCandidateData(response.data);
    } catch (err) {
      console.error('Error fetching candidate data:', err);
    }
  };

  const fetchVerificationLogs = async () => {
    try {
      const response = await apiClient.getVerificationLogsByDocument(documentId);
      setVerificationLogs(response.logs || []);
    } catch (err) {
      console.error('Error fetching verification logs:', err);
    }
  };

  if (!reasonCode || reasonCode === 'VERIFIED') {
    return null;
  }

  const config = REASON_CODE_MESSAGES[reasonCode] || {
    title: 'Verification Issue',
    severity: 'warning' as const,
  };

  const severityStyles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-600',
      IconComponent: XCircle,
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-600',
      IconComponent: AlertTriangle,
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-600',
      IconComponent: Info,
    },
  };

  const style = severityStyles[config.severity];
  const Icon = style.IconComponent;

  return (
    <div className={`rounded-lg border ${style.border} ${style.bg} p-4`}>
      <div className="flex items-start">
        <Icon className={`h-5 w-5 ${style.icon} mt-0.5`} />
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${style.text}`}>
            {config.title}
          </h3>

          {/* Mismatch Fields */}
          {mismatchFields.length > 0 && (
            <div className={`mt-2 text-sm ${style.text}`}>
              <p className="font-medium">Mismatched Fields:</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                {mismatchFields.map((field) => (
                  <li key={field}>
                    {FIELD_LABELS[field] || field}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Extracted vs Candidate Data Comparison */}
          {extractedIdentity && candidateData && mismatchFields.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className={`text-sm font-medium ${style.text} hover:underline flex items-center`}
              >
                {showDetails ? 'Hide' : 'Show'} field comparison
                <AlertCircle className="ml-1 h-4 w-4" />
              </button>

              {showDetails && (
                <div className="mt-2 bg-white rounded border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Field
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          From Document
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Candidate Record
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mismatchFields.map((field) => (
                        <tr key={field} className="bg-red-50">
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">
                            {FIELD_LABELS[field] || field}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {extractedIdentity[field] || <span className="text-gray-400 italic">Not found</span>}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {candidateData[field] || <span className="text-gray-400 italic">Not set</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Action Recommendations */}
          <div className={`mt-3 text-sm ${style.text}`}>
            <p className="font-medium">Recommended Actions:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              {config.severity === 'error' && (
                <>
                  <li>Verify this document belongs to the correct candidate</li>
                  <li>Check if the document was uploaded to the wrong profile</li>
                  <li>Contact the candidate to confirm identity details</li>
                </>
              )}
              {config.severity === 'warning' && (
                <>
                  <li>Review the extracted information for accuracy</li>
                  <li>Update candidate profile if document information is correct</li>
                  <li>Re-upload a clearer document if extraction failed</li>
                </>
              )}
              {config.severity === 'info' && (
                <>
                  <li>Ensure the document contains identity information</li>
                  <li>Upload a passport or ID document for verification</li>
                  <li>Document may require manual review</li>
                </>
              )}
            </ul>
          </div>

          {/* View Verification Logs Link */}
          {verificationLogs.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => {
                  // Open verification logs in a modal or navigate to logs page
                  console.log('View logs:', verificationLogs);
                }}
                className={`text-sm font-medium ${style.text} hover:underline flex items-center`}
              >
                View verification logs
                <ExternalLink className="ml-1 h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
