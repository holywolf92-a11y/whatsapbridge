import { useState } from 'react';
import { X, Mail, Send, Users, Building2 } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { toast } from 'sonner';

interface SendToEmployerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCandidateIds: string[];
  candidates: Array<{
    id: string;
    name: string;
    position?: string;
  }>;
}

export function SendToEmployerModal({ isOpen, onClose, selectedCandidateIds, candidates }: SendToEmployerModalProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'select'>('manual');
  const [employerEmail, setEmployerEmail] = useState('');
  const [selectedEmployerId, setSelectedEmployerId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [employers, setEmployers] = useState<Array<{ id: string; company_name: string; email?: string | null }>>([]);
  const [loadingEmployers, setLoadingEmployers] = useState(false);

  // Debug logging
  console.log('[SendToEmployerModal] Props received:', {
    selectedCandidateIds,
    selectedCandidateIdsLength: selectedCandidateIds?.length,
    candidatesLength: candidates?.length,
    candidatesList: candidates?.map(c => ({ id: c.id, name: c.name }))
  });

  // Load employers when switching to select tab
  const loadEmployers = async () => {
    if (employers.length > 0) return; // Already loaded
    
    try {
      setLoadingEmployers(true);
      const response = await apiClient.get<{ success: boolean; employers: Array<{ id: string; company_name: string; email?: string | null }> }>('/email/employers');
      setEmployers(response.employers || []);
    } catch (error: any) {
      console.error('Failed to load employers:', error);
      toast.error('Failed to load employers list');
    } finally {
      setLoadingEmployers(false);
    }
  };

  const handleTabChange = (tab: 'manual' | 'select') => {
    setActiveTab(tab);
    if (tab === 'select') {
      loadEmployers();
    }
  };

  const handleSend = async () => {
    // Validation
    if (activeTab === 'manual' && !employerEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    if (activeTab === 'select' && !selectedEmployerId) {
      toast.error('Please select an employer');
      return;
    }

    if (selectedCandidateIds.length === 0) {
      toast.error('No candidates selected');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        candidateIds: selectedCandidateIds,
        employerEmail: activeTab === 'manual' ? employerEmail.trim() : undefined,
        employerId: activeTab === 'select' ? selectedEmployerId : undefined,
        message: message.trim() || undefined,
      };

      console.log('[SendToEmployerModal] Sending payload:', payload);
      console.log('[SendToEmployerModal] candidateIds type:', typeof selectedCandidateIds, Array.isArray(selectedCandidateIds));
      console.log('[SendToEmployerModal] candidateIds length:', selectedCandidateIds.length);
      console.log('[SendToEmployerModal] candidateIds content:', selectedCandidateIds);

      const response = await apiClient.post<{ success: boolean; message: string; candidateCount: number }>('/email/send-to-employer', payload);

      toast.success(response.message || `Email sent successfully to ${employerEmail}`);
      
      // Reset and close
      setEmployerEmail('');
      setSelectedEmployerId('');
      setMessage('');
      onClose();

    } catch (error: any) {
      console.error('[SendToEmployerModal] Failed to send email:', error);
      const errorMessage = error.message || 'Failed to send email';
      // Try to extract the actual error from the fetch error message
      const match = errorMessage.match(/\{.*\}/);
      if (match) {
        try {
          const errorObj = JSON.parse(match[0]);
          toast.error(errorObj.error || errorMessage);
        } catch {
          toast.error(errorMessage);
        }
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Get selected candidates details
  const selectedCandidates = candidates.filter(c => selectedCandidateIds.includes(c.id));

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#111827' }}>
                Send to Employer
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
                {selectedCandidateIds.length} candidate{selectedCandidateIds.length > 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            padding: '4px',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px'
          }}>
            <button
              onClick={() => handleTabChange('manual')}
              style={{
                flex: 1,
                padding: '10px 16px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: activeTab === 'manual' ? 'white' : 'transparent',
                color: activeTab === 'manual' ? '#111827' : '#6b7280',
                boxShadow: activeTab === 'manual' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Mail className="w-4 h-4" />
                <span>Manual Email</span>
              </div>
            </button>
            <button
              onClick={() => handleTabChange('select')}
              style={{
                flex: 1,
                padding: '10px 16px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: activeTab === 'select' ? 'white' : 'transparent',
                color: activeTab === 'select' ? '#111827' : '#6b7280',
                boxShadow: activeTab === 'select' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Building2 className="w-4 h-4" />
                <span>Select Employer</span>
              </div>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'manual' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Employer Email Address <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="email"
                value={employerEmail}
                onChange={(e) => setEmployerEmail(e.target.value)}
                placeholder="employer@company.com"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
          )}

          {activeTab === 'select' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Select Employer <span style={{ color: '#ef4444' }}>*</span>
              </label>
              {loadingEmployers ? (
                <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                  Loading employers...
                </div>
              ) : employers.length === 0 ? (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#92400e'
                }}>
                  No employers found. Please use manual email entry.
                </div>
              ) : (
                <select
                  value={selectedEmployerId}
                  onChange={(e) => setSelectedEmployerId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Choose an employer...</option>
                  {employers.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.company_name}{emp.email ? ` (${emp.email})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Optional Message */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Additional Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personalized message for the employer..."
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* Selected Candidates Preview */}
          <div style={{
            padding: '16px',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Users className="w-4 h-4 text-gray-600" />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                Selected Candidates ({selectedCandidates.length})
              </span>
            </div>
            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {selectedCandidates.map((candidate, index) => (
                <div
                  key={candidate.id}
                  style={{
                    padding: '8px 0',
                    borderBottom: index < selectedCandidates.length - 1 ? '1px solid #e5e7eb' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: '14px', color: '#111827' }}>{candidate.name}</span>
                  <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                    {candidate.position || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: loading ? 0.5 : 1
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#f9fafb')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = 'white')}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                borderRadius: '8px',
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Sending...' : 'Send Email'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
