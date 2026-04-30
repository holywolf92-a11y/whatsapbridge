import { useEffect, useState, type MouseEvent } from 'react';
import { Dashboard } from './components/Dashboard';
import { CandidateManagement } from './components/CandidateManagement_ENHANCED';
import { EmployerManagement } from './components/EmployerManagement';
import { JobOrderManagement } from './components/JobOrderManagement';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { AdminPanel } from './components/AdminPanel';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { PublicApplicationForm } from './components/PublicApplicationForm';
import { ApplicationLinkGenerator } from './components/ApplicationLinkGenerator';
import { CVInbox } from './components/CVInbox';
import { CommunicationTemplates } from './components/CommunicationTemplates';
import { UserManagement } from './components/UserManagement';
import { Login } from './components/Login';
import { InboxUI } from './components/InboxUI';
import { WhatsAppBridge } from './components/WhatsAppBridge';
import { WhatsAppInbox } from './components/WhatsAppInbox';
import { CandidateBrowserExcel } from './components/CandidateBrowserExcel';
import { PublicCandidateProfile } from './components/PublicCandidateProfile';
import { EmployeesModule } from './components/EmployeesModule';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { ReviewPage } from './components/ReviewPage';
import { ReviewsDashboard } from './components/ReviewsDashboard';
import { CandidateOnboardingPage } from './components/CandidateOnboardingPage';
import { CandidatePortalDashboard } from './components/CandidatePortalDashboard';
import { EmployerPortalDashboard } from './components/EmployerPortalDashboard';
import { PartnerPortalDashboard } from './components/PartnerPortalDashboard';
import { useAuth, AuthProvider } from './lib/authContext';
import { CandidateProvider } from './lib/candidateContext';
import { getRoleLabel, hasRolePermission, normalizeUserRole, type Permission, type UserRole } from './lib/authData';
import { apiClient, type PortalProfileResponse } from './lib/apiClient';
import { APP_CONFIG } from './lib/constants';
import { Toaster } from './components/ui/sonner';
import { ArrowLeft, Briefcase, Building2, ChevronDown, ClipboardList, FileText, FolderTree, Inbox, LayoutDashboard, Link2, LogOut, Mail, Menu, MessageSquare, Phone, Settings as SettingsIcon, Shield, Users, X, type LucideIcon } from 'lucide-react';

type AdminNavigationOptions = {
  profession?: string;
  candidateId?: string | null;
  candidateTab?: 'details' | 'documents' | 'missing-data' | null;
};

type NavItemConfig = {
  tab: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  roles?: UserRole[];
  permission?: {
    resource: keyof Permission;
    action: string;
  };
  badge?: 'candidate-count';
};

type NavSectionConfig = {
  id: string;
  label: string;
  items: NavItemConfig[];
};

type AppSessionUser = {
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  lastActive: string;
};

const NAV_SECTIONS: NavSectionConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { tab: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { tab: 'employee-dashboard', label: 'My Workspace', icon: ClipboardList, roles: ['worker'] },
    ],
  },
  {
    id: 'talent',
    label: 'Talent Operations',
    items: [
      { tab: 'cv-inbox', label: 'CV Inbox', icon: Inbox },
      { tab: 'inbox-ui', label: 'Inbox Manager', icon: Mail },
      { tab: 'candidate-excel-browser', label: 'Excel Browser', icon: FolderTree },
      { tab: 'candidates', label: 'Candidates', icon: Users, badge: 'candidate-count' },
    ],
  },
  {
    id: 'jobs',
    label: 'Employer And Jobs',
    items: [
      { tab: 'employers', label: 'Employers', icon: Building2 },
      { tab: 'jobs', label: 'Job Orders', icon: Briefcase },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { tab: 'employees', label: 'Employees', icon: ClipboardList },
      { tab: 'reports', label: 'Reports', icon: FileText },
      { tab: 'reviews', label: 'Reviews', icon: MessageSquare },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    items: [
      { tab: 'templates', label: 'Templates', icon: FileText },
      { tab: 'whatsapp-inbox', label: 'WhatsApp Inbox', icon: MessageSquare },
      { tab: 'whatsapp-bridge', label: 'WhatsApp Bridge', icon: Phone },
      { tab: 'application-link', label: 'Application Link', icon: Link2 },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { tab: 'admin-panel', label: 'Admin Panel', icon: Shield, adminOnly: true },
      { tab: 'users', label: 'User Management', icon: Users, permission: { resource: 'users', action: 'view' } },
      { tab: 'settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
];

const DEFAULT_OPEN_SECTIONS: Record<string, boolean> = {
  overview: true,
  talent: true,
  jobs: false,
  operations: false,
  communication: false,
  system: false,
};

const NAVIGATION_DRAWER_BREAKPOINT = 900;

const SECTION_BY_TAB = NAV_SECTIONS.reduce<Record<string, string>>((map, section) => {
  section.items.forEach((item) => {
    map[item.tab] = section.id;
  });
  return map;
}, {});

function FalishaHeaderMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-5 w-5 md:h-6 md:w-6">
      <defs>
        <linearGradient id="falisha-mark-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="falisha-mark-red" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
      </defs>
      <rect x="5" y="5" width="38" height="38" rx="12" fill="url(#falisha-mark-blue)" />
      <path d="M16 33V15h16v4H21v3h9v4h-9v7z" fill="#ffffff" />
      <path d="M32 15c2.9 0 5.1 2.2 5.1 5.1 0 1.9-.8 3.2-2.6 4.6l-4.1 3.1c-1.2.9-1.8 1.6-1.8 2.7V33H24v-2.7c0-2.4 1-4.1 3.2-5.8l4.2-3.1c.8-.6 1.1-1 1.1-1.8 0-.8-.7-1.5-1.6-1.5-.9 0-1.6.7-1.8 1.8h-4.5C24.9 17.2 27.8 15 32 15z" fill="url(#falisha-mark-red)" opacity="0.96" />
    </svg>
  );
}

const AppContent = () => {
  const { session, signOut, loading } = useAuth();
  const sessionRole = normalizeUserRole(session?.user.user_metadata?.role);
  const [serverRole, setServerRole] = useState<UserRole | null>(null);
  const effectiveRole: UserRole = serverRole ?? sessionRole;
  const user: AppSessionUser = session ? {
    name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
    email: session.user.email || '',
    role: effectiveRole,
    roleLabel: getRoleLabel(effectiveRole),
    lastActive: 'Today',
  } : {
    name: 'Guest',
    email: '',
    role: 'candidate',
    roleLabel: 'Candidate',
    lastActive: 'Today',
  };
  const isInternalPortal = user.role === 'admin' || user.role === 'worker';
  const defaultInternalTab = user.role === 'worker' ? 'employee-dashboard' : 'dashboard';
  const portalBasePath = user.role === 'admin' ? '/admin' : '/management';

  const [activeTab, setActiveTab] = useState(defaultInternalTab);
  const [selectedProfession, setSelectedProfession] = useState<string>('all');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [candidateToOpen, setCandidateToOpen] = useState<string | null>(null);
  const [candidateTabToOpen, setCandidateTabToOpen] = useState<'details' | 'documents' | 'missing-data'>('details');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(DEFAULT_OPEN_SECTIONS);
  const [isMobileNavigation, setIsMobileNavigation] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.innerWidth < NAVIGATION_DRAWER_BREAKPOINT;
  });
  const [professions, setProfessions] = useState<string[]>(['all']);
  const [professionCounts, setProfessionCounts] = useState<Record<string, number>>({ all: 0 });
  const [portalProfile, setPortalProfile] = useState<PortalProfileResponse | null>(null);
  const [portalProfileLoading, setPortalProfileLoading] = useState(false);
  const [portalProfileError, setPortalProfileError] = useState<string | null>(null);
  // Clear server role on sign-out
  useEffect(() => { if (!session) setServerRole(null); }, [session]);
  const candidatePortalPath = '/profile';
  const partnerPortalPath = '/partner/dashboard';
  const employerPortalPath = '/employer/dashboard';

  const tabPaths: Record<string, string> = {
    dashboard: `${portalBasePath}/dashboard`,
    'employee-dashboard': `${portalBasePath}/employee-dashboard`,
    'cv-inbox': `${portalBasePath}/cv-inbox`,
    'inbox-ui': `${portalBasePath}/inbox`,
    'whatsapp-inbox': `${portalBasePath}/whatsapp`,
    'whatsapp-bridge': `${portalBasePath}/whatsapp-bridge`,
    'candidate-excel-browser': `${portalBasePath}/excel-browser`,
    candidates: `${portalBasePath}/candidates`,
    employers: `${portalBasePath}/employers`,
    jobs: `${portalBasePath}/jobs`,
    employees: `${portalBasePath}/employees`,
    templates: `${portalBasePath}/templates`,
    'application-link': `${portalBasePath}/application-link`,
    reports: `${portalBasePath}/reports`,
    settings: `${portalBasePath}/settings`,
    'admin-panel': `${portalBasePath}/admin`,
    users: `${portalBasePath}/users`,
    reviews: `${portalBasePath}/reviews`,
  };

  const buildPortalUrl = (tab: string, opts?: AdminNavigationOptions) => {
    const base = tabPaths[tab] || tabPaths[defaultInternalTab];
    const url = new URL(base, window.location.origin);
    if (tab === 'candidates') {
      const profession = (opts?.profession ?? 'all').toString();
      if (profession && profession !== 'all') {
        url.searchParams.set('profession', profession);
      }
      if (opts?.candidateId) {
        url.searchParams.set('candidateId', opts.candidateId);
      }
      if (opts?.candidateTab) {
        url.searchParams.set('candidateTab', opts.candidateTab);
      }
    }
    return `${url.pathname}${url.search}`;
  };

  const parsePortalLocation = () => {
    const { pathname, search } = window.location;
    const normalizedPathname = pathname.replace(/\/+$/, '') || '/';

    if (normalizedPathname === '/' || normalizedPathname === portalBasePath) {
      return { tab: defaultInternalTab, profession: 'all', candidateId: null, candidateTab: 'details' as const };
    }

    if (!normalizedPathname.startsWith(`${portalBasePath}/`)) {
      return { tab: defaultInternalTab, profession: 'all', candidateId: null, candidateTab: 'details' as const };
    }

    const match = Object.entries(tabPaths).find(([, path]) => path === normalizedPathname);
    const tab = match?.[0] || defaultInternalTab;

    let profession: string | null = null;
    let candidateId: string | null = null;
    let candidateTab: 'details' | 'documents' | 'missing-data' = 'details';
    if (tab === 'candidates') {
      const params = new URLSearchParams(search);
      profession = params.get('profession');
      candidateId = params.get('candidateId');
      const rawCandidateTab = params.get('candidateTab');
      if (rawCandidateTab === 'documents' || rawCandidateTab === 'missing-data' || rawCandidateTab === 'details') {
        candidateTab = rawCandidateTab;
      }
    }

    return { tab, profession: profession || 'all', candidateId, candidateTab };
  };

  const navigateTab = (tab: string, opts?: AdminNavigationOptions) => {
    setActiveTab(tab);
    if (tab === 'candidates') {
      setSelectedProfession(opts?.profession || 'all');
      if (opts?.candidateId !== undefined) {
        setCandidateToOpen(opts.candidateId ?? null);
      }
      if (opts?.candidateTab) {
        setCandidateTabToOpen(opts.candidateTab);
      }
    }
    if (typeof window === 'undefined') {
      return;
    }

    const nextUrl = buildPortalUrl(tab, opts);
    if (window.location.pathname + window.location.search !== nextUrl) {
      window.history.pushState({}, '', nextUrl);
    }
  };

  const onNavClick = (event: MouseEvent<HTMLAnchorElement>, tab: string, opts?: AdminNavigationOptions) => {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    navigateTab(tab, opts);
    setSidebarOpen(false);
  };

  useEffect(() => {
    if (!isInternalPortal || typeof window === 'undefined') {
      return;
    }

    const syncFromPath = () => {
      const parsed = parsePortalLocation();
      setActiveTab(parsed.tab);
      if (parsed.tab === 'candidates') {
        setSelectedProfession(parsed.profession);
        setCandidateToOpen(parsed.candidateId);
        setCandidateTabToOpen(parsed.candidateTab);
      } else {
        setCandidateToOpen(null);
        setCandidateTabToOpen('details');
      }
    };

    syncFromPath();
    window.addEventListener('popstate', syncFromPath);
    return () => window.removeEventListener('popstate', syncFromPath);
  }, [defaultInternalTab, isInternalPortal, portalBasePath]);

  useEffect(() => {
    const activeSectionId = SECTION_BY_TAB[activeTab];
    if (!activeSectionId) {
      return;
    }

    setOpenSections((current) => {
      if (current[activeSectionId]) {
        return current;
      }

      return {
        ...current,
        [activeSectionId]: true,
      };
    });
  }, [activeTab]);

  useEffect(() => {
    if (!session || typeof window === 'undefined') {
      return;
    }

    const normalizedPathname = window.location.pathname.replace(/\/+$/, '') || '/';

    if (user.role === 'candidate') {
      if (portalProfileLoading) {
        return;
      }

      if (normalizedPathname !== candidatePortalPath) {
        window.history.replaceState({}, '', candidatePortalPath);
      }
      return;
    }

    if (user.role === 'partner') {
      if (normalizedPathname !== partnerPortalPath) {
        window.history.replaceState({}, '', partnerPortalPath);
      }
      return;
    }

    if (user.role === 'employer') {
      if (normalizedPathname !== employerPortalPath) {
        window.history.replaceState({}, '', employerPortalPath);
      }
      return;
    }

    const shouldRedirect =
      normalizedPathname === '/' ||
      normalizedPathname === '/login' ||
      normalizedPathname === '/admin' ||
      normalizedPathname === '/worker' ||
      normalizedPathname === '/management' ||
      !normalizedPathname.startsWith(`${portalBasePath}/`);

    if (shouldRedirect) {
      const nextUrl = buildPortalUrl(defaultInternalTab);
      if (window.location.pathname + window.location.search !== nextUrl) {
        window.history.replaceState({}, '', nextUrl);
      }
      setActiveTab(defaultInternalTab);
    }
  }, [candidatePortalPath, defaultInternalTab, employerPortalPath, partnerPortalPath, portalBasePath, portalProfileLoading, session, user.role]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncNavigationMode = () => {
      setIsMobileNavigation(window.innerWidth < NAVIGATION_DRAWER_BREAKPOINT);
    };

    syncNavigationMode();
    window.addEventListener('resize', syncNavigationMode);
    return () => {
      window.removeEventListener('resize', syncNavigationMode);
    };
  }, []);

  useEffect(() => {
    if (!isMobileNavigation) {
      setSidebarOpen(false);
    }
  }, [isMobileNavigation]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!sidebarOpen || !isMobileNavigation) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileNavigation, sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen || !isMobileNavigation || typeof window === 'undefined') {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= NAVIGATION_DRAWER_BREAKPOINT) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobileNavigation, sidebarOpen]);

  useEffect(() => {
    if (!isInternalPortal) {
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const data = await apiClient.getCandidateBrowseMetadata();
        if (!isMounted) {
          return;
        }
        const positions = data.professions.map((profession) => profession.name);
        setProfessions(['all', ...positions]);
        const counts: Record<string, number> = { all: data.totalCandidates };
        data.professions.forEach((profession) => {
          counts[profession.name] = profession.count;
        });
        setProfessionCounts(counts);
      } catch {
        // Ignore candidate metadata failures here. The shell can still render.
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [isInternalPortal]);

  const loadPortalProfile = async (accessToken: string) => {
    setPortalProfileLoading(true);
    setPortalProfileError(null);

    try {
      const response = await apiClient.getPortalProfile(accessToken);
      // Use server-authoritative role (backend reads from users table, not just JWT)
      if (response.role) {
        setServerRole(normalizeUserRole(response.role));
      }
      setPortalProfile(response);
      return response;
    } catch (error: any) {
      setPortalProfileError(error?.message || 'Failed to load portal profile');
      setPortalProfile(null);
      return null;
    } finally {
      setPortalProfileLoading(false);
    }
  };

  useEffect(() => {
    if (!session || (user.role !== 'candidate' && user.role !== 'partner' && user.role !== 'employer')) {
      setPortalProfile(null);
      setPortalProfileError(null);
      setPortalProfileLoading(false);
      return;
    }

    let isMounted = true;

    loadPortalProfile(session.access_token).then((response) => {
      if (!isMounted || !response) {
        return;
      }
      setPortalProfile(response);
    });

    return () => {
      isMounted = false;
    };
  }, [session, user.role]);

  const toggleSection = (sectionId: string) => {
    setOpenSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  };

  const shouldRenderNavItem = (item: NavItemConfig) => {
    if (item.adminOnly && user.role !== 'admin') {
      return false;
    }

    if (item.roles && !item.roles.includes(user.role)) {
      return false;
    }

    if (item.permission && !hasRolePermission(user.role, item.permission.resource, item.permission.action)) {
      return false;
    }

    return true;
  };

  const getNavItemBadge = (item: NavItemConfig) => {
    if (item.badge === 'candidate-count') {
      return professionCounts.all ?? 0;
    }

    return null;
  };

  const isBrowserView = activeTab === 'candidate-excel-browser';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'employee-dashboard':
        return <EmployeeDashboard />;
      case 'cv-inbox':
        return <CVInbox onNavigateToCandidate={(id) => navigateTab('candidates', { candidateId: id })} />;
      case 'inbox-ui':
        return <InboxUI apiBaseUrl={(import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE_URL || '/api'} />;
      case 'whatsapp-inbox':
        return <WhatsAppInbox />;
      case 'whatsapp-bridge':
        return <WhatsAppBridge />;
      case 'candidate-excel-browser':
        return <CandidateBrowserExcel />;
      case 'candidates':
        return (
          <CandidateManagement
            initialProfessionFilter={selectedProfession}
            candidateIdToOpen={candidateToOpen}
            candidateInitialTabToOpen={candidateTabToOpen}
            onCandidateOpened={() => {
              setCandidateToOpen(null);
              setCandidateTabToOpen('details');
              if (typeof window !== 'undefined') {
                const nextUrl = buildPortalUrl('candidates', { profession: selectedProfession });
                window.history.replaceState({}, '', nextUrl);
              }
            }}
          />
        );
      case 'employers':
        return <EmployerManagement />;
      case 'jobs':
        return <JobOrderManagement />;
      case 'employees':
        return <EmployeesModule userRole={user.role} />;
      case 'templates':
        return <CommunicationTemplates />;
      case 'application-link':
        return <ApplicationLinkGenerator />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      case 'admin-panel':
        return <AdminPanel />;
      case 'users':
        return <UserManagement />;
      case 'reviews':
        return <ReviewsDashboard />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    if (typeof window !== 'undefined' && window.location.pathname === '/admin/reviews') {
      window.history.replaceState({}, '', '/review/qr');
      return <ReviewPage />;
    }

    return <Login />;
  }

  // If JWT has no explicit role (e.g. Google OAuth users), wait for server-side role confirmation
  // before rendering any portal — prevents wrong redirect/render before API returns.
  // Only block if portal profile is still actively loading (portalProfileLoading).
  // If loading finished with an error or null, fall through to avoid infinite spinner.
  if (serverRole === null && portalProfileLoading && (sessionRole === 'candidate' || sessionRole === 'partner' || sessionRole === 'employer')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (user.role === 'candidate') {
    return (
      <CandidatePortalDashboard
        accessToken={session.access_token}
        user={user}
        portalProfile={portalProfile}
        onSignOut={signOut}
        loading={portalProfileLoading}
        error={portalProfileError}
        onRefreshPortalProfile={() => loadPortalProfile(session.access_token)}
      />
    );
  }

  if (user.role === 'partner') {
    return (
      <PartnerPortalDashboard
        accessToken={session.access_token}
        user={user}
        portalProfile={portalProfile}
        onSignOut={signOut}
        loading={portalProfileLoading}
        error={portalProfileError}
        onRefreshPortalProfile={() => loadPortalProfile(session.access_token)}
      />
    );
  }

  if (user.role === 'employer') {
    return (
      <EmployerPortalDashboard
        accessToken={session.access_token}
        user={user}
        portalProfile={portalProfile}
        onSignOut={signOut}
        loading={portalProfileLoading}
        error={portalProfileError}
        onRefreshPortalProfile={async () => { await loadPortalProfile(session.access_token); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-40 shrink-0 border-b border-slate-200 bg-white/92 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur supports-[backdrop-filter]:bg-white/84">
        <div className="px-3 md:px-5 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 md:gap-3 min-w-0 flex-1">
              {!isBrowserView && isMobileNavigation && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="flex-shrink-0 rounded-lg p-2 hover:bg-slate-100 transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5 text-slate-600" />
                </button>
              )}
              <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/80 flex-shrink-0">
                <FalishaHeaderMark />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2.5">
                  <h1 className="truncate text-sm font-semibold text-slate-900 sm:text-base">{APP_CONFIG.company.name}</h1>
                  <span className="hidden lg:inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                    {user.role === 'admin' ? 'Admin Portal' : 'Worker Portal'}
                  </span>
                </div>
                <div className="mt-0.5 flex min-w-0 items-center gap-2 text-[11px] sm:text-xs text-slate-500">
                  <p className="truncate">Recruitment Operations Platform</p>
                  <span className="hidden xl:inline text-slate-300">•</span>
                  <span className="hidden xl:inline-flex items-center gap-1 truncate text-slate-500">
                    <Phone className="h-3 w-3" />
                    {APP_CONFIG.contact.phone}
                  </span>
                  <span className="hidden xl:inline text-slate-300">•</span>
                  <span className="hidden 2xl:inline-flex items-center gap-1 truncate text-slate-500">
                    <Mail className="h-3 w-3" />
                    {APP_CONFIG.contact.email}
                  </span>
                </div>
              </div>
            </div>
            <div className="relative flex-shrink-0 self-center">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2.5 md:px-3 py-1.5 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-slate-900 leading-tight">{user.name}</p>
                  <p className="flex items-center justify-end gap-1 text-[11px] text-slate-500 leading-tight">
                    <span className={`w-2 h-2 rounded-full ${user.role === 'admin' ? 'bg-slate-900' : 'bg-sky-500'}`} />
                    {user.roleLabel}
                  </p>
                </div>
                <div className={`flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full text-sm font-semibold text-white ${user.role === 'admin' ? 'bg-gradient-to-br from-slate-800 to-slate-950' : 'bg-gradient-to-br from-sky-500 to-blue-700'}`}>
                  {user.name[0]}
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-400 mt-1">Last active: {user.lastActive}</p>
                  </div>
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    My Profile
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4" />
                    Preferences
                  </button>
                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <button
                      onClick={() => {
                        signOut();
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="admin-shell min-w-0 flex-1 min-h-0">
        {!isBrowserView && (
          <>
            {isMobileNavigation && sidebarOpen && (
              <div className="admin-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
            )}
            <aside className={`admin-sidebar border-gray-200 min-h-0${isMobileNavigation ? ' is-mobile' : ' is-desktop'}${sidebarOpen ? ' sidebar-open' : ''}`} aria-label="Primary navigation">
              <div className="admin-sidebar-panel">
                {isMobileNavigation && (
                  <div className="admin-sidebar-header">
                    <div className="min-w-0">
                      <p className="admin-sidebar-brand">Navigation</p>
                      <p className="admin-sidebar-subtitle">Modules and workflows</p>
                    </div>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                      aria-label="Close menu"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                )}

                <div className="admin-sidebar-body">
                  <nav className="admin-nav" aria-label="Portal navigation">
                    {NAV_SECTIONS.map((section) => {
                      const visibleItems = section.items.filter(shouldRenderNavItem);
                      if (!visibleItems.length) {
                        return null;
                      }

                      const sectionIsOpen = openSections[section.id] ?? false;
                      const sectionHasActiveItem = visibleItems.some((item) => item.tab === activeTab);

                      return (
                        <section key={section.id} className="admin-nav-section">
                          <button
                            type="button"
                            className={`admin-nav-section-toggle${sectionHasActiveItem ? ' is-active' : ''}`}
                            onClick={() => toggleSection(section.id)}
                            aria-expanded={sectionIsOpen}
                          >
                            <span>{section.label}</span>
                            <ChevronDown className={`h-4 w-4 transition-transform ${sectionIsOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {sectionIsOpen && (
                            <div className="admin-nav-list">
                              {visibleItems.map((item) => {
                                const Icon = item.icon;
                                const badge = getNavItemBadge(item);
                                const isActive = activeTab === item.tab;
                                const itemHref = item.tab === 'candidates'
                                  ? buildPortalUrl(item.tab, { profession: 'all' })
                                  : buildPortalUrl(item.tab);

                                return (
                                  <a
                                    key={item.tab}
                                    href={itemHref}
                                    onClick={(event) => {
                                      if (item.tab === 'candidates') {
                                        setSelectedProfession('all');
                                        onNavClick(event, item.tab, { profession: 'all' });
                                        return;
                                      }

                                      onNavClick(event, item.tab);
                                    }}
                                    className={`admin-nav-item${isActive ? ' is-active' : ''}`}
                                    aria-current={isActive ? 'page' : undefined}
                                  >
                                    <span className="admin-nav-icon-wrap">
                                      <Icon className="admin-nav-icon" strokeWidth={1.9} />
                                    </span>
                                    <span className="admin-nav-label">{item.label}</span>
                                    {typeof badge === 'number' && <span className="admin-nav-badge">{badge}</span>}
                                  </a>
                                );
                              })}

                              {section.id === 'talent' && activeTab === 'candidates' && professions.filter((profession) => profession !== 'all').length > 0 && (
                                <div className="admin-nav-subtree" aria-label="Candidate profession filters">
                                  {professions.filter((profession) => profession !== 'all').map((profession) => {
                                    const isActiveProfession = selectedProfession === profession;

                                    return (
                                      <a
                                        key={profession}
                                        href={buildPortalUrl('candidates', { profession })}
                                        onClick={(event) => {
                                          setSelectedProfession(profession);
                                          onNavClick(event, 'candidates', { profession });
                                        }}
                                        className={`admin-nav-subitem${isActiveProfession ? ' is-active' : ''}`}
                                        aria-current={isActiveProfession ? 'page' : undefined}
                                      >
                                        <span className="admin-nav-subitem-dot" />
                                        <span className="admin-nav-subitem-label">{profession}</span>
                                        <span className="admin-nav-subitem-count">{professionCounts[profession] ?? 0}</span>
                                      </a>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </section>
                      );
                    })}
                  </nav>
                </div>

                <div className="admin-sidebar-footer">
                  <p className="admin-sidebar-footer-label">Signed in as</p>
                  <p className="admin-sidebar-footer-name">{user.name}</p>
                  <p className="admin-sidebar-footer-meta">{user.roleLabel} • {APP_CONFIG.company.name}</p>
                </div>
              </div>
            </aside>
          </>
        )}

        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto bg-gradient-to-b from-slate-50 to-white">
          {isBrowserView && (
            <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3">
              <button
                onClick={() => navigateTab('candidates')}
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Candidates</span>
              </button>
            </div>
          )}

          <div className={isBrowserView ? '' : 'p-3 sm:p-4 md:p-6'}>
            {renderContent()}
          </div>
        </main>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
};

export default function App() {
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname;

    if (pathname === '/privacy') {
      return <PrivacyPolicy />;
    }

    if (pathname === '/apply' || pathname.startsWith('/apply/')) {
      return <PublicApplicationForm />;
    }

    if (pathname === '/onboarding') {
      return (
        <AuthProvider>
          <>
            <CandidateOnboardingPage />
            <Toaster position="top-right" richColors closeButton />
          </>
        </AuthProvider>
      );
    }

    if (pathname === '/review' || pathname.startsWith('/review/')) {
      return <ReviewPage />;
    }

    const profileMatch = pathname.match(/^\/profile\/([^\/]+)(?:\/(.+))?$/);
    if (profileMatch) {
      return (
        <>
          <PublicCandidateProfile />
          <Toaster position="top-right" richColors closeButton />
        </>
      );
    }
  }

  return (
    <AuthProvider>
      <CandidateProvider>
        <AppContent />
      </CandidateProvider>
    </AuthProvider>
  );
}