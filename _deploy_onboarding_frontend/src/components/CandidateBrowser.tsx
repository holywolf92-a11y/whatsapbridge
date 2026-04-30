import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { apiClient, Candidate } from '../lib/apiClient';

// Simplified browser: previously mock-backed; now uses live API data in a minimal list.
export function CandidateBrowser() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await apiClient.getCandidates();
        if (isMounted) setCandidates(data);
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Candidate Browser</h1>
          <p className="text-sm text-gray-600">API-backed list view</p>
        </div>

        {candidates.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-600">Add candidates via the backend API to see them here.</p>
          </div>
        ) : (
          <ul className="bg-white rounded-lg border border-gray-200 divide-y">
            {candidates.map((c) => (
              <li key={c.id} className="px-4 py-3">
                <div className="font-medium text-gray-900">{c.name}</div>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <span>{c.position || 'Unknown role'}</span>
                  <span className="text-gray-400">•</span>
                  <span>{c.location || 'Location not set'}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
