import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Link2, Download, RefreshCw, Search, CheckCircle, X, FileText, Mail, MessageSquare } from 'lucide-react';
import { api, apiClient, UnmatchedDocument } from '../lib/apiClient';

interface UnmatchedDocumentsQueueProps {
  /** Called whenever a document is successfully linked so parent can refresh stats */
  onLinked?: () => void;
}

interface CandidateSearchResult {
  id: string;
  candidate_code: string;
  name: string;
  email?: string;
  phone?: string;
  cnic?: string;
}

export function UnmatchedDocumentsQueue({ onLinked }: UnmatchedDocumentsQueueProps) {
  const [documents, setDocuments] = useState<UnmatchedDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'needs_review' | 'pending'>('all');

  // Candidate-link modal state
  const [linkingDoc, setLinkingDoc] = useState<UnmatchedDocument | null>(null);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateResults, setCandidateResults] = useState<CandidateSearchResult[]>([]);
  const [candidateSearchLoading, setCandidateSearchLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getUnmatchedDocuments({
        limit: 50,
        offset: 0,
        status: filterStatus === 'all' ? undefined : filterStatus,
      });
      setDocuments(result.documents);
      setTotal(result.total);
    } catch (e: any) {
      setError(e?.message || 'Failed to load unmatched documents');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  async function searchCandidates(query: string) {
    if (!query.trim() || query.trim().length < 2) {
      setCandidateResults([]);
      return;
    }
    setCandidateSearchLoading(true);
    try {
      const result = await apiClient.getCandidates({ search: query, limit: 10 });
      setCandidateResults(
        (result.candidates || []).map((c: any) => ({
          id: c.id,
          candidate_code: c.candidate_code,
          name: c.name,
          email: c.email,
          phone: c.phone,
          cnic: c.cnic,
        }))
      );
    } catch {
      setCandidateResults([]);
    } finally {
      setCandidateSearchLoading(false);
    }
  }

  async function handleLink(candidate: CandidateSearchResult) {
    if (!linkingDoc) return;
    setLinking(true);
    try {
      await api.linkUnmatchedDocument(linkingDoc.id, candidate.id);
      setLinkSuccess(`Linked to ${candidate.name} (${candidate.candidate_code})`);
      setDocuments(prev => prev.filter(d => d.id !== linkingDoc.id));
      setTotal(prev => Math.max(0, prev - 1));
      onLinked?.();
      setTimeout(() => {
        setLinkingDoc(null);
        setLinkSuccess(null);
        setCandidateResults([]);
        setCandidateSearch('');
      }, 1800);
    } catch (e: any) {
      setError(e?.message || 'Failed to link document');
    } finally {
      setLinking(false);
    }
  }

  function openLinkModal(doc: UnmatchedDocument) {
    setLinkingDoc(doc);
    setCandidateSearch('');
    setCandidateResults([]);
    setLinkSuccess(null);
  }

  function closeModal() {
    if (linking) return;
    setLinkingDoc(null);
    setCandidateSearch('');
    setCandidateResults([]);
    setLinkSuccess(null);
  }

  function getSourceIcon(source: string) {
    if (source === 'whatsapp') return <MessageSquare size={14} className="inline mr-1 text-green-600" />;
    if (source === 'email') return <Mail size={14} className="inline mr-1 text-blue-600" />;
    return <FileText size={14} className="inline mr-1 text-gray-500" />;
  }

  const needsReviewCount = documents.filter(d => d.needs_manual_review).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Unmatched Documents Queue
            {total > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                {total}
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Documents that couldn't be automatically linked to a candidate — manually assign them below.
          </p>
        </div>
        <button
          onClick={loadDocuments}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 text-sm">
        {(['all', 'needs_review', 'pending'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`px-3 py-1 rounded-full border transition-colors ${
              filterStatus === f
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? `All (${total})` : f === 'needs_review' ? `Needs Review (${needsReviewCount})` : 'Pending'}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Document table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
          Loading documents…
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <CheckCircle size={40} className="mx-auto mb-3 text-green-400" />
          <p className="font-medium text-gray-600">All clear!</p>
          <p className="text-sm text-gray-400 mt-1">No unmatched documents waiting for review.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">File</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Source</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Received</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Review Reason</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map(doc => (
                <tr key={doc.id} className={`hover:bg-gray-50 transition-colors ${doc.needs_manual_review ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-4 py-3 truncate max-w-[220px]">
                    <span className="font-medium text-gray-800" title={doc.file_name}>{doc.file_name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium capitalize">
                      {doc.document_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {getSourceIcon(doc.source)}
                    <span className="capitalize">{doc.source}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {doc.received_at ? new Date(doc.received_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {doc.needs_manual_review ? (
                      <div className="flex items-start gap-1">
                        <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
                        <span className="text-xs text-amber-700 line-clamp-2">
                          {Array.isArray(doc.review_reasons) && doc.review_reasons.length > 0
                            ? doc.review_reasons[0]
                            : 'Manual review required'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Awaiting auto-link</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {doc.downloadUrl && (
                        <a
                          href={doc.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                          title="Download"
                        >
                          <Download size={15} />
                        </a>
                      )}
                      <button
                        onClick={() => openLinkModal(doc)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors"
                      >
                        <Link2 size={13} /> Link to Candidate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Link modal */}
      {linkingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h4 className="font-semibold text-gray-800 text-base">Link Document to Candidate</h4>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{linkingDoc.file_name}</p>
              </div>
              <button
                onClick={closeModal}
                disabled={linking}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              {linkSuccess ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <CheckCircle size={40} className="text-green-500" />
                  <p className="font-medium text-gray-700">{linkSuccess}</p>
                </div>
              ) : (
                <>
                  {/* Document preview */}
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        {Array.isArray(linkingDoc.review_reasons) && linkingDoc.review_reasons.length > 0 ? (
                          linkingDoc.review_reasons.map((r, i) => (
                            <p key={i} className="text-amber-700 text-xs">{r}</p>
                          ))
                        ) : (
                          <p className="text-amber-700 text-xs">No match found automatically — search for the candidate below.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Candidate search */}
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, CNIC, phone, or code…"
                      value={candidateSearch}
                      onChange={e => {
                        setCandidateSearch(e.target.value);
                        searchCandidates(e.target.value);
                      }}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      autoFocus
                    />
                    {candidateSearchLoading && (
                      <RefreshCw size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                    )}
                  </div>

                  {/* Results */}
                  {candidateResults.length > 0 && (
                    <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-64 overflow-y-auto">
                      {candidateResults.map(c => (
                        <button
                          key={c.id}
                          disabled={linking}
                          onClick={() => handleLink(c)}
                          className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors flex items-center justify-between group"
                        >
                          <div>
                            <p className="font-medium text-gray-800 text-sm">{c.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {c.candidate_code}
                              {c.cnic && ` · CNIC ${c.cnic}`}
                              {c.phone && ` · ${c.phone}`}
                            </p>
                          </div>
                          <Link2 size={15} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                        </button>
                      ))}
                    </div>
                  )}

                  {candidateSearch.length >= 2 && !candidateSearchLoading && candidateResults.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-4">No candidates found for "{candidateSearch}"</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
