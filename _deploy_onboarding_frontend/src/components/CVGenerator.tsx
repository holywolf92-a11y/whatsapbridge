import { useState } from 'react';
import { FileText, Download, Eye, X, User, Briefcase, Award, Globe, Calendar, MapPin, Phone, Mail, Shield, Building2 } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  nationality: string;
  countryOfInterest: string;
  experience: string;
  age?: number;
  passportNumber?: string;
  passportExpiry?: string;
  skills?: string;
  languages?: string;
  previousEmployment?: string;
  education?: string;
  certifications?: string;
}

interface CVGeneratorProps {
  candidate: Candidate;
  onClose: () => void;
}

type CVVersion = 'employer-safe' | 'internal' | 'both';
type CVTemplate = 'professional' | 'modern' | 'compact';

export function CVGenerator({ candidate, onClose }: CVGeneratorProps) {
  const [cvVersion, setCvVersion] = useState<CVVersion>('employer-safe');
  const [template, setTemplate] = useState<CVTemplate>('professional');
  const [showPreview, setShowPreview] = useState(false);

  const handleDownloadPDF = () => {
    // In production, this would generate actual PDF
    window.print();
  };

  const handleDownloadBoth = () => {
    alert('Downloading both Employer-Safe and Internal versions...');
    // In production, this would generate both PDFs
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-xl my-8">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                  CV Generator - {candidate.name}
                </h2>
                <p className="text-gray-600 mt-1">Generate employer-safe or internal CVs</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CV Version Selection */}
              <div>
                <label className="block text-sm mb-3">CV Version</label>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-white transition-colors">
                    <input
                      type="radio"
                      name="cvVersion"
                      value="employer-safe"
                      checked={cvVersion === 'employer-safe'}
                      onChange={(e) => setCvVersion(e.target.value as CVVersion)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span className="font-medium">Employer-Safe CV</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Recommended</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Hides contact information (email, phone, address). Safe to share with employers.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-white transition-colors">
                    <input
                      type="radio"
                      name="cvVersion"
                      value="internal"
                      checked={cvVersion === 'internal'}
                      onChange={(e) => setCvVersion(e.target.value as CVVersion)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">Internal CV</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Includes all contact information. For internal use only.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm mb-3">CV Template</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setTemplate('professional')}
                    className={`p-4 border-2 rounded-lg text-left hover:bg-white transition-colors ${
                      template === 'professional' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="text-sm font-medium">Professional</div>
                    <div className="text-xs text-gray-500 mt-1">Classic layout</div>
                  </button>
                  <button
                    onClick={() => setTemplate('modern')}
                    className={`p-4 border-2 rounded-lg text-left hover:bg-white transition-colors ${
                      template === 'modern' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="text-sm font-medium">Modern</div>
                    <div className="text-xs text-gray-500 mt-1">Clean design</div>
                  </button>
                  <button
                    onClick={() => setTemplate('compact')}
                    className={`p-4 border-2 rounded-lg text-left hover:bg-white transition-colors ${
                      template === 'compact' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="text-sm font-medium">Compact</div>
                    <div className="text-xs text-gray-500 mt-1">Space-saving</div>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download {cvVersion === 'employer-safe' ? 'Employer-Safe' : 'Internal'} CV
                  </button>
                  <button
                    onClick={handleDownloadBoth}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Both Versions
                  </button>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            {cvVersion === 'employer-safe' && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-800">
                      <strong>Employer-Safe Mode:</strong> This CV hides all contact information including email, phone number, 
                      and detailed address. Employers will need to contact you (the agency) to reach this candidate. 
                      This protects your commission and prevents direct hiring.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {cvVersion === 'internal' && (
              <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-orange-800">
                      <strong>Internal Use Only:</strong> This CV contains full contact information. 
                      Do NOT share this version with employers. Use this only for internal records and verification.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="p-6">
              <CVPreview 
                candidate={candidate} 
                version={cvVersion} 
                template={template}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CVPreviewProps {
  candidate: Candidate;
  version: CVVersion;
  template: CVTemplate;
}

function CVPreview({ candidate, version, template }: CVPreviewProps) {
  const isEmployerSafe = version === 'employer-safe';

  if (template === 'professional') {
    return (
      <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg max-w-4xl mx-auto print:border-0">
        {/* Watermark for employer-safe */}
        {isEmployerSafe && (
          <div className="bg-green-600 text-white text-center py-2 px-4 text-sm print:bg-green-600">
            <Shield className="w-4 h-4 inline-block mr-2" />
            EMPLOYER-SAFE VERSION - Contact: Falisha Manpower for candidate details
          </div>
        )}

        <div className="p-8 print:p-6">
          {/* Header */}
          <div className="border-b-4 border-blue-600 pb-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{candidate.name}</h1>
                <div className="text-xl text-blue-600 mb-3">{candidate.position}</div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {!isEmployerSafe && (
                    <>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        {candidate.phone}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        {candidate.email}
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Globe className="w-4 h-4" />
                    Nationality: {candidate.nationality}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    Seeking: {candidate.countryOfInterest}
                  </div>
                </div>
              </div>

              {/* Agency Branding */}
              <div className="text-right print:block">
                <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white text-2xl mb-2">
                  FM
                </div>
                <div className="text-xs text-gray-600">
                  Presented by<br />
                  <strong>Falisha Manpower</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Professional Summary
            </h2>
            <p className="text-gray-700">
              Experienced {candidate.position} with {candidate.experience} of hands-on experience. 
              Seeking opportunities in {candidate.countryOfInterest}. Highly skilled professional 
              with proven track record in the field.
            </p>
          </div>

          {/* Experience */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Work Experience
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-gray-900">{candidate.position}</div>
                    <div className="text-sm text-gray-600">
                      {candidate.previousEmployment || 'Previous Employer'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {candidate.experience}
                  </div>
                </div>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>Performed all duties related to {candidate.position} position</li>
                  <li>Maintained high standards of quality and safety</li>
                  <li>Worked effectively in team environments</li>
                  <li>Completed all assigned tasks on time</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Skills */}
          {candidate.skills && typeof candidate.skills === 'string' && candidate.skills.trim() && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Skills & Competencies
              </h2>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.split(',').map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {candidate.languages && typeof candidate.languages === 'string' && candidate.languages.trim() && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                Languages
              </h2>
              <div className="flex flex-wrap gap-2">
                {candidate.languages.split(',').map((lang, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {lang.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {candidate.certifications && typeof candidate.certifications === 'string' && candidate.certifications.trim() && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Certifications & Licenses
              </h2>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {candidate.certifications.split(',').map((cert, idx) => (
                  <li key={idx}>{cert.trim()}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Passport Information */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Travel Documents
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Passport Status:</span>{' '}
                <span className="font-semibold text-green-600">Valid</span>
              </div>
              {!isEmployerSafe && candidate.passportNumber && (
                <div>
                  <span className="text-gray-600">Passport Number:</span>{' '}
                  <span className="font-semibold">{candidate.passportNumber}</span>
                </div>
              )}
              {candidate.passportExpiry && (
                <div>
                  <span className="text-gray-600">Expiry Date:</span>{' '}
                  <span className="font-semibold">{candidate.passportExpiry}</span>
                </div>
              )}
              <div>
                <span className="text-gray-600">Availability:</span>{' '}
                <span className="font-semibold text-green-600">Ready to Travel</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-gray-200 pt-6 mt-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-900 font-semibold mb-1">
                    For recruitment inquiries, please contact:
                  </p>
                  <p className="text-blue-800">
                    <strong>Falisha Manpower Services</strong><br />
                    Email: info@falishamanpower.com<br />
                    Phone: +92 XXX XXXXXXX<br />
                    {isEmployerSafe && (
                      <span className="text-xs text-blue-700 mt-2 block">
                        Note: Candidate contact information is available upon request for serious opportunities.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-center text-xs text-gray-500 mt-4">
              CV Generated on {new Date().toLocaleDateString()} | Reference: {candidate.id}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Add other templates (modern, compact) later
  return <div>Template preview coming soon...</div>;
}