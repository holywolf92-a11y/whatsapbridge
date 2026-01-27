import { useState } from 'react';
import { mockEmployers } from '../lib/mockData';
import { Search, Plus, Building2, Mail, Phone, MapPin, Briefcase, Eye } from 'lucide-react';

export function EmployerManagement() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployers = mockEmployers.filter(employer =>
    employer.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employer.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employer.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Employer Management</h2>
          <p className="text-gray-600">Manage your employer database and relationships</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Employer
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company name, country, or contact person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Employers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployers.map((employer) => (
          <div key={employer.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                {employer.activeJobs > 0 && (
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    {employer.activeJobs} Active Jobs
                  </span>
                )}
              </div>
              <h3 className="text-white">{employer.companyName}</h3>
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="w-4 h-4" />
                <p className="text-sm text-blue-100">{employer.country}</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Contact Person */}
              <div>
                <p className="text-xs text-gray-600 mb-1">Contact Person</p>
                <p className="text-sm">{employer.contactPerson}</p>
              </div>

              {/* Email */}
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-600">Email</p>
                  <p className="text-sm break-all">{employer.email}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-600">Phone</p>
                  <p className="text-sm">{employer.phone}</p>
                </div>
              </div>

              {/* Categories */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-600">Hiring Categories</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {employer.categories.slice(0, 3).map((category, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                    >
                      {category}
                    </span>
                  ))}
                  {employer.categories.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{employer.categories.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 p-4 flex gap-2">
              <button className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                <Eye className="w-4 h-4" />
                View Details
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Briefcase className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="mb-4">Employer Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 mb-1">Total Employers</p>
            <p className="text-2xl text-blue-900">{mockEmployers.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 mb-1">Active Jobs</p>
            <p className="text-2xl text-green-900">
              {mockEmployers.reduce((sum, emp) => sum + emp.activeJobs, 0)}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 mb-1">Countries</p>
            <p className="text-2xl text-purple-900">
              {new Set(mockEmployers.map(e => e.country)).size}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-600 mb-1">Categories</p>
            <p className="text-2xl text-orange-900">
              {new Set(mockEmployers.flatMap(e => e.categories)).size}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
