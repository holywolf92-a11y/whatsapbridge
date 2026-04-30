import React, { useState, useEffect } from 'react';
import { Mail, Download, Eye, CheckCircle, AlertCircle, Clock, Filter, Trash2 } from 'lucide-react';

interface InboxMessage {
  id: string;
  source: string;
  external_message_id: string;
  payload?: any;
  status: string;
  received_at: string;
  created_at: string;
}

interface Attachment {
  id: string;
  file_name: string;
  mime_type: string;
  sha256?: string;
  created_at?: string;
}

interface InboxUIProps {
  apiBaseUrl?: string;
}

export const InboxUI: React.FC<InboxUIProps> = ({ apiBaseUrl = 'http://localhost:1000/api' }) => {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [attachments, setAttachments] = useState<Record<string, Attachment[]>>({});
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);

  const getFromDisplay = (message: InboxMessage): string => {
    const payload = message.payload;
    if (!payload) return '';
    if (typeof payload.from === 'string' && payload.from.trim()) return payload.from;
    if (typeof payload.sender === 'string' && payload.sender.trim()) return payload.sender;
    if (typeof payload.phone === 'string' && payload.phone.trim()) return payload.phone;
    if (typeof payload.email === 'string' && payload.email.trim()) return payload.email;
    if (typeof payload.wa_id === 'string' && payload.wa_id.trim()) return payload.wa_id;

    const contactWaId = payload?.contacts?.[0]?.wa_id;
    if (typeof contactWaId === 'string' && contactWaId.trim()) return contactWaId;

    const contactName = payload?.contacts?.[0]?.profile?.name;
    if (typeof contactName === 'string' && contactName.trim()) return contactName;

    return '';
  };

  const getMessagePreview = (message: InboxMessage): string => {
    const payload = message.payload;
    if (!payload) return '';

    if (message.source === 'whatsapp') {
      if (typeof payload.text === 'string') return payload.text;
      if (typeof payload.caption === 'string') return payload.caption;
      if (typeof payload.type === 'string') return `[${payload.type}]`;
      return '';
    }

    if (message.source === 'gmail') {
      const subject = typeof payload.subject === 'string' ? payload.subject : '';
      return subject || '';
    }

    if (typeof payload.text === 'string') return payload.text;
    if (typeof payload.message === 'string') return payload.message;
    return '';
  };

  // Filters
  const [filterSource, setFilterSource] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  // Pagination
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  // Fetch messages with filters
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterSource) params.append('source', filterSource);
      if (filterStatus) params.append('status', filterStatus);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());

      const response = await fetch(`${apiBaseUrl}/cv-inbox?${params.toString()}`);
      const data = await response.json();
      setMessages(data.messages || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch attachments for a message
  const fetchAttachments = async (messageId: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/cv-inbox/${messageId}/attachments`);
      const data = await response.json();
      setAttachments((prev) => ({ ...prev, [messageId]: data }));
    } catch (err) {
      console.error('Failed to fetch attachments:', err);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [offset, filterSource, filterStatus]);

  const handleStatusChange = async (messageId: string, newStatus: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/cv-inbox/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, status: newStatus } : msg))
        );
        if (selectedMessage?.id === messageId) {
          setSelectedMessage({ ...selectedMessage, status: newStatus });
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await fetch(`${apiBaseUrl}/cv-inbox/${messageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const handleViewAttachments = async (message: InboxMessage) => {
    setSelectedMessage(message);
    if (!attachments[message.id]) {
      await fetchAttachments(message.id);
    }
  };

  const handleDownloadAttachment = (messageId: string, attachmentId: string, fileName: string) => {
    // Trigger download via API
    const downloadUrl = `${apiBaseUrl}/cv-inbox/${messageId}/attachments/${attachmentId}/download`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      whatsapp: 'bg-green-100 text-green-800',
      gmail: 'bg-blue-100 text-blue-800',
      api: 'bg-purple-100 text-purple-800',
    };
    return colors[source] || 'bg-gray-100 text-gray-800';
  };

  const pageCount = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Inbox Manager</h1>
          </div>
          <p className="text-gray-600">
            {total} total messages · Displaying {messages.length} on page {currentPage}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Source Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select
                value={filterSource}
                onChange={(e) => {
                  setFilterSource(e.target.value);
                  setOffset(0);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Sources</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="gmail">Gmail</option>
                <option value="api">API</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setOffset(0);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processed">Processed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Messages Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No messages found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Source</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">From</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Message</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">External ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Received</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {messages.map((message) => (
                    <tr key={message.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSourceColor(message.source)}`}>
                          {message.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="max-w-xs truncate" title={getFromDisplay(message)}>
                          {getFromDisplay(message) || <span className="text-gray-400">—</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="max-w-md truncate" title={getMessagePreview(message)}>
                          {getMessagePreview(message) || <span className="text-gray-400">—</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                        <div className="max-w-xs truncate" title={message.external_message_id}>
                          {message.external_message_id || <span className="text-gray-400">—</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(message.status)}
                          <select
                            value={message.status}
                            onChange={(e) => handleStatusChange(message.id, e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm bg-white text-gray-900 focus:outline-none focus:ring-blue-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="processed">Processed</option>
                            <option value="failed">Failed</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(message.received_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewAttachments(message)}
                            className="p-2 hover:bg-blue-50 rounded-md text-blue-600 transition-colors"
                            title="View attachments"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="p-2 hover:bg-red-50 rounded-md text-red-600 transition-colors"
                            title="Delete message"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {pageCount}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Attachment Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Attachments</h3>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                {!attachments[selectedMessage.id] || attachments[selectedMessage.id].length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No attachments</p>
                ) : (
                  <div className="space-y-3">
                    {attachments[selectedMessage.id].map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{attachment.file_name}</p>
                          <p className="text-sm text-gray-500">{attachment.mime_type}</p>
                        </div>
                        <button
                          onClick={() => handleDownloadAttachment(selectedMessage.id, attachment.id, attachment.file_name)}
                          className="ml-4 p-2 hover:bg-blue-50 rounded-md text-blue-600 transition-colors"
                          title="Download"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxUI;
