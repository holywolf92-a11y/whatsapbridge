import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { CandidateManagement } from './components/CandidateManagement';
import { CandidateBrowserEnhanced } from './components/CandidateBrowserEnhanced';
import { EmployerManagement } from './components/EmployerManagement';
import { JobOrderManagement } from './components/JobOrderManagement';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { PublicApplicationForm } from './components/PublicApplicationForm';
import { ApplicationLinkGenerator } from './components/ApplicationLinkGenerator';
import { CVInbox } from './components/CVInbox';
import { CommunicationTemplates } from './components/CommunicationTemplates';
import { UserManagement } from './components/UserManagement';
import { Login } from './components/Login';
import { AuthProvider, useAuth } from './lib/authContext';
import { hasPermission } from './lib/authData';
import { mockCandidates } from './lib/mockData';
import { Users, Briefcase, Building2, FileText, Settings as SettingsIcon, LayoutDashboard, Link2, Inbox, MessageSquare, FolderTree, ArrowLeft, LogOut, Shield, ChevronDown } from 'lucide-react';

function AppContent() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPublicForm, setShowPublicForm] = useState(false);
  const [selectedProfession, setSelectedProfession] = useState<string>('all');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Get unique professions from candidates
  const professions = Array.from(new Set(mockCandidates.map(c => c.position))).sort();
  const professionCounts = professions.reduce((acc, profession) => {
    acc[profession] = mockCandidates.filter(c => c.position === profession).length;
    return acc;
  }, {} as Record<string, number>);

  // Check if we should show the public form based on URL
  if (typeof window !== 'undefined' && window.location.pathname === '/apply') {
    return <PublicApplicationForm />;
  }

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated || !user) {
    return <Login />;
  }

  // Check if we're in browser view
  const isBrowserView = activeTab === 'candidate-browser';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'cv-inbox':
        return <CVInbox />;
      case 'candidates':
        return <CandidateManagement initialProfessionFilter={selectedProfession} />;
      case 'candidate-browser':
        return <CandidateBrowserEnhanced />;
      case 'employers':
        return <EmployerManagement />;
      case 'jobs':
        return <JobOrderManagement />;
      case 'templates':
        return <CommunicationTemplates />;
      case 'application-link':
        return <ApplicationLinkGenerator />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      case 'users':
        return <UserManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-blue-600">Falisha Manpower</h1>
              <p className="text-gray-600 text-sm">Recruitment Automation Portal</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${
                      user.role === 'Admin' ? 'bg-purple-500' :
                      user.role === 'Manager' ? 'bg-blue-500' :
                      user.role === 'Recruiter' ? 'bg-green-500' :
                      'bg-gray-500'
                    }`} />
                    {user.role}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                  user.role === 'Admin' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                  user.role === 'Manager' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                  user.role === 'Recruiter' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                  'bg-gradient-to-br from-gray-500 to-gray-600'
                }`}>
                  {user.name[0]}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* User Menu Dropdown */}
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
                        logout();
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

      <div className="flex">
        {/* Sidebar - Hidden when in browser view */}
        {!isBrowserView && (
          <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
            <nav className="p-4 space-y-1">
              {/* Dashboard */}
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              
              {/* Section: Candidate Operations */}
              <div className="pt-4">
                <p className="px-4 text-xs font-semibold text-gray-500 mb-2">CANDIDATE OPERATIONS</p>
                
                <button
                  onClick={() => setActiveTab('cv-inbox')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                    activeTab === 'cv-inbox'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Inbox className="w-4 h-4" />
                  <span className="flex-1 text-left">CV Inbox</span>
                  <span className="bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded text-xs">5 New</span>
                </button>
                
                <button
                  onClick={() => {
                    setActiveTab('candidates');
                    setSelectedProfession('all');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                    activeTab === 'candidates'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span className="flex-1 text-left">Candidates</span>
                  <span className="text-xs text-gray-500">{mockCandidates.length}</span>
                </button>

                {/* Profession Sub-items */}
                {professions.map((profession) => (
                  <button
                    key={profession}
                    onClick={() => {
                      setActiveTab('candidates');
                      setSelectedProfession(profession);
                    }}
                    className={`w-full flex items-center gap-3 pl-12 pr-4 py-2 rounded-lg transition-colors text-sm ${
                      activeTab === 'candidates' && selectedProfession === profession
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex-1 text-left">{profession}</span>
                    <span className="text-xs text-gray-500">{professionCounts[profession]}</span>
                  </button>
                ))}

                <button
                  onClick={() => setActiveTab('candidate-browser')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                    activeTab === 'candidate-browser'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FolderTree className="w-4 h-4" />
                  <span className="flex-1 text-left">Browser (Excel)</span>
                </button>
              </div>

              {/* Section: Employer & Jobs */}
              <div className="pt-4">
                <p className="px-4 text-xs font-semibold text-gray-500 mb-2">EMPLOYER & JOBS</p>
                
                <button
                  onClick={() => setActiveTab('employers')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                    activeTab === 'employers'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Employers
                </button>
                
                <button
                  onClick={() => setActiveTab('jobs')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                    activeTab === 'jobs'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Job Orders
                </button>
              </div>

              {/* Section: Communication */}
              <div className="pt-4">
                <p className="px-4 text-xs font-semibold text-gray-500 mb-2">COMMUNICATION</p>
                
                <button
                  onClick={() => setActiveTab('templates')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                    activeTab === 'templates'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Templates
                </button>
                
                <button
                  onClick={() => setActiveTab('application-link')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                    activeTab === 'application-link'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Link2 className="w-4 h-4" />
                  Application Link
                </button>
              </div>

              {/* Section: Reports & Settings */}
              <div className="pt-4">
                <p className="px-4 text-xs font-semibold text-gray-500 mb-2">SYSTEM</p>
                
                {hasPermission(user, 'users', 'view') && (
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                      activeTab === 'users'
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    User Management
                  </button>
                )}
                
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                    activeTab === 'reports'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Reports
                </button>
                
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
                    activeTab === 'settings'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <SettingsIcon className="w-4 h-4" />
                  Settings
                </button>
              </div>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1">
          {/* Back button for Browser view */}
          {isBrowserView && (
            <div className="bg-white border-b border-gray-200 px-6 py-3">
              <button
                onClick={() => setActiveTab('candidates')}
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Candidates</span>
              </button>
            </div>
          )}
          
          <div className={isBrowserView ? '' : 'p-6'}>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}