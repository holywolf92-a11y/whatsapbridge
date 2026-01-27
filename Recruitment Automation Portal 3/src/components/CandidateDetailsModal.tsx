import { useState } from 'react';
import { X, Edit2, Save, Phone, Mail, MapPin, Briefcase, Calendar, FileText, Globe, CheckCircle, XCircle, Star, Video, MessageSquare, Upload, Download, Eye, Trash2, File, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Candidate } from '../lib/mockData';

interface CandidateDetailsModalProps {
  candidate: Candidate;
  onClose: () => void;
}

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  category: 'CV' | 'Passport' | 'Certificate' | 'Contract' | 'Medical' | 'Photo' | 'Other';
  uploadedBy: string;
  uploadedDate: string;
  fileSize: string;
  status: 'verified' | 'pending' | 'expired';
  expiryDate?: string;
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

export function CandidateDetailsModal({ candidate, onClose }: CandidateDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCandidate, setEditedCandidate] = useState(candidate);
  const [documents, setDocuments] = useState<Document[]>(getMockDocuments(candidate.id));
  const [activeTab, setActiveTab] = useState<'details' | 'documents'>('details');

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
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        const newDocs: Document[] = Array.from(files).map(file => ({
          id: `doc-${Date.now()}-${Math.random()}`,
          fileName: file.name,
          fileType: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
          category: 'Other',
          uploadedBy: 'Current User',
          uploadedDate: new Date().toISOString().split('T')[0],
          fileSize: `${(file.size / 1024).toFixed(0)} KB`,
          status: 'pending'
        }));
        setDocuments([...newDocs, ...documents]);
      }
    };
    input.click();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'CV': return <FileText className="w-4 h-4" />;
      case 'Passport': return <File className="w-4 h-4" />;
      case 'Photo': return <ImageIcon className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl text-blue-600">
              {candidate.name[0]}
            </div>
            <div>
              <h2>{candidate.name}</h2>
              <p className="text-gray-600">{candidate.position} • {candidate.nationality}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6 flex-shrink-0">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Candidate Details
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-2 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'documents'
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Documents
              <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                {documents.length}
              </span>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'details' ? (
            <div className="p-6 space-y-6">
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
                  <p className="text-2xl">{candidate.aiScore}/10</p>
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
                        value={editedCandidate.email}
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
                        value={editedCandidate.phone}
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
                        name="country"
                        value={editedCandidate.country}
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
                        value={editedCandidate.nationality}
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
                        value={editedCandidate.position}
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
                        name="appliedDate"
                        value={editedCandidate.appliedDate}
                        onChange={handleChange}
                        className={`text-sm ${isEditing ? 'border border-gray-300' : 'bg-gray-100'} p-1 rounded`}
                        readOnly={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    {candidate.passportAvailable ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mt-1" />
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Passport Status</p>
                      <p className="text-sm">{candidate.passportAvailable ? 'Available' : 'Not Available'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h3 className="mb-4">Skills & Competencies</h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Languages */}
              {candidate.languages && candidate.languages.length > 0 && (
                <div>
                  <h3 className="mb-4">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.languages.map((language, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
                      >
                        {language}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Source */}
              <div>
                <h3 className="mb-4">Application Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Application Source</p>
                  <p className="text-sm">{candidate.source}</p>
                </div>
              </div>

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
              <div>
                <h3 className="mb-4">AI Analysis</h3>
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 p-4 rounded-lg space-y-2">
                  <p className="text-sm">
                    <strong>Strengths:</strong> {candidate.experience} years of experience in {candidate.position}. 
                    Strong skill set including {candidate.skills.slice(0, 3).join(', ')}.
                  </p>
                  <p className="text-sm">
                    <strong>Recommendation:</strong> Highly suitable for {candidate.country} market. 
                    {candidate.passportAvailable ? ' Passport ready - can deploy quickly.' : ' Passport needed - estimated 2-3 weeks.'}
                  </p>
                  <p className="text-sm">
                    <strong>Match Score:</strong> {candidate.aiScore}/10 based on experience, skills, and market demand.
                  </p>
                </div>
              </div>

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
                <button className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
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
          ) : (
            <div className="p-6 space-y-4">
              {/* Documents Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Candidate Documents</h3>
                  <p className="text-sm text-gray-600 mt-1">{documents.length} files uploaded</p>
                </div>
                <button
                  onClick={handleUploadDocument}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Document
                </button>
              </div>

              {/* Documents Grid */}
              {documents.length > 0 ? (
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
                            <button className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 text-sm">
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                            <button className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1.5 text-sm">
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </button>
                            <button className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1.5 text-sm">
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
                  <div>📜 Certificates</div>
                  <div>📝 Contracts</div>
                  <div>🏥 Medical Reports</div>
                  <div>📷 Photos</div>
                  <div>📁 Other Documents</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}