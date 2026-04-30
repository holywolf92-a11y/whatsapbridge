import { useState, useEffect } from 'react';
import { X, Edit2, Save, Phone, Mail, MapPin, Briefcase, Calendar, FileText, Globe, CheckCircle, XCircle, Star, Video, MessageSquare, Upload, Download, Eye, Trash2, File, Image as ImageIcon, AlertCircle, Loader, Shield, Check, Link2, RefreshCw } from 'lucide-react';
import { Candidate } from '../lib/apiClient';
import { ExtractionReviewModal } from './ExtractionReviewModal';
import { MissingDataTab } from './MissingDataTab';
import { apiClient } from '../lib/apiClient';
import { renderPdfFirstPageToDataUrl } from '../lib/pdfThumb';

interface CandidateDetailsModalProps {
  candidate: Candidate;
  onClose: () => void;
  initialTab?: 'details' | 'documents' | 'missing-data';
  onDocumentChange?: () => void;
}

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  category: 'CV' | 'Passport' | 'Educational' | 'Experience' | 'NAVTTC' | 'Police' | 'Certificate' | 'Contract' | 'Medical' | 'Photo' | 'Other';
  uploadedBy: string;
  uploadedDate: string;
  fileSize: string;
  status: 'verified' | 'pending' | 'expired';
  expiryDate?: string;

  // Backing fields from API (optional, used in some UI conditions)
  verification_status?: string;
  mime_type?: string;
  rejection?: any;
}

// Mock documents for this candidate
const getMockDocuments = (candidateId: string): Document[] => {
  const allDocs: Record<string, Document[]> = {
    '1': [
      {
        id: 'doc-001',
        fileName: 'Ahmed_Hassan_CV.pdf',
        fileType: 'PDF',
        category: 'CV',
        uploadedBy: 'System (Auto)',
        uploadedDate: '2024-12-13',
        fileSize: '245 KB',
        status: 'verified'
      },
      {
        id: 'doc-002',
        fileName: 'Ahmed_Hassan_Passport.pdf',
        fileType: 'PDF',
        category: 'Passport',
        uploadedBy: 'Admin',
        uploadedDate: '2024-12-10',
        fileSize: '1.2 MB',
        status: 'verified',
        expiryDate: '2028-05-15'
      },
      {
        id: 'doc-004',
        fileName: 'Electrical_Certificate.pdf',
        fileType: 'PDF',
        category: 'Certificate',
        uploadedBy: 'Admin',
        uploadedDate: '2024-12-08',
        fileSize: '890 KB',
        status: 'verified',
        expiryDate: '2026-12-31'
      }
    ],
    'AUTO-001': [
      {
        id: 'doc-003',
        fileName: 'Maria_Garcia_CV.pdf',
        fileType: 'PDF',
        category: 'CV',
        uploadedBy: 'System (WhatsApp)',
        uploadedDate: '2024-12-13',
        fileSize: '180 KB',
        status: 'verified'
      }
    ],
    '2': [
      {
        id: 'doc-005',
        fileName: 'Mohammed_Ali_Medical.pdf',
        fileType: 'PDF',
        category: 'Medical',
        uploadedBy: 'Admin',
        uploadedDate: '2024-11-20',
        fileSize: '650 KB',
        status: 'expired',
        expiryDate: '2024-11-30'
      }
    ],
    'AUTO-002': [
      {
        id: 'doc-006',
        fileName: 'John_Smith_CV.docx',
        fileType: 'DOCX',
        category: 'CV',
        uploadedBy: 'System (Email)',
        uploadedDate: '2024-12-13',
        fileSize: '312 KB',
        status: 'pending'
      }
    ],
    '3': [
      {
        id: 'doc-007',
        fileName: 'Rajesh_Photo.jpg',
        fileType: 'JPG',
        category: 'Photo',
        uploadedBy: 'Admin',
        uploadedDate: '2024-12-13',
        fileSize: '450 KB',
        status: 'verified'
      }
    ]
  };
  return allDocs[candidateId] || [];
};

// Helper to safely parse JSON array from backend
function safeJsonArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string') as string[];
  if (typeof value === 'string') {
    // Try parsing as JSON array first
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed.filter((v) => typeof v === 'string') as string[]) : [];
    } catch {
      // If not JSON, treat as comma-separated string
      return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
  }
  return [];
}

function splitByDelimiters(value: string): string[] {
  return value
    .split(/\s*\|\s*|\s*;\s*|\n+/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function formatSimpleList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v)).filter((v) => v.length > 0);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return formatSimpleList(parsed);
    } catch {
      return splitByDelimiters(value);
    }
  }
  return [];
}

function formatEducationList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === 'string')) {
      return (value as string[]).map((v) => v.trim()).filter((v) => v.length > 0);
    }
    return value
      .map((entry: any) => {
        if (!entry || typeof entry !== 'object') return '';
        const parts = [
          entry.degree,
          entry.institution,
          entry.location,
          entry.graduation_date,
          entry.cgpa ? `CGPA: ${entry.cgpa}` : undefined,
        ].filter(Boolean);
        return parts.join(' - ');
      })
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return formatEducationList(parsed);
    } catch {
      return splitByDelimiters(value);
    }
  }
  return [];
}

