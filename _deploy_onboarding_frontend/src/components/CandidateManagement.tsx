import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import {
  Award,
  AlertCircle,
  Briefcase,
  Calendar,
  Download,
  Eye,
  File,
  FileText,
  Grid3x3,
  Image,
  List,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Share2,
  Star,
  X,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { apiClient, Candidate } from '../lib/apiClient';
import { CANDIDATE_STATUS_VALUES, type CandidateStatus, normalizeCandidateStatus } from '../lib/candidateStatus';
import { MergeCandidatesModal } from './MergeCandidatesModal';

interface CandidateManagementProps {
  initialProfessionFilter?: string;
}

interface FilterState {
  search: string;
  position: string;
  country: string;
  status: string;
}

function getInitials(name: string) {
  const trimmed = (name || '').trim();
  if (!trimmed) return '??';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || '';
  const second = parts[1]?.[0] || parts[0]?.[1] || '';
  return `${first}${second}`.toUpperCase();
}

function safeJsonArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string') as string[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed.filter((v) => typeof v === 'string') as string[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function confidenceScore10(confidence?: Record<string, number>) {
  if (!confidence) return null;
  const values = Object.values(confidence).filter((v) => typeof v === 'number' && isFinite(v));
  if (values.length === 0) return null;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  // Handle both 0..1 and 0..100 inputs defensively
  const normalized = avg > 1 ? avg / 100 : avg;
  const score = Math.max(0, Math.min(10, normalized * 10));
  return Math.round(score * 10) / 10;
}

