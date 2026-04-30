import { useState } from 'react';
import { Copy, Check, X, Link, FileText, ExternalLink } from 'lucide-react';
import { Candidate } from '../lib/mockData';
import { generateProfileLink, generateCVShareLink, copyToClipboard } from '../lib/linkUtils';

interface ShareLinksModalProps {
  candidate: Candidate;
  onClose: () => void;
}

export function ShareLinksModal({ candidate, onClose }: ShareLinksModalProps) {
  const [copiedProfile, setCopiedProfile] = useState(false);
  const [copiedCV, setCopiedCV] = useState(false);

  const profileLink = generateProfileLink(candidate);
  const cvShareLink = generateCVShareLink(candidate);

  const handleCopyProfile = async () => {
    await copyToClipboard(profileLink);
    setCopiedProfile(true);
    setTimeout(() => setCopiedProfile(false), 2000);
  };

  const handleCopyCV = async () => {
    await copyToClipboard(cvShareLink);
    setCopiedCV(true);
    setTimeout(() => setCopiedCV(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Share Links</h2>
              <p className="text-sm text-blue-100 mt-1">{candidate.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Link */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Link className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Profile Link</h3>
                <p className="text-xs text-gray-600">Shareable candidate profile page</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={profileLink}
                readOnly
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleCopyProfile}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-all ${
                  copiedProfile
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copiedProfile ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Use this link to share the full candidate profile with employers or team members
            </p>
          </div>

          {/* CV Share Link */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Recruiter CV Link</h3>
                <p className="text-xs text-gray-600">Employer-safe CV without contact info</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={cvShareLink}
                readOnly
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleCopyCV}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-all ${
                  copiedCV
                    ? 'bg-green-600 text-white'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {copiedCV ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              🔒 This CV hides contact information to prevent employer poaching
            </p>
          </div>

          {/* Quick Actions */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Share</h4>
            <div className="grid grid-cols-3 gap-2">
              <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" />
                WhatsApp
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Email
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" />
                SMS
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex items-center justify-between">
          <p className="text-xs text-gray-600">
            Links are permanent and don't expire
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
