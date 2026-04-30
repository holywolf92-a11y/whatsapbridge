import { useState } from 'react';
import { FileText, Upload, Download, Eye, Trash2, Search, Filter, FolderOpen, File, Calendar, User, CheckCircle, AlertCircle, Image, FileSpreadsheet } from 'lucide-react';

interface Document {
  id: string;
  fileName: string;
  fileType: string;
  category: 'CV' | 'Passport' | 'Certificate' | 'Contract' | 'Medical' | 'Photo' | 'Other';
  candidateId?: string;
  candidateName?: string;
  uploadedBy: string;
  uploadedDate: string;
  fileSize: string;
  status: 'verified' | 'pending' | 'expired';
  expiryDate?: string;
  notes?: string;
  fileUrl?: string;
}

const mockDocuments: Document[] = [
  {
    id: 'doc-001',
    fileName: 'Ahmed_Hassan_CV.pdf',
    fileType: 'PDF',
    category: 'CV',
    candidateId: '1',
    candidateName: 'Ahmed Hassan',
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
    candidateId: '1',
    candidateName: 'Ahmed Hassan',
    uploadedBy: 'Admin',
    uploadedDate: '2024-12-10',
    fileSize: '1.2 MB',
    status: 'verified',
    expiryDate: '2028-05-15'
  },
  {
    id: 'doc-003',
    fileName: 'Maria_Garcia_CV.pdf',
    fileType: 'PDF',
    category: 'CV',
    candidateId: 'AUTO-001',
    candidateName: 'Maria Garcia',
    uploadedBy: 'System (WhatsApp)',
    uploadedDate: '2024-12-13',
    fileSize: '180 KB',
    status: 'verified'
  },
  {
    id: 'doc-004',
    fileName: 'Electrical_Certificate_Ahmed.pdf',
    fileType: 'PDF',
    category: 'Certificate',
    candidateId: '1',
    candidateName: 'Ahmed Hassan',
    uploadedBy: 'Admin',
    uploadedDate: '2024-12-08',
    fileSize: '890 KB',
    status: 'verified',
    expiryDate: '2026-12-31'
  },
  {
    id: 'doc-005',
    fileName: 'Mohammed_Ali_Medical.pdf',
    fileType: 'PDF',
    category: 'Medical',
    candidateId: '2',
    candidateName: 'Mohammed Ali',
    uploadedBy: 'Admin',
    uploadedDate: '2024-11-20',
    fileSize: '650 KB',
    status: 'expired',
    expiryDate: '2024-11-30'
  },
  {
    id: 'doc-006',
    fileName: 'John_Smith_CV.docx',
    fileType: 'DOCX',
    category: 'CV',
    candidateId: 'AUTO-002',
    candidateName: 'John Smith',
    uploadedBy: 'System (Email)',
    uploadedDate: '2024-12-13',
    fileSize: '312 KB',
    status: 'pending'
  },
  {
    id: 'doc-007',
    fileName: 'Rajesh_Photo.jpg',
    fileType: 'JPG',
    category: 'Photo',
    candidateId: '3',
    candidateName: 'Rajesh Kumar',
    uploadedBy: 'Admin',
    uploadedDate: '2024-12-13',
    fileSize: '450 KB',
    status: 'verified'
  },
  {
    id: 'doc-008',
    fileName: 'Contract_Template_Saudi.docx',
    fileType: 'DOCX',
    category: 'Contract',
    uploadedBy: 'HR Manager',
    uploadedDate: '2024-12-01',
    fileSize: '125 KB',
    status: 'verified',
    notes: 'Standard contract template for Saudi Arabia'
  }
];

export function DocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        Array.from(files).forEach(file => {
          const newDoc: Document = {
            id: `doc-${Date.now()}-${Math.random()}`,
            fileName: file.name,
            fileType: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
            category: 'Other',
            uploadedBy: 'Current User',
            uploadedDate: new Date().toISOString().split('T')[0],
            fileSize: `${(file.size / 1024).toFixed(0)} KB`,
            status: 'pending'
          };
          setDocuments([newDoc, ...documents]);
        });
      }
    };
    input.click();
  };

  const stats = {
    total: documents.length,
    cvs: documents.filter(d => d.category === 'CV').length,
    passports: documents.filter(d => d.category === 'Passport').length,
    certificates: documents.filter(d => d.category === 'Certificate').length,
    pending: documents.filter(d => d.status === 'pending').length,
    expired: documents.filter(d => d.status === 'expired').length
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'CV': return <FileText className="w-4 h-4" />;
      case 'Passport': return <File className="w-4 h-4" />;
      case 'Certificate': return <FileSpreadsheet className="w-4 h-4" />;
      case 'Photo': return <Image className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Document Management</h1>
          <p className="text-gray-600 mt-1">Centralized storage for all candidate documents</p>
        </div>
        <button
          onClick={handleUpload}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
        >
          <Upload className="w-5 h-5" />
          Upload Documents
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total</span>
            <FolderOpen className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-2xl font-semibold">{stats.total}</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-700">CVs</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-semibold text-blue-900">{stats.cvs}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-purple-700">Passports</span>
            <File className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-semibold text-purple-900">{stats.passports}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-700">Certificates</span>
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-semibold text-green-900">{stats.certificates}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-yellow-700">Pending</span>
            <AlertCircle className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="text-2xl font-semibold text-yellow-900">{stats.pending}</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-red-700">Expired</span>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-semibold text-red-900">{stats.expired}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by filename, candidate, or uploader..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="CV">CVs</option>
            <option value="Passport">Passports</option>
            <option value="Educational">Educational Documents</option>
            <option value="Experience">Experience Certificates</option>
            <option value="NAVTTC">NAVTTC Reports</option>
            <option value="Police">Police Certificate</option>
            <option value="Certificate">Professional Certificates</option>
            <option value="Contract">Contracts</option>
            <option value="Medical">Medical</option>
            <option value="Photo">Photos</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-600">
                  Document
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-600">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-600">
                  Candidate
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-600">
                  Uploaded By
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-600">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-600">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        doc.category === 'CV' ? 'bg-blue-100 text-blue-600' :
                        doc.category === 'Passport' ? 'bg-purple-100 text-purple-600' :
                        doc.category === 'Certificate' ? 'bg-green-100 text-green-600' :
                        doc.category === 'Photo' ? 'bg-pink-100 text-pink-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {getCategoryIcon(doc.category)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{doc.fileName}</p>
                        <p className="text-sm text-gray-500">{doc.fileType} • {doc.fileSize}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      doc.category === 'CV' ? 'bg-blue-100 text-blue-700' :
                      doc.category === 'Passport' ? 'bg-purple-100 text-purple-700' :
                      doc.category === 'Certificate' ? 'bg-green-100 text-green-700' :
                      doc.category === 'Medical' ? 'bg-red-100 text-red-700' :
                      doc.category === 'Photo' ? 'bg-pink-100 text-pink-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {doc.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {doc.candidateName ? (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{doc.candidateName}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No candidate</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{doc.uploadedBy}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {doc.uploadedDate}
                    </div>
                    {doc.expiryDate && (
                      <div className="text-xs text-gray-500 mt-1">
                        Expires: {doc.expiryDate}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                      doc.status === 'verified' ? 'bg-green-100 text-green-700' :
                      doc.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {doc.status === 'verified' && <CheckCircle className="w-3 h-3" />}
                      {doc.status === 'expired' && <AlertCircle className="w-3 h-3" />}
                      {doc.status === 'pending' && <AlertCircle className="w-3 h-3" />}
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">Document Organization System</h3>
            <p className="text-sm text-gray-700 mb-3">
              All documents are automatically organized by category and linked to candidates. Documents are stored securely and can be accessed anytime.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Auto-categorization
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Expiry tracking
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Secure storage
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Quick search
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
