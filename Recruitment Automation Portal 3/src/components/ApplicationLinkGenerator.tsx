import { useState } from 'react';
import { Link2, Copy, QrCode, Check, Share2, MessageSquare, Mail, Eye } from 'lucide-react';
import { ApplicationFormPreview } from './ApplicationFormPreview';

export function ApplicationLinkGenerator() {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // In production, this would be your actual domain
  const applicationLink = 'https://falishamanpower.com/apply';
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(applicationLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `🌟 *Overseas Job Opportunity* 🌟\n\n` +
      `Apply now with Falisha Manpower for employment in Gulf countries!\n\n` +
      `📝 Fill out our online application form:\n${applicationLink}\n\n` +
      `We're currently recruiting for positions in UAE, Saudi Arabia, Qatar, and more.\n\n` +
      `Apply today!`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Apply for Overseas Employment - Falisha Manpower');
    const body = encodeURIComponent(
      `Dear Candidate,\n\n` +
      `Thank you for your interest in overseas employment opportunities.\n\n` +
      `Please complete our online application form at:\n${applicationLink}\n\n` +
      `We are currently recruiting for various positions in Gulf countries including UAE, Saudi Arabia, Qatar, Oman, and more.\n\n` +
      `Best regards,\nFalisha Manpower Team`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const generateQRCode = () => {
    // Using a free QR code API
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(applicationLink)}`;
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = generateQRCode();
    link.download = 'falisha-application-qr.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>Application Form Link</h2>
        <p className="text-gray-600">Share this link with candidates to collect applications</p>
      </div>

      {/* Link Display */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="block text-sm mb-3">Public Application Form URL</label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Link2 className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={applicationLink}
              readOnly
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
            />
          </div>
          <button
            onClick={copyToClipboard}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            {copied ? (
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
      </div>

      {/* Quick Share Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={shareViaWhatsApp}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow text-left"
        >
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <MessageSquare className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="mb-2">Share via WhatsApp</h3>
          <p className="text-sm text-gray-600">Send the application link directly via WhatsApp</p>
        </button>

        <button
          onClick={shareViaEmail}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow text-left"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="mb-2">Share via Email</h3>
          <p className="text-sm text-gray-600">Email the application link to candidates</p>
        </button>

        <button
          onClick={() => setShowQR(!showQR)}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow text-left"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <QrCode className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="mb-2">Generate QR Code</h3>
          <p className="text-sm text-gray-600">Create a scannable QR code for the form</p>
        </button>
      </div>

      {/* QR Code Display */}
      {showQR && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3>QR Code</h3>
            <button
              onClick={downloadQR}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              Download QR Code
            </button>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200 mb-4">
              <img
                src={generateQRCode()}
                alt="Application Form QR Code"
                className="w-64 h-64"
              />
            </div>
            <p className="text-sm text-gray-600 text-center max-w-md">
              Print this QR code and display it at your office, recruitment centers, or share it on social media. 
              Candidates can scan it to directly access the application form.
            </p>
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-blue-900 mb-4">How to Use</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
              1
            </div>
            <div>
              <p className="text-sm text-blue-800">
                <strong>Share the Link:</strong> Copy and paste the URL in your WhatsApp status, Facebook posts, or send directly to candidates
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
              2
            </div>
            <div>
              <p className="text-sm text-blue-800">
                <strong>Use QR Code:</strong> Print the QR code and display it at your office or recruitment centers for easy scanning
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
              3
            </div>
            <div>
              <p className="text-sm text-blue-800">
                <strong>Track Applications:</strong> All submissions will automatically appear in the Candidate Management section
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
              4
            </div>
            <div>
              <p className="text-sm text-blue-800">
                <strong>Mobile Friendly:</strong> The form is fully optimized for mobile devices - candidates can apply from their phones
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Button */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="mb-4">Preview Form</h3>
        <p className="text-sm text-gray-600 mb-4">
          See how the application form looks to candidates before sharing
        </p>
        <button
          onClick={() => setShowPreview(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Eye className="w-4 h-4" />
          Open Form Preview
        </button>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Application Form Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <ApplicationFormPreview />
          </div>
        </div>
      )}
    </div>
  );
}