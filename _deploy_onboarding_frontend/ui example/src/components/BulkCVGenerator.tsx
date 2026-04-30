import { useState } from 'react';
import { FileText, Download, X, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import type { Candidate } from '../lib/mockData';

interface BulkCVGeneratorProps {
  candidates: Candidate[];
  onClose: () => void;
}

export function BulkCVGenerator({ candidates, onClose }: BulkCVGeneratorProps) {
  const [version, setVersion] = useState<'employer-safe' | 'internal'>('employer-safe');
  const [template, setTemplate] = useState<'professional' | 'modern' | 'compact'>('professional');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleGenerate = () => {
    setGenerating(true);
    setProgress(0);

    // Simulate PDF generation progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setGenerating(false);
          // In production, this would trigger actual PDF download
          alert(`Generated ${candidates.length} ${version === 'employer-safe' ? 'Employer-Safe' : 'Internal'} CVs!`);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                Bulk CV Generation
              </h2>
              <p className="text-gray-600 mt-1">
                Generate CVs for {candidates.length} selected candidate{candidates.length > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Selected Candidates */}
          <div>
            <label className="block text-sm mb-3">Selected Candidates</label>
            <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto border border-gray-200">
              <div className="space-y-2">
                {candidates.map((candidate, idx) => (
                  <div key={candidate.id} className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-xs">{candidate.name[0]}</span>
                    </div>
                    <div className="flex-1">
                      <p>{candidate.name}</p>
                      <p className="text-xs text-gray-500">{candidate.position}</p>
                    </div>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CV Version */}
          <div>
            <label className="block text-sm mb-3">CV Version</label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="version"
                  value="employer-safe"
                  checked={version === 'employer-safe'}
                  onChange={(e) => setVersion(e.target.value as 'employer-safe')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Employer-Safe CVs</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Recommended</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    No contact information - Safe to share with employers
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="version"
                  value="internal"
                  checked={version === 'internal'}
                  onChange={(e) => setVersion(e.target.value as 'internal')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Internal CVs</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Full contact information - For internal use only
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Template */}
          <div>
            <label className="block text-sm mb-3">CV Template</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setTemplate('professional')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  template === 'professional' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-medium">Professional</div>
                <div className="text-xs text-gray-500 mt-1">Classic layout</div>
              </button>
              <button
                onClick={() => setTemplate('modern')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  template === 'modern' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-medium">Modern</div>
                <div className="text-xs text-gray-500 mt-1">Clean design</div>
              </button>
              <button
                onClick={() => setTemplate('compact')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  template === 'compact' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-medium">Compact</div>
                <div className="text-xs text-gray-500 mt-1">Space-saving</div>
              </button>
            </div>
          </div>

          {/* Warning */}
          {version === 'employer-safe' ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                  <strong>Employer-Safe Mode:</strong> All {candidates.length} CVs will be generated without 
                  contact information. Employers must contact your agency to reach candidates.
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <strong>Warning:</strong> Internal CVs contain full contact information. 
                  Do NOT share these with employers.
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {generating && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Generating CVs...</span>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Output: {candidates.length} PDF file{candidates.length > 1 ? 's' : ''} in a ZIP archive
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {generating ? 'Generating...' : 'Generate & Download'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
