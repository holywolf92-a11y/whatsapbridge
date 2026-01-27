import { useState, useEffect } from 'react';
import { Inbox, Upload, FileText, Mail, MessageSquare, Calendar, CheckCircle, Clock, Sparkles, Eye, Download, AlertTriangle } from 'lucide-react';

interface IncomingCV {
  id: string;
  fileName: string;
  source: 'WhatsApp' | 'Email' | 'Web Form';
  senderName: string;
  senderContact: string;
  receivedDate: string;
  fileSize: string;
  status: 'processing' | 'extracted' | 'error';
  candidateId?: string;
  errorMessage?: string;
  confidence?: number;
}

// Mock incoming CVs - these are auto-processing
const mockIncomingCVs: IncomingCV[] = [
  {
    id: 'cv-001',
    fileName: 'Ahmed_Hassan_CV.pdf',
    source: 'WhatsApp',
    senderName: 'Ahmed Hassan',
    senderContact: '+92 300 1234567',
    receivedDate: '2024-12-13 10:30 AM',
    fileSize: '245 KB',
    status: 'extracted',
    candidateId: 'CND-001',
    confidence: 95
  },
  {
    id: 'cv-002',
    fileName: 'Maria_Garcia_Resume.pdf',
    source: 'Email',
    senderName: 'Maria Garcia',
    senderContact: 'maria.garcia@email.com',
    receivedDate: '2024-12-13 09:15 AM',
    fileSize: '180 KB',
    status: 'extracted',
    candidateId: 'CND-002',
    confidence: 88
  },
  {
    id: 'cv-003',
    fileName: 'John_Smith_CV.docx',
    source: 'WhatsApp',
    senderName: 'John Smith',
    senderContact: '+92 301 9876543',
    receivedDate: '2024-12-13 08:45 AM',
    fileSize: '312 KB',
    status: 'processing'
  },
  {
    id: 'cv-004',
    fileName: 'Corrupt_File.pdf',
    source: 'Email',
    senderName: 'Unknown',
    senderContact: 'test@email.com',
    receivedDate: '2024-12-12 11:20 PM',
    fileSize: '15 KB',
    status: 'error',
    errorMessage: 'Failed to extract text from PDF. File may be corrupted or image-based.'
  },
  {
    id: 'cv-005',
    fileName: 'Mohammed_Ali_CV.pdf',
    source: 'Web Form',
    senderName: 'Mohammed Ali',
    senderContact: 'mali@email.com',
    receivedDate: '2024-12-12 06:30 PM',
    fileSize: '275 KB',
    status: 'extracted',
    candidateId: 'CND-003',
    confidence: 72
  }
];

export function CVInbox() {
  const [cvs, setCvs] = useState<IncomingCV[]>(mockIncomingCVs);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Simulate auto-processing for any "processing" CVs
  useEffect(() => {
    const processingCvs = cvs.filter(cv => cv.status === 'processing');
    
    if (processingCvs.length > 0) {
      const timeout = setTimeout(() => {
        setCvs(cvs.map(cv => {
          if (cv.status === 'processing') {
            // Simulate successful extraction (90% success rate)
            if (Math.random() > 0.1) {
              return {
                ...cv,
                status: 'extracted',
                candidateId: `CND-${Date.now()}`,
                confidence: Math.floor(Math.random() * 30) + 70 // 70-100%
              };
            } else {
              return {
                ...cv,
                status: 'error',
                errorMessage: 'Failed to extract data. Please upload a clearer CV.'
              };
            }
          }
          return cv;
        }));
      }, 3000); // 3 seconds for demo, real would be 10-30 seconds

      return () => clearTimeout(timeout);
    }
  }, [cvs]);

  const handleManualUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const newCV: IncomingCV = {
          id: `cv-${Date.now()}`,
          fileName: file.name,
          source: 'Web Form',
          senderName: 'Manual Upload',
          senderContact: 'N/A',
          receivedDate: new Date().toLocaleString(),
          fileSize: `${(file.size / 1024).toFixed(0)} KB`,
          status: 'processing'
        };
        setCvs([newCV, ...cvs]);
      }
    };
    input.click();
  };

  const handleRetry = (cvId: string) => {
    setCvs(cvs.map(cv => 
      cv.id === cvId ? { ...cv, status: 'processing', errorMessage: undefined } : cv
    ));
  };

  const filteredCVs = filterStatus === 'all' 
    ? cvs 
    : cvs.filter(cv => cv.status === filterStatus);

  const stats = {
    total: cvs.length,
    processing: cvs.filter(cv => cv.status === 'processing').length,
    extracted: cvs.filter(cv => cv.status === 'extracted').length,
    errors: cvs.filter(cv => cv.status === 'error').length,
    needsReview: cvs.filter(cv => cv.status === 'extracted' && (cv.confidence || 0) < 85).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">CV Inbox</h1>
          <p className="text-gray-600 mt-1">Automatic AI extraction - CVs become candidates instantly</p>
        </div>
        <button 
          onClick={handleManualUpload}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
        >
          <Upload className="w-5 h-5" />
          Upload CV Manually
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total CVs</span>
            <Inbox className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-2xl font-semibold">{stats.total}</div>
          <div className="text-xs text-gray-500 mt-1">All time</div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-700">Processing</span>
            <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
          </div>
          <div className="text-2xl font-semibold text-blue-900">{stats.processing}</div>
          <div className="text-xs text-blue-600 mt-1">AI extracting now...</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-700">Extracted</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-semibold text-green-900">{stats.extracted}</div>
          <div className="text-xs text-green-600 mt-1">Now candidates</div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-6 border-2 border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-yellow-700">Needs Review</span>
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-2xl font-semibold text-yellow-900">{stats.needsReview}</div>
          <div className="text-xs text-yellow-600 mt-1">Low confidence</div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-6 border-2 border-red-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-red-700">Errors</span>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-2xl font-semibold text-red-900">{stats.errors}</div>
          <div className="text-xs text-red-600 mt-1">Need manual fix</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilterStatus('processing')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === 'processing' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Processing ({stats.processing})
          </button>
          <button
            onClick={() => setFilterStatus('extracted')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === 'extracted' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Extracted ({stats.extracted})
          </button>
          <button
            onClick={() => setFilterStatus('error')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === 'error' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Errors ({stats.errors})
          </button>
        </div>
      </div>

      {/* CV List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-600">
                  CV Details
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-600">
                  Source
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-600">
                  Sender Info
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-600">
                  Received
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
              {filteredCVs.map((cv) => (
                <tr key={cv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        cv.status === 'processing' ? 'bg-blue-100 animate-pulse' :
                        cv.status === 'extracted' ? 'bg-green-100' :
                        'bg-red-100'
                      }`}>
                        <FileText className={`w-5 h-5 ${
                          cv.status === 'processing' ? 'text-blue-600' :
                          cv.status === 'extracted' ? 'text-green-600' :
                          'text-red-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{cv.fileName}</p>
                        <p className="text-sm text-gray-500">{cv.fileSize}</p>
                        {cv.status === 'error' && cv.errorMessage && (
                          <p className="text-xs text-red-600 mt-1">{cv.errorMessage}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {cv.source === 'WhatsApp' && (
                        <>
                          <MessageSquare className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-700 font-medium">WhatsApp</span>
                        </>
                      )}
                      {cv.source === 'Email' && (
                        <>
                          <Mail className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-700 font-medium">Email</span>
                        </>
                      )}
                      {cv.source === 'Web Form' && (
                        <>
                          <Upload className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-purple-700 font-medium">Web Form</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{cv.senderName}</p>
                      <p className="text-sm text-gray-500">{cv.senderContact}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {cv.receivedDate}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {cv.status === 'processing' && (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3 animate-spin" />
                          AI Processing...
                        </span>
                      </div>
                    )}
                    {cv.status === 'extracted' && (
                      <div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit mb-1">
                          <CheckCircle className="w-3 h-3" />
                          Extracted
                        </span>
                        {cv.confidence && (
                          <div className="text-xs text-gray-600">
                            Confidence: <span className={`font-semibold ${
                              cv.confidence >= 85 ? 'text-green-600' : 'text-yellow-600'
                            }`}>{cv.confidence}%</span>
                          </div>
                        )}
                      </div>
                    )}
                    {cv.status === 'error' && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" />
                        Error
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {cv.status === 'extracted' && cv.candidateId && (
                        <button
                          onClick={() => window.location.hash = 'candidates'}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View Candidate
                        </button>
                      )}
                      {cv.status === 'error' && (
                        <button
                          onClick={() => handleRetry(cv.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          Retry Extraction
                        </button>
                      )}
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">🤖 Fully Automatic AI Processing</h3>
            <p className="text-sm text-gray-700 mb-4">
              When a CV arrives from WhatsApp, Email, or Web Form, our AI automatically:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm mb-4">
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">1</div>
                Reads the CV file
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">2</div>
                Extracts all data
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">3</div>
                Creates candidate profile
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">4</div>
                Flags if needs review
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-gray-700">
                <strong>📋 What happens next:</strong> The candidate automatically appears in <strong>Candidate Management</strong> with a <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">Needs Review</span> badge if confidence is low. You can then review and fix any missing fields.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}