import { useEffect, useState } from 'react';
import { api, ParsingJob } from '../lib/apiClient';
import { X, Sparkles, FileText, CheckCircle, AlertTriangle, User, Briefcase, Globe, Phone, Mail, MapPin, Award, Calendar, Save, Eye, Edit2, Loader } from 'lucide-react';

interface IncomingCV {
  id: string;
  fileName: string;
  source: 'WhatsApp' | 'Email' | 'Web Form';
  senderName: string;
  senderContact: string;
  receivedDate: string;
  fileSize: string;
}

interface ExtractedData {
  // Personal Information
  name: string;
  email: string;
  phone: string;
  nationality: string;
  dateOfBirth?: string;
  age?: number;
  
  // Job Information
  position: string;
  experience: string;
  countryOfInterest: string;
  
  // Skills & Languages
  skills: string;
  languages: string;
  
  // Education & Certifications
  education: string;
  certifications: string;
  
  // Work History
  previousEmployment: string;
  
  // Passport Information
  passportNumber?: string;
  passportExpiry?: string;
  
  // Additional
  summary?: string;
  
  // Confidence scores
  confidence: {
    overall: number;
    name: number;
    contact: number;
    experience: number;
    skills: number;
    education: number;
    languages: number;
  };
}

interface CVParserProps {
  cv: IncomingCV;
  onClose: () => void;
  onSaved: () => void;
  jobId?: string;
}

export function CVParser({ cv, onClose, onSaved, jobId }: CVParserProps) {
  const [stage, setStage] = useState<'uploading' | 'extracting' | 'review' | 'saving'>('extracting');
  const [extractedData, setExtractedData] = useState<ExtractedData | any | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Poll real parsing job if provided
  useEffect(() => {
    if (stage !== 'extracting') return;
    let stopped = false;
    let timer: number | undefined;
    let localProgress = 0;
    let delayMs = 2000;
    const maxDelayMs = 10000;

    const stop = () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };

    const schedule = () => {
      if (stopped) return;
      timer = window.setTimeout(() => {
        void tick();
      }, delayMs);
    };

    const onVisibilityChange = () => {
      if (stopped) return;
      if (typeof document !== 'undefined' && document.hidden) return;
      delayMs = 2000;
      void tick();
    };

    const tick = async () => {
      if (stopped) return;
      if (typeof document !== 'undefined' && document.hidden) return;

      try {
        if (!jobId) {
          setErrorMessage('No parsing job to poll');
          setStage('review');
          stop();
          return;
        }

        const job: ParsingJob = await api.getParsingJob(jobId);
        if (typeof job.progress === 'number') {
          setProgress(Math.max(progress, job.progress));
        } else {
          localProgress = Math.min(95, localProgress + 5);
          setProgress(localProgress);
        }

        if (job.status === 'extracted') {
          setProgress(100);
          setExtractedData(job.result || null);
          setStage('review');
          stop();
          return;
        }

        if (job.status === 'failed') {
          setErrorMessage(job.error_message || 'Parsing failed');
          setStage('review');
          stop();
          return;
        }
      } catch (e: any) {
        setErrorMessage(e?.message || 'Failed to fetch job status');
        setStage('review');
        stop();
        return;
      }

      delayMs = Math.min(Math.round(delayMs * 1.5), maxDelayMs);
      schedule();
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    void tick();
    return () => stop();
  }, [stage, jobId]);

  const handleSave = () => {
    setStage('saving');
    // In production, this would save to database
    setTimeout(() => {
      onSaved();
    }, 1500);
  };

  const updateField = (field: keyof ExtractedData, value: any) => {
    if (extractedData) {
      setExtractedData({ ...extractedData, [field]: value });
    }
  };

  // Extracting Stage
  if (stage === 'extracting') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">AI Processing Your CV</h2>
            <p className="text-gray-600 mb-6">Using OpenAI to extract candidate information...</p>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Analyzing CV content...</span>
                <span className="text-sm font-medium text-blue-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* CV Info */}
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="font-medium">{cv.fileName}</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Source: <span className="font-medium">{cv.source}</span></p>
                <p>From: <span className="font-medium">{cv.senderName}</span></p>
                <p>Size: <span className="font-medium">{cv.fileSize}</span></p>
              </div>
            </div>

            {/* Extraction Steps */}
            <div className="mt-6 space-y-2 text-left">
              <div className={`flex items-center gap-3 text-sm ${progress > 20 ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-4 h-4" />
                Reading PDF/Document content
              </div>
              <div className={`flex items-center gap-3 text-sm ${progress > 40 ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-4 h-4" />
                Extracting personal information
              </div>
              <div className={`flex items-center gap-3 text-sm ${progress > 60 ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-4 h-4" />
                Analyzing work experience
              </div>
              <div className={`flex items-center gap-3 text-sm ${progress > 80 ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-4 h-4" />
                Identifying skills and qualifications
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Saving Stage
  if (stage === 'saving') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader className="w-8 h-8 text-green-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Saving Candidate Profile</h2>
          <p className="text-gray-600">Creating new candidate record...</p>
        </div>
      </div>
    );
  }

  // Review Stage
  if (stage === 'review' && extractedData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
        <div className="min-h-screen p-4">
          <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-xl my-8">
            {/* Header */}
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl">Extracted Data - Review & Confirm</h2>
                      <p className="text-gray-600">AI extracted data from {cv.fileName}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Confidence Score */}
              <div className="mt-4 flex items-center gap-4">
                <div className="flex-1 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">AI Confidence Score</p>
                      <p className="text-2xl font-semibold text-green-700">
                        {(extractedData.confidence.overall * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="text-center">
                        <p className="text-gray-600">Name</p>
                        <p className="font-semibold">{(extractedData.confidence.name * 100).toFixed(0)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600">Contact</p>
                        <p className="font-semibold">{(extractedData.confidence.contact * 100).toFixed(0)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600">Experience</p>
                        <p className="font-semibold">{(extractedData.confidence.experience * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                    editMode ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  <Edit2 className="w-4 h-4" />
                  {editMode ? 'View Mode' : 'Edit Mode'}
                </button>
              </div>
            </div>

            {/* Extracted Data Form */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <h3 className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-blue-600" />
                    Personal Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={extractedData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        disabled={!editMode}
                        className={`w-full px-4 py-2 border rounded-lg ${editMode ? 'bg-white' : 'bg-gray-100'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Email *</label>
                      <input
                        type="email"
                        value={extractedData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        disabled={!editMode}
                        className={`w-full px-4 py-2 border rounded-lg ${editMode ? 'bg-white' : 'bg-gray-100'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Phone *</label>
                      <input
                        type="tel"
                        value={extractedData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        disabled={!editMode}
                        className={`w-full px-4 py-2 border rounded-lg ${editMode ? 'bg-white' : 'bg-gray-100'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Nationality *</label>
                      <input
                        type="text"
                        value={extractedData.nationality}
                        onChange={(e) => updateField('nationality', e.target.value)}
                        disabled={!editMode}
                        className={`w-full px-4 py-2 border rounded-lg ${editMode ? 'bg-white' : 'bg-gray-100'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Age</label>
                      <input
                        type="number"
                        value={extractedData.age || ''}
                        onChange={(e) => updateField('age', parseInt(e.target.value))}
                        disabled={!editMode}
                        className={`w-full px-4 py-2 border rounded-lg ${editMode ? 'bg-white' : 'bg-gray-100'}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Job Information */}
                <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                  <h3 className="flex items-center gap-2 mb-4">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                    Job Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-1">Current Position *</label>
                      <input
                        type="text"
                        value={extractedData.position}
                        onChange={(e) => updateField('position', e.target.value)}
                        disabled={!editMode}
                        className={`w-full px-4 py-2 border rounded-lg ${editMode ? 'bg-white' : 'bg-gray-100'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Years of Experience *</label>
                      <input
                        type="text"
                        value={extractedData.experience}
                        onChange={(e) => updateField('experience', e.target.value)}
                        disabled={!editMode}
                        className={`w-full px-4 py-2 border rounded-lg ${editMode ? 'bg-white' : 'bg-gray-100'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Country of Interest *</label>
                      <input
                        type="text"
                        value={extractedData.countryOfInterest}
                        onChange={(e) => updateField('countryOfInterest', e.target.value)}
                        disabled={!editMode}
                        className={`w-full px-4 py-2 border rounded-lg ${editMode ? 'bg-white' : 'bg-gray-100'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Previous Employment</label>
                      <textarea
                        value={extractedData.previousEmployment}
                        onChange={(e) => updateField('previousEmployment', e.target.value)}
                        disabled={!editMode}
                        rows={3}
                        className={`w-full px-4 py-2 border rounded-lg ${editMode ? 'bg-white' : 'bg-gray-100'}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Skills & Languages */}
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <h3 className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-green-600" />
                    Skills & Languages
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-1">Skills (comma separated)</label>
                      <textarea
                        value={extractedData.skills}
                        onChange={(e) => updateField('skills', e.target.value)}
                        disabled={!editMode}
                        rows={3}
                        className={`w-full px-4 py-2 border rounded-lg ${editMode ? 'bg-white' : 'bg-gray-100'}`}
                        placeholder="e.g. Microsoft Excel, Customer Service, Team Leadership"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Languages (comma separated)</label>
                      <input
                        type="text"
                        value={extractedData.languages}
                        onChange={(e) => updateField('languages', e.target.value)}
                        disabled={!editMode}
                        className={`w-full px-4 py-2 border rounded-lg ${editMode ? 'bg-white' : 'bg-gray-100'}`}
                        placeholder="e.g. English, Arabic, Urdu"
                      />
                    </div>
                  </div>
                </div>

                {/* Education & Certifications */}
                <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                  <h3 className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-yellow-600" />
                    Education & Certifications
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-1">Education</label>
                      <textarea
                        value={extractedData.education}
                        onChange={(e) => updateField('education', e.target.value)}
                        disabled={!editMode}
                        rows={2}
                        className={`w-full px-4 py-2 border rounded-lg ${editMode ? 'bg-white' : 'bg-gray-100'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Certifications (comma separated)</label>
                      <textarea
                        value={extractedData.certifications}
                        onChange={(e) => updateField('certifications', e.target.value)}
                        disabled={!editMode}
                        rows={2}
                        className={`w-full px-4 py-2 border rounded-lg ${editMode ? 'bg-white' : 'bg-gray-100'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Passport Number</label>
                      <input
                        type="text"
                        value={extractedData.passportNumber || ''}
                        onChange={(e) => updateField('passportNumber', e.target.value)}
                        disabled={!editMode}
                        className={`w-full px-4 py-2 border rounded-lg ${editMode ? 'bg-white' : 'bg-gray-100'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Passport Expiry</label>
                      <input
                        type="date"
                        value={extractedData.passportExpiry || ''}
                        onChange={(e) => updateField('passportExpiry', e.target.value)}
                        disabled={!editMode}
                        className={`w-full px-4 py-2 border rounded-lg ${editMode ? 'bg-white' : 'bg-gray-100'}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {extractedData.summary && (
                <div className="mt-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-gray-600" />
                    Professional Summary
                  </h3>
                  <textarea
                    value={extractedData.summary}
                    onChange={(e) => updateField('summary', e.target.value)}
                    disabled={!editMode}
                    rows={4}
                    className={`w-full px-4 py-2 border rounded-lg ${editMode ? 'bg-white' : 'bg-gray-100'}`}
                  />
                </div>
              )}

              {/* Warning */}
              {extractedData.confidence.overall < 0.8 && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <strong>Low Confidence:</strong> Some extracted data may not be accurate. Please review and edit as needed before saving.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-6 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-600">
                Original CV will be saved with this candidate profile
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save to Candidates
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error fallback when review stage has no structured data
  if (stage === 'review' && !extractedData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Parsing Not Available</h2>
          <p className="text-gray-600">{errorMessage || 'Result not available'}</p>
          <div className="mt-6">
            <button onClick={onClose} className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Mock function to simulate AI extraction
// In production, this would call OpenAI API
function mockExtractData(cv: IncomingCV): ExtractedData {
  // This simulates what OpenAI would return
  return {
    name: cv.senderName,
    email: cv.senderContact.includes('@') ? cv.senderContact : 'extracted.email@example.com',
    phone: cv.senderContact.includes('+') ? cv.senderContact : '+92 300 1234567',
    nationality: 'Pakistani',
    age: 32,
    position: 'Construction Worker',
    experience: '5',
    countryOfInterest: 'Saudi Arabia',
    skills: 'Masonry, Carpentry, Concrete Work, Safety Protocols',
    languages: 'Urdu, English, Arabic (Basic)',
    education: 'Matric (10th Grade)',
    certifications: 'Construction Safety Certificate, Heavy Machinery Operation',
    previousEmployment: 'ABC Construction Company (2018-2023) - Construction Worker',
    passportNumber: 'AB1234567',
    passportExpiry: '2027-12-31',
    summary: 'Experienced construction worker with 5+ years in residential and commercial projects. Skilled in masonry, carpentry, and safety compliance. Seeking opportunities in Gulf countries.',
    confidence: {
      overall: 0.92,
      name: 0.98,
      contact: 0.95,
      experience: 0.88
    }
  };
}