export function CandidateDetailsModal({ candidate, onClose, initialTab = 'details' }: CandidateDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCandidate, setEditedCandidate] = useState(candidate);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'missing-data'>(initialTab);
  const [extractionInProgress, setExtractionInProgress] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showExtractionModal, setShowExtractionModal] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // Safety: Reset uploading state if it's been stuck for too long
  useEffect(() => {
    if (uploading) {
      const timeout = setTimeout(() => {
        console.warn('[Upload] Safety timeout: Uploading state stuck, resetting');
        setUploading(false);
        setExtractionError('Upload timed out. Please try again.');
      }, 180000); // 3 minutes (should be less than the 5-minute safety timeout in handleUploadDocument)
      
      return () => clearTimeout(timeout);
    }
  }, [uploading]);
  const [showEmployerCV, setShowEmployerCV] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const resolvedProfilePhotoUrl = (((editedCandidate as any).profile_photo_signed_url || editedCandidate.profile_photo_url || '').toString());
  const isPdfProfilePhoto = !!resolvedProfilePhotoUrl && resolvedProfilePhotoUrl.toLowerCase().includes('.pdf');
  const [profilePdfThumb, setProfilePdfThumb] = useState<string | null>(null);
  const [profilePdfThumbStatus, setProfilePdfThumbStatus] = useState<'idle' | 'pending' | 'failed'>('idle');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!isPdfProfilePhoto) {
        setProfilePdfThumb(null);
        setProfilePdfThumbStatus('idle');
        return;
      }
      if (!resolvedProfilePhotoUrl) return;

      try {
        setProfilePdfThumbStatus('pending');
        const thumb = await renderPdfFirstPageToDataUrl(resolvedProfilePhotoUrl, { maxPagesToScan: 10 });
        if (!cancelled) {
          setProfilePdfThumb(thumb);
          setProfilePdfThumbStatus('idle');
        }
      } catch (e) {
        console.warn('[PDF Thumb] Failed to render profile PDF thumbnail', { url: resolvedProfilePhotoUrl, error: e });
        if (!cancelled) {
          setProfilePdfThumb(null);
          setProfilePdfThumbStatus('failed');
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [resolvedProfilePhotoUrl, isPdfProfilePhoto]);

  // Fetch real documents from API
  const fetchDocuments = async () => {
    try {
      setDocumentsLoading(true);
      const apiDocs = await apiClient.listCandidateDocumentsNew(candidate.id);
      
      // Map API documents to display format
      const mappedDocs: Document[] = apiDocs.map((doc: any) => {
        // Map category from API format (cv_resume) to display format (CV)
        let category: Document['category'] = 'Other';
        if (doc.category === 'cv_resume') category = 'CV';
        else if (doc.category === 'passport') category = 'Passport';
        else if (doc.category === 'educational_documents') category = 'Educational';
        else if (doc.category === 'experience_certificates') category = 'Experience';
        else if (doc.category === 'navttc_reports') category = 'NAVTTC';
        else if (doc.category === 'police_character_certificate') category = 'Police';
        else if (doc.category === 'certificates') category = 'Certificate';
        else if (doc.category === 'contracts') category = 'Contract';
        else if (doc.category === 'medical_reports') category = 'Medical';
        else if (doc.category === 'photos') category = 'Photo';
        
        // Map verification status
        let status: Document['status'] = 'pending';
        if (doc.verification_status === 'verified') status = 'verified';
        else if (doc.verification_status === 'needs_review' || doc.verification_status === 'pending_ai') status = 'pending';
        else if (doc.verification_status === 'rejected_mismatch' || doc.verification_status === 'failed') status = 'expired';
        
        return {
          id: doc.id,
          fileName: doc.file_name || 'Unknown',
          fileType: doc.mime_type?.split('/')[1]?.toUpperCase() || 'PDF',
          category,
          uploadedBy: doc.uploaded_by_user_id || 'System',
          uploadedDate: doc.created_at ? new Date(doc.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          fileSize: doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : '0 KB',
          status,
          expiryDate: doc.expiry_date,
        };
      });
      
      setDocuments(mappedDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      // Fallback to mock documents on error
      setDocuments(getMockDocuments(candidate.id));
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Fetch documents when modal opens or candidate changes
  useEffect(() => {
    if (activeTab === 'documents') {
      fetchDocuments();
    }
  }, [candidate.id, activeTab]);

  const handleShowEmployerCV = () => {
    setShowEmployerCV(true);
  };

  const handleCopyShareLink = async () => {
    const shareLink = `${window.location.origin}/safe-cv/${candidate.id}`;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically update the candidate data in your backend
    // For this example, we'll just update the local state
    setEditedCandidate(editedCandidate);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedCandidate({
      ...editedCandidate,
      [name]: value,
    });
  };

  const handleUploadDocument = () => {
    console.log('[Upload] Button clicked - opening file picker'); // Debug log
    
    // Reset any previous error state
    setExtractionError(null);
    
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
      input.multiple = true;
      
      // Handle file picker cancellation
      input.oncancel = () => {
        console.log('[Upload] File picker cancelled by user');
        setUploading(false);
      };
      
      input.onchange = async (e) => {
        console.log('[Upload] File selected:', (e.target as HTMLInputElement).files?.length || 0, 'files'); // Debug log
        const files = (e.target as HTMLInputElement).files;
        
        // If no files selected, reset state and return
        if (!files || files.length === 0) {
          console.log('[Upload] No files selected - resetting state');
          setUploading(false);
          return;
        }
        
        if (files) {
        setExtractionError(null);
        setUploading(true); // Show loading during upload
        
        // Safety timeout: Always reset uploading state after 5 minutes max
        let safetyTimeout: NodeJS.Timeout | null = setTimeout(() => {
          console.warn('Upload safety timeout: Resetting uploading state');
          setUploading(false);
        }, 300000); // 5 minutes
        
        try {
          // Upload all files using the new API
          const uploadedDocumentIds: string[] = [];
          const uploadPromises: Promise<any>[] = [];
          
          // Create upload promises for all files
          for (const file of Array.from(files)) {
            const uploadPromise = (async () => {
              try {
                // Upload with timeout handled by apiClient (120+ seconds based on file size)
                const response = await apiClient.uploadCandidateDocument(file, candidate.id, 'web');
                if (response.document?.id) {
                  uploadedDocumentIds.push(response.document.id);
                }
                return { success: true, file: file.name };
              } catch (error) {
                console.error('Error uploading document:', error);
                const errorMessage = error instanceof Error 
                  ? error.message 
                  : 'Unknown error occurred';
                
                // Check for common error types
                let userFriendlyMessage = `Failed to upload ${file.name}`;
                if (errorMessage.includes('timeout') || errorMessage.includes('aborted') || errorMessage.includes('Upload timeout')) {
                  userFriendlyMessage = `${file.name}: Upload timeout. Please check your connection and try again.`;
                } else if (errorMessage.includes('File exceeds') || errorMessage.includes('size limit')) {
                  userFriendlyMessage = `${file.name}: File is too large (max 10MB)`;
                } else if (errorMessage.includes('Unsupported file type') || errorMessage.includes('file type')) {
                  userFriendlyMessage = `${file.name}: Unsupported file type. Allowed: PDF, DOC, DOCX, JPG, PNG`;
                } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                  userFriendlyMessage = `${file.name}: Network error. Please check your connection and try again.`;
                } else if (errorMessage.includes('Candidate not found')) {
                  userFriendlyMessage = `${file.name}: Candidate not found. Please refresh the page.`;
                } else if (errorMessage) {
                  userFriendlyMessage = `${file.name}: ${errorMessage}`;
                }
                
                setExtractionError(userFriendlyMessage);
                return { success: false, file: file.name, error: userFriendlyMessage };
              }
            })();
            
            uploadPromises.push(uploadPromise);
          }
          
          // Wait for all uploads to complete (or fail)
          await Promise.allSettled(uploadPromises);
          
          // Upload is complete - reset uploading state immediately
          setUploading(false);
          
          // Automatically refresh documents after upload (with error handling)
          try {
            await fetchDocuments();
          } catch (fetchError) {
            console.error('Error fetching documents after upload:', fetchError);
            // Don't show error to user, just log it
          }
          
          // Wait for AI categorization to complete, then check if any uploaded document is a CV
          // Only trigger extraction if the document is actually categorized as a CV
          if (uploadedDocumentIds.length > 0) {
            // Poll for categorization completion (max 30 seconds)
            const maxAttempts = 15; // 15 attempts * 2 seconds = 30 seconds max
            let attempts = 0;
            let cvFound = false;
            
            while (attempts < maxAttempts && !cvFound) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
              
              try {
                const uploadedDocs = await apiClient.listCandidateDocumentsNew(candidate.id);
                
                // Check if any of the uploaded documents is now categorized as CV
                const latestCV = uploadedDocs
                  .filter((doc: any) => 
                    uploadedDocumentIds.includes(doc.id) && 
                    doc.category === 'cv_resume' &&
                    doc.verification_status !== 'pending_ai' // Wait for categorization to complete
                  )
                  .sort((a: any, b: any) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  )[0];
                
                if (latestCV?.storage_path) {
                  cvFound = true;
                  
                  // Now trigger extraction - this is a CV
                  setExtractionInProgress(true);
                  
                  try {
                    // Add timeout to extraction call (30 seconds)
                    const extractionPromise = apiClient.extractCandidateData(
                      candidate.id, 
                      latestCV.storage_path
                    );
                    
                    const timeoutPromise = new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('Extraction timeout: The process took too long. Please try again.')), 30000)
                    );
                    
                    const result = await Promise.race([extractionPromise, timeoutPromise]) as any;
                    
                    if (result && result.success) {
                      setExtractedData(result.data);
                      setShowExtractionModal(true);
                      setExtractionInProgress(false); // Reset immediately on success
                    } else {
                      setExtractionError(result?.error || 'Failed to extract CV data');
                      setExtractionInProgress(false); // Reset on failure
                    }
                  } catch (error) {
                    console.error('Extraction error:', error);
                    setExtractionError(
                      error instanceof Error 
                        ? error.message 
                        : 'CV extraction failed. The document may still be processing. Please refresh the page.'
                    );
                    setExtractionInProgress(false); // Always reset on error
                  }
                  break; // Exit the polling loop
                }
              } catch (error) {
                console.error('Error checking document status:', error);
                // Continue polling
              }
              
              attempts++;
            }
            
            // Refresh documents after categorization completes (whether CV found or not)
            // This ensures the UI shows the updated category and status
            await fetchDocuments();
            
            // If we didn't find a CV after polling, it means the uploaded documents are not CVs
            // This is normal for passports, certificates, etc. - no extraction needed
            if (!cvFound) {
              // Documents uploaded successfully, but they're not CVs
              // No extraction needed - this is expected behavior
              console.log('Uploaded documents are not CVs - no extraction needed');
              
              // Refresh documents to show updated status/category after categorization
              await fetchDocuments();
            }
          } else {
            // No documents uploaded, but refresh anyway to ensure UI is up to date
            await fetchDocuments();
          }
        } catch (error) {
          console.error('Upload error:', error);
          setExtractionError(
            error instanceof Error ? error.message : 'An error occurred during upload'
          );
        } finally {
          // Always reset uploading state, even if there's an error
          if (safetyTimeout) {
            clearTimeout(safetyTimeout);
            safetyTimeout = null;
          }
          setUploading(false);
        }
      }
    };
    
    // Add error handler for file input
    input.onerror = (error) => {
      console.error('[Upload] File input error:', error);
      setExtractionError('Failed to open file picker. Please try again.');
      setUploading(false);
    };
    
    // Trigger file picker - must be called synchronously from user interaction
    console.log('[Upload] Triggering file picker...'); // Debug log
    try {
      input.click();
      console.log('[Upload] File picker triggered successfully'); // Debug log
    } catch (error) {
      console.error('[Upload] Error triggering file picker:', error);
      setExtractionError('Failed to open file picker. Please check your browser settings.');
    }
    } catch (error) {
      console.error('[Upload] Error in handleUploadDocument:', error);
      setExtractionError('Failed to open file picker. Please try again.');
      setUploading(false);
    }
  };

  // Handle document upload completion callback
  const handleDocumentUploadComplete = async (document: any) => {
    // Automatically refresh documents when upload completes
    await fetchDocuments();
  };

  // Handle document view
  const handleViewDocument = async (doc: Document) => {
    const newWindow = window.open('', '_blank');

    try {
      const response = await apiClient.getCandidateDocumentDownload(doc.id);

      if (newWindow) {
        newWindow.location.href = response.download_url;
      } else {
        // Fallback if popup was blocked
        window.open(response.download_url, '_blank');
      }
    } catch (error: any) {
      console.error('Error viewing document:', error);

      if (newWindow) {
        newWindow.close();
      }

      alert(error?.message || 'Failed to view document');
    }
  };

  // Handle document download
  const handleDownloadDocument = async (doc: Document) => {
    try {
      const response = await apiClient.getCandidateDocumentDownload(doc.id);
      const link = document.createElement('a');
      link.href = response.download_url;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error('Error downloading document:', error);
      alert(error?.message || 'Failed to download document');
    }
  };

  // Handle document delete
  const handleDeleteDocument = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete "${doc.fileName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.deleteCandidateDocument(doc.id);
      // Refresh documents after deletion
      await fetchDocuments();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      alert(error?.message || 'Failed to delete document');
    }
  };

  // Handle document reprocess (for stuck "Pending" documents)
  const handleReprocessDocument = async (doc: Document) => {
    // Check retry limits before reprocessing
    if (doc.rejection?.retry_count !== undefined && doc.rejection?.max_retries !== undefined) {
      if (doc.rejection.retry_count >= doc.rejection.max_retries) {
        alert(`Maximum retry limit reached (${doc.rejection.retry_count}/${doc.rejection.max_retries}). Document cannot be reprocessed automatically. Please contact an administrator for manual review.`);
        return;
      }
    }

    if (!confirm(`Reprocess verification for "${doc.fileName}"? This will trigger AI verification again.`)) {
      return;
    }

    try {
      console.log('[ReprocessDocument] Reprocessing document:', doc.id, doc.fileName);
      await apiClient.reprocessCandidateDocument(doc.id);
      console.log('[ReprocessDocument] Document reprocessing initiated');

      alert('Document verification reprocessing initiated. Status will update shortly.');

      // Refresh documents after a delay to see status update
      setTimeout(async () => {
        await fetchDocuments();
      }, 2000);
    } catch (error: any) {
      console.error('[ReprocessDocument] Error reprocessing document:', error);
      const errorMessage = error?.message || 'Failed to reprocess document';

      // Check if error is about max retries
      if (errorMessage.includes('Maximum retry limit')) {
        alert(`Cannot reprocess: ${errorMessage}`);
      } else {
        alert(`Error reprocessing document: ${errorMessage}`);
      }
    }
  };

  // Handle quick approve (for pending documents - no password needed)
  const handleQuickApprove = async (doc: Document) => {
    if (!confirm(`Approve "${doc.fileName}"? This will mark the document as verified.`)) {
      return;
    }

    try {
      console.log('[QuickApprove] Approving document:', doc.id, doc.fileName);
      await apiClient.quickApproveCandidateDocument(doc.id);
      console.log('[QuickApprove] Document approved successfully');

      alert('Document approved successfully!');

      // Refresh documents to see updated status
      await fetchDocuments();
    } catch (error: any) {
      console.error('[QuickApprove] Error approving document:', error);
      const errorMessage = error?.message || 'Failed to approve document';
      alert(`Error approving document: ${errorMessage}`);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'CV': return <FileText className="w-4 h-4" />;
      case 'Passport': return <File className="w-4 h-4" />;
      case 'Photo': return <ImageIcon className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  const handleApproveExtraction = async (approvedData: any) => {
    try {
      // Update candidate with approved extraction data
      await apiClient.approveExtraction(candidate.id, approvedData);
      setShowExtractionModal(false);
      setExtractedData(null);
      // Update local candidate state with new data
      setEditedCandidate({
        ...editedCandidate,
        ...approvedData
      });
    } catch (error) {
      console.error('Failed to approve extraction:', error);
      setExtractionError('Failed to save extracted data');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 flex items-start justify-between flex-shrink-0">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold text-lg">
                {((candidate.name || 'UK').trim() || 'UK').substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{candidate.name || 'Unknown'}</h2>
              <p className="text-sm text-gray-600 mt-0.5">
                {candidate.position || 'Candidate'} • {candidate.email || 'No email'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
            {isEditing && (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-6 flex-shrink-0">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Candidate Details
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'documents'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Documents
              {documents.length > 0 && (
                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  {documents.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('missing-data')}
              className={`py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'missing-data'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              Missing Data
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'details' ? (
            <div className="p-6 space-y-6">
              {/* Profile Photo */}
              {resolvedProfilePhotoUrl && (
                <div className="flex justify-center">
                  <div className="relative">
                    {isPdfProfilePhoto ? (
                      profilePdfThumb ? (
                        <img
                          src={profilePdfThumb}
                          alt={candidate.name}
                          className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-lg cursor-pointer"
                          onClick={() => window.open(resolvedProfilePhotoUrl, '_blank')}
                          title="Click to open PDF"
                        />
                      ) : (
                        <div
                          className="w-32 h-32 rounded-full border-4 border-gray-200 shadow-lg bg-gradient-to-br from-blue-100 to-purple-100 flex flex-col items-center justify-center cursor-pointer"
                          onClick={() => window.open(resolvedProfilePhotoUrl, '_blank')}
                          title="Click to open PDF"
                        >
                          <div className="text-3xl font-bold text-blue-600">
                            {((candidate.name || 'UK').trim() || 'UK').substring(0, 2).toUpperCase()}
                          </div>
                          {profilePdfThumbStatus === 'pending' ? (
                            <div className="mt-1 flex items-center gap-2">
                              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              <div className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 text-gray-700">Generating…</div>
                            </div>
                          ) : (
                            <div className="mt-1 text-[10px] px-2 py-0.5 rounded-full bg-white/70 text-gray-700">PDF</div>
                          )}
                        </div>
                      )
                    ) : (
                      <img
                        src={resolvedProfilePhotoUrl}
                        alt={candidate.name}
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-lg"
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Status & Score */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Current Status</p>
                  <span className={`px-4 py-2 rounded-full text-sm inline-block ${
                    candidate.status === 'Applied' ? 'bg-blue-100 text-blue-700' :
                    candidate.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    candidate.status === 'Deployed' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {candidate.status}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">AI Matching Score</p>
                  <p className="text-2xl">{candidate.ai_score || 0}/10</p>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <input
                        type="email"
                        name="email"
                        value={editedCandidate.email || ''}
                        onChange={handleChange}
                        className={`text-sm ${isEditing ? 'border border-gray-300' : 'bg-gray-100'} p-1 rounded`}
                        readOnly={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <input
                        type="tel"
                        name="phone"
                        value={editedCandidate.phone || ''}
                        onChange={handleChange}
                        className={`text-sm ${isEditing ? 'border border-gray-300' : 'bg-gray-100'} p-1 rounded`}
                        readOnly={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Country of Interest</p>
                      <input
                        type="text"
                        name="country_of_interest"
                        value={editedCandidate.country_of_interest || ''}
                        onChange={handleChange}
                        className={`text-sm ${isEditing ? 'border border-gray-300' : 'bg-gray-100'} p-1 rounded`}
                        readOnly={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Nationality</p>
                      <input
                        type="text"
                        name="nationality"
                        value={editedCandidate.nationality || ''}
                        onChange={handleChange}
                        className={`text-sm ${isEditing ? 'border border-gray-300' : 'bg-gray-100'} p-1 rounded`}
                        readOnly={!isEditing}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Details */}
              <div>
                <h3 className="mb-4">Professional Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Position</p>
                      <input
                        type="text"
                        name="position"
                        value={editedCandidate.position || ''}
                        onChange={handleChange}
                        className={`text-sm ${isEditing ? 'border border-gray-300' : 'bg-gray-100'} p-1 rounded`}
                        readOnly={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Applied Date</p>
                      <input
                        type="date"
                        name="created_at"
                        value={editedCandidate.created_at?.split('T')[0] || ''}
                        onChange={handleChange}
                        className={`text-sm ${isEditing ? 'border border-gray-300' : 'bg-gray-100'} p-1 rounded`}
                        readOnly={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    {candidate.passport_received ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mt-1" />
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Passport Status</p>
                      <p className="text-sm">{candidate.passport_received ? 'Received' : 'Not Received'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              {(() => {
                const skills = safeJsonArray(candidate.skills);
                return skills.length > 0 && (
                  <div>
                    <h3 className="mb-4">Skills & Competencies</h3>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Languages */}
              {(() => {
                const languages = safeJsonArray(candidate.languages);
                return languages.length > 0 && (
                  <div>
                    <h3 className="mb-4">Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      {languages.map((language, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Education */}
              {candidate.education && (
                <div>
                  <h3 className="mb-4">Education</h3>
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-line">{candidate.education}</p>
                  </div>
                </div>
              )}

              {/* Certifications */}
              {candidate.certifications && (
                <div>
                  <h3 className="mb-4">Certifications</h3>
                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-line">{candidate.certifications}</p>
                  </div>
                </div>
              )}

              {/* Internships */}
              {candidate.internships && (
                <div>
                  <h3 className="mb-4">Internships</h3>
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-line">{candidate.internships}</p>
                  </div>
                </div>
              )}

              {/* Previous Employment */}
              {candidate.previous_employment && (
                <div>
                  <h3 className="mb-4">Work Experience</h3>
                  <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-line">{candidate.previous_employment}</p>
                  </div>
                </div>
              )}

              {/* Professional Summary */}
              {candidate.professional_summary && (
                <div>
                  <h3 className="mb-4">Professional Summary</h3>
                  <div className="bg-teal-50 border border-teal-200 p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-line">{candidate.professional_summary}</p>
                  </div>
                </div>
              )}

              {/* Application Source */}
              {candidate.source && (
                <div>
                  <h3 className="mb-4">Application Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Application Source</p>
                    <p className="text-sm">{candidate.source}</p>
                  </div>
                </div>
              )}

              {/* Video Link */}
              {candidate.videoLink && (
                <div>
                  <h3 className="mb-4">Video Profile</h3>
                  <a
                    href={candidate.videoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Video className="w-5 h-5" />
                    Watch Video Profile
                  </a>
                </div>
              )}

              {/* Notes */}
              {candidate.notes && (
                <div>
                  <h3 className="mb-4">Notes & Remarks</h3>
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="text-sm">{candidate.notes}</p>
                  </div>
                </div>
              )}

              {/* AI Insights */}
              {(candidate.experience_years || candidate.position || candidate.ai_score) && (
                <div>
                  <h3 className="mb-4">AI Analysis</h3>
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 p-4 rounded-lg space-y-2">
                    {(candidate.experience_years || candidate.position) && (
                      <p className="text-sm">
                        <strong>Strengths:</strong>
                        {candidate.experience_years ? ` ${candidate.experience_years} years of experience` : ''}
                        {candidate.position ? ` in ${candidate.position}` : ''}.
                        {(() => {
                          const skills = safeJsonArray(candidate.skills);
                          return skills.length > 0 ? ` Strong skill set including ${skills.slice(0, 3).join(', ')}.` : '';
                        })()}
                      </p>
                    )}
                    {candidate.country_of_interest && candidate.country_of_interest !== 'missing' && (
                      <p className="text-sm">
                        <strong>Recommendation:</strong> Highly suitable for {candidate.country_of_interest} market.
                        {candidate.passport_received ? ' Passport ready - can deploy quickly.' : ' Passport needed - estimated 2-3 weeks.'}
                      </p>
                    )}
                    {candidate.ai_score && (
                      <p className="text-sm">
                        <strong>Match Score:</strong> {candidate.ai_score}/10 based on experience, skills, and market demand.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {isEditing ? (
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Details
                  </button>
                )}
                <button
                  onClick={handleShowEmployerCV}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Generate Employer CV
                </button>
                <button className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Send to Employer
                </button>
                <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Download CV
                </button>
              </div>
            </div>
          ) : activeTab === 'documents' ? (
            <div className="p-6 space-y-4">
              {/* Upload Status */}
              {uploading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <Loader className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Uploading Document...</p>
                    <p className="text-sm text-blue-700 mt-1">Please wait while your file is being uploaded</p>
                  </div>
                </div>
              )}

              {/* Auto-Extraction Status */}
              {extractionInProgress && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <Loader className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5 animate-spin" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Extracting CV Data</p>
                    <p className="text-sm text-blue-700 mt-1">Processing your CV with AI... This may take a moment.</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {extractionError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Extraction Error</p>
                    <p className="text-sm text-red-700 mt-1">{extractionError}</p>
                    <button
                      onClick={() => setExtractionError(null)}
                      className="text-xs text-red-600 hover:text-red-700 mt-2 underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Documents Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Candidate Documents</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {documentsLoading ? 'Loading...' : `${documents.length} files uploaded`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchDocuments}
                    disabled={documentsLoading}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                    title="Refresh documents"
                  >
                    <RefreshCw className={`w-4 h-4 ${documentsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={handleUploadDocument}
                    disabled={extractionInProgress || uploading}
                    className={`${
                      extractionInProgress || uploading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } px-4 py-2 rounded-lg transition-colors flex items-center gap-2`}
                  >
                    <Upload className={`w-4 h-4 ${uploading ? 'animate-pulse' : ''}`} />
                    {uploading ? 'Uploading...' : extractionInProgress ? 'Extracting...' : 'Upload Document'}
                  </button>
                </div>
              </div>

              {/* Documents Grid */}
              {documentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading documents...</span>
                </div>
              ) : documents.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {documents.map(doc => (
                    <div
                      key={doc.id}
                      className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          doc.category === 'CV' ? 'bg-blue-100 text-blue-600' :
                          doc.category === 'Passport' ? 'bg-purple-100 text-purple-600' :
                          doc.category === 'Certificate' ? 'bg-green-100 text-green-600' :
                          doc.category === 'Medical' ? 'bg-red-100 text-red-600' :
                          doc.category === 'Photo' ? 'bg-pink-100 text-pink-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {getCategoryIcon(doc.category)}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 truncate">{doc.fileName}</h4>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span>{doc.fileType}</span>
                                <span>•</span>
                                <span>{doc.fileSize}</span>
                                <span>•</span>
                                <span className={`px-2 py-0.5 rounded-full ${
                                  doc.category === 'CV' ? 'bg-blue-100 text-blue-700' :
                                  doc.category === 'Passport' ? 'bg-purple-100 text-purple-700' :
                                  doc.category === 'Certificate' ? 'bg-green-100 text-green-700' :
                                  doc.category === 'Medical' ? 'bg-red-100 text-red-700' :
                                  doc.category === 'Photo' ? 'bg-pink-100 text-pink-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {doc.category}
                                </span>
                              </div>
                            </div>
                            
                            {/* Status Badge */}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 flex-shrink-0 ${
                              doc.status === 'verified' ? 'bg-green-100 text-green-700' :
                              doc.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {doc.status === 'verified' && <CheckCircle className="w-3 h-3" />}
                              {doc.status === 'expired' && <AlertCircle className="w-3 h-3" />}
                              {doc.status === 'pending' && <AlertCircle className="w-3 h-3" />}
                              {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                            </span>
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Uploaded {doc.uploadedDate}</span>
                            </div>
                            <div>
                              By {doc.uploadedBy}
                            </div>
                            {doc.expiryDate && (
                              <div className="flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>Expires: {doc.expiryDate}</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleViewDocument(doc)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 text-sm">
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                            <button 
                              onClick={() => handleDownloadDocument(doc)}
                              className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1.5 text-sm">
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </button>
                            
                            {/* Approve/Reprocess buttons for pending documents (but not for already verified docs) */}
                            {(doc.status === 'pending' || doc.verification_status === 'pending_ai' || doc.verification_status === 'needs_review') && 
                             doc.verification_status !== 'verified' && (
                              <>
                                <button 
                                  onClick={() => handleQuickApprove(doc)}
                                  className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1.5 text-sm">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReprocessDocument(doc)}
                                  className="px-3 py-1.5 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors flex items-center gap-1.5 text-sm"
                                  title="Reprocess AI verification"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  Reprocess
                                </button>
                              </>
                            )}
                            
                            <button 
                              onClick={() => handleDeleteDocument(doc)}
                              className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1.5 text-sm">
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">No documents uploaded yet</p>
                  <button
                    onClick={handleUploadDocument}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload First Document
                  </button>
                </div>
              )}

              {/* Document Categories Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  Document Categories
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-700">
                  <div>📄 CV / Resume</div>
                  <div>🛂 Passport</div>
                  <div>🎓 Educational Documents</div>
                  <div>💼 Experience Certificates</div>
                  <div>👷 NAVTTC Reports</div>
                  <div>👮 Police Certificate</div>
                  <div>📜 Professional Certificates</div>
                  <div>📋 Contracts</div>
                  <div>🏥 Medical Reports</div>
                  <div>📷 Photos</div>
                  <div>📂 Other Documents</div>
                </div>
              </div>
            </div>
          ) : activeTab === 'missing-data' ? (
            <div className="p-6">
              <MissingDataTab 
                candidate={editedCandidate}
                onFieldUpdate={async (field, value) => {
                  // Update the local state
                  setEditedCandidate({
                    ...editedCandidate,
                    [field]: value
                  });
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Extraction Modal */}
      {showExtractionModal && extractedData && (
        <ExtractionReviewModal
          candidateId={candidate.id}
          extractedData={extractedData}
          onClose={() => {
            setShowExtractionModal(false);
            setExtractedData(null);
          }}
          onApprove={handleApproveExtraction}
          onReject={(notes: string) => {
            console.log('Extraction rejected:', notes);
            setShowExtractionModal(false);
            setExtractedData(null);
          }}
        />
      )}
      {showEmployerCV && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between text-white print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Employer-Safe CV</h2>
                  <p className="text-sm text-blue-100">Contact information hidden for privacy</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmployerCV(false)}
                className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Action Bar */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-200 p-4 flex items-center justify-between gap-4 print:hidden">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Safe to Share</p>
                  <p className="text-xs text-gray-600">All sensitive information removed</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyShareLink}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-medium ${
                    copiedLink
                      ? 'bg-green-600 text-white'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      Copy Share Link
                    </>
                  )}
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>

            {/* CV Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8 print:p-8">
              <div id="printable-cv" className="max-w-4xl mx-auto bg-white">
                {/* Logo and Header Section */}
                <div className="text-center mb-6">
                  <img 
                    src="/ChatGPT Image Jan 20, 2026, 05_24_22 PM.png" 
                    alt="Falisha Manpower" 
                    className="h-16 mx-auto mb-4"
                  />
                </div>
                
                {/* Header Section */}
                <div className="text-center mb-6 pb-4 border-b-2 border-blue-600">
                  <h1 className="text-3xl font-bold mb-2">{candidate.name || 'Candidate'}</h1>
                  <p className="text-lg text-gray-600 mb-2">{candidate.position || 'Professional'}</p>
                  <div className="flex items-center justify-center gap-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      <span>{candidate.nationality || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <span>Seeking: {candidate.country || 'Not specified'}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Information - HIDDEN FOR EMPLOYERS */}
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex items-start gap-2">
                    <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-yellow-900 text-sm mb-1">Contact Information Protected</h3>
                      <p className="text-xs text-yellow-800 mb-2">
                        For privacy, direct contact details have been removed. Contact Falisha Manpower to reach this candidate.
                      </p>
                      <div className="text-xs text-gray-700">
                        <p>✉️ falishamanpower4035@gmail.com</p>
                        <p>📱 +92330 3333335</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Summary */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    Professional Summary
                  </h2>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-gray-900 text-sm">Experience</span>
                      </div>
                      <p className="text-xl font-bold text-blue-600">{candidate.experience_years || 0} Years</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-gray-900 text-sm">AI Match Score</span>
                      </div>
                      <p className="text-xl font-bold text-purple-600">{candidate.ai_score?.toFixed(1) || 'N/A'}/10</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {candidate.professional_summary || `Highly skilled ${candidate.position || 'professional'} with ${candidate.experience_years || 0} years of professional experience. Seeking opportunities in ${candidate.country || 'various markets'} to contribute technical expertise and drive operational excellence.`}
                  </p>
                </div>

                {/* Work Experience */}
                {candidate.previous_employment && (
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      Work Experience
                    </h2>
                    <div className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                      <p className="text-sm whitespace-pre-line text-gray-700">{candidate.previous_employment}</p>
                    </div>
                  </div>
                )}

                {/* Core Skills */}
                {safeJsonArray(candidate.skills).length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
                      <Star className="w-5 h-5 text-blue-600" />
                      Core Skills & Competencies
                    </h2>
                    <div className="grid grid-cols-3 gap-2">
                      {safeJsonArray(candidate.skills).map((skill, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded border border-blue-200 text-gray-800 font-medium text-center text-sm"
                        >
                          {skill}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {(() => {
                  const educationItems = formatEducationList(candidate.education);
                  if (educationItems.length === 0) return null;
                  return (
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Education
                      </h2>
                      <div className="bg-gray-50 p-3 rounded border-l-4 border-purple-500">
                        <ul className="text-sm text-gray-700 space-y-1">
                          {educationItems.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })()}

                {/* Certifications */}
                {(() => {
                  const certificationItems = formatSimpleList(candidate.certifications);
                  if (certificationItems.length === 0) return null;
                  return (
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        Certifications
                      </h2>
                      <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                        <ul className="text-sm text-gray-700 space-y-1">
                          {certificationItems.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })()}

                {/* Internships */}
                {(() => {
                  const internshipItems = formatSimpleList(candidate.internships);
                  if (internshipItems.length === 0) return null;
                  return (
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Internships
                      </h2>
                      <div className="bg-purple-50 p-3 rounded border-l-4 border-purple-500">
                        <ul className="text-sm text-gray-700 space-y-1">
                          {internshipItems.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })()}

                {/* Additional Information */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Additional Information
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold text-gray-900 text-sm">Nationality</span>
                      </div>
                      <p className="text-gray-700 text-sm">{candidate.nationality || 'Not specified'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold text-gray-900 text-sm">Preferred Location</span>
                      </div>
                      <p className="text-gray-700 text-sm">{candidate.country || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Footer Notice */}
                <div className="mt-6 pt-4 border-t border-gray-300">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Shield className="w-6 h-6 text-blue-600 flex-shrink-0" />
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1 text-sm">Protected by Falisha Manpower</h3>
                        <p className="text-xs text-gray-700 mb-2">
                          This employer-safe CV protects candidate privacy. Contact information has been secured.
                        </p>
                        <p className="text-xs text-gray-600">
                          <strong>For interviews:</strong> falishamanpower4035@gmail.com | +92330 3333335
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Watermark */}
                <div className="mt-4 text-center text-xs text-gray-400">
                  <p>Falisha Manpower AI Recruitment System | Candidate ID: {candidate.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Print Styles */}
          <style>{`
            @media print {
              @page {
                size: A4;
                margin: 0.5in;
              }
              
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
                margin: 0;
                padding: 0;
              }
              
              /* Hide everything */
              * {
                display: none !important;
                visibility: hidden !important;
              }
              
              /* Show only the printable CV */
              #printable-cv {
                display: block !important;
                visibility: visible !important;
                position: relative !important;
                width: 100% !important;
                height: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                page-break-after: auto;
                page-break-inside: avoid;
              }
              
              #printable-cv * {
                display: block !important;
                visibility: visible !important;
                margin-bottom: 0.5rem !important;
                page-break-inside: avoid !important;
              }
              
              /* Typography */
              #printable-cv h1 { 
                font-size: 20px !important; 
                font-weight: bold !important;
                margin-bottom: 6px !important; 
              }
              #printable-cv h2 { 
                font-size: 14px !important; 
                font-weight: bold !important;
                margin-bottom: 8px !important; 
              }
              #printable-cv p { 
                font-size: 10px !important; 
                line-height: 1.3 !important;
                margin-bottom: 4px !important;
              }
              #printable-cv img {
                max-width: 100% !important;
                height: auto !important;
                margin-bottom: 8px !important;
              }
              
              /* Reduce all spacing */
              #printable-cv .mb-6 { margin-bottom: 8px !important; }
              #printable-cv .mb-4 { margin-bottom: 6px !important; }
              #printable-cv .mb-3 { margin-bottom: 4px !important; }
              #printable-cv .mb-2 { margin-bottom: 2px !important; }
              #printable-cv .mb-1 { margin-bottom: 1px !important; }
              
              #printable-cv .pb-2 { padding-bottom: 4px !important; }
              #printable-cv .pb-4 { padding-bottom: 6px !important; }
              #printable-cv .pb-6 { padding-bottom: 8px !important; }
              
              #printable-cv .p-6 { padding: 6px !important; }
              #printable-cv .p-4 { padding: 4px !important; }
              #printable-cv .p-3 { padding: 3px !important; }
              
              #printable-cv .gap-2 { gap: 2px !important; }
              #printable-cv .gap-3 { gap: 3px !important; }
              #printable-cv .gap-4 { gap: 4px !important; }
              
              /* Grid and flexbox */
              #printable-cv .grid,
              #printable-cv .flex {
                display: flex !important;
              }
              
              #printable-cv .grid-cols-2,
              #printable-cv .grid-cols-3 {
                flex-direction: row !important;
                flex-wrap: wrap !important;
              }
              
              #printable-cv .grid-cols-2 > * {
                flex: 0 0 48% !important;
              }
              
              #printable-cv .grid-cols-3 > * {
                flex: 0 0 31% !important;
              }
              
              /* Keep colors for branding */
              #printable-cv .bg-blue-50,
              #printable-cv .bg-purple-50,
              #printable-cv .bg-yellow-50,
              #printable-cv .bg-gray-50,
              #printable-cv .bg-green-50 {
                print-color-adjust: exact !important;
                -webkit-print-color-adjust: exact !important;
              }
              
              #printable-cv .border,
              #printable-cv .border-b-2,
              #printable-cv .border-l-4 {
                border-color: inherit !important;
                print-color-adjust: exact !important;
                -webkit-print-color-adjust: exact !important;
              }
              
              #printable-cv .text-sm { font-size: 9px !important; }
              #printable-cv .text-xs { font-size: 8px !important; }
              #printable-cv .text-xl { font-size: 12px !important; }
              #printable-cv .text-2xl { font-size: 14px !important; }
              #printable-cv .text-3xl { font-size: 16px !important; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
