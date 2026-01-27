import { mockCandidates, mockJobOrders, mockEmployers } from '../lib/mockData';
import { Users, Briefcase, Building2, TrendingUp, MapPin, Award, UserCheck, Calendar } from 'lucide-react';

export function Dashboard() {
  // Calculate stats
  const totalCandidates = mockCandidates.length;
  const newToday = mockCandidates.filter(c => c.appliedDate === '2025-12-13').length;
  const newThisWeek = mockCandidates.filter(c => {
    const date = new Date(c.appliedDate);
    const weekAgo = new Date('2025-12-06');
    return date >= weekAgo;
  }).length;
  
  const statusBreakdown = {
    Applied: mockCandidates.filter(c => c.status === 'Applied').length,
    Pending: mockCandidates.filter(c => c.status === 'Pending').length,
    Deployed: mockCandidates.filter(c => c.status === 'Deployed').length,
    Cancelled: mockCandidates.filter(c => c.status === 'Cancelled').length,
  };

  const sourceBreakdown = {
    WhatsApp: mockCandidates.filter(c => c.source === 'WhatsApp').length,
    Email: mockCandidates.filter(c => c.source === 'Email').length,
    Form: mockCandidates.filter(c => c.source === 'Form').length,
    Manual: mockCandidates.filter(c => c.source === 'Manual').length,
  };

  // Country breakdown
  const countryBreakdown: { [key: string]: number } = {};
  mockCandidates.forEach(c => {
    countryBreakdown[c.country] = (countryBreakdown[c.country] || 0) + 1;
  });

  // Position breakdown
  const positionBreakdown: { [key: string]: number } = {};
  mockCandidates.forEach(c => {
    positionBreakdown[c.position] = (positionBreakdown[c.position] || 0) + 1;
  });

  const openJobs = mockJobOrders.filter(j => j.status === 'Open').length;
  const totalEmployers = mockEmployers.length;

  return (
    <div className="space-y-6">
      <div>
        <h2>Dashboard</h2>
        <p className="text-gray-600">Welcome to Falisha Manpower Recruitment Portal</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Candidates</p>
              <p className="text-3xl mt-2">{totalCandidates}</p>
              <p className="text-sm text-green-600 mt-1">+{newToday} today</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open Job Orders</p>
              <p className="text-3xl mt-2">{openJobs}</p>
              <p className="text-sm text-gray-500 mt-1">{mockJobOrders.length} total</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Employers</p>
              <p className="text-3xl mt-2">{totalEmployers}</p>
              <p className="text-sm text-gray-500 mt-1">Registered companies</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Deployed</p>
              <p className="text-3xl mt-2">{statusBreakdown.Deployed}</p>
              <p className="text-sm text-green-600 mt-1">Successfully placed</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="mb-4">Status Breakdown</h3>
          <div className="space-y-4">
            {Object.entries(statusBreakdown).map(([status, count]) => {
              const percentage = (count / totalCandidates) * 100;
              const colors: { [key: string]: string } = {
                Applied: 'bg-blue-500',
                Pending: 'bg-yellow-500',
                Deployed: 'bg-green-500',
                Cancelled: 'bg-red-500',
              };
              return (
                <div key={status}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">{status}</span>
                    <span className="text-sm">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${colors[status]}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Source Breakdown */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="mb-4">Application Source</h3>
          <div className="space-y-4">
            {Object.entries(sourceBreakdown).map(([source, count]) => {
              const percentage = (count / totalCandidates) * 100;
              return (
                <div key={source}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">{source}</span>
                    <span className="text-sm">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-indigo-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Country & Position Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Country Breakdown */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3>Country of Interest - Distribution</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(countryBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([country, count]) => (
                <div key={country} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span>{country}</span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Position Breakdown */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-green-600" />
            <h3>Position-wise Distribution</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(positionBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([position, count]) => (
                <div key={position} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span>{position}</span>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-blue-900">AI Insights & Recommendations</h3>
            <div className="mt-3 space-y-2">
              <p className="text-sm text-blue-800">
                • <strong>Electrician applications increased by 32%</strong> this week. High demand for UAE positions.
              </p>
              <p className="text-sm text-blue-800">
                • <strong>Saudi Arabia is currently the top demand destination</strong> with {countryBreakdown['Saudi Arabia']} active candidates.
              </p>
              <p className="text-sm text-blue-800">
                • <strong>Recommendation:</strong> Push marketing for Welder and Steel Fixer positions - high AI matching scores detected.
              </p>
              <p className="text-sm text-blue-800">
                • <strong>Alert:</strong> 5 candidates pending document verification for more than 3 days. Follow-up required.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h3>Recent Applications</h3>
        </div>
        <div className="space-y-3">
          {mockCandidates.slice(0, 5).map(candidate => (
            <div key={candidate.id} className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p>{candidate.name}</p>
                  <p className="text-sm text-gray-600">{candidate.position} • {candidate.country}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  candidate.status === 'Applied' ? 'bg-blue-100 text-blue-700' :
                  candidate.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                  candidate.status === 'Deployed' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {candidate.status}
                </span>
                <p className="text-sm text-gray-500 mt-1">{candidate.appliedDate}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}