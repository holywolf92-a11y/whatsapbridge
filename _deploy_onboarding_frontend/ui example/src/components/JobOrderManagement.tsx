import { useState } from 'react';
import { mockJobOrders } from '../lib/mockData';
import { Search, Plus, Filter, Briefcase, Building2, MapPin, DollarSign, Users, AlertCircle, CheckCircle, Eye } from 'lucide-react';

export function JobOrderManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredJobs = mockJobOrders.filter(job => {
    const matchesSearch = job.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.employerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Job Order Management</h2>
          <p className="text-gray-600">Track and manage all job orders from employers</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Job Order
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by position, employer, or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Job Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredJobs.map((job) => (
          <div key={job.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white mb-1">{job.position}</h3>
                    <div className="flex items-center gap-2 text-sm text-green-100">
                      <Building2 className="w-4 h-4" />
                      {job.employerName}
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs ${
                  job.status === 'Open' ? 'bg-white bg-opacity-20' : 'bg-gray-500'
                }`}>
                  {job.status}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Location & Salary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600">Location</p>
                    <p className="text-sm">{job.country}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600">Salary</p>
                    <p className="text-sm">{job.salary}</p>
                  </div>
                </div>
              </div>

              {/* Candidates & Urgency */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600">Required</p>
                    <p className="text-sm">{job.candidates} candidates</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600">Urgency</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs inline-block ${
                      job.urgency === 'High' ? 'bg-red-100 text-red-700' :
                      job.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {job.urgency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Required Skills */}
              <div>
                <p className="text-xs text-gray-600 mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {job.skills.slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.skills.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{job.skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Created Date */}
              <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                Created on {job.createdDate}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 p-4 flex gap-2">
              <button className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                View Matches
              </button>
              <button className="flex-1 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" />
                Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="mb-4">Job Order Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 mb-1">Open Jobs</p>
            <p className="text-2xl text-green-900">
              {mockJobOrders.filter(j => j.status === 'Open').length}
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 mb-1">Total Candidates</p>
            <p className="text-2xl text-blue-900">
              {mockJobOrders.reduce((sum, job) => sum + job.candidates, 0)}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-600 mb-1">High Urgency</p>
            <p className="text-2xl text-red-900">
              {mockJobOrders.filter(j => j.urgency === 'High' && j.status === 'Open').length}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Closed Jobs</p>
            <p className="text-2xl text-gray-900">
              {mockJobOrders.filter(j => j.status === 'Closed').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
