import { useEffect, useState, useMemo } from 'react';
import { 
  Award,
  Briefcase, 
  Calendar,
  CheckCircle,
  FileText,
  Mail,
  MapPin,
  Phone,
  Search,
  Star,
  User,
  XCircle 
} from 'lucide-react';
import { apiClient, Candidate } from '../lib/apiClient';

function getInitials(name: string) {
  const trimmed = (name || '').trim();
  if (!trimmed) return '??';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || '';
  const second = parts[1]?.[0] || parts[0]?.[1] || '';
  return `${first}${second}`.toUpperCase();
}

// Simplified browser: previously mock-backed; now uses live API data in a card grid.
export function CandidateBrowserEnhanced() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await apiClient.getCandidates();
        if (isMounted) setCandidates(data.candidates || []);
      } catch (e: any) {
        if (isMounted) setError(e?.message || 'Failed to load candidates');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCandidates = useMemo(() => {
    if (!searchTerm) return candidates;
    const lower = searchTerm.toLowerCase();
    return candidates.filter(c =>
      c.name.toLowerCase().includes(lower) ||
      c.position?.toLowerCase().includes(lower) ||
      c.email?.toLowerCase().includes(lower) ||
      c.country_of_interest?.toLowerCase().includes(lower)
    );
  }, [candidates, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="bg-white border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-900 mb-2">Failed to load candidates</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Candidate Browser</h1>
          <p className="text-gray-600 mt-1">Browse and search all candidates</p>
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="text-sm opacity-90">Total Candidates</div>
          <div className="text-2xl font-bold">{candidates.length}</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, position, email, or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-600">
            Showing {filteredCandidates.length} of {candidates.length} candidates
          </div>
        )}
      </div>

      {filteredCandidates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms' : 'Add candidates to see them here'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.map((c) => {
            const statusLabel = (c.status || 'Applied').toString();
            const score = c.ai_score;

            return (
              <div
                key={c.id}
                className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all overflow-hidden"
              >
                {/* Card Header with Gradient */}
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 h-24 relative">
                  <div className="absolute -bottom-10 left-6">
                    <div className="w-20 h-20 bg-white rounded-full p-1.5 shadow-xl">
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
                        {getInitials(c.name)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="pt-14 p-6">
                  {/* Name and Title */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{c.name}</h3>
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <Briefcase className="w-4 h-4" />
                    <span className="text-sm">{c.position || 'Position not set'}</span>
                  </div>

                  {/* Status and Score */}
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      statusLabel === 'Applied' ? 'bg-blue-100 text-blue-700' :
                      statusLabel === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      statusLabel === 'Deployed' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {statusLabel}
                    </span>
                    {score != null && (
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-bold text-gray-900">{score.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4">
                    {c.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                          <Mail className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-gray-700 truncate">{c.email}</span>
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                          <Phone className="w-3 h-3 text-blue-600" />
                        </div>
                        <span className="text-gray-700">{c.phone}</span>
                      </div>
                    )}
                    {c.country_of_interest && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                          <MapPin className="w-3 h-3 text-purple-600" />
                        </div>
                        <span className="text-gray-700">{c.country_of_interest}</span>
                      </div>
                    )}
                  </div>

                  {/* Document Status */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Documents:</span>
                    <div className="flex items-center gap-1">
                      {c.cv_received && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {c.passport_received && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {c.photo_received && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {!c.cv_received && !c.passport_received && !c.photo_received && (
                        <span className="text-gray-400">None uploaded</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
