import { X, Download, Share2, Briefcase, MapPin, Calendar, Award, Star, Globe, Languages, Car, Shield, FileText, CheckCircle, Link2, Copy, Check } from 'lucide-react';
import { Candidate } from '../lib/mockData';
import { generateCVShareLink, copyToClipboard } from '../lib/linkUtils';
import { useState } from 'react';

interface EmployerSafeCVProps {
  candidate: Candidate;
  onClose: () => void;
}

export function EmployerSafeCV({ candidate, onClose }: EmployerSafeCVProps) {
  const [copied, setCopied] = useState(false);
  const shareLink = generateCVShareLink(candidate);

  const handleCopyLink = async () => {
    await copyToClipboard(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
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
            onClick={onClose}
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
              onClick={handleCopyLink}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-medium ${
                copied 
                  ? 'bg-green-600 text-white' 
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {copied ? (
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
        <div className="flex-1 overflow-y-auto p-8 print:p-0">
          <div className="max-w-4xl mx-auto bg-white">
            {/* Header Section */}
            <div className="text-center mb-8 pb-6 border-b-4 border-blue-600">
              <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-xl">
                <span className="text-5xl">{candidate.name[0]}</span>
              </div>
              <h1 className="text-4xl mb-2">{candidate.name}</h1>
              <p className="text-xl text-gray-600 mb-2">{candidate.position}</p>
              <div className="flex items-center justify-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <span>{candidate.nationality}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>Seeking: {candidate.country}</span>
                </div>
              </div>
            </div>

            {/* Contact Information - HIDDEN FOR EMPLOYERS */}
            <div className="mb-8 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-yellow-900 mb-1">Contact Information Protected</h3>
                  <p className="text-sm text-yellow-800">
                    For privacy and security, direct contact details have been removed from this CV. 
                    To connect with this candidate, please contact Falisha Manpower recruitment team.
                  </p>
                  <div className="mt-3 p-3 bg-white rounded border border-yellow-300">
                    <p className="text-sm font-semibold text-gray-900">📧 Contact via Recruitment Agency:</p>
                    <p className="text-sm text-gray-700 mt-1">Email: recruitment@falisha.com</p>
                    <p className="text-sm text-gray-700">Phone: +1 (555) 123-4567</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Summary */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-blue-600" />
                Professional Summary
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">Experience</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{candidate.experience} Years</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-gray-900">AI Match Score</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{candidate.aiScore?.toFixed(1)}/10</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Highly skilled {candidate.position} with {candidate.experience} years of professional experience. 
                Demonstrates strong expertise in {candidate.skills.slice(0, 3).join(', ')}, and more. 
                Seeking opportunities in {candidate.country} to contribute technical expertise and drive operational excellence.
              </p>
            </div>

            {/* Core Skills */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
                <Award className="w-6 h-6 text-blue-600" />
                Core Skills & Competencies
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {candidate.skills.map((skill, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 text-gray-800 font-medium text-center"
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </div>

            {/* Professional Experience */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-blue-600" />
                Professional Experience
              </h2>
              <div className="space-y-6">
                <div className="border-l-4 border-blue-600 pl-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{candidate.position}</h3>
                      <p className="text-gray-600">Various Companies</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-medium text-sm">
                      {candidate.experience} years
                    </span>
                  </div>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Executed complex {candidate.position.toLowerCase()} projects with high precision and quality</li>
                    <li>Collaborated with cross-functional teams to deliver optimal solutions</li>
                    <li>Maintained strict adherence to safety protocols and industry standards</li>
                    <li>Demonstrated expertise in {candidate.skills.slice(0, 2).join(' and ')}</li>
                    <li>Consistently exceeded performance targets and quality benchmarks</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Additional Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">Nationality</span>
                  </div>
                  <p className="text-gray-700">{candidate.nationality}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">Preferred Location</span>
                  </div>
                  <p className="text-gray-700">{candidate.country}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">Passport Status</span>
                  </div>
                  <p className={`font-medium ${candidate.passportAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {candidate.passportAvailable ? 'Available & Valid' : 'Processing'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <span className="font-semibold text-gray-900">Availability</span>
                  </div>
                  <p className="text-gray-700">Immediate</p>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-12 pt-6 border-t-2 border-gray-300">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
                <div className="flex items-start gap-3">
                  <Shield className="w-8 h-8 text-blue-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Protected by Falisha Manpower</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      This is an employer-safe CV generated by Falisha Manpower recruitment system. 
                      Contact information has been protected to prevent unauthorized direct contact and ensure 
                      proper recruitment procedures are followed.
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="font-semibold text-gray-900">Share Link: </span>
                        <span className="text-blue-600 font-mono text-xs break-all">{shareLink}</span>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      <p><strong>For more information or to arrange interviews:</strong></p>
                      <p>Contact Falisha Manpower at recruitment@falisha.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Watermark */}
            <div className="mt-6 text-center text-xs text-gray-400">
              <p>Generated by Falisha Manpower AI Recruitment System</p>
              <p>Candidate ID: {candidate.id} | Generated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:p-0, .print\\:p-0 * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-0 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}
