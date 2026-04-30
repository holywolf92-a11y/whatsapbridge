/**
 * MergeCandidatesModal.tsx
 *
 * Admin merge tool: search for a duplicate of an existing candidate, choose
 * which record wins, then call POST /api/candidates/:id/merge.
 *
 * A full audit row is written to candidate_merges automatically by the backend.
 *
 * Usage:
 *   <MergeCandidatesModal candidate={currentCandidate} onClose={() => {}} onMerged={() => reload()} />
 */

import { useState } from 'react';
import { AlertTriangle, Search, ArrowRight, RefreshCw, CheckCircle, X, History, ChevronDown, ChevronUp, Merge } from 'lucide-react';
import { apiClient, Candidate, CandidateMerge } from '../lib/apiClient';

interface MergeCandidatesModalProps {
  candidate: Candidate;
  onClose: () => void;
  onMerged: () => void;
}

export function MergeCandidatesModal({ candidate, onClose, onMerged }: MergeCandidatesModalProps) {
  const [tab, setTab] = useState<'merge' | 'history'>('merge');

  // Merge tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Candidate[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedLoser, setSelectedLoser] = useState<Candidate | null>(null);
  const [strategy, setStrategy] = useState<'winner_wins' | 'loser_wins'>('winner_wins');
  const [reason, setReason] = useState('');
  const [merging, setMerging] = useState(false);
  const [mergeSuccess, setMergeSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // History tab state
  const [history, setHistory] = useState<CandidateMerge[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState<string | null>(null);

  async function search(q: string) {
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await apiClient.getCandidates({ search: q, limit: 8 });
      // Exclude the current candidate from results
      setSearchResults((res.candidates || []).filter((c: any) => c.id !== candidate.id));
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleMerge() {
    if (!selectedLoser) return;
    setMerging(true);
    setError(null);
    try {
      const res = await apiClient.mergeCandidates(candidate.id, selectedLoser.id, {
        strategy,
        reason: reason.trim() || undefined,
      });
      const m = res.merge;
      setMergeSuccess(
        `Merged ${selectedLoser.candidate_code} → ${candidate.candidate_code}. ` +
        `Moved ${m.documentsMoved} docs, relinked ${m.attachmentsRelinked} attachments` +
        (m.fieldsFilledIn.length > 0 ? `, filled in: ${m.fieldsFilledIn.slice(0, 4).join(', ')}` : '') + '.'
      );
      onMerged();
    } catch (e: any) {
      setError(e?.message || 'Merge failed');
    } finally {
      setMerging(false);
    }
  }

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const res = await apiClient.getCandidateMergeHistory(candidate.id);
      setHistory(res.merges);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  function handleTabChange(t: 'merge' | 'history') {
    setTab(t);
    if (t === 'history' && history.length === 0) loadHistory();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <Merge size={16} className="text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Merge Candidate</h4>
              <p className="text-xs text-gray-500">{candidate.candidate_code} · {candidate.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-100">
          {(['merge', 'history'] as const).map(t => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`px-5 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t ? 'border-purple-500 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'merge' ? '⇄ Merge Duplicate' : '📋 Audit History'}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* ── MERGE TAB ────────────────────────────────────────── */}
          {tab === 'merge' && (
            mergeSuccess ? (
              <div className="flex flex-col items-center gap-4 py-10">
                <CheckCircle size={48} className="text-green-500" />
                <p className="font-semibold text-gray-700 text-center max-w-md">{mergeSuccess}</p>
                <p className="text-sm text-gray-400 text-center">
                  The duplicate has been soft-deleted and all documents have been moved to {candidate.candidate_code}.
                </p>
                <button onClick={onClose} className="mt-2 px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors">
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Explainer */}
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-sm text-amber-700">
                  <strong>This candidate ({candidate.candidate_code}) will be the winner.</strong><br />
                  Find the duplicate below. The duplicate's documents and attachments will be moved here, then it will be soft-deleted. Every merge is audit-logged.
                </div>

                {/* Search */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Search for duplicate candidate</label>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Name, CNIC, phone, or code…"
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); search(e.target.value); }}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                    {searchLoading && <RefreshCw size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
                  </div>

                  {searchResults.length > 0 && !selectedLoser && (
                    <div className="mt-2 border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-56 overflow-y-auto">
                      {searchResults.map(c => (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedLoser(c); setSearchResults([]); }}
                          className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors flex items-center justify-between group"
                        >
                          <div>
                            <p className="font-medium text-sm text-gray-800">{c.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {c.candidate_code} {c.cnic ? `· CNIC ${c.cnic}` : ''} {c.phone ? `· ${c.phone}` : ''}
                            </p>
                          </div>
                          <span className="text-xs text-purple-400 group-hover:text-purple-600 font-medium">Select →</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected loser */}
                {selectedLoser && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Duplicate to remove</span>
                      <button onClick={() => setSelectedLoser(null)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                        Clear
                      </button>
                    </div>

                    {/* Visual merge diagram */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white rounded-lg border border-gray-200 p-3 text-center">
                        <p className="text-xs text-gray-400 mb-1">Will be DELETED</p>
                        <p className="font-semibold text-sm text-gray-700">{selectedLoser.name}</p>
                        <p className="text-xs text-gray-400">{selectedLoser.candidate_code}</p>
                      </div>
                      <ArrowRight size={20} className="text-purple-400 shrink-0" />
                      <div className="flex-1 bg-purple-50 rounded-lg border border-purple-200 p-3 text-center">
                        <p className="text-xs text-purple-500 mb-1">WINNER (survives)</p>
                        <p className="font-semibold text-sm text-purple-800">{candidate.name}</p>
                        <p className="text-xs text-purple-500">{candidate.candidate_code}</p>
                      </div>
                    </div>

                    {/* Strategy */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">When winner has a missing field that the duplicate has:</label>
                      <div className="flex gap-2">
                        {(['winner_wins', 'loser_wins'] as const).map(s => (
                          <button
                            key={s}
                            onClick={() => setStrategy(s)}
                            className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                              strategy === s
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {s === 'winner_wins' ? '✓ Fill in gaps only' : '↩ Duplicate fills all'}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {strategy === 'winner_wins'
                          ? 'Winner keeps all its own data; only empty winner fields get filled from the duplicate.'
                          : "Duplicate's non-empty fields overwrite the winner's fields."}
                      </p>
                    </div>

                    {/* Reason */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Reason (optional, for audit log)</label>
                      <input
                        type="text"
                        placeholder="e.g. Same person submitted twice from different emails"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                    <AlertTriangle size={14} /> {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-1">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMerge}
                    disabled={!selectedLoser || merging}
                    className="flex items-center gap-1.5 px-5 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {merging ? <RefreshCw size={14} className="animate-spin" /> : <Merge size={14} />}
                    {merging ? 'Merging…' : 'Merge Now'}
                  </button>
                </div>
              </div>
            )
          )}

          {/* ── HISTORY TAB ──────────────────────────────────────── */}
          {tab === 'history' && (
            <div className="space-y-3">
              {historyLoading ? (
                <div className="text-center py-10 text-gray-400">
                  <RefreshCw size={22} className="animate-spin mx-auto mb-2" />
                  Loading history…
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-14 text-gray-400">
                  <History size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No merge history for this candidate.</p>
                </div>
              ) : (
                history.map(m => {
                  const isWinner = m.winner_id === candidate.id;
                  const expanded = historyExpanded === m.id;
                  return (
                    <div key={m.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setHistoryExpanded(expanded ? null : m.id)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${isWinner ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {isWinner ? 'Won' : 'Merged into another'}
                          </span>
                          <span className="text-sm text-gray-700">
                            {new Date(m.created_at).toLocaleDateString()} by <strong>{m.merged_by}</strong>
                          </span>
                          <span className="text-xs text-gray-400 capitalize">{m.merge_strategy.replace('_', ' ')}</span>
                        </div>
                        {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                      </button>
                      {expanded && (
                        <div className="px-4 pb-4 space-y-2 bg-gray-50 border-t border-gray-100">
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-3">
                            <div><span className="font-medium">Winner ID:</span> <span className="font-mono">{m.winner_id.slice(0, 8)}…</span></div>
                            <div><span className="font-medium">Loser ID:</span> <span className="font-mono">{m.loser_id.slice(0, 8)}…</span></div>
                            <div><span className="font-medium">Audit row:</span> <span className="font-mono">{m.id.slice(0, 8)}…</span></div>
                          </div>
                          {m.review_reasons?.length ? (
                            <div className="text-xs text-gray-500">
                              <span className="font-medium">Reason:</span> {m.review_reasons.join('; ')}
                            </div>
                          ) : null}
                          {m.field_overrides && Object.keys(m.field_overrides).length > 0 && (
                            <div className="text-xs text-gray-500">
                              <span className="font-medium block mb-1">Fields changed:</span>
                              <ul className="ml-2 space-y-0.5">
                                {Object.entries(m.field_overrides).slice(0, 6).map(([field, diff]: [string, any]) => (
                                  <li key={field} className="font-mono">
                                    {field}: <span className="text-red-500 line-through">{String(diff.from ?? '—').slice(0, 30)}</span>
                                    {' → '}
                                    <span className="text-green-600">{String(diff.to ?? '—').slice(0, 30)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
