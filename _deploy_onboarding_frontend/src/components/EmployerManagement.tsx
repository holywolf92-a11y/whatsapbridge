import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Building2, Mail, Phone, MapPin, Briefcase, RefreshCw, AlertCircle, Users, Clock } from 'lucide-react';
import { apiClient, EmployerLeadProfile } from '../lib/apiClient';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  New: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  Active: 'bg-green-100 text-green-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  Contacted: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-gray-100 text-gray-600',
  Closed: 'bg-gray-100 text-gray-600',
};

export function EmployerManagement() {
  const [leads, setLeads] = useState<(EmployerLeadProfile & { requirements_count?: number })[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getAdminEmployerLeads({
        search: debouncedSearch || undefined,
        limit: 200,
        dedupe: true,
      });
      setLeads(result.leads);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load employers');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const countries = Array.from(new Set(leads.map(l => l.country).filter(Boolean)));
  const activeCount = leads.filter(l => l.status?.toLowerCase() === 'active').length;
  const newCount = leads.filter(l => l.status?.toLowerCase() === 'new').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Employer Management</h2>
          <p className="text-gray-600">
            {loading ? 'Loading...' : `${total} employer contact${total !== 1 ? 's' : ''} in your database`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadLeads}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Employer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company name, country, contact person, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-700 font-medium">Failed to load employers</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button onClick={loadLeads} className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
              <div className="h-28 bg-gray-200" />
              <div className="p-6 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && leads.length === 0 && !error && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {debouncedSearch ? `No employers found matching "${debouncedSearch}"` : 'No employer contacts yet'}
          </p>
        </div>
      )}

      {!loading && leads.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leads.map((lead) => {
            const professionList = lead.professions
              ? lead.professions.split(/[,;|]/).map((p: string) => p.trim()).filter(Boolean)
              : [];
            return (
              <div key={lead.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6" />
                    </div>
                    {lead.status && (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status] || 'bg-white bg-opacity-20 text-white'}`}>
                        {lead.status}
                      </span>
                    )}
                  </div>
                  <h3 className="text-white">{lead.company_name || 'Unknown Company'}</h3>
                  {(lead.country || lead.city) && (
                    <div className="flex items-center gap-2 mt-2">
                      <MapPin className="w-4 h-4" />
                      <p className="text-sm text-blue-100">{[lead.city, lead.country].filter(Boolean).join(', ')}</p>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-3">
                  {lead.contact_name && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Contact Person</p>
                        <p className="text-sm font-medium">{lead.contact_name}</p>
                      </div>
                    </div>
                  )}
                  {lead.email && (
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm break-all">{lead.email}</p>
                      </div>
                    </div>
                  )}
                  {lead.phone_number && (
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm">{lead.phone_number}</p>
                      </div>
                    </div>
                  )}
                  {lead.updated_at && (
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Last Updated</p>
                        <p className="text-sm">{new Date(lead.updated_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                  {professionList.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <p className="text-xs text-gray-500">Hiring For</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {professionList.slice(0, 3).map((p: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{p}</span>
                        ))}
                        {professionList.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">+{professionList.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 px-6 py-3">
                  <p className="text-xs text-gray-400">
                    Added {new Date(lead.created_at || '').toLocaleDateString()}
                    {(lead as any).requirements_count > 1 && (
                      <> &bull; {(lead as any).requirements_count} requirements</>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && (
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="mb-4">Employer Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">Total Employers</p>
              <p className="text-2xl font-bold text-blue-900">{total}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 mb-1">Active</p>
              <p className="text-2xl font-bold text-green-900">{activeCount}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600 mb-1">New Leads</p>
              <p className="text-2xl font-bold text-yellow-900">{newCount}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 mb-1">Countries</p>
              <p className="text-2xl font-bold text-purple-900">{countries.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
