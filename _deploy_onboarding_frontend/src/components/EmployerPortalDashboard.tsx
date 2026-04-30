import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Briefcase, Building2, CheckCircle2, ChevronDown, Clock, Globe2, LayoutDashboard,
  LogOut, Mail, MapPin, Menu, Phone, Plus, RefreshCw, Search, Settings, ShieldCheck,
  Sparkles, Users, X, FileText, Banknote, CalendarDays, Star, BriefcaseBusiness,
  Lock, MessageCircle, Award, ExternalLink, Download,
} from 'lucide-react';
import { apiClient, type EmployerLeadProfile, type PortalProfileResponse, type JobRecommendation } from '../lib/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

type View = 'dashboard' | 'requirements' | 'post-job' | 'profile';

type PostJobForm = {
  professions: string;
  quantity: string;
  country: string;
  city: string;
  salary_range: string;
  duty_hours: string;
  contract_duration: string;
  benefits_included: string;
  comments: string;
};

type ProfileForm = {
  company_name: string;
  contact_name: string;
  phone: string;
  country: string;
  city: string;
};

const EMPTY_JOB: PostJobForm = {
  professions: '',
  quantity: '',
  country: '',
  city: '',
  salary_range: '',
  duty_hours: '',
  contract_duration: '',
  benefits_included: '',
  comments: '',
};

const WORLD_COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Angola', 'Argentina', 'Armenia', 'Australia',
  'Austria', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Belgium', 'Bolivia', 'Bosnia and Herzegovina',
  'Brazil', 'Bulgaria', 'Cambodia', 'Cameroon', 'Canada', 'Chile', 'China', 'Colombia',
  'Croatia', 'Cuba', 'Czech Republic', 'Denmark', 'Dominican Republic', 'Ecuador', 'Egypt',
  'Ethiopia', 'Finland', 'France', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala',
  'Hungary', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica',
  'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Kyrgyzstan', 'Lebanon', 'Libya',
  'Malaysia', 'Maldives', 'Malta', 'Mauritius', 'Mexico', 'Moldova', 'Mongolia', 'Morocco',
  'Myanmar', 'Nepal', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Oman', 'Pakistan',
  'Palestine', 'Panama', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania',
  'Russia', 'Rwanda', 'Saudi Arabia', 'Senegal', 'Serbia', 'Singapore', 'Slovakia',
  'Slovenia', 'Somalia', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sudan',
  'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tanzania', 'Thailand', 'Tunisia', 'Turkey',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay',
  'Uzbekistan', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
];

const CONTRACT_OPTIONS = ['6 months', '1 year', '2 years', '3 years', 'Renewable', 'Permanent'];
const HOURS_OPTIONS = ['8 hrs / 5 days', '8 hrs / 6 days', '10 hrs / 6 days', '12 hrs / 6 days', 'Shift work'];
const QTY_OPTIONS = ['1–5', '6–10', '11–20', '21–50', '51–100', '100+'];
const SALARY_OPTIONS = [
  'SAR 800–1,200/mo', 'SAR 1,200–1,800/mo', 'SAR 1,800–2,500/mo', 'SAR 2,500–4,000/mo', 'SAR 4,000+/mo',
  'AED 1,000–1,500/mo', 'AED 1,500–2,500/mo', 'AED 2,500–4,000/mo', 'AED 4,000+/mo',
  'QAR 1,000–1,500/mo', 'QAR 1,500–2,500/mo', 'QAR 2,500–4,000/mo',
  'USD 300–500/mo', 'USD 500–800/mo', 'USD 800–1,200/mo', 'USD 1,200–2,000/mo',
  'Negotiable',
];

// ─── Props ────────────────────────────────────────────────────────────────────

