import { useState } from 'react';
import { mockCandidates, mockJobOrders, mockEmployers } from '../lib/mockData';
import { FileText, Download, Calendar, TrendingUp, BarChart3, PieChart } from 'lucide-react';

export function Reports() {
  const [reportType, setReportType] = useState('daily');

  // Calculate various metrics
  const totalCandidates = mockCandidates.length;
  const deployedCandidates = mockCandidates.filter(c => c.status === 'Deployed').length;
  const pendingCandidates = mockCandidates.filter(c => c.status === 'Pending').length;
  const appliedCandidates = mockCandidates.filter(c => c.status === 'Applied').length;

  // Country breakdown
  const countryStats = mockCandidates.reduce((acc, c) => {
    acc[c.country] = (acc[c.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Position breakdown
  const positionStats = mockCandidates.reduce((acc, c) => {
    acc[c.position] = (acc[c.position] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Source breakdown
  const sourceStats = mockCandidates.reduce((acc, c) => {
    acc[c.source] = (acc[c.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const reports = [
    {
      id: 'daily',
      name: 'Daily Activity Report',
      description: 'New candidates, status changes, and daily metrics',
      icon: Calendar,
      color: 'blue'
    },
    {
      id: 'country',
      name: 'Country-wise Report',
      description: 'Applications breakdown by destination country',
      icon: PieChart,
      color: 'green'
    },
    {
      id: 'position',
      name: 'Position-wise Report',
      description: 'Applications breakdown by trade/position',
      icon: BarChart3,
      color: 'purple'
    },
    {
      id: 'source',
      name: 'Source Analysis',
      description: 'Application sources and conversion rates',
      icon: TrendingUp,
      color: 'orange'
    },
    {
      id: 'employer',
      name: 'Employer Pipeline',
      description: 'Job orders and fulfillment status',
      icon: FileText,
      color: 'red'
    },
    {
      id: 'status',
      name: 'Status Summary',
      description: 'Candidate status workflow and timeline',
      icon: BarChart3,
      color: 'indigo'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Reports & Analytics</h2>
          <p className="text-gray-600">Generate and export detailed reports</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Select Date Range
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export All
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Total Applications</p>
          <p className="text-3xl mb-1">{totalCandidates}</p>
          <p className="text-sm text-green-600">All time</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Deployed</p>
          <p className="text-3xl mb-1">{deployedCandidates}</p>
          <p className="text-sm text-gray-500">{((deployedCandidates / totalCandidates) * 100).toFixed(1)}% success rate</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">In Progress</p>
          <p className="text-3xl mb-1">{pendingCandidates}</p>
          <p className="text-sm text-yellow-600">Pending review</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">New Applications</p>
          <p className="text-3xl mb-1">{appliedCandidates}</p>
          <p className="text-sm text-blue-600">Ready to process</p>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            purple: 'bg-purple-100 text-purple-600',
            orange: 'bg-orange-100 text-orange-600',
            red: 'bg-red-100 text-red-600',
            indigo: 'bg-indigo-100 text-indigo-600',
          };
          
          return (
            <div key={report.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${colorClasses[report.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="mb-2">{report.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                    View
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Country Report */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3>Country-wise Distribution</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                  Total Candidates
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                  Percentage
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 uppercase tracking-wider">
                  Visual
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(countryStats)
                .sort((a, b) => b[1] - a[1])
                .map(([country, count]) => {
                  const percentage = (count / totalCandidates) * 100;
                  return (
                    <tr key={country} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{country}</td>
                      <td className="px-6 py-4">{count}</td>
                      <td className="px-6 py-4">{percentage.toFixed(1)}%</td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Position Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3>Position-wise Distribution</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(positionStats)
            .sort((a, b) => b[1] - a[1])
            .map(([position, count]) => {
              const percentage = (count / totalCandidates) * 100;
              return (
                <div key={position} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm">{position}</p>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                      {count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{percentage.toFixed(1)}% of total</p>
                </div>
              );
            })}
        </div>
      </div>

      {/* Source Analysis */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="mb-6">Application Source Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(sourceStats).map(([source, count]) => {
            const percentage = (count / totalCandidates) * 100;
            return (
              <div key={source} className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">{source}</p>
                <p className="text-3xl mb-1">{count}</p>
                <p className="text-sm text-gray-500">{percentage.toFixed(1)}%</p>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-3">
                  <div
                    className="h-1 rounded-full bg-indigo-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Summary Report */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-blue-900 mb-4">AI Generated Summary (Daily Report)</h3>
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm">
              <strong className="text-blue-900">Applications:</strong> {appliedCandidates} new candidates today. 
              Peak application time: 10 AM - 2 PM. Most common source: {Object.entries(sourceStats).sort((a, b) => b[1] - a[1])[0][0]}.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm">
              <strong className="text-blue-900">Top Demand:</strong> {Object.entries(countryStats).sort((a, b) => b[1] - a[1])[0][0]} 
              {' '}is the most requested destination with {Object.entries(countryStats).sort((a, b) => b[1] - a[1])[0][1]} candidates.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm">
              <strong className="text-blue-900">Positions:</strong> {Object.entries(positionStats).sort((a, b) => b[1] - a[1])[0][0]} 
              {' '}has the highest applications ({Object.entries(positionStats).sort((a, b) => b[1] - a[1])[0][1]} candidates).
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm">
              <strong className="text-blue-900">Recommendation:</strong> Focus recruitment efforts on {Object.entries(positionStats).sort((a, b) => a[1] - b[1])[0][0]} 
              {' '}positions as they have lower application rates but high demand from employers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
