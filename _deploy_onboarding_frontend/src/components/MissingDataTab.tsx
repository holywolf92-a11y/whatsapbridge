import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader, Pencil, Save, X, FileText, Clock, Mail, Paperclip, RefreshCw, MessageSquare } from 'lucide-react';
import { Candidate, CandidateReplyTrace } from '../lib/apiClient';
import { apiClient } from '../lib/apiClient';

interface MissingDataTabProps {
  candidate: Candidate;
  onFieldUpdate: (field: string, value: any) => Promise<void>;
}

interface MissingFieldInfo {
  field: string;
  label: string;
  source: string | null;
  canBeManuallyUpdated: boolean;
  hint: string;
}

export function MissingDataTab({ candidate, onFieldUpdate }: MissingDataTabProps) {
  const [missingFields, setMissingFields] = useState<MissingFieldInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [replyTrace, setReplyTrace] = useState<CandidateReplyTrace | null>(null);
  const [traceLoading, setTraceLoading] = useState(true);
  const [downloadingDocumentId, setDownloadingDocumentId] = useState<string | null>(null);
  const [expandedReplyId, setExpandedReplyId] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([fetchMissingFields(), fetchReplyTrace()]);
  }, [candidate.id]);

  const fetchMissingFields = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getMissingFields(candidate.id);
      setMissingFields(response.missing_fields_with_info || []);
    } catch (error: any) {
      console.error('Error fetching missing fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplyTrace = async () => {
    try {
      setTraceLoading(true);
      const response = await apiClient.getCandidateReplyTrace(candidate.id);
      setReplyTrace(response);
    } catch (error: any) {
      console.error('Error fetching reply trace:', error);
      setReplyTrace(null);
    } finally {
      setTraceLoading(false);
    }
  };

  const handleStartEdit = (field: MissingFieldInfo) => {
    setEditingField(field.field);
    // Get current value from candidate
    const currentValue = (candidate as any)[field.field] || '';
    setEditValue(currentValue);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleSave = async (field: string) => {
    if (!editValue.trim()) {
      alert('Please enter a value');
      return;
    }

    try {
      setSaving(true);
      await onFieldUpdate(field, editValue.trim());
      setEditingField(null);
      setEditValue('');
      await fetchMissingFields(); // Refresh missing fields
    } catch (error: any) {
      console.error('Error saving field:', error);
      alert(error?.message || 'Failed to save field');
    } finally {
      setSaving(false);
    }
  };

  const getFieldType = (field: string): 'text' | 'date' | 'number' | 'email' | 'tel' => {
    if (field.includes('date') || field.includes('dob') || field.includes('expiry')) return 'date';
    if (field.includes('email')) return 'email';
    if (field.includes('phone') || field.includes('tel')) return 'tel';
    if (field.includes('years') || field.includes('age') || field.includes('salary')) return 'number';
    return 'text';
  };

  const getFieldPlaceholder = (field: string): string => {
    const placeholders: Record<string, string> = {
      name: 'Full Name',
      email: 'email@example.com',
      phone: '+923001234567',
      date_of_birth: 'YYYY-MM-DD',
      passport_expiry: 'YYYY-MM-DD',
      nationality: 'Pakistani',
      country_of_interest: 'UAE',
      position: 'Software Engineer',
      experience_years: '5',
      father_name: 'Father\'s Name',
      cnic: '42301-1234567-1',
      passport: 'AB1234567',
    };
    return placeholders[field] || `Enter ${field.replace(/_/g, ' ')}`;
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Not available';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const handleDownloadDocument = async (documentId: string) => {
    try {
      setDownloadingDocumentId(documentId);
      const downloadUrl = await apiClient.getCandidateDocumentDownloadUrl(documentId);
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      console.error('Error getting document download URL:', error);
      alert(error?.message || 'Failed to get document download URL');
    } finally {
      setDownloadingDocumentId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading missing fields...</span>
      </div>
    );
  }

  if (missingFields.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-green-50 rounded-lg border-2 border-green-200">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All Required Fields Complete!</h3>
          <p className="text-gray-600">
            This candidate has all required fields populated. No missing data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-900 mb-1">
              {missingFields.length} Missing Field{missingFields.length !== 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-gray-700">
              These fields are required for the Excel Browser view. You can manually update them below, or wait for documents to be uploaded and processed.
            </p>
          </div>
        </div>
      </div>

      {/* Missing Fields List */}
      <div className="space-y-3">
        {missingFields.map((fieldInfo) => {
          const isEditing = editingField === fieldInfo.field;
          const fieldType = getFieldType(fieldInfo.field);
          const placeholder = getFieldPlaceholder(fieldInfo.field);

          return (
            <div
              key={fieldInfo.field}
              className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Field Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{fieldInfo.label}</h4>
                    {fieldInfo.source && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        fieldInfo.source === 'manual'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {fieldInfo.source}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{fieldInfo.hint}</p>

                  {/* Edit Form */}
                  {isEditing ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type={fieldType}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder={placeholder}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={saving}
                      />
                      <button
                        onClick={() => handleSave(fieldInfo.field)}
                        disabled={saving}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 italic">Not set</span>
                      <button
                        onClick={() => handleStartEdit(fieldInfo)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 text-sm"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Update
                      </button>
                    </div>
                  )}
                </div>

                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {fieldInfo.source === 'manual' ? (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    </div>
                  ) : fieldInfo.source ? (
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          About Missing Fields
        </h4>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>Fields marked as "manual" will never be overwritten by document extraction</li>
          <li>Fields awaiting documents will be automatically filled when documents are uploaded and processed</li>
          <li>You can manually update any missing field at any time</li>
          <li>Missing fields are calculated based on Excel Browser requirements</li>
        </ul>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              Reply Trace
            </h4>
            <p className="text-sm text-gray-600 mt-1">Sent emails, candidate replies, attached documents, and candidate updates for this profile.</p>
          </div>
          <button
            onClick={fetchReplyTrace}
            disabled={traceLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${traceLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {traceLoading ? (
          <div className="py-8 flex items-center justify-center text-gray-500">
            <Loader className="w-5 h-5 animate-spin mr-2" />
            Loading reply trace...
          </div>
        ) : !replyTrace ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
            Reply trace is not available for this candidate yet.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Tracking Token</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{replyTrace.candidate.emailTrackingToken || 'Not assigned'}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Last Sent</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{formatDateTime(replyTrace.candidate.lastSentAt)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Last Reply Processed</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{formatDateTime(replyTrace.candidate.lastReplyProcessedAt)}</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4">
                <h5 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Sent
                </h5>
                <div className="space-y-3">
                  {replyTrace.sentMessages.length === 0 ? (
                    <p className="text-sm text-gray-500">No outbound messages logged.</p>
                  ) : replyTrace.sentMessages.map((message) => (
                    <div key={message.id} className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                      <p className="text-sm font-medium text-gray-900">{message.subject || 'No subject'}</p>
                      <p className="text-xs text-gray-600 mt-1">{formatDateTime(message.sentAt)} · {message.provider || 'unknown provider'}</p>
                      <p className="text-xs text-gray-600 mt-1">Trigger: {message.trigger || 'n/a'}</p>
                      {(message.missingFields.length > 0 || message.missingDocs.length > 0) && (
                        <p className="text-xs text-gray-600 mt-1">Requested: {[...message.missingFields, ...message.missingDocs].join(', ')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h5 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  Replies
                </h5>
                <div className="space-y-3">
                  {replyTrace.replyMessages.length === 0 ? (
                    <p className="text-sm text-gray-500">No reply messages matched yet.</p>
                  ) : replyTrace.replyMessages.map((message) => (
                    <div key={message.id} className="rounded-lg bg-green-50 border border-green-100 p-3">
                      <p className="text-sm font-medium text-gray-900">{message.subject || 'No subject'}</p>
                      <p className="text-xs text-gray-600 mt-1">{message.from || 'Unknown sender'} · {formatDateTime(message.receivedAt)}</p>
                      <p className="text-xs text-gray-600 mt-1">Matched by {message.matchedBy || 'unknown'} · {message.attachmentCount} attachment{message.attachmentCount === 1 ? '' : 's'}</p>
                      {message.bodyPreview && (
                        <div className="mt-2 rounded-md bg-white/80 p-2 text-xs text-gray-700 whitespace-pre-wrap">
                          {expandedReplyId === message.id ? (message.bodyText || message.bodyPreview) : message.bodyPreview}
                        </div>
                      )}
                      {message.bodyText && message.bodyText.length > (message.bodyPreview?.length || 0) && (
                        <button
                          onClick={() => setExpandedReplyId((current) => current === message.id ? null : message.id)}
                          className="mt-2 inline-flex items-center gap-2 rounded-md border border-green-200 bg-white px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
                        >
                          {expandedReplyId === message.id ? 'Collapse Full Reply' : 'Expand Full Reply'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4">
                <h5 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
                  <Paperclip className="w-4 h-4 text-purple-600" />
                  Documents From Replies
                </h5>
                <div className="space-y-3">
                  {replyTrace.documents.length === 0 ? (
                    <p className="text-sm text-gray-500">No email-sourced documents linked yet.</p>
                  ) : replyTrace.documents.map((doc) => (
                    <div key={doc.id} className="rounded-lg bg-purple-50 border border-purple-100 p-3">
                      <p className="text-sm font-medium text-gray-900">{doc.fileName || 'Unnamed document'}</p>
                      <p className="text-xs text-gray-600 mt-1">{doc.documentType || doc.category || 'Unknown type'} · {doc.verificationStatus || 'pending'}</p>
                      <p className="text-xs text-gray-600 mt-1">{formatDateTime(doc.createdAt)}</p>
                      <button
                        onClick={() => handleDownloadDocument(doc.id)}
                        disabled={downloadingDocumentId === doc.id}
                        className="mt-2 inline-flex items-center gap-2 rounded-md border border-purple-200 bg-white px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50"
                      >
                        {downloadingDocumentId === doc.id ? (
                          <Loader className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FileText className="w-3.5 h-3.5" />
                        )}
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h5 className="font-medium text-gray-900 flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Candidate Updates
                </h5>
                <div className="space-y-3">
                  {replyTrace.candidateUpdates.length === 0 ? (
                    <p className="text-sm text-gray-500">No candidate field updates traced from replies yet.</p>
                  ) : replyTrace.candidateUpdates.map((update, index) => (
                    <div key={`${update.field}-${index}`} className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                      <p className="text-sm font-medium text-gray-900">{update.field.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-600 mt-1">Source: {update.source}</p>
                      <p className="text-xs text-gray-600 mt-1">{formatDateTime(update.updatedAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