type EmployerPortalDashboardProps = {
  accessToken: string;
  user: { name: string; email: string; roleLabel: string };
  portalProfile: PortalProfileResponse | null;
  loading: boolean;
  error?: string | null;
  onSignOut: () => Promise<void>;
  onRefreshPortalProfile: () => Promise<void>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name?: string | null) {
  const n = (name || '?').trim();
  const parts = n.split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '');
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }: { status?: string | null }) {
  const s = (status || 'New').toLowerCase();
  const map: Record<string, string> = {
    new: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    active: 'bg-green-50 text-green-700 border-green-200',
    'in progress': 'bg-blue-50 text-blue-700 border-blue-200',
    fulfilled: 'bg-purple-50 text-purple-700 border-purple-200',
    closed: 'bg-gray-100 text-gray-500 border-gray-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  const cls = map[s] ?? map.new;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {status || 'New'}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EmployerPortalDashboard({
  accessToken,
  user,
  portalProfile,
  loading,
  error,
  onSignOut,
  onRefreshPortalProfile,
}: EmployerPortalDashboardProps) {
  const lead = portalProfile?.profile.employerLead;
  const account = portalProfile?.profile.user;
  const companyName = lead?.company_name || account?.name || user.name || 'My Company';
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  // ── shared state
  const [view, setView] = useState<View>('dashboard');
  const [requirements, setRequirements] = useState<EmployerLeadProfile[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [profileToast, setProfileToast] = useState<string | null>(null);

  // ── requirements list state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // ── post-job state
  const [jobForm, setJobForm] = useState<PostJobForm>(EMPTY_JOB);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState<string | null>(null);

  // ── profile edit state
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    company_name: '',
    contact_name: '',
    phone: '',
    country: '',
    city: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // ── Init forms from portalProfile
  useEffect(() => {
    setProfileForm({
      company_name: lead?.company_name || account?.name || user.name || '',
      contact_name: lead?.contact_name || account?.name || user.name || '',
      phone: lead?.phone_number || account?.phone || '',
      country: lead?.country || '',
      city: lead?.city || '',
    });
  }, [lead, account, user.name]);

  // ── Load requirements on mount
  useEffect(() => {
    let live = true;
    setReqLoading(true);
    apiClient.getEmployerRequirements(accessToken)
      .then((r) => { if (live) setRequirements(r.requirements || []); })
      .catch(() => {})
      .finally(() => { if (live) setReqLoading(false); });
    return () => { live = false; };
  }, [accessToken]);

  // ── Close account menu on outside click
  useEffect(() => {
    if (!showAccountMenu) return undefined;
    function handleClick(e: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setShowAccountMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showAccountMenu]);

  // ── Toast auto-clear
  useEffect(() => {
    if (!profileToast) return undefined;
    const t = window.setTimeout(() => setProfileToast(null), 3000);
    return () => clearTimeout(t);
  }, [profileToast]);

  // ── Post success auto-clear
  useEffect(() => {
    if (!postSuccess) return undefined;
    const t = window.setTimeout(() => setPostSuccess(null), 4000);
    return () => clearTimeout(t);
  }, [postSuccess]);

  // ── Stats
  const stats = useMemo(() => {
    const all = requirements;
    return {
      total: all.length,
      active: all.filter((r) => ['new', 'active'].includes((r.status || 'new').toLowerCase())).length,
      inProgress: all.filter((r) => (r.status || '').toLowerCase() === 'in progress').length,
      fulfilled: all.filter((r) => (r.status || '').toLowerCase() === 'fulfilled').length,
    };
  }, [requirements]);

  // ── Filtered requirements
  const filtered = useMemo(() => {
    return requirements.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch = !q || (r.professions || '').toLowerCase().includes(q) || (r.country || '').toLowerCase().includes(q) || (r.city || '').toLowerCase().includes(q);
      const s = (r.status || 'new').toLowerCase();
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'new' && s === 'new') ||
        (statusFilter === 'active' && s === 'active') ||
        (statusFilter === 'in-progress' && s === 'in progress') ||
        (statusFilter === 'fulfilled' && s === 'fulfilled');
      return matchSearch && matchStatus;
    });
  }, [requirements, search, statusFilter]);

  // ── Handlers
  async function handlePostJob(e: React.FormEvent) {
    e.preventDefault();
    setPosting(true);
    setPostError(null);
    setPostSuccess(null);
    try {
      const req = await apiClient.createEmployerRequirement(accessToken, {
        professions: jobForm.professions,
        quantity: jobForm.quantity || undefined,
        country: jobForm.country || undefined,
        city: jobForm.city || undefined,
        salary_range: jobForm.salary_range || undefined,
        duty_hours: jobForm.duty_hours || undefined,
        contract_duration: jobForm.contract_duration || undefined,
        benefits_included: jobForm.benefits_included || undefined,
        comments: jobForm.comments || undefined,
      });
      setRequirements((prev) => [req.requirement, ...prev]);
      setJobForm(EMPTY_JOB);
      setPostSuccess('Requirement posted successfully! Our team will start sourcing candidates.');
      setView('requirements');
    } catch (err: any) {
      setPostError(err?.message || 'Failed to post requirement.');
    } finally {
      setPosting(false);
    }
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    try {
      await apiClient.updatePortalProfile(accessToken, {
        company_name: profileForm.company_name,
        contact_name: profileForm.contact_name,
        phone: profileForm.phone,
        country: profileForm.country,
        city: profileForm.city,
      });
      await onRefreshPortalProfile();
      setProfileToast('Profile updated successfully.');
      setShowProfileDialog(false);
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  }

  const VIEW_LABELS: Record<View, string> = {
    dashboard: 'Dashboard',
    requirements: 'My Requirements',
    'post-job': 'Post a Requirement',
    profile: 'Company Profile',
  };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">

      {/* ── Mobile overlay ───────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar / Drawer ─────────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-shrink-0 flex-col border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out lg:relative lg:z-auto lg:w-60 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand */}
        <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-600 text-xs font-black text-white">F</span>
            <span className="text-base font-bold text-cyan-600">Falisha Jobs</span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Company badge */}
        <div className="mx-3 mt-3 rounded-xl bg-cyan-50 px-3 py-2.5">
          <p className="truncate text-xs font-semibold text-cyan-700">{companyName}</p>
          <p className="text-[11px] text-cyan-500">Employer Account</p>
        </div>

        {/* Nav */}
        <nav className="mt-3 flex-1 space-y-0.5 px-2">
          {([
            { v: 'dashboard' as View, label: 'Dashboard', Icon: LayoutDashboard },
            { v: 'requirements' as View, label: 'My Requirements', Icon: FileText },
            { v: 'post-job' as View, label: 'Post a Job', Icon: Plus },
            { v: 'profile' as View, label: 'Company Profile', Icon: Building2 },
          ] as const).map(({ v, label, Icon }) => (
            <button
              key={v}
              onClick={() => { setView(v); setSidebarOpen(false); }}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                view === v
                  ? 'bg-cyan-50 text-cyan-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
              {v === 'post-job' && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-cyan-100 text-[10px] font-bold text-cyan-700">+</span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-200 px-2 py-3">
          <button
            onClick={onSignOut}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3.5 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-sm font-semibold text-gray-900">{VIEW_LABELS[view]}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { void onRefreshPortalProfile(); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:bg-gray-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {/* Account menu */}
            <div ref={accountMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setShowAccountMenu((c) => !c)}
                className="flex items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2 transition hover:border-gray-200 hover:bg-gray-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600 text-xs font-bold text-white">
                  {initials(companyName).toUpperCase() || 'E'}
                </span>
                <span className="hidden min-w-0 text-left sm:block">
                  <span className="block max-w-[150px] truncate text-sm font-semibold text-gray-900">{companyName}</span>
                  <span className="block text-xs text-gray-500">{user.email}</span>
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${showAccountMenu ? 'rotate-180' : ''}`} />
              </button>

              {showAccountMenu && (
                <div className="absolute right-0 z-30 mt-2 w-64 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
                  <div className="px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-gray-900">{companyName}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">{user.email}</p>
                  </div>
                  <hr className="my-1.5 border-gray-100" />
                  <button
                    type="button"
                    onClick={() => { setShowAccountMenu(false); setView('profile'); }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    <Settings className="h-4 w-4" /> Company Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAccountMenu(false); void onSignOut(); }}
                    className="mt-0.5 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Toast */}
        {profileToast && (
          <div className="absolute right-6 top-16 z-40 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 shadow-lg">
            <CheckCircle2 className="h-4 w-4" /> {profileToast}
          </div>
        )}

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">

          {/* ── Loading ── */}
          {loading && (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-8 text-center text-sm text-gray-400">
              Loading employer workspace…
            </div>
          )}

          {/* ── Error ── */}
          {!loading && error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>
          )}

          {/* ─────────────────── DASHBOARD VIEW ─────────────────── */}
          {!loading && view === 'dashboard' && (
            <div className="space-y-6">

              {/* Welcome banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-500 p-6 text-white shadow-md">
                <div className="absolute right-0 top-0 h-full w-48 pointer-events-none bg-[radial-gradient(ellipse_at_right,rgba(255,255,255,0.15),transparent_70%)]" />
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-cyan-200" />
                      <span className="text-xs font-semibold uppercase tracking-widest text-cyan-100">Employer Portal</span>
                    </div>
                    <h2 className="mt-2 text-2xl font-bold">{companyName}</h2>
                    <p className="mt-1 text-sm text-cyan-100">
                      Manage your hiring requirements and track fulfilment in real time.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs">
                      {(lead?.email || user.email) && (
                        <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
                          <Mail className="h-3 w-3" /> {lead?.email || user.email}
                        </span>
                      )}
                      {lead?.phone_number && (
                        <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
                          <Phone className="h-3 w-3" /> {lead.phone_number}
                        </span>
                      )}
                      {(lead?.country || lead?.city) && (
                        <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
                          <MapPin className="h-3 w-3" /> {[lead?.city, lead?.country].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setView('post-job')}
                    className="flex-shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-cyan-700 shadow transition hover:bg-cyan-50"
                  >
                    + Post Requirement
                  </button>
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { label: 'Total Requirements', value: stats.total, Icon: FileText, color: 'text-cyan-600', bg: 'bg-cyan-50' },
                  { label: 'Open / Active', value: stats.active, Icon: BriefcaseBusiness, color: 'text-green-600', bg: 'bg-green-50' },
                  { label: 'In Progress', value: stats.inProgress, Icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Fulfilled', value: stats.fulfilled, Icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map(({ label, value, Icon, color, bg }) => (
                  <div key={label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className={`inline-flex rounded-xl p-2.5 ${bg}`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <p className="mt-4 text-2xl font-bold text-gray-900">{value}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>

              {/* Recent requirements */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                  <h2 className="text-sm font-semibold text-gray-900">Recent Requirements</h2>
                  <button onClick={() => setView('requirements')} className="text-xs font-medium text-cyan-600 hover:underline">
                    View all →
                  </button>
                </div>
                {reqLoading ? (
                  <p className="px-5 py-4 text-sm text-gray-400">Loading requirements…</p>
                ) : requirements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Briefcase className="mx-auto h-8 w-8 text-gray-300" />
                    <p className="mt-3 text-sm font-medium text-gray-500">No requirements yet</p>
                    <button
                      type="button"
                      onClick={() => setView('post-job')}
                      className="mt-3 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-700"
                    >
                      Post your first requirement
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                        <th className="px-5 py-3">Role / Position</th>
                        <th className="px-4 py-3">Qty</th>
                        <th className="px-4 py-3">Country</th>
                        <th className="px-4 py-3">Salary</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {requirements.slice(0, 6).map((r) => (
                        <tr key={r.id} className="transition hover:bg-gray-50">
                          <td className="px-5 py-3.5 font-medium text-gray-900">{r.professions || '—'}</td>
                          <td className="px-4 py-3.5 text-gray-600">{r.quantity || '—'}</td>
                          <td className="px-4 py-3.5 text-gray-600">{r.country || '—'}</td>
                          <td className="px-4 py-3.5 text-gray-600">{r.salary_range || '—'}</td>
                          <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                          <td className="px-4 py-3.5 text-gray-400">{formatDate(r.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
              </div>

              {postSuccess && (
                <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-5 py-3.5 text-sm font-medium text-green-700">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> {postSuccess}
                </div>
              )}
            </div>
          )}

          {/* ─────────────────── REQUIREMENTS VIEW ─────────────────── */}
          {!loading && view === 'requirements' && (
            <div className="space-y-5">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1" style={{ minWidth: '200px' }}>
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by role, country…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 outline-none focus:border-cyan-400"
                >
                  <option value="all">All statuses</option>
                  <option value="new">New</option>
                  <option value="active">Active</option>
                  <option value="in-progress">In Progress</option>
                  <option value="fulfilled">Fulfilled</option>
                </select>
                <button
                  type="button"
                  onClick={() => setView('post-job')}
                  className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700"
                >
                  <Plus className="h-4 w-4" /> New Requirement
                </button>
              </div>

              {/* Cards grid */}
              {reqLoading ? (
                <p className="text-sm text-gray-400">Loading…</p>
              ) : filtered.length === 0 ? (
                <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-12 text-center">
                  <Briefcase className="h-8 w-8 text-gray-300" />
                  <p className="mt-3 text-sm font-medium text-gray-500">No requirements found</p>
                  <button
                    type="button"
                    onClick={() => setView('post-job')}
                    className="mt-3 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-700"
                  >
                    Post a requirement
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((r) => (
                    <RequirementCard key={r.id} req={r} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─────────────────── POST JOB VIEW ─────────────────── */}
          {!loading && view === 'post-job' && (
            <div className="mx-auto max-w-2xl">
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-5">
                  <h2 className="text-lg font-semibold text-gray-900">Post a New Requirement</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Describe the role you need to fill — Falisha will source, screen, and deliver.
                  </p>
                </div>

                <form onSubmit={handlePostJob} className="divide-y divide-gray-100">
                  {/* Role */}
                  <section className="px-6 py-5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-700">Role Details</h3>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Role / Position <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <BriefcaseBusiness className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={jobForm.professions}
                          onChange={(e) => setJobForm((f) => ({ ...f, professions: e.target.value }))}
                          placeholder="e.g. HVAC Technician, Civil Engineer, Driver"
                          className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Workers Needed</label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <select
                            value={jobForm.quantity}
                            onChange={(e) => setJobForm((f) => ({ ...f, quantity: e.target.value }))}
                            className="w-full appearance-none rounded-xl border border-gray-200 py-2.5 pl-10 pr-8 text-sm text-gray-700 outline-none focus:border-cyan-400"
                          >
                            <option value="">Select quantity…</option>
                            {QTY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Salary / Package</label>
                        <div className="relative">
                          <Banknote className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <select
                            value={jobForm.salary_range}
                            onChange={(e) => setJobForm((f) => ({ ...f, salary_range: e.target.value }))}
                            className="w-full appearance-none rounded-xl border border-gray-200 py-2.5 pl-10 pr-8 text-sm text-gray-700 outline-none focus:border-cyan-400"
                          >
                            <option value="">Select range…</option>
                            {SALARY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                            <option value="custom">Enter custom…</option>
                          </select>
                        </div>
                        {jobForm.salary_range === 'custom' && (
                          <input
                            type="text"
                            placeholder="e.g. SAR 2,000/mo"
                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-cyan-400"
                            onChange={(e) => setJobForm((f) => ({ ...f, salary_range: e.target.value }))}
                          />
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Location */}
                  <section className="px-6 py-5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-700">Job Location</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Country</label>
                        <div className="relative">
                          <Globe2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <select
                            value={jobForm.country}
                            onChange={(e) => setJobForm((f) => ({ ...f, country: e.target.value }))}
                            className="w-full appearance-none rounded-xl border border-gray-200 py-2.5 pl-10 pr-8 text-sm text-gray-700 outline-none focus:border-cyan-400"
                          >
                            <option value="">Select country…</option>
                            {WORLD_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">City</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={jobForm.city}
                            onChange={(e) => setJobForm((f) => ({ ...f, city: e.target.value }))}
                            placeholder="e.g. Riyadh, Dubai"
                            className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-cyan-400"
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Working Conditions */}
                  <section className="px-6 py-5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-700">Working Conditions</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Duty Hours</label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <select
                            value={jobForm.duty_hours}
                            onChange={(e) => setJobForm((f) => ({ ...f, duty_hours: e.target.value }))}
                            className="w-full appearance-none rounded-xl border border-gray-200 py-2.5 pl-10 pr-8 text-sm text-gray-700 outline-none focus:border-cyan-400"
                          >
                            <option value="">Select hours…</option>
                            {HOURS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                            <option value="other">Other (specify in notes)</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Contract Duration</label>
                        <div className="relative">
                          <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <select
                            value={jobForm.contract_duration}
                            onChange={(e) => setJobForm((f) => ({ ...f, contract_duration: e.target.value }))}
                            className="w-full appearance-none rounded-xl border border-gray-200 py-2.5 pl-10 pr-8 text-sm text-gray-700 outline-none focus:border-cyan-400"
                          >
                            <option value="">Select duration…</option>
                            {CONTRACT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Benefits Included</label>
                      <div className="relative">
                        <Star className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={jobForm.benefits_included}
                          onChange={(e) => setJobForm((f) => ({ ...f, benefits_included: e.target.value }))}
                          placeholder="e.g. Accommodation, Meals, Medical, Transport"
                          className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Notes */}
                  <section className="px-6 py-5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-700">Additional Notes</h3>
                    <textarea
                      value={jobForm.comments}
                      onChange={(e) => setJobForm((f) => ({ ...f, comments: e.target.value }))}
                      rows={4}
                      placeholder="Visa type, interview process, accommodation details, language preference, start date…"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                    />
                  </section>

                  {/* Submit */}
                  <div className="flex items-center justify-between px-6 py-5">
                    <button
                      type="button"
                      onClick={() => { setJobForm(EMPTY_JOB); setPostError(null); }}
                      className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                    >
                      Clear form
                    </button>
                    <button
                      type="submit"
                      disabled={posting}
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {posting ? 'Posting…' : 'Post Requirement'}
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {postError && (
                    <div className="mx-6 mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {postError}
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* ─────────────────── PROFILE VIEW ─────────────────── */}
          {!loading && view === 'profile' && (
            <div className="mx-auto max-w-xl">
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-5">
                  <h2 className="text-lg font-semibold text-gray-900">Company Profile</h2>
                  <p className="mt-1 text-sm text-gray-500">Update your company details visible to the Falisha team.</p>
                </div>
                <form onSubmit={handleProfileSave} className="px-6 py-5 space-y-4">
                  {[
                    { key: 'company_name', label: 'Company Name', icon: Building2, placeholder: 'Acme Corp' },
                    { key: 'contact_name', label: 'Contact Person', icon: Users, placeholder: 'Ahmad Khan' },
                    { key: 'phone', label: 'WhatsApp / Phone', icon: Phone, placeholder: '+971501234567' },
                  ].map(({ key, label, icon: Icon, placeholder }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">{label}</label>
                      <div className="relative">
                        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={profileForm[key as keyof ProfileForm]}
                          onChange={(e) => setProfileForm((f) => ({ ...f, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                        />
                      </div>
                    </div>
                  ))}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">Country</label>
                      <div className="relative">
                        <Globe2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <select
                          value={profileForm.country}
                          onChange={(e) => setProfileForm((f) => ({ ...f, country: e.target.value }))}
                          className="w-full appearance-none rounded-xl border border-gray-200 py-2.5 pl-10 pr-8 text-sm text-gray-700 outline-none focus:border-cyan-400"
                        >
                          <option value="">Select country…</option>
                          {WORLD_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700">City</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={profileForm.city}
                          onChange={(e) => setProfileForm((f) => ({ ...f, city: e.target.value }))}
                          placeholder="e.g. Dubai"
                          className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>
                  </div>

                  {profileError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{profileError}</div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:opacity-60"
                    >
                      {profileSaving ? 'Saving…' : 'Save Profile'}
                      <ShieldCheck className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </div>

              {/* Account info card */}
              <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Account Info</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {lead?.email || user.email}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <ShieldCheck className="h-4 w-4 text-gray-400" />
                    <span>Status: </span>
                    <StatusBadge status={lead?.status} />
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// ─── Contact popup ────────────────────────────────────────────────────────────

const ADMIN_WHATSAPP = '+9203303333335';
const ADMIN_EMAIL = 'support@falishajobs.com';
const WHATSAPP_URL = `https://wa.me/${ADMIN_WHATSAPP.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello, I am interested in your candidate recruitment services. I have a job requirement I would like to discuss.')}`;

function ContactPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50">
            <MessageCircle className="h-5 w-5 text-cyan-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Contact Our Team</p>
            <p className="text-xs text-gray-500">We'll unlock candidates for your role</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          Our recruitment consultants are ready to present verified candidates for your requirement. Reach us to get started.
        </p>
        <div className="space-y-3">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full rounded-xl bg-green-500 text-white px-4 py-3 text-sm font-semibold hover:bg-green-600 transition"
          >
            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.122 1.527 5.855L0 24l6.335-1.506A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.803 9.803 0 0 1-5.007-1.374l-.36-.213-3.72.885.934-3.61-.234-.372A9.784 9.784 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
            </svg>
            WhatsApp: {ADMIN_WHATSAPP}
          </a>
          <a
            href={`mailto:${ADMIN_EMAIL}?subject=Job Requirement Enquiry`}
            className="flex items-center gap-3 w-full rounded-xl border border-gray-200 text-gray-700 px-4 py-3 text-sm font-medium hover:bg-gray-50 transition"
          >
            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
            {ADMIN_EMAIL}
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Candidate Status Modal ───────────────────────────────────────────────────

const EMPLOYER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  unreviewed: { label: 'Unreviewed', color: 'bg-gray-100 text-gray-600' },
  shortlisted: { label: 'Shortlisted', color: 'bg-blue-100 text-blue-700' },
  selected: { label: 'Selected', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-600' },
};

function profileLinkForCandidate(id: string, name: string): string {
  const slug = (name || 'candidate').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `https://falishajobs.up.railway.app/profile/${id}/${slug}`;
}

function CandidatesModal({
  job,
  onClose,
}: {
  job: EmployerLeadProfile;
  onClose: () => void;
}) {
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [downloadingCvId, setDownloadingCvId] = useState<string | null>(null);

  const handleDownloadCV = async (candidateId: string, candidateName: string) => {
    if (downloadingCvId) return;
    setDownloadingCvId(candidateId);
    try {
      const result = await apiClient.generateCandidateCV(candidateId, 'employer-safe', false);
      const response = await fetch(result.cv_url);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${candidateName || 'Candidate'}_Employer_CV.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download CV. Please try again.');
    } finally {
      setDownloadingCvId(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    apiClient.getJobRecommendations(job.id!)
      .then(r => setRecommendations(r.recommendations))
      .catch(() => setRecommendations([]))
      .finally(() => setLoading(false));
  }, [job.id]);

  const handleStatusChange = async (recId: string, status: 'unreviewed' | 'shortlisted' | 'selected' | 'rejected') => {
    setUpdatingId(recId);
    try {
      await apiClient.updateEmployerStatus(recId, status);
      setRecommendations(prev => prev.map(r => r.id === recId ? { ...r, employer_status: status } : r));
    } catch {
      // ignore
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-200">
          <div>
            <p className="font-bold text-gray-900">{job.professions || 'Role'}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {[job.city, job.country].filter(Boolean).join(', ')}
              {recommendations.length > 0 && ` · ${recommendations.length} candidate${recommendations.length !== 1 ? 's' : ''} shortlisted`}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading && <p className="text-center py-8 text-sm text-gray-400">Loading candidates…</p>}
          {!loading && recommendations.length === 0 && (
            <p className="text-center py-8 text-sm text-gray-400">No candidates assigned yet. Our team is working on it.</p>
          )}
          {!loading && recommendations.map(rec => {
            const c = rec.candidates;
            if (!c) return null;
            const st = EMPLOYER_STATUS_LABELS[rec.employer_status] ?? EMPLOYER_STATUS_LABELS.unreviewed;
            return (
              <div key={rec.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-cyan-200 transition">
                {/* Photo */}
                {c.profile_photo_url ? (
                  <img src={c.profile_photo_url} alt={c.name || ''} className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-gray-100" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center flex-shrink-0 text-lg font-bold text-white">
                    {(c.name || '?')[0]}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {c.position || '—'}
                    {c.experience_years != null && <> · {c.experience_years} yrs exp</>}
                    {c.country_of_interest && <> · prefers {c.country_of_interest}</>}
                  </p>
                  {c.skills && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {c.skills.split(/[,;]/).slice(0, 4).map(s => s.trim()).filter(Boolean).map(skill => (
                        <span key={skill} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{skill}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Match score */}
                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                  <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${
                    rec.match_score >= 80 ? 'bg-green-100 text-green-700' :
                    rec.match_score >= 65 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {rec.match_score}%
                  </span>
                  <span className="text-[10px] text-gray-400">match</span>
                </div>

                {/* Actions + status */}
                <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                  <select
                    value={rec.employer_status}
                    disabled={updatingId === rec.id}
                    onChange={e => handleStatusChange(rec.id, e.target.value as any)}
                    className={`text-xs font-semibold rounded-full px-3 py-1.5 border-0 cursor-pointer appearance-none focus:ring-2 focus:ring-cyan-300 outline-none ${st.color} ${updatingId === rec.id ? 'opacity-60' : ''}`}
                  >
                    <option value="unreviewed">Unreviewed</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="selected">Selected</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <div className="flex items-center gap-1">
                    <a
                      href={profileLinkForCandidate(c.id!, c.name || '')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 hover:underline px-1.5 py-0.5 rounded"
                      title="View full profile"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Profile
                    </a>
                    <span className="text-gray-200">|</span>
                    <button
                      type="button"
                      onClick={() => handleDownloadCV(c.id!, c.name || '')}
                      disabled={downloadingCvId === c.id}
                      className="flex items-center gap-1 text-[10px] text-purple-600 hover:text-purple-800 hover:underline px-1.5 py-0.5 rounded disabled:opacity-50"
                      title="Download employer-safe CV"
                    >
                      <Download className="h-3 w-3" />
                      {downloadingCvId === c.id ? 'Generating…' : 'Download CV'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer CTA */}
        <div className="border-t border-gray-100 px-5 py-4 flex items-center justify-between text-sm">
          <span className="text-gray-400 text-xs">Mark candidates to track your interest</span>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-medium text-green-600 hover:underline"
          >
            <MessageCircle className="h-4 w-4" />
            Contact recruiter on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Requirement Card ─────────────────────────────────────────────────────────

function RequirementCard({ req }: { req: EmployerLeadProfile }) {
  const [expanded, setExpanded] = useState(false);
  const [recCount, setRecCount] = useState<number | null>(null);
  const [poolCount, setPoolCount] = useState<number>(30);
  const [showContactPopup, setShowContactPopup] = useState(false);
  const [showCandidates, setShowCandidates] = useState(false);

  const isClosed = ['closed', 'fulfilled'].includes((req.status || '').toLowerCase());

  useEffect(() => {
    if (!req.id || isClosed) return;
    // Fetch actual recommendation count
    apiClient.getJobRecommendations(req.id)
      .then(r => setRecCount(r.recommendations.length))
      .catch(() => setRecCount(0));
    // Fetch loose pool count for locked state
    apiClient.getRecommendationPoolCount(req.id)
      .then(r => setPoolCount(r.count))
      .catch(() => setPoolCount(30));
  }, [req.id, isClosed]);

  const hasRecommendations = recCount !== null && recCount > 0;

  return (
    <>
      {showContactPopup && <ContactPopup onClose={() => setShowContactPopup(false)} />}
      {showCandidates && <CandidatesModal job={req} onClose={() => setShowCandidates(false)} />}

      <article className="rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50">
              <BriefcaseBusiness className="h-5 w-5 text-cyan-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate font-semibold text-gray-900">{req.professions || 'Untitled Role'}</p>
                <StatusBadge status={req.status} />
              </div>
              <p className="mt-0.5 text-xs text-gray-500">
                {[req.city, req.country].filter(Boolean).join(', ') || 'Location TBD'}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-500">
            {req.quantity && (
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-gray-400" /> {req.quantity} workers</span>
            )}
            {req.salary_range && (
              <span className="flex items-center gap-1.5"><Banknote className="h-3.5 w-3.5 text-gray-400" /> {req.salary_range}</span>
            )}
            {req.contract_duration && (
              <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-gray-400" /> {req.contract_duration}</span>
            )}
            {req.duty_hours && (
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-gray-400" /> {req.duty_hours}</span>
            )}
          </div>

          {(req.benefits_included || req.comments) && (
            <>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-3 flex items-center gap-1 text-xs font-medium text-cyan-600 hover:underline"
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                {expanded ? 'Hide details' : 'View details'}
              </button>
              {expanded && (
                <div className="mt-2 space-y-1.5 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                  {req.benefits_included && (
                    <p><span className="font-semibold text-gray-700">Benefits: </span>{req.benefits_included}</p>
                  )}
                  {req.comments && (
                    <p><span className="font-semibold text-gray-700">Notes: </span>{req.comments}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Candidates Section ──────────────────────────────────────────── */}
        <div className="border-t border-gray-100 px-5 py-3">
          {isClosed ? (
            /* Closed state */
            <div className="flex items-center gap-3 text-gray-400">
              <Lock className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs">This requirement is closed</span>
            </div>
          ) : hasRecommendations ? (
            /* Unlocked: recommendations available */
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-cyan-600" />
                <div>
                  <p className="text-sm font-bold text-gray-900">{recCount}</p>
                  <p className="text-[10px] text-gray-500 leading-none">Candidates<br />shortlisted</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCandidates(true)}
                className="flex items-center gap-2 rounded-xl bg-cyan-600 text-white px-4 py-2 text-xs font-semibold hover:bg-cyan-700 transition"
              >
                View Profiles →
              </button>
            </div>
          ) : (
            /* Locked: no recommendations yet */
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Lock className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{poolCount}+</p>
                  <p className="text-[10px] text-gray-500 leading-none">Candidates<br />available</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowContactPopup(true)}
                className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 px-3 py-2 text-xs font-semibold hover:bg-amber-100 transition"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Contact Us
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-2 text-[11px] text-gray-400">
          Posted {req.created_at
            ? new Date(req.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—'}
        </div>
      </article>
    </>
  );
}
