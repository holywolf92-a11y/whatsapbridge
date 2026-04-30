import React, { useState, useCallback } from 'react';
import { Upload, File, CheckCircle, AlertCircle, Clock, XCircle, FileText, Shield, Award, Briefcase, Heart, Image as ImageIcon, FileQuestion, GraduationCap } from 'lucide-react';
import { apiClient } from '../lib/apiClient';

interface DocumentUploadVerificationProps {
  candidateId: string;
  onUploadComplete?: (document: any) => void;
}

const DOCUMENT_CATEGORIES = {
  cv_resume: { label: 'CV / Resume', icon: FileText, color: 'blue', description: 'Curriculum vitae or resume' },
  passport: { label: 'Passport', icon: Shield, color: 'purple', description: 'Passport copy or scan' },
  cnic: { label: 'CNIC (National ID)', icon: Shield, color: 'indigo', description: 'Pakistani National ID Card' },
  driving_license: { label: 'Driving License', icon: Shield, color: 'cyan', description: 'Driver\'s license' },
  police_character_certificate: { label: 'Police Certificate', icon: Shield, color: 'teal', description: 'Police clearance, character certificate' },
  educational_documents: { label: 'Educational Documents', icon: GraduationCap, color: 'blue', description: 'Degrees, diplomas, transcripts, marksheets' },
  experience_certificates: { label: 'Experience Certificates', icon: Briefcase, color: 'emerald', description: 'Employment certificates, experience letters' },
  navttc_reports: { label: 'NAVTTC Reports', icon: Award, color: 'amber', description: 'NAVTTC vocational training certificates' },
  certificates: { label: 'Professional Certificates', icon: Award, color: 'green', description: 'Skill certifications, professional licenses' },
  contracts: { label: 'Contracts', icon: Briefcase, color: 'orange', description: 'Employment contracts, agreements' },
  medical_reports: { label: 'Medical Reports', icon: Heart, color: 'red', description: 'Medical test reports, health certificates' },
  photos: { label: 'Photos', icon: ImageIcon, color: 'pink', description: 'Passport photos, ID photos' },
  other_documents: { label: 'Other Documents', icon: FileQuestion, color: 'gray', description: 'Miscellaneous documents' },
};

const VERIFICATION_STATUS = {
  pending_ai: { label: 'Processing...', icon: Clock, color: 'yellow', description: 'AI is analyzing the document' },
  verified: { label: 'Verified', icon: CheckCircle, color: 'green', description: 'Identity confirmed' },
  needs_review: { label: 'Needs Review', icon: AlertCircle, color: 'orange', description: 'Manual review required' },
  rejected_mismatch: { label: 'Rejected', icon: XCircle, color: 'red', description: 'Identity mismatch detected' },
  failed: { label: 'Failed', icon: XCircle, color: 'red', description: 'AI processing failed' },
};

export default function DocumentUploadVerification({ candidateId, onUploadComplete }: DocumentUploadVerificationProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ file: File; progress: number; status: string; documentId?: string }[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [candidateId]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }, [candidateId]);

  const handleFiles = async (files: File[]) => {
    setError(null);

    // Validate file types and size
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'text/plain'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        setError(`File ${file.name} has unsupported type. Allowed: PDF, DOC, DOCX, JPG, PNG, TXT`);
        return false;
      }
      if (file.size > maxSize) {
        setError(`File ${file.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Add files to uploading state
    const newUploadingFiles = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading',
    }));
    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Upload files one by one
    for (const uploadingFile of newUploadingFiles) {
      try {
        const formData = new FormData();
        formData.append('file', uploadingFile.file);
        formData.append('candidate_id', candidateId);
        formData.append('source', 'Manual Upload');

        // Simulate progress
        setUploadingFiles(prev =>
          prev.map(uf =>
            uf.file === uploadingFile.file
              ? { ...uf, progress: 30 }
              : uf
          )
        );

        const response = await apiClient.uploadCandidateDocument(uploadingFile.file, candidateId, 'Manual Upload');

        setUploadingFiles(prev =>
          prev.map(uf =>
            uf.file === uploadingFile.file
              ? { ...uf, progress: 100, status: 'completed', documentId: response.document.id }
              : uf
          )
        );

        // Add to uploaded documents
        setUploadedDocuments(prev => [...prev, response.document]);

        // Call callback to notify parent component
        if (onUploadComplete) {
          onUploadComplete(response.document);
        }

        // Start polling for verification status
        pollVerificationStatus(response.document.id);

      } catch (err: any) {
        console.error('Upload error:', err);
        setUploadingFiles(prev =>
          prev.map(uf =>
            uf.file === uploadingFile.file
              ? { ...uf, status: 'error' }
              : uf
          )
        );
        setError(err.response?.data?.error || 'Upload failed');
      }
    }

    // Remove completed uploads after 3 seconds
    setTimeout(() => {
      setUploadingFiles(prev => prev.filter(uf => uf.status !== 'completed'));
    }, 3000);
  };

  const pollVerificationStatus = async (documentId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // Poll for up to 30 seconds

    const poll = async () => {
      if (attempts >= maxAttempts) {
        console.log('Stopped polling for document', documentId);
        return;
      }

      try {
        const response = await apiClient.getCandidateDocument(documentId);
        const document = response.document;

        // Update uploaded documents
        setUploadedDocuments(prev =>
          prev.map(doc => doc.id === documentId ? document : doc)
        );

        // Continue polling if still pending
        if (document.verification_status === 'pending_ai') {
          attempts++;
          setTimeout(poll, 2000); // Poll every 2 seconds
        }
      } catch (err) {
        console.error('Error polling verification status:', err);
      }
    };

    // Start polling after 2 seconds
    setTimeout(poll, 2000);
  };

  const getStatusColor = (status: string) => {
    const statusConfig = VERIFICATION_STATUS[status as keyof typeof VERIFICATION_STATUS];
    return statusConfig?.color || 'gray';
  };

  const getStatusIcon = (status: string) => {
    const statusConfig = VERIFICATION_STATUS[status as keyof typeof VERIFICATION_STATUS];
    return statusConfig?.icon || Clock;
  };

  const getCategoryIcon = (category: string) => {
    const categoryConfig = DOCUMENT_CATEGORIES[category as keyof typeof DOCUMENT_CATEGORIES];
    return categoryConfig?.icon || FileQuestion;
  };

  const getCategoryLabel = (category: string) => {
    const categoryConfig = DOCUMENT_CATEGORIES[category as keyof typeof DOCUMENT_CATEGORIES];
    return categoryConfig?.label || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <Upload className={`mx-auto h-12 w-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
        <p className="mt-2 text-sm font-medium text-gray-900">
          Drop documents here or click to browse
        </p>
        <p className="mt-1 text-xs text-gray-500">
          PDF, DOC, DOCX, JPG, PNG, TXT up to 10MB
        </p>
        <p className="mt-1 text-xs text-gray-400">
          AI will automatically categorize and verify identity
        </p>
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
        >
          Select Files
        </label>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <p className="ml-3 text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">Uploading...</h3>
          {uploadingFiles.map((upload, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <File className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{upload.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {upload.status === 'uploading' && (
                    <p className="text-sm text-blue-600">{upload.progress}%</p>
                  )}
                  {upload.status === 'completed' && (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  )}
                  {upload.status === 'error' && (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                </div>
              </div>
              {upload.status === 'uploading' && (
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Documents */}
      {uploadedDocuments.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">Recent Uploads</h3>
          {uploadedDocuments.map((doc) => {
            const StatusIcon = getStatusIcon(doc.verification_status);
            const CategoryIcon = getCategoryIcon(doc.category || doc.detected_category);
            const statusColor = getStatusColor(doc.verification_status);

            return (
              <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <CategoryIcon className="h-8 w-8 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{doc.file_name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {getCategoryLabel(doc.category || doc.detected_category || 'other_documents')}
                        {doc.confidence && ` (${(doc.confidence * 100).toFixed(0)}% confidence)`}
                      </p>
                      <div className="flex items-center mt-2 space-x-2">
                        <StatusIcon className={`h-4 w-4 text-${statusColor}-500`} />
                        <span className={`text-xs font-medium text-${statusColor}-700`}>
                          {VERIFICATION_STATUS[doc.verification_status as keyof typeof VERIFICATION_STATUS]?.label || doc.verification_status}
                        </span>
                      </div>
                      {doc.verification_reason_code && doc.verification_status !== 'verified' && (
                        <p className="text-xs text-gray-500 mt-1">
                          Reason: {doc.verification_reason_code.replace(/_/g, ' ')}
                        </p>
                      )}
                      {doc.mismatch_fields && doc.mismatch_fields.length > 0 && (
                        <div className="mt-2 flex items-center space-x-1">
                          <AlertCircle className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-red-600">
                            Mismatch: {doc.mismatch_fields.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {new Date(doc.uploaded_at).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