export function CandidateManagement({ initialProfessionFilter = 'all' }: CandidateManagementProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<CandidateStatus>('Pending');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<Candidate | null>(null);
  // ── Search: separate the raw input value from the debounced API query ────────
  // Enterprise pattern: user sees instant feedback in the input box while we
  // wait 400 ms of inactivity before firing the network request.
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    position: initialProfessionFilter || 'all',
    country: 'all',
    status: 'all',
  });
  const [positions, setPositions] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);

  // Sync profession filter when the sidebar prop changes without unmounting.
  useEffect(() => {
    setFilters(f => ({ ...f, position: initialProfessionFilter || 'all' }));
  }, [initialProfessionFilter]);

  // In-flight request cancellation: abort the previous XHR when deps change.
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel any previous in-flight request.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    let isMounted = true;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const response = await apiClient.getCandidates({
          search: debouncedSearch || undefined,
          position: filters.position,
          country_of_interest: filters.country,
          status: filters.status,
        });
        if (!isMounted || controller.signal.aborted) return;
        setCandidates(response.candidates || []);
        const uniquePositions = Array.from(
          new Set((response.candidates || []).map(c => c.position).filter(Boolean))
        ).sort() as string[];
        setPositions(uniquePositions);

        const uniqueCountries = Array.from(
          new Set((response.candidates || []).map((c) => c.country_of_interest).filter(Boolean))
        ).sort() as string[];
        setCountries(uniqueCountries);

        const uniqueStatuses = Array.from(
          new Set((response.candidates || []).map((c) => normalizeCandidateStatus(c.status)).filter(Boolean))
        ).sort() as string[];
        setStatuses(uniqueStatuses.length ? uniqueStatuses : [...CANDIDATE_STATUS_VALUES]);
      } catch (e: any) {
        if (!isMounted || controller.signal.aborted) return;
        setError(e?.message || 'Failed to load candidates');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
      controller.abort();
    };
    // NOTE: debouncedSearch fires only after 400 ms quiet time;
    //       discrete selects (position/country/status) fire immediately.
  }, [debouncedSearch, filters.position, filters.country, filters.status]);

  // Client-side guard filter: mirrors the server filter so the list stays
  // consistent during the 400 ms debounce window while the user is still
  // typing.  Uses `debouncedSearch` (not the raw input) so it stays in sync
  // with what the API actually sent.
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch = !debouncedSearch ||
        c.name.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower) ||
        c.phone?.toLowerCase().includes(searchLower) ||
        c.candidate_code?.toLowerCase().includes(searchLower);
      const matchesPosition = filters.position === 'all' || c.position === filters.position;
      const matchesCountry = filters.country === 'all' || (c.country_of_interest || '—') === filters.country;
      const matchesStatus = filters.status === 'all' || (c.status || 'Applied') === filters.status;
      return matchesSearch && matchesPosition && matchesCountry && matchesStatus;
    });
  }, [candidates, debouncedSearch, filters.position, filters.country, filters.status]);

  const stats = useMemo(() => {
    const totalCandidates = candidates.length;
    const totalProfessions = positions.length;
    const pendingReview = candidates.filter((c) => !!c.needs_review).length;
    const deployed = candidates.filter((c) => (c.status || 'Applied') === 'Deployed').length;
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const newThisWeek = candidates.filter((c) => {
      const created = c.created_at ? Date.parse(c.created_at) : NaN;
      return Number.isFinite(created) && now - created <= weekMs;
    }).length;
    return { totalCandidates, totalProfessions, pendingReview, deployed, newThisWeek };
  }, [candidates, positions.length]);

  const positionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of candidates) {
      const key = (c.position || '').trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }, [candidates]);

  const allFilteredSelected = useMemo(() => {
    if (filteredCandidates.length === 0) return false;
    return filteredCandidates.every((c) => selectedIds.has(c.id));
  }, [filteredCandidates, selectedIds]);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelectedIds(new Set(filteredCandidates.map((c) => c.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function applyBulkStatusUpdate() {
    if (selectedIds.size === 0) return;
    try {
      setBulkUpdating(true);
      const ids = Array.from(selectedIds);
      const result = await apiClient.bulkUpdateCandidateStatus(ids, bulkStatus);
      const updatedIds = new Set((result.candidates || []).map((c) => c.id));

      setCandidates((prev) =>
        prev.map((c) => (updatedIds.has(c.id) ? { ...c, status: bulkStatus } : c))
      );
      clearSelection();
    } catch (e: any) {
      alert(e?.message || 'Failed to bulk update status');
    } finally {
      setBulkUpdating(false);
    }
  }

  async function handleDownloadCV(candidate: Candidate) {
    try {
      // ✅ NEW SYSTEM: Server-side Puppeteer PDF generation (employer-safe format)
      const result = await apiClient.generateCandidateCV(candidate.id, 'employer-safe', true);
      
      // Download PDF from signed URL
      const response = await fetch(result.cv_url);
      if (!response.ok) {
        throw new Error(`Failed to download CV: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${candidate.name || 'Candidate'}_Employer_Safe_CV.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert('Employer-Safe CV downloaded successfully!');
    } catch (error: any) {
      console.error('Failed to download CV:', error);
      alert(error?.message || 'Failed to download CV. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading candidates...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to load candidates</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Candidates</h1>
            <p className="text-gray-600 mt-1">Manage your candidate pipeline</p>
          </div>
          <button
            type="button"
            onClick={() => alert('Add New Candidate: coming soon')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add New Candidate
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="rounded-lg p-5 text-white bg-blue-600 shadow-sm">
            <p className="text-white/90 text-sm font-medium">Total Candidates</p>
            <p className="text-4xl font-bold mt-2">{stats.totalCandidates}</p>
          </div>
          <div className="rounded-lg p-5 text-white bg-orange-600 shadow-sm">
            <p className="text-white/90 text-sm font-medium">Total Professions</p>
            <p className="text-4xl font-bold mt-2">{stats.totalProfessions}</p>
          </div>
          <div className="rounded-lg p-5 text-white bg-yellow-500 shadow-sm">
            <p className="text-white/90 text-sm font-medium">Pending Review</p>
            <p className="text-4xl font-bold mt-2">{stats.pendingReview}</p>
          </div>
          <div className="rounded-lg p-5 text-white bg-green-600 shadow-sm">
            <p className="text-white/90 text-sm font-medium">Deployed</p>
            <p className="text-4xl font-bold mt-2">{stats.deployed}</p>
          </div>
          <div className="rounded-lg p-5 text-white bg-purple-600 shadow-sm">
            <p className="text-white/90 text-sm font-medium">New This Week</p>
            <p className="text-4xl font-bold mt-2">{stats.newThisWeek}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          {/* Profession Sidebar */}
          <aside className="hidden lg:block">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900">Professions</p>
              <div className="mt-3 space-y-1">
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, position: 'all' }))}
                  className={`w-full h-10 px-3 rounded-lg border text-sm font-semibold flex items-center justify-between transition-colors ${
                    filters.position === 'all'
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate">All Candidates</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{candidates.length}</span>
                </button>

                <div className="pt-1 max-h-[calc(100vh-360px)] overflow-auto pr-1">
                  {positions.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, position: p }))}
                      className={`w-full h-10 px-3 rounded-lg border text-sm font-semibold flex items-center justify-between transition-colors ${
                        filters.position === p
                          ? 'bg-blue-50 border-blue-200 text-blue-800'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="truncate">{p}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{positionCounts.get(p) || 0}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div>
            {/* Filters / Search / View Toggle */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  <select
                    value={filters.country}
                    onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                    className="h-10 px-4 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Countries</option>
                    {countries.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="h-10 px-4 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    {statuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>

                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      role="searchbox"
                      aria-label="Search candidates"
                      placeholder="Search by name, CNIC, phone, email…"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      // Prevent accidental form submission on Enter
                      onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                      className="h-10 w-full pl-10 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {searchInput && (
                      <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => setSearchInput('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('card')}
                    className={`h-10 px-4 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-colors ${
                      viewMode === 'card' ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                    Cards
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`h-10 px-4 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-colors ${
                      viewMode === 'table' ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <List className="w-4 h-4" />
                    Table
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                <span>
                  Showing <span className="font-semibold text-gray-900">{filteredCandidates.length}</span> of{' '}
                  <span className="font-semibold text-gray-900">{candidates.length}</span> candidates
                </span>

                <button
                  type="button"
                  onClick={() => (allFilteredSelected ? clearSelection() : selectAllFiltered())}
                  className="text-blue-600 font-semibold hover:text-blue-700"
                >
                  {allFilteredSelected ? 'Clear Selection' : 'Select All'}
                </button>
              </div>
            </div>

            {filteredCandidates.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-600">
              {filters.search || filters.country !== 'all' || filters.status !== 'all' || filters.position !== 'all'
                ? 'Try adjusting your filters.'
                : 'Try adding a candidate from the CV inbox or backend API.'}
            </p>
          </div>
            ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCandidates.map((c) => {
              const skills = safeJsonArray(c.skills);
              const confidenceScore = confidenceScore10(c.extraction_confidence);
              const score = typeof c.ai_score === 'number' && isFinite(c.ai_score) ? Math.round(c.ai_score * 10) / 10 : confidenceScore;
              const statusLabel = (c.status || 'Applied').toString();
              const badge = c.needs_review
                ? { label: 'Review', cls: 'bg-yellow-100 text-yellow-800' }
                : c.auto_extracted
                  ? { label: 'Auto', cls: 'bg-green-100 text-green-800' }
                  : { label: 'Manual', cls: 'bg-gray-100 text-gray-700' };

              const cvOk = !!c.cv_received;
              const passportOk = !!c.passport_received;
              const certificateOk = !!c.certificate_received || !!c.degree_received;
              const photoOk = !!c.photo_received;
              const medicalOk = !!c.medical_received;
              const docCount = [cvOk, passportOk, certificateOk, photoOk, medicalOk].filter(Boolean).length;
              const allDocsOk = docCount === 5;
              const selected = selectedIds.has(c.id);

              return (
                <div
                  key={c.id}
                  className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                    selected ? 'border-blue-300 ring-2 ring-blue-100 bg-blue-50/20' : 'border-gray-200'
                  }`}
                >
                  <div className="h-24 bg-gradient-to-r from-blue-500 via-purple-500 to-fuchsia-500" />

                  <div className="px-5 pb-5">
                    {/* Avatar row — pulled up over the banner, checkbox top-right */}
                    <div className="-mt-10 mb-2 flex items-end justify-between">
                      <div className="w-16 h-16 rounded-full bg-white p-1 shadow flex-shrink-0">
                        <div className="w-full h-full rounded-full bg-blue-50 flex items-center justify-center">
                          <span className="text-blue-700 font-bold text-xl">{getInitials(c.name)}</span>
                        </div>
                      </div>
                      <div className="pb-1">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelected(c.id)}
                          className="w-5 h-5 rounded border-gray-300"
                        />
                      </div>
                    </div>

                    {/* Name + details row — safely below the avatar */}
                    <div className="mt-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{c.name}</h3>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{c.position || '—'}</span>
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>
                          {(c.nationality || '—')}{' '}
                          <span className="text-gray-400">→</span>{' '}
                          <span className="text-blue-700 font-medium">{c.country_of_interest || '—'}</span>
                        </span>
                      </p>
                    </div>

                    {/* Pills row */}
                    <div className="mt-4 flex flex-wrap gap-2 items-center">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700">
                        {statusLabel}
                      </span>
                      {score != null && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-yellow-50 text-yellow-800 inline-flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          {score} <span className="text-yellow-700/70">/10</span>
                        </span>
                      )}
                      {c.experience_years != null && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-50 text-gray-700">
                          {c.experience_years}y exp
                        </span>
                      )}
                    </div>

                    {/* Contact */}
                    <div className="mt-4 border-t border-gray-100 pt-4 space-y-3 text-sm">
                      {c.phone && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
                            <Phone className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Phone</p>
                            <p className="font-semibold text-gray-900">{c.phone}</p>
                          </div>
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="font-semibold text-gray-900 truncate">{c.email}</p>
                          </div>
                        </div>
                      )}
                      {c.created_at && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Applied Date</p>
                            <p className="font-semibold text-gray-900">{new Date(c.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    {skills.length > 0 && (
                      <div className="mt-5">
                        <p className="text-sm font-semibold text-gray-900 mb-2">Top Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {skills.slice(0, 4).map((s, idx) => (
                            <span key={`${c.id}-skill-${idx}`} className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents */}
                    <div className="mt-5">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-900">Documents</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          docCount === 0
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : allDocsOk
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-yellow-50 text-yellow-800 border-yellow-200'
                        }`}>
                          {docCount} files
                        </span>
                      </div>
                      {docCount > 0 ? (
                        <>
                          <div className="grid grid-cols-5 gap-2">
                            {[
                              { label: 'CV', ok: cvOk, Icon: FileText },
                              { label: 'Passport', ok: passportOk, Icon: File },
                              { label: 'Certificate', ok: certificateOk, Icon: Award },
                              { label: 'Photo', ok: photoOk, Icon: Image },
                              { label: 'Medical', ok: medicalOk, Icon: Plus },
                            ].map((d) => (
                              <div
                                key={`${c.id}-${d.label}`}
                                className={`h-14 rounded-xl border flex flex-col items-center justify-center gap-1 text-[10px] font-semibold relative ${
                                  d.ok 
                                    ? 'bg-green-50 border-green-300 text-green-800' 
                                    : 'bg-red-50 border-red-300 text-red-800'
                                }`}
                                title={d.ok ? 'Available' : 'Missing'}
                              >
                                {d.ok ? (
                                  <CheckCircle className="w-5 h-5 text-green-600 absolute top-1 right-1" strokeWidth={2.5} />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-600 absolute top-1 right-1" strokeWidth={2.5} />
                                )}
                                <d.Icon className="w-4 h-4" />
                                {d.label}
                              </div>
                            ))}
                          </div>
                          <div className={`mt-3 rounded-xl px-4 py-2 text-xs font-semibold ${
                            allDocsOk ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {allDocsOk ? 'All documents are valid' : 'Some documents are missing'}
                          </div>
                        </>
                      ) : (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
                          <AlertCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
                          <p className="text-xs font-semibold text-red-800">No documents uploaded yet</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-5">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          className="h-11 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Full Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadCV(c)}
                          className="h-11 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors inline-flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Employer CV
                        </button>
                      </div>

                      <div className="mt-3 grid grid-cols-4 gap-2">
                        <button type="button" className="h-10 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-semibold hover:bg-gray-100">WhatsApp</button>
                        <button type="button" className="h-10 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-semibold hover:bg-gray-100 inline-flex items-center justify-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </button>
                        <button type="button" className="h-10 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-semibold hover:bg-gray-100 inline-flex items-center justify-center gap-2">
                          <Share2 className="w-4 h-4" />
                          Share
                        </button>
                        <button type="button" className="h-10 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 font-semibold hover:bg-gray-100 inline-flex items-center justify-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setMergeTarget(c)}
                          className="h-10 rounded-xl bg-gray-50 border border-purple-200 text-purple-700 font-semibold hover:bg-purple-50 inline-flex items-center justify-center gap-2"
                          title="Merge duplicate"
                        >
                          Merge
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
            ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCandidates.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-semibold text-xs">
                            {c.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{c.candidate_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{c.position || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.email || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.phone || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {c.status || 'Applied'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadCV(c)}
                          className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Download CV"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            )}
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[min(920px,calc(100%-3rem))]">
            <div className="bg-white rounded-lg border border-gray-200 shadow-lg px-4 py-3 flex items-center justify-between gap-3">
              <div className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">{selectedIds.size}</span> selected
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value as any)}
                  className="h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={bulkUpdating}
                >
                  {CANDIDATE_STATUS_VALUES.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={applyBulkStatusUpdate}
                  disabled={bulkUpdating}
                  className="h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                >
                  {bulkUpdating ? 'Updating…' : 'Update Status'}
                </button>

                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={bulkUpdating}
                  className="h-10 px-4 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Merge modal */}
      {mergeTarget && (
        <MergeCandidatesModal
          candidate={mergeTarget}
          onClose={() => setMergeTarget(null)}
          onMerged={() => {
            setMergeTarget(null);
            // Refresh the list so the soft-deleted loser disappears
            setFilters(f => ({ ...f }));
          }}
        />
      )}
    </div>
  );
}
