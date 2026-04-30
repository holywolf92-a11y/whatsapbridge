/**
 * MatchingHealthMetrics.tsx
 *
 * Governance-level dashboard widget that shows matching system health.
 * Gives admins visibility into how the automated identity matching is performing:
 *
 *   • Auto-merge rate (CNIC/Passport/Phone/Email hits)
 *   • Manual review rate (name-only matches)
 *   • Confidence score distribution (high / medium / low)
 *   • Signal frequency breakdown (which identifiers are most commonly matched on)
 *   • Total merges by actor (system auto vs admin manual)
 *
 * Mount inside the admin dashboard or Settings panel:
 *   <MatchingHealthMetrics />
 */

import { useEffect, useState } from 'react';
import { RefreshCw, TrendingUp, Users, GitMerge, ShieldCheck, AlertTriangle, Info } from 'lucide-react';
import { apiClient, MatchingMetrics } from '../lib/apiClient';

const SIGNAL_LABELS: Record<string, string> = {
  cnic:        'CNIC',
  passport:    'Passport',
  phone:       'Phone + Name',
  email:       'Email + Name',
  name_dob:    'Name + DOB',
  name_father: 'Name + Father',
  name:        'Name Only',
};

const SIGNAL_COLORS: Record<string, string> = {
  cnic:        'bg-green-500',
  passport:    'bg-emerald-500',
  phone:       'bg-blue-500',
  email:       'bg-sky-500',
  name_dob:    'bg-purple-500',
  name_father: 'bg-violet-500',
  name:        'bg-amber-500',
};

function StatCard({
  label, value, sub, icon: Icon, color,
}: { label: string; value: string | number; sub?: string; icon: any; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-xl ${color}`}>
          <Icon size={14} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function ConfidenceBar({
  label, count, total, color,
}: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-medium text-gray-600">
        <span>{label}</span>
        <span>{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function MatchingHealthMetrics() {
  const [metrics, setMetrics] = useState<MatchingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getMatchingMetrics();
      setMetrics(data);
      setLastRefreshed(new Date());
    } catch (e: any) {
      setError(e?.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
        <RefreshCw size={18} className="animate-spin" />
        <span className="text-sm">Loading matching metrics…</span>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
        <AlertTriangle size={14} /> {error || 'No data'}
      </div>
    );
  }

  const confidenceTotal = metrics.confidence.high + metrics.confidence.medium + metrics.confidence.low;
  const autoMergeCount = (metrics.merges.byActor['system (auto)'] ?? 0);
  const adminMergeCount = (metrics.merges.byActor['admin'] ?? 0);
  const totalMerges = metrics.totals.totalMerges;
  const autoMergePct = totalMerges > 0 ? Math.round((autoMergeCount / totalMerges) * 100) : 0;

  // Sort signals by frequency descending
  const sortedSignals = Object.entries(metrics.signals).sort(([, a], [, b]) => b - a);
  const maxSignalCount = sortedSignals[0]?.[1] ?? 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Matching Health</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Governance metrics for the automated identity matching engine
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-xs text-gray-400">
              Refreshed {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Active Candidates"
          value={metrics.totals.activeCandidates.toLocaleString()}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          label="Total Merges"
          value={totalMerges.toLocaleString()}
          sub={`${autoMergeCount} auto · ${adminMergeCount} admin`}
          icon={GitMerge}
          color="bg-purple-500"
        />
        <StatCard
          label="Auto-Merge Rate"
          value={`${autoMergePct}%`}
          sub="System-resolved merges"
          icon={TrendingUp}
          color="bg-green-500"
        />
        <StatCard
          label="Manual Reviews"
          value={metrics.confidence.nameOnlyManualReview.toLocaleString()}
          sub="Name-only flagged"
          icon={ShieldCheck}
          color="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Confidence Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <h4 className="font-semibold text-gray-800 text-sm">Confidence Distribution</h4>
            <div className="group relative">
              <Info size={13} className="text-gray-300 cursor-help" />
              <div className="absolute bottom-full left-0 mb-2 w-56 bg-gray-800 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                High ≥ 0.85 · Medium 0.65–0.85 · Low &lt; 0.65
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <ConfidenceBar label="High (≥0.85)" count={metrics.confidence.high}   total={confidenceTotal} color="bg-green-500" />
            <ConfidenceBar label="Medium (0.65–0.85)" count={metrics.confidence.medium} total={confidenceTotal} color="bg-amber-400" />
            <ConfidenceBar label="Low (<0.65)"  count={metrics.confidence.low}    total={confidenceTotal} color="bg-red-400" />
          </div>
          <p className="text-xs text-gray-400 mt-4">
            {metrics.confidence.withConfidenceData} of {metrics.totals.activeCandidates} candidates have confidence data
          </p>
        </div>

        {/* Signal Frequency */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h4 className="font-semibold text-gray-800 text-sm mb-4">Signal Frequency</h4>
          {sortedSignals.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No signal data yet — data populates after matching events</p>
          ) : (
            <div className="space-y-2.5">
              {sortedSignals.slice(0, 7).map(([signal, count]) => {
                const pct = Math.round((count / maxSignalCount) * 100);
                return (
                  <div key={signal} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-28 shrink-0">
                      {SIGNAL_LABELS[signal] ?? signal}
                    </span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${SIGNAL_COLORS[signal] ?? 'bg-gray-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
          {(metrics.signals['name'] ?? 0) > 0 && (
            <div className="mt-4 p-2 bg-amber-50 rounded-lg text-xs text-amber-700">
              ⚠ Name-only matches ({metrics.signals['name']}) always require manual review
            </div>
          )}
        </div>

        {/* Merge Strategy Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h4 className="font-semibold text-gray-800 text-sm mb-4">Merge Strategy Breakdown</h4>
          {Object.keys(metrics.merges.byStrategy).length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No merges yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(metrics.merges.byStrategy).map(([strategy, count]) => {
                const pct = totalMerges > 0 ? Math.round((count / totalMerges) * 100) : 0;
                const label = strategy === 'winner_wins' ? 'Fill gaps only' : strategy === 'loser_wins' ? 'Duplicate fills all' : 'Manual override';
                const color = strategy === 'winner_wins' ? 'bg-blue-500' : strategy === 'loser_wins' ? 'bg-purple-500' : 'bg-gray-500';
                return (
                  <div key={strategy} className="flex items-center gap-3 text-xs">
                    <span className="text-gray-600 w-32 shrink-0">{label}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-gray-500 w-10 text-right">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actor Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h4 className="font-semibold text-gray-800 text-sm mb-4">Who Performed Merges</h4>
          {Object.keys(metrics.merges.byActor).length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No merges yet</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(metrics.merges.byActor).map(([actor, count]) => {
                const pct = totalMerges > 0 ? Math.round((count / totalMerges) * 100) : 0;
                const isSystem = actor.startsWith('system');
                return (
                  <div key={actor} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isSystem ? 'bg-green-500' : 'bg-blue-500'}`} />
                      <span className="text-sm text-gray-700 capitalize">{actor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">{count}</span>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
