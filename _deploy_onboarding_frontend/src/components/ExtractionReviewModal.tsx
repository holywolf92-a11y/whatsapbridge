import React, { useState, useEffect } from 'react';
import { X, Check, AlertTriangle, Clock, User, Bot } from 'lucide-react';
import { apiClient } from '../lib/apiClient';

interface ExtractedData {
  nationality?: string;
  position?: string;
  experience_years?: number;
  country_of_interest?: string;
  skills?: string[];
  languages?: string[];
  education?: string;
  certifications?: string[];
  internships?: string[];
  previous_employment?: string;
  passport_expiry?: string;
  professional_summary?: string;
  extraction_confidence?: Record<string, number>;
}

interface ExtractionReviewModalProps {
  candidateId: string;
  extractedData: ExtractedData;
  onClose: () => void;
  onApprove: (data: ExtractedData, notes?: string) => void;
  onReject: (notes: string) => void;
}

export function ExtractionReviewModal({
  candidateId,
  extractedData,
  onClose,
  onApprove,
  onReject
}: ExtractionReviewModalProps) {
  const [editedData, setEditedData] = useState<ExtractedData>(extractedData);
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [candidateId]);

  const loadHistory = async () => {
    try {
      const response = await apiClient.getExtractionHistory(candidateId);
      setHistory(response.history || []);
    } catch (error) {
      console.error('Failed to load extraction history:', error);
    }
  };

  const getConfidenceColor = (confidence?: number): string => {
    if (!confidence) return 'text-gray-400';
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence?: number): string => {
    if (!confidence) return 'Unknown';
    if (confidence >= 0.9) return 'High';
    if (confidence >= 0.7) return 'Medium';
    return 'Low';
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(editedData, notes);
      onClose();
    } catch (error) {
      console.error('Failed to approve extraction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setLoading(true);
    try {
      await onReject(notes);
      onClose();
    } catch (error) {
      console.error('Failed to reject extraction:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof ExtractedData, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Review Extracted Data</h2>
            <p className="text-sm text-gray-600 mt-1">
              Review and edit the automatically extracted CV data before saving
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Extraction Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-800">
              <Bot className="w-5 h-5" />
              <span className="font-semibold">AI-Extracted Data</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              This data was automatically extracted from the CV. Please review and correct any errors.
            </p>
          </div>

          {/* Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nationality
                {editedData.extraction_confidence?.nationality && (
                  <span className={`ml-2 text-xs ${getConfidenceColor(editedData.extraction_confidence.nationality)}`}>
                    ({getConfidenceLabel(editedData.extraction_confidence.nationality)} confidence)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={editedData.nationality || ''}
                onChange={(e) => updateField('nationality', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position
                {editedData.extraction_confidence?.position && (
                  <span className={`ml-2 text-xs ${getConfidenceColor(editedData.extraction_confidence.position)}`}>
                    ({getConfidenceLabel(editedData.extraction_confidence.position)} confidence)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={editedData.position || ''}
                onChange={(e) => updateField('position', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience
                {editedData.extraction_confidence?.experience_years && (
                  <span className={`ml-2 text-xs ${getConfidenceColor(editedData.extraction_confidence.experience_years)}`}>
                    ({getConfidenceLabel(editedData.extraction_confidence.experience_years)} confidence)
                  </span>
                )}
              </label>
              <input
                type="number"
                value={editedData.experience_years || ''}
                onChange={(e) => updateField('experience_years', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country of Interest
                {editedData.extraction_confidence?.country_of_interest && (
                  <span className={`ml-2 text-xs ${getConfidenceColor(editedData.extraction_confidence.country_of_interest)}`}>
                    ({getConfidenceLabel(editedData.extraction_confidence.country_of_interest)} confidence)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={editedData.country_of_interest || ''}
                onChange={(e) => updateField('country_of_interest', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passport Expiry
              </label>
              <input
                type="date"
                value={editedData.passport_expiry || ''}
                onChange={(e) => updateField('passport_expiry', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Education
                {editedData.extraction_confidence?.education && (
                  <span className={`ml-2 text-xs ${getConfidenceColor(editedData.extraction_confidence.education)}`}>
                    ({getConfidenceLabel(editedData.extraction_confidence.education)} confidence)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={editedData.education || ''}
                onChange={(e) => updateField('education', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Arrays - Skills, Languages, Certifications */}
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills (comma-separated)
                {editedData.extraction_confidence?.skills && (
                  <span className={`ml-2 text-xs ${getConfidenceColor(editedData.extraction_confidence.skills)}`}>
                    ({getConfidenceLabel(editedData.extraction_confidence.skills)} confidence)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={editedData.skills?.join(', ') || ''}
                onChange={(e) => updateField('skills', e.target.value.split(',').map(s => s.trim()))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Languages (comma-separated)
                {editedData.extraction_confidence?.languages && (
                  <span className={`ml-2 text-xs ${getConfidenceColor(editedData.extraction_confidence.languages)}`}>
                    ({getConfidenceLabel(editedData.extraction_confidence.languages)} confidence)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={editedData.languages?.join(', ') || ''}
                onChange={(e) => updateField('languages', e.target.value.split(',').map(s => s.trim()))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certifications (comma-separated)
                {editedData.extraction_confidence?.certifications && (
                  <span className={`ml-2 text-xs ${getConfidenceColor(editedData.extraction_confidence.certifications)}`}>
                    ({getConfidenceLabel(editedData.extraction_confidence.certifications)} confidence)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={editedData.certifications?.join(', ') || ''}
                onChange={(e) => updateField('certifications', e.target.value.split(',').map(s => s.trim()))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internships (comma-separated)
                {editedData.extraction_confidence?.internships && (
                  <span className={`ml-2 text-xs ${getConfidenceColor(editedData.extraction_confidence.internships)}`}>
                    ({getConfidenceLabel(editedData.extraction_confidence.internships)} confidence)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={editedData.internships?.join(', ') || ''}
                onChange={(e) => updateField('internships', e.target.value.split(',').map(s => s.trim()))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Text Areas */}
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Previous Employment
                {editedData.extraction_confidence?.previous_employment && (
                  <span className={`ml-2 text-xs ${getConfidenceColor(editedData.extraction_confidence.previous_employment)}`}>
                    ({getConfidenceLabel(editedData.extraction_confidence.previous_employment)} confidence)
                  </span>
                )}
              </label>
              <textarea
                value={editedData.previous_employment || ''}
                onChange={(e) => updateField('previous_employment', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professional Summary
                {editedData.extraction_confidence?.professional_summary && (
                  <span className={`ml-2 text-xs ${getConfidenceColor(editedData.extraction_confidence.professional_summary)}`}>
                    ({getConfidenceLabel(editedData.extraction_confidence.professional_summary)} confidence)
                  </span>
                )}
              </label>
              <textarea
                value={editedData.professional_summary || ''}
                onChange={(e) => updateField('professional_summary', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about the review or corrections made..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Extraction History */}
          {history.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                <Clock className="w-4 h-4" />
                {showHistory ? 'Hide' : 'Show'} Extraction History ({history.length})
              </button>
              
              {showHistory && (
                <div className="mt-4 space-y-3">
                  {history.map((item, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {item.extraction_source === 'automated' ? (
                            <Bot className="w-4 h-4 text-blue-600" />
                          ) : (
                            <User className="w-4 h-4 text-green-600" />
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {item.extraction_source === 'automated' ? 'AI Extraction' : 'Human Review'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(item.extracted_at).toLocaleString()}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-gray-600">{item.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <button
            onClick={handleReject}
            disabled={loading}
            className="px-6 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Reject
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Approve & Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
