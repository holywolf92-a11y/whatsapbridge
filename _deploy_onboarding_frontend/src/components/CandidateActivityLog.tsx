import { useState, useEffect } from 'react';
import { Clock, User, FileText, Calendar, AlertCircle } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface EmployeeLog {
  id: string;
  employee_name: string;
  task_type: string;
  description: string;
  time_spent_minutes: number;
  log_date: string;
  status: string;
  created_at: string;
}

interface CandidateActivityLogProps {
  candidateId: string;
  candidateName?: string;
}

export const CandidateActivityLog = ({ candidateId, candidateName = 'Candidate' }: CandidateActivityLogProps) => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<EmployeeLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivityLog();
  }, [candidateId]);

  const fetchActivityLog = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/employee-logs/candidate/${candidateId}/activity`, {
        params: {
          limit: 100,
        },
      });

      setLogs(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch candidate activity:', err);
      setError('Failed to load employee activity history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Employee Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              📌 Employee Activity Log
            </CardTitle>
            <CardDescription>All work performed on {candidateName}'s profile</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {logs.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No activity logged yet</p>
            <p className="text-sm text-gray-500 mt-1">Employees haven't logged work on this candidate yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 border border-gray-100 rounded-lg hover:border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {/* Header with Date and Employee */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{log.employee_name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(log.log_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="whitespace-nowrap">
                      {log.task_type}
                    </Badge>
                    {log.status === 'pending' && (
                      <Badge variant="outline" className="whitespace-nowrap">
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 mb-2 p-3 bg-gray-50 rounded border border-gray-100">
                  {log.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {log.time_spent_minutes} minutes
                    </span>
                    <span>
                      {new Date(log.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <span className="font-semibold">💡 Activity Audit Trail:</span> This log provides a complete history of all
            work performed on this candidate. It's used for accountability, tracking progress, and dispute resolution.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
