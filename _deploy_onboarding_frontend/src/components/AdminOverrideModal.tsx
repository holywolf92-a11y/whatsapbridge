import React, { useState } from 'react';
import { X, Shield, AlertTriangle, Lock, FileText, CheckCircle, Loader } from 'lucide-react';

interface AdminOverrideModalProps {
  documentId: string;
  documentName: string;
  documentCategory: 'CV' | 'Passport' | 'Certificate' | 'Contract' | 'Medical' | 'Photo' | 'Other' | string;
  rejectionCode?: string;
  rejectionReason?: string;
  isOverridable: boolean; // Whether this rejection can be overridden
  requiredRole?: 'admin' | 'super_admin'; // Required role for override
  onClose: () => void;
  onConfirm: (password: string, justification: string) => Promise<void>; // Callback with admin password and justification
  loading?: boolean;
}

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

export function AdminOverrideModal({
  documentId,
  documentName,
  documentCategory,
  rejectionCode,
  rejectionReason,
  isOverridable,
  requiredRole = 'admin',
  onClose,
  onConfirm,
  loading = false,
}: AdminOverrideModalProps) {
  const [password, setPassword] = useState('');
  const [justification, setJustification] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const categoryDisplayName = getCategoryDisplayName(documentCategory);
  const requiresSuperAdmin = requiredRole === 'super_admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!password.trim()) {
      setError('Admin password is required');
      return;
    }

    if (!justification.trim()) {
      setError('Justification reason is required');
      return;
    }

    if (justification.trim().length < 10) {
      setError('Justification must be at least 10 characters');
      return;
    }

    try {
      await onConfirm(password, justification.trim());
      // Modal will be closed by parent component on success
    } catch (err: any) {
      setError(err?.message || 'Failed to override document verification. Please try again.');
    }
  };

  // If not overridable, show warning
  if (!isOverridable) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-red-50">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Override Not Allowed
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">{categoryDisplayName}</p>
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
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">This Document Cannot Be Overridden</h3>
                  <p className="text-sm text-gray-700">
                    The rejection reason <span className="font-mono text-red-700">{rejectionCode || 'Unknown'}</span> indicates a serious security or integrity issue that cannot be overridden.
                  </p>
                </div>
              </div>
            </div>

            {rejectionReason && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Rejection Reason</h3>
                <p className="text-sm text-gray-700">{rejectionReason}</p>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-yellow-600" />
                Security Policy
              </h3>
              <p className="text-sm text-gray-700">
                Documents with security-related rejection codes (such as tampering or photo mismatch) cannot be overridden to maintain system integrity and compliance.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-yellow-50">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Admin Override Required
                </h2>
                <p className="text-sm text-gray-600 mt-1">{categoryDisplayName}: {documentName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form id="admin-override-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Override Warning</h3>
                <p className="text-sm text-gray-700">
                  You are about to override the AI verification rejection for this {categoryDisplayName.toLowerCase()}. 
                  This action will mark the document as verified and will be logged for audit purposes.
                  {requiresSuperAdmin && (
                    <span className="block mt-2 font-medium text-red-700">
                      This rejection requires Super Admin privileges to override.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Rejection Details */}
          {rejectionReason && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-600" />
                Rejection Reason
              </h3>
              <p className="text-sm text-gray-700">{rejectionReason}</p>
              {rejectionCode && (
                <p className="text-xs text-gray-500 mt-2 font-mono">Code: {rejectionCode}</p>
              )}
            </div>
          )}

          {/* Admin Password */}
          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Admin Password
                <span className="text-red-500">*</span>
              </div>
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter your admin password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Your password will be verified before the override is processed.
            </p>
          </div>

          {/* Justification */}
          <div>
            <label htmlFor="justification" className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Justification Reason
                <span className="text-red-500">*</span>
              </div>
            </label>
            <textarea
              id="justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              disabled={loading}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
              placeholder="Explain why this document should be verified despite the rejection (minimum 10 characters)..."
              required
              minLength={10}
            />
            <p className="text-xs text-gray-500 mt-1">
              {justification.length}/10+ characters. This reason will be logged for audit purposes.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              Audit Trail
            </h4>
            <p className="text-sm text-gray-700">
              This override will be permanently logged with your admin credentials, timestamp, and justification reason for compliance and audit purposes.
            </p>
          </div>
        </form>

        {/* Footer Actions - Always visible at bottom */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 font-medium"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="admin-override-form"
            onClick={handleSubmit}
            disabled={loading || !password.trim() || !justification.trim() || justification.trim().length < 10}
            className={`px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2 font-medium ${
              loading || !password.trim() || !justification.trim() || justification.trim().length < 10
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
                : 'bg-yellow-600 text-white hover:bg-yellow-700 shadow-md hover:shadow-lg'
            }`}
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Confirm Override
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
