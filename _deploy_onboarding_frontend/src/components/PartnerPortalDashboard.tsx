import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3, Building2, CheckCircle2, ChevronDown, Clock, CloudUpload, FileSpreadsheet,
  FileText, LayoutDashboard, LogOut, Mail, MapPin, Menu, MoreVertical, Phone, Plus, Search, Settings, Upload, Users, UserCircle2, X, XCircle,
} from 'lucide-react';
import { apiClient, type Candidate, type PartnerBulkUploadResult, type PortalProfileResponse } from '../lib/apiClient';
import { normalizeCandidateStatus } from '../lib/candidateStatus';

// ─── Types ─────────────────────────────────────────────────────────────────

type View = 'dashboard' | 'candidates' | 'upload' | 'bulk-upload';

interface UploadForm {
  name: string;
  cnic: string;
  phone: string;
  email: string;
  cvFile: File | null;
  passportFile: File | null;
  photoFile: File | null;
}

const EMPTY_UPLOAD_FORM: UploadForm = {
  name: '', cnic: '', phone: '', email: '',
  cvFile: null, passportFile: null, photoFile: null,
};

type PartnerPortalDashboardProps = {
  accessToken: string;
  user: {
    name: string;
    email: string;
    roleLabel: string;
  };
  portalProfile: PortalProfileResponse | null;
  loading: boolean;
  error?: string | null;
  onSignOut: () => void;
  onRefreshPortalProfile: () => Promise<unknown>;
};

