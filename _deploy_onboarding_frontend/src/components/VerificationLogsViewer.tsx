import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Upload, Scan, Shield, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient } from '../lib/apiClient';

interface VerificationLogsViewerProps {
  documentId?: string;
  candidateId?: string;
  requestId?: string;
  autoRefresh?: boolean;
}

const EVENT_TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  upload_started: { icon: Upload, color: 'blue', label: 'Upload Started' },
  upload_completed: { icon: CheckCircle, color: 'green', label: 'Upload Completed' },
  ai_scan_started: { icon: Scan, color: 'purple', label: 'AI Scan Started' },
  ai_scan_completed: { icon: CheckCircle, color: 'green', label: 'AI Scan Completed' },
  ai_scan_failed: { icon: XCircle, color: 'red', label: 'AI Scan Failed' },
  identity_verification_started: { icon: Shield, color: 'blue', label: 'Identity Check Started' },
  identity_verification_completed: { icon: Shield, color: 'green', label: 'Identity Check Completed' },
  verification_status_changed: { icon: FileText, color: 'orange', label: 'Status Changed' },
  manual_review_requested: { icon: AlertCircle, color: 'yellow', label: 'Manual Review Requested' },
  manual_review_completed: { icon: CheckCircle, color: 'green', label: 'Manual Review Completed' },
  error: { icon: XCircle, color: 'red', label: 'Error' },
};

export default function VerificationLogsViewer({
  documentId,
  candidateId,
  requestId,
  autoRefresh = false,
}: VerificationLogsViewerProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [timeline, setTimeline] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'logs' | 'timeline'>('timeline');

  useEffect(() => {
    fetchLogs();
    
    if (autoRefresh) {
      // Avoid background polling when tab is hidden
      const tick = () => {
        if (typeof document !== 'undefined' && document.hidden) return;
        fetchLogs();
      };

      const interval = setInterval(tick, 3000); // Refresh every 3 seconds

      const onVisibility = () => {
        if (typeof document !== 'undefined' && !document.hidden) {
          fetchLogs();
        }
      };
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', onVisibility);
      }

      return () => {
        clearInterval(interval);
        if (typeof document !== 'undefined') {
          document.removeEventListener('visibilitychange', onVisibility);
        }
      };
    }
  }, [documentId, candidateId, requestId, autoRefresh]);

  const fetchLogs = async () => {
    try {
      let endpoint = '';
      if (requestId) {
        endpoint = `/verification-logs/request/${requestId}`;
      } else if (documentId) {
        endpoint = `/verification-logs/document/${documentId}`;
      } else if (candidateId) {
        endpoint = `/verification-logs/candidate/${candidateId}`;
      } else {
        return;
      }

      let logs: any[] = [];
      if (documentId) {
        const response = await apiClient.getVerificationLogsByDocument(documentId);
        logs = response.logs || [];
      } else if (candidateId) {
        const response = await apiClient.getVerificationLogsByCandidate(candidateId);
        logs = response.logs || [];
      }
      setLogs(logs);
      
      // Also fetch timeline view
      if (candidateId || documentId) {
        const timelineResponse = await apiClient.getVerificationTimeline({
          candidateId,
          documentId,
          limit: 50,
        });
        setTimeline(timelineResponse.logs || []);
      }
    } catch (err) {
      console.error('Error fetching verification logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) return 'N/A';
    if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
    return `${seconds.toFixed(1)}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading verification logs...</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2">No verification logs found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Verification History</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              viewMode === 'timeline'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Timeline View
          </button>
          <button
            onClick={() => setViewMode('logs')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              viewMode === 'logs'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Raw Logs
          </button>
        </div>
      </div>

      {/* Timeline View */}
      {viewMode === 'timeline' && timeline.length > 0 && (
        <div className="space-y-4">
          {timeline.map((event) => {
            const config = EVENT_TYPE_CONFIG[event.event_type] || EVENT_TYPE_CONFIG.error;
            const Icon = config.icon;
            const isExpanded = expandedLogs.has(event.id);

            return (
              <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className={`p-2 rounded-full bg-${config.color}-100`}>
                      <Icon className={`h-4 w-4 text-${config.color}-600`} />
                    </div>
                    <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                  </div>

                  {/* Event Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{config.label}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(event.created_at).toLocaleString()}
                        </p>
                        {event.candidate_name && (
                          <p className="text-xs text-gray-600 mt-1">
                            Candidate: {event.candidate_name}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => toggleLogExpansion(event.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    {/* Event Summary */}
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      {event.file_name && (
                        <div>
                          <span className="text-gray-500">File:</span>
                          <span className="ml-1 text-gray-900">{event.file_name}</span>
                        </div>
                      )}
                      {event.category_display_name && (
                        <div>
                          <span className="text-gray-500">Category:</span>
                          <span className="ml-1 text-gray-900">{event.category_display_name}</span>
                        </div>
                      )}
                      {event.confidence !== null && event.confidence !== undefined && (
                        <div>
                          <span className="text-gray-500">Confidence:</span>
                          <span className="ml-1 text-gray-900">{(event.confidence * 100).toFixed(0)}%</span>
                        </div>
                      )}
                      {event.verification_status && (
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <span className="ml-1 text-gray-900">{event.verification_status}</span>
                        </div>
                      )}
                      {event.scan_duration_seconds !== null && (
                        <div>
                          <span className="text-gray-500">Scan Duration:</span>
                          <span className="ml-1 text-gray-900">{formatDuration(event.scan_duration_seconds)}</span>
                        </div>
                      )}
                      {event.total_processing_seconds !== null && (
                        <div>
                          <span className="text-gray-500">Total Time:</span>
                          <span className="ml-1 text-gray-900">{formatDuration(event.total_processing_seconds)}</span>
                        </div>
                      )}
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-96">
                          {JSON.stringify(event, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Raw Logs View */}
      {viewMode === 'logs' && (
        <div className="space-y-2">
          {logs.map((log) => {
            const config = EVENT_TYPE_CONFIG[log.event_type] || EVENT_TYPE_CONFIG.error;
            const Icon = config.icon;
            const isExpanded = expandedLogs.has(log.id);

            return (
              <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-4 w-4 text-${config.color}-600`} />
                    <span className="text-sm font-medium text-gray-900">{config.label}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      log.event_status === 'success' ? 'bg-green-100 text-green-800' :
                      log.event_status === 'failure' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {log.event_status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                    <button
                      onClick={() => toggleLogExpansion(log.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-96">
                      {JSON.stringify(log, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
          <p className="text-xs text-gray-500">Total Events</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {logs.filter(l => l.event_status === 'success').length}
          </p>
          <p className="text-xs text-gray-500">Successful</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">
            {logs.filter(l => l.event_status === 'failure').length}
          </p>
          <p className="text-xs text-gray-500">Failed</p>
        </div>
      </div>
    </div>
  );
}
