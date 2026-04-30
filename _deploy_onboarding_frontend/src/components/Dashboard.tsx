import { useEffect, useState } from 'react';
import { apiClient, CandidateDashboardStats } from '../lib/apiClient';
import { Users, Briefcase, Building2, UserCheck, TrendingUp, AlertTriangle, RefreshCw, Star } from 'lucide-react';

interface DashboardData {
  stats: CandidateDashboardStats;
  totalEmployers: number;
  totalJobOrders: number;
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stats, employersRes, jobOrdersRes] = await Promise.all([
        apiClient.getCandidateDashboardStats(),
        apiClient.getEmployers({ limit: 1 }),
        apiClient.getJobOrders({ limit: 1 }),
      ]);
      setData({
        stats,
        totalEmployers: employersRes.total,
        totalJobOrders: jobOrdersRes.total,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Welcome to Falisha Manpower Recruitment Portal</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-32 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-800">Failed to load dashboard</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium">
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { stats, totalEmployers, totalJobOrders } = data;

  const kpis = [
    {
      label: 'Total Candidates',
      value: stats.totalCandidates.toLocaleString(),
      sub: stats.newThisWeek > 0 ? `+${stats.newThisWeek} this week` : 'No new this week',
      icon: Users,
      from: 'from-blue-500',
      to: 'to-blue-600',
    },
    {
      label: 'Job Orders',
      value: totalJobOrders.toLocaleString(),
      sub: 'Total job orders',
      icon: Briefcase,
      from: 'from-emerald-500',
      to: 'to-emerald-600',
    },
    {
      label: 'Active Employers',
      value: totalEmployers.toLocaleString(),
      sub: 'Registered companies',
      icon: Building2,
      from: 'from-violet-500',
      to: 'to-violet-600',
    },
    {
      label: 'Deployed',
      value: stats.deployed.toLocaleString(),
      sub: 'Successfully placed',
      icon: UserCheck,
      from: 'from-orange-500',
      to: 'to-orange-600',
    },
  ];

  const secondaryStats = [
    {
      label: 'Pending Review',
      value: stats.pendingReview,
      icon: AlertTriangle,
      color: stats.pendingReview > 0 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-green-700 bg-green-50 border-green-200',
      note: stats.pendingReview > 0 ? 'Needs attention' : 'All clear',
    },
    {
      label: 'New This Week',
      value: stats.newThisWeek,
      icon: TrendingUp,
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      note: 'Last 7 days',
    },
    {
      label: 'Professions',
      value: stats.totalProfessions,
      icon: Star,
      color: 'text-violet-700 bg-violet-50 border-violet-200',
      note: 'Distinct roles',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Welcome to Falisha Manpower Recruitment Portal</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map(({ label, value, sub, icon: Icon, from, to }) => (
          <div
            key={label}
            className={`bg-gradient-to-br ${from} ${to} rounded-xl p-5 shadow-sm text-white`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium opacity-85">{label}</p>
                <p className="text-3xl font-bold mt-1 leading-none">{value}</p>
                <p className="text-xs mt-2 px-2 py-0.5 rounded-full inline-block bg-white/20 opacity-90">
                  {sub}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {secondaryStats.map(({ label, value, icon: Icon, color, note }) => (
          <div key={label} className={`rounded-xl border p-5 flex items-center gap-4 ${color}`}>
            <div className="w-11 h-11 rounded-xl bg-white/70 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold leading-none">{value.toLocaleString()}</p>
              <p className="text-sm font-semibold mt-0.5">{label}</p>
              <p className="text-xs opacity-60 mt-0.5">{note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