type PartnerProfileForm = {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  cityCountry: string;
  partnerType: string;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function initials(name?: string) {
  return (name || '?')[0].toUpperCase();
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

function StatusBadge({ status }: { status?: string }) {
  const normalized = normalizeCandidateStatus(status);
  const classes = normalized === 'Applied'
    ? 'bg-blue-100 text-blue-700'
    : normalized === 'Pending'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-green-100 text-green-700';

  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>{normalized}</span>;
}

interface DropZoneProps {
  label: string;
  hint: string;
  acceptText: string;
  accept: string;
  file: File | null;
  onSelect: (f: File) => void;
  required?: boolean;
}

function DropZone({ label, hint, acceptText, accept, file, onSelect, required }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-gray-700">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </p>
      <div
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
          dragging ? 'border-blue-400 bg-blue-50' : file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-gray-400 bg-white'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) onSelect(f);
        }}
      >
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onSelect(f); }} />
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <FileText className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700 truncate max-w-[200px]">{file.name}</span>
          </div>
        ) : (
          <>
            <Upload className="mx-auto h-6 w-6 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">{hint}</p>
            <p className="mt-0.5 text-xs text-gray-400">{acceptText}</p>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function PartnerPortalDashboard({ accessToken, user, portalProfile, loading, onSignOut, onRefreshPortalProfile }: PartnerPortalDashboardProps) {
  const account = portalProfile?.profile.user;
  const partnerApplication = portalProfile?.profile.partnerApplication;
  const partnerDisplayName = account?.name || user.name;
  const partnerAccountLabel = partnerApplication?.company_name || partnerDisplayName;
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  // ── shared state
  const [view, setView] = useState<View>('dashboard');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'error'; message: string } | null>(null);
  const [profileToast, setProfileToast] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState<PartnerProfileForm>({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    cityCountry: '',
    partnerType: '',
  });

  // ── candidates view
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);

  // ── upload view
  const [uploadForm, setUploadForm] = useState<UploadForm>(EMPTY_UPLOAD_FORM);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // ── bulk upload view
  const [bulkExcel, setBulkExcel] = useState<File | null>(null);
  const [bulkZip, setBulkZip] = useState<File | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<PartnerBulkUploadResult | null>(null);

  useEffect(() => {
    setProfileForm({
      name: account?.name || user.name || '',
      email: account?.email || user.email || '',
      phone: account?.phone || partnerApplication?.phone_number || '',
      companyName: partnerApplication?.company_name || '',
      cityCountry: partnerApplication?.city_country || '',
      partnerType: partnerApplication?.partner_type || '',
    });
  }, [account?.email, account?.name, account?.phone, partnerApplication?.city_country, partnerApplication?.company_name, partnerApplication?.partner_type, partnerApplication?.phone_number, user.email, user.name]);

  useEffect(() => {
    if (!showAccountMenu) {
      return undefined;
    }

    function handlePointerDown(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [showAccountMenu]);

  useEffect(() => {
    if (!profileToast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setProfileToast(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [profileToast]);

  useEffect(() => {
    if (!showProfileDialog) {
      return undefined;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowProfileDialog(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showProfileDialog]);

  // Load candidates once
  useEffect(() => {
    let live = true;
    setCandidatesLoading(true);
    apiClient.getPartnerCandidates(accessToken)
      .then((r) => { if (live) setCandidates(r.candidates || []); })
      .catch(() => {})
      .finally(() => { if (live) setCandidatesLoading(false); });
    return () => { live = false; };
  }, [accessToken]);

  async function handleProfileSave() {
    const trimmedName = profileForm.name.trim();
    const trimmedEmail = profileForm.email.trim();

    if (!trimmedName) {
      setProfileFeedback({ type: 'error', message: 'Name is required.' });
      return;
    }

    if (!trimmedEmail) {
      setProfileFeedback({ type: 'error', message: 'Email is required.' });
      return;
    }

    setProfileSaving(true);
    setProfileFeedback(null);

    try {
      await apiClient.updatePortalProfile(accessToken, {
        name: trimmedName,
        email: trimmedEmail,
        phone: profileForm.phone.trim(),
        company_name: profileForm.companyName.trim(),
        city_country: profileForm.cityCountry.trim(),
        partner_type: profileForm.partnerType.trim(),
      });
      await onRefreshPortalProfile();
      setProfileToast('Profile updated successfully.');
      setShowProfileDialog(false);
    } catch (err: any) {
      setProfileFeedback({ type: 'error', message: err?.message || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  }

  // ── Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: candidates.length,
      applied: candidates.filter((c) => normalizeCandidateStatus(c.status) === 'Applied').length,
      pending: candidates.filter((c) => normalizeCandidateStatus(c.status) === 'Pending').length,
      deployed: candidates.filter((c) => normalizeCandidateStatus(c.status) === 'Deployed').length,
      today: candidates.filter((c) => (c.created_at || '').startsWith(today)).length,
    };
  }, [candidates]);

  // ── Filtered candidates
  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch = !q || (c.name || '').toLowerCase().includes(q) || (c.cnic || '').toLowerCase().includes(q) || (c.phone || '').includes(q);
      const s = normalizeCandidateStatus(c.status).toLowerCase();
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'applied' && s === 'applied') ||
        (statusFilter === 'pending' && s === 'pending') ||
        (statusFilter === 'deployed' && s === 'deployed');
      const matchDate =
        (!dateFrom || (c.created_at || '') >= dateFrom) &&
        (!dateTo || (c.created_at || '') <= dateTo + 'T23:59:59');
      return matchSearch && matchStatus && matchDate;
    });
  }, [candidates, search, statusFilter, dateFrom, dateTo]);

  // ── Upload candidate handler
  async function handleUpload() {
    if (!uploadForm.name.trim()) { setUploadError('Full Name is required'); return; }
    if (!uploadForm.cnic.trim()) { setUploadError('CNIC / Passport is required'); return; }
    if (!uploadForm.phone.trim()) { setUploadError('Phone is required'); return; }
    setUploading(true);
    setUploadError(null);
    try {
      const { candidate } = await apiClient.createPartnerCandidate({
        name: uploadForm.name.trim(),
        cnic: uploadForm.cnic.trim(),
        phone: uploadForm.phone.trim(),
        email: uploadForm.email.trim() || undefined,
      }, accessToken);
      if (uploadForm.cvFile) await apiClient.uploadPartnerCandidateDocument(uploadForm.cvFile, candidate.id, accessToken, 'cv');
      if (uploadForm.passportFile) await apiClient.uploadPartnerCandidateDocument(uploadForm.passportFile, candidate.id, accessToken, 'passport_cnic');
      if (uploadForm.photoFile) await apiClient.uploadCandidatePhoto(candidate.id, uploadForm.photoFile);
      setCandidates((prev) => [candidate, ...prev]);
      setUploadForm(EMPTY_UPLOAD_FORM);
      setUploadSuccess(`${candidate.name} saved successfully.`);
      setView('candidates');
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  // ── Bulk upload handler
  async function handleBulkUpload() {
    if (!bulkExcel) { setBulkError('Excel file is required'); return; }
    setBulkProcessing(true);
    setBulkError(null);
    setBulkResult(null);
    try {
      const result = await apiClient.uploadPartnerBulkCandidates(bulkExcel, bulkZip, accessToken);
      setBulkResult(result);
      if (result.candidates.length > 0) {
        setCandidates((prev) => [...result.candidates, ...prev]);
      }
    } catch (err: any) {
      setBulkError(err?.message || 'Bulk upload failed');
    } finally {
      setBulkProcessing(false);
    }
  }

  // ── Download CSV template
  function downloadTemplate() {
    const csv = 'Name,CNIC/Passport,Phone,Email\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'partner_candidate_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const VIEW_TITLE: Record<View, string> = {
    dashboard: 'Dashboard',
    candidates: 'Candidates',
    upload: 'Upload Candidate',
    'bulk-upload': 'Bulk Upload',
  };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar / Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-shrink-0 flex-col border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out lg:relative lg:z-auto lg:w-56 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <span className="text-base font-bold text-blue-600">Falisha Jobs</span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-2 py-3">
          {([
            { v: 'dashboard' as View, label: 'Dashboard', Icon: LayoutDashboard },
            { v: 'candidates' as View, label: 'Candidates', Icon: Users },
            { v: 'upload' as View, label: 'Upload Candidate', Icon: Upload },
            { v: 'bulk-upload' as View, label: 'Bulk Upload', Icon: CloudUpload },
          ] as const).map(({ v, label, Icon }) => (
            <button
              key={v}
              onClick={() => { setView(v); setSidebarOpen(false); }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                view === v ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-200 px-2 py-3">
          <button
            onClick={onSignOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold text-gray-900">{VIEW_TITLE[view]}</h1>
          </div>
          <div ref={accountMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowAccountMenu((current) => !current)}
              className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 transition hover:border-gray-200 hover:bg-gray-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                {initials(partnerAccountLabel)}
              </span>
              <span className="min-w-0 text-left">
                <span className="block max-w-[220px] truncate text-sm font-semibold text-gray-900">{partnerAccountLabel}</span>
                <span className="block text-xs text-gray-500">Partner Account</span>
              </span>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showAccountMenu ? 'rotate-180' : ''}`} />
            </button>

            {showAccountMenu && (
              <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
                <div className="rounded-xl px-3 py-3">
                  <p className="truncate text-sm font-semibold text-gray-900">{partnerAccountLabel}</p>
                  <p className="mt-0.5 text-xs text-gray-500">Partner Account</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAccountMenu(false);
                    setShowProfileDialog(true);
                    setProfileFeedback(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-left text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4" />
                  Profile Settings
                </button>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {loading && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Loading partner workspace…</div>
          )}

          {/* ── Dashboard ── */}
          {!loading && view === 'dashboard' && (
            <div className="space-y-6">
              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                {[
                  { label: 'Total Candidates', value: stats.total, color: 'bg-blue-100', iconColor: 'text-blue-600', Icon: Users },
                  { label: 'Applied', value: stats.applied, color: 'bg-blue-100', iconColor: 'text-blue-600', Icon: FileText },
                  { label: 'Pending', value: stats.pending, color: 'bg-amber-100', iconColor: 'text-amber-600', Icon: Clock },
                  { label: 'Deployed', value: stats.deployed, color: 'bg-green-100', iconColor: 'text-green-600', Icon: CheckCircle2 },
                  { label: 'Uploads Today', value: stats.today, color: 'bg-purple-100', iconColor: 'text-purple-600', Icon: BarChart3 },
                ].map(({ label, value, color, iconColor, Icon }) => (
                  <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className={`inline-flex rounded-lg p-2 ${color}`}>
                      <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-gray-900">{value}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>

              {/* Recent uploads */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                  <h2 className="text-sm font-semibold text-gray-900">Recent Uploads</h2>
                  <button
                    onClick={() => setView('candidates')}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    View all →
                  </button>
                </div>
                {candidatesLoading ? (
                  <p className="px-5 py-4 text-sm text-gray-500">Loading…</p>
                ) : candidates.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-gray-500">No candidates submitted yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {candidates.slice(0, 5).map((c) => (
                      <li key={c.id} className="flex items-center justify-between px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-300 text-sm font-medium text-gray-700">
                            {initials(c.name)}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{c.name}</p>
                            <p className="text-xs text-gray-500">{c.cnic || c.candidate_code}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={c.status} />
                          <span className="text-xs text-gray-400">{formatDate(c.created_at)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* ── Candidates ── */}
          {!loading && view === 'candidates' && (
            <div className="space-y-4">
              {uploadSuccess && (
                <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  {uploadSuccess}
                  <button className="ml-auto" onClick={() => setUploadSuccess(null)}><X className="h-3.5 w-3.5" /></button>
                </div>
              )}
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, CNIC, or phone..."
                    className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm outline-none focus:border-blue-400"
                >
                  <option value="all">All Status</option>
                  <option value="applied">Applied</option>
                  <option value="pending">Pending</option>
                  <option value="deployed">Deployed</option>
                </select>
                <div className="relative">
                  <button
                    onClick={() => setShowDateFilter((v) => !v)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Clock className="h-4 w-4" />
                    Date Filter
                  </button>
                  {showDateFilter && (
                    <div className="absolute right-0 top-full z-10 mt-1 flex gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
                      <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-xs" />
                      <span className="self-center text-xs text-gray-400">to</span>
                      <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded border border-gray-300 px-2 py-1 text-xs" />
                      <button onClick={() => { setDateFrom(''); setDateTo(''); setShowDateFilter(false); }} className="text-xs text-gray-400 hover:text-gray-700">Clear</button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { setView('upload'); setUploadSuccess(null); }}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Candidate
                </button>
              </div>

              {/* Table */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">CNIC / Passport</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Uploaded Date</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {candidatesLoading ? (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Loading…</td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No candidates found.</td></tr>
                    ) : (
                      filtered.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                                {initials(c.name)}
                              </span>
                              <span className="font-medium text-gray-900">{c.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{c.cnic || c.passport || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{c.phone || '—'}</td>
                          <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                          <td className="px-4 py-3 text-gray-500">{formatDate(c.created_at)}</td>
                          <td className="px-4 py-3">
                            <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Upload Candidate ── */}
          {!loading && view === 'upload' && (
            <div className="space-y-4">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Candidate Information */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-5 text-sm font-semibold text-gray-900">Candidate Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
                      <input
                        value={uploadForm.name}
                        onChange={(e) => { setUploadForm((f) => ({ ...f, name: e.target.value })); setUploadError(null); }}
                        placeholder="Enter full name"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">CNIC / Passport <span className="text-red-500">*</span></label>
                      <input
                        value={uploadForm.cnic}
                        onChange={(e) => { setUploadForm((f) => ({ ...f, cnic: e.target.value })); setUploadError(null); }}
                        placeholder="42101-1234567-8"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone <span className="text-red-500">*</span></label>
                      <input
                        value={uploadForm.phone}
                        onChange={(e) => { setUploadForm((f) => ({ ...f, phone: e.target.value })); setUploadError(null); }}
                        placeholder="+92 300 1234567"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                      <input
                        value={uploadForm.email}
                        onChange={(e) => setUploadForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="candidate@example.com"
                        type="email"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      />
                    </div>
                    <div className="rounded-lg bg-blue-50 px-4 py-3">
                      <p className="text-xs font-semibold text-blue-800">Partner: {partnerDisplayName}</p>
                      <p className="mt-0.5 text-xs text-blue-600">This candidate will be tagged to your account</p>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-5 text-sm font-semibold text-gray-900">Documents</h2>
                  <div className="space-y-4">
                    <DropZone
                      label="CV / Resume"
                      hint="Drag & drop CV here, or click to browse"
                      acceptText="PDF, DOC, DOCX"
                      accept=".pdf,.doc,.docx"
                      file={uploadForm.cvFile}
                      onSelect={(f) => setUploadForm((prev) => ({ ...prev, cvFile: f }))}
                      required
                    />
                    <DropZone
                      label="Passport / CNIC Copy"
                      hint="Drag & drop document here"
                      acceptText="PDF, JPG, PNG"
                      accept=".pdf,.jpg,.jpeg,.png"
                      file={uploadForm.passportFile}
                      onSelect={(f) => setUploadForm((prev) => ({ ...prev, passportFile: f }))}
                      required
                    />
                    <DropZone
                      label="Photo"
                      hint="Drag & drop photo here"
                      acceptText="JPG, PNG"
                      accept=".jpg,.jpeg,.png"
                      file={uploadForm.photoFile}
                      onSelect={(f) => setUploadForm((prev) => ({ ...prev, photoFile: f }))}
                    />
                  </div>
                </div>
              </div>

              {uploadError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <XCircle className="h-4 w-4 flex-shrink-0" />
                  {uploadError}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setView('candidates'); setUploadForm(EMPTY_UPLOAD_FORM); setUploadError(null); }}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {uploading && (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {uploading ? 'Processing…' : 'Upload & Process Candidate'}
                </button>
              </div>
            </div>
          )}

          {/* ── Bulk Upload ── */}
          {!loading && view === 'bulk-upload' && (
            <div className="space-y-4">
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-sm font-semibold text-gray-900">Step 1: Upload Excel File</h2>
                  <DropZone
                    label=""
                    hint="Upload Excel file with candidate data"
                    acceptText=".xlsx, .xls format"
                    accept=".xlsx,.xls"
                    file={bulkExcel}
                    onSelect={(f) => { setBulkExcel(f); setBulkError(null); setBulkResult(null); }}
                  />
                  <button
                    onClick={downloadTemplate}
                    className="mt-3 flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Download Excel Template →
                  </button>
                </div>

                {/* Step 2 */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-sm font-semibold text-gray-900">Step 2: Upload ZIP File (Documents)</h2>
                  <DropZone
                    label=""
                    hint="Upload ZIP containing CVs, passports, and photos"
                    acceptText=".zip format"
                    accept=".zip"
                    file={bulkZip}
                    onSelect={(f) => { setBulkZip(f); setBulkError(null); setBulkResult(null); }}
                  />
                </div>

                {/* Requirements */}
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-blue-800">
                    <FileText className="h-4 w-4" /> Requirements:
                  </p>
                  <ul className="space-y-1 text-xs text-blue-700 list-disc list-inside">
                    <li>Excel must contain: Name, CNIC/Passport, Phone. Email is optional.</li>
                    <li>ZIP filenames should include the same CNIC/Passport token used in Excel.</li>
                    <li>Bulk files are sent through the existing ingestion and parser pipeline.</li>
                  </ul>
                </div>

                {bulkError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <XCircle className="h-4 w-4 flex-shrink-0" />
                    {bulkError}
                  </div>
                )}

                {bulkResult && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                    <p className="font-semibold">Bulk upload complete</p>
                    <p className="mt-1">Created {bulkResult.created}, updated {bulkResult.updated}, across {bulkResult.total} rows.</p>
                    {bulkResult.errors.length > 0 && (
                      <ul className="mt-2 space-y-0.5 text-xs text-red-600 list-disc list-inside">
                        {bulkResult.errors.slice(0, 10).map((e, i) => (
                          <li key={i}>Row {e.row}: {e.name || ''} — {e.error}</li>
                        ))}
                        {bulkResult.errors.length > 10 && <li>…and {bulkResult.errors.length - 10} more errors</li>}
                      </ul>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => { setBulkExcel(null); setBulkZip(null); setBulkError(null); setBulkResult(null); }}
                    className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkUpload}
                    disabled={bulkProcessing || !bulkExcel}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {bulkProcessing && (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    )}
                    {bulkProcessing ? 'Processing…' : 'Process Bulk Upload'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {profileToast && (
        <div className="pointer-events-none fixed right-4 top-4 z-50 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-green-200 bg-green-50 px-4 py-3 shadow-lg">
          <div className="flex items-start gap-3 text-green-800">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none" />
            <div>
              <p className="text-sm font-semibold">Saved</p>
              <p className="text-sm">{profileToast}</p>
            </div>
          </div>
        </div>
      )}

      {showProfileDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 px-4 py-6">
          <div className="absolute inset-0" onClick={() => setShowProfileDialog(false)} />
          <div className="relative z-[101] w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Profile Settings</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Update your partner account details, contact information, and company profile.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileDialog(false)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close profile settings"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Company / Agency Name</label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={profileForm.companyName}
                    onChange={(event) => setProfileForm((current) => ({ ...current, companyName: event.target.value }))}
                    className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    placeholder="Your company name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <div className="relative">
                  <UserCircle2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={profileForm.name}
                    onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                    className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    placeholder="Your full name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={profileForm.phone}
                    onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))}
                    className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    placeholder="+92 312 5569101"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
                    className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">City / Country</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={profileForm.cityCountry}
                    onChange={(event) => setProfileForm((current) => ({ ...current, cityCountry: event.target.value }))}
                    className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    placeholder="Lahore, Pakistan"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Partner Type</label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={profileForm.partnerType}
                    onChange={(event) => setProfileForm((current) => ({ ...current, partnerType: event.target.value }))}
                    className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    placeholder="Recruitment agency"
                  />
                </div>
              </div>
            </div>

            {profileFeedback && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {profileFeedback.message}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowProfileDialog(false)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleProfileSave()}
                disabled={profileSaving}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {profileSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

