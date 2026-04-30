import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Eye, Download, FileText, User, Calendar, Shield } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import VerificationStatusBadge from './VerificationStatusBadge';
import IdentityMismatchAlert from './IdentityMismatchAlert';
import VerificationLogsViewer from './VerificationLogsViewer';

interface DocumentReviewInterfaceProps {
  candidateId?: string;
  showOnlyPendingReview?: boolean;
}

interface Document {
  id: string;
  candidate_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  category: string;
  detected_category: string;
  confidence: number;
  verification_status: 'pending_ai' | 'verified' | 'needs_review' | 'rejected_mismatch' | 'failed';
  verification_reason_code: string;
  extracted_identity_json: any;
  mismatch_fields: string[];
  uploaded_at: string;
  storage_path: string;
}

export default function DocumentReviewInterface({
  candidateId,
  showOnlyPendingReview = true,
}: DocumentReviewInterfaceProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showLogsModal, setShowLogsModal] = useState(false);

  useEffect(() => {
    fetchDocumentsForReview();
  }, [candidateId, showOnlyPendingReview]);

  const fetchDocumentsForReview = async () => {
    try {
      setLoading(true);
      
      // Fetch all candidates if no specific candidate ID
      if (!candidateId) {
        // TODO: Implement API endpoint to fetch all documents needing review across all candidates
        // For now, we'll fetch for a specific candidate
        return;
      }

      const allDocs = await apiClient.listCandidateDocumentsNew(candidateId);
      
      // Filter for documents needing review
      const filtered = showOnlyPendingReview
        ? allDocs.filter((doc: Document) => 
            doc.verification_status === 'needs_review' || 
            doc.verification_status === 'rejected_mismatch' ||
            doc.verification_status === 'failed'
          )
        : allDocs;

      setDocuments(filtered);
    } catch (err) {
      console.error('Error fetching documents for review:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (documentId: string) => {
    try {
      // Update document status to verified
      await apiClient.updateCandidateDocument(documentId, {
        verification_status: 'verified',
        verification_reason_code: 'MANUAL_REVIEW_APPROVED',
      });

      // Log manual review completion (if endpoint exists)
      // Note: Verification logs are typically created automatically by the backend

      // Refresh documents
      fetchDocumentsForReview();
      setSelectedDocument(null);
      setReviewNotes('');
      setNewCategory('');
    } catch (err) {
      console.error('Error approving document:', err);
    }
  };

  const handleReject = async (documentId: string) => {
    try {
      // Update document status to rejected
      await apiClient.updateCandidateDocument(documentId, {
        verification_status: 'rejected_mismatch',
        verification_reason_code: 'MANUAL_REVIEW_REJECTED',
      });

      // Log manual review completion (if endpoint exists)
      // Note: Verification logs are typically created automatically by the backend

      // Refresh documents
      fetchDocumentsForReview();
      setSelectedDocument(null);
      setReviewNotes('');
    } catch (err) {
      console.error('Error rejecting document:', err);
    }
  };

  const handleDownload = async (documentId: string) => {
    try {
      const response = await apiClient.getCandidateDocumentDownload(documentId);
      const downloadUrl = response.download_url;
      
      // Open in new tab
      window.open(downloadUrl, '_blank');
    } catch (err) {
      console.error('Error downloading document:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading documents for review...</span>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center p-8">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">All caught up!</h3>
        <p className="mt-1 text-sm text-gray-500">No documents require manual review</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Review</h2>
          <p className="mt-1 text-sm text-gray-500">
            {documents.length} document{documents.length !== 1 ? 's' : ''} requiring manual review
          </p>
        </div>
      </div>

      {/* Documents List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Documents Queue */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Review Queue</h3>
          
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setSelectedDocument(doc)}
              className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${
                selectedDocument?.id === doc.id
                  ? 'border-blue-500 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">{doc.file_name}</p>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <VerificationStatusBadge
                      status={doc.verification_status}
                      reasonCode={doc.verification_reason_code}
                      mismatchFields={doc.mismatch_fields}
                      confidence={doc.confidence}
                      size="sm"
                    />
                    
                    <p className="text-xs text-gray-500">
                      Uploaded: {new Date(doc.uploaded_at).toLocaleString()}
                    </p>
                    
                    {doc.detected_category && (
                      <p className="text-xs text-gray-600">
                        AI detected: {doc.detected_category} ({(doc.confidence * 100).toFixed(0)}%)
                      </p>
                    )}
                  </div>
                </div>

                {selectedDocument?.id === doc.id && (
                  <div className="ml-2">
                    <div className="bg-blue-100 rounded-full p-1">
                      <Eye className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Review Panel */}
        {selectedDocument && (
          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Review Details</h3>
                <button
                  onClick={() => handleDownload(selectedDocument.id)}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
              </div>

              {/* Document Info */}
              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-500">File Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedDocument.file_name}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500">Verification Status</label>
                  <div className="mt-1">
                    <VerificationStatusBadge
                      status={selectedDocument.verification_status}
                      reasonCode={selectedDocument.verification_reason_code}
                      mismatchFields={selectedDocument.mismatch_fields}
                      confidence={selectedDocument.confidence}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500">AI Category Detection</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedDocument.detected_category || 'Unknown'} 
                    {selectedDocument.confidence && ` (${(selectedDocument.confidence * 100).toFixed(0)}% confidence)`}
                  </p>
                </div>

                {selectedDocument.extracted_identity_json && Object.keys(selectedDocument.extracted_identity_json).length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Extracted Identity</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded border border-gray-200">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {JSON.stringify(selectedDocument.extracted_identity_json, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Identity Mismatch Alert */}
              {(selectedDocument.verification_status === 'rejected_mismatch' || 
                selectedDocument.mismatch_fields?.length > 0) && (
                <div className="mb-6">
                  <IdentityMismatchAlert
                    documentId={selectedDocument.id}
                    mismatchFields={selectedDocument.mismatch_fields}
                    reasonCode={selectedDocument.verification_reason_code}
                    extractedIdentity={selectedDocument.extracted_identity_json}
                    candidateId={selectedDocument.candidate_id}
                  />
                </div>
              )}

              {/* Review Actions */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correct Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Use AI detected category</option>
                    <option value="cv_resume">CV / Resume</option>
                    <option value="passport">Passport</option>
                    <option value="certificates">Certificates</option>
                    <option value="contracts">Contracts</option>
                    <option value="medical_reports">Medical Reports</option>
                    <option value="photos">Photos</option>
                    <option value="other_documents">Other Documents</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Notes
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add notes about your review decision..."
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleApprove(selectedDocument.id)}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedDocument.id)}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </button>
                </div>
              </div>

              {/* View Logs */}
              <div className="mt-4">
                <button
                  onClick={() => setShowLogsModal(true)}
                  className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View verification logs
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Logs Modal */}
      {showLogsModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Verification Logs</h3>
                <button
                  onClick={() => setShowLogsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <VerificationLogsViewer
                documentId={selectedDocument.id}
                autoRefresh={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
