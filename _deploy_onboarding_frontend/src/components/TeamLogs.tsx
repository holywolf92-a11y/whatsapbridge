import { useState, useEffect } from 'react';
import { Calendar, Download, Filter, Search, Clock, User, FileText } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface TeamLog {
  id: string;
  employee_name: string;
  candidate_name: string;
  task_type: string;
  description: string;
  time_spent_minutes: number;
  log_date: string;
  status: string;
  is_flagged: boolean;
}

interface Employee {
  id: string;
  name: string;
}

export const TeamLogs = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<TeamLog[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    employeeId: '',
    candidateName: '',
  });

  const [page, setPage] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchTeamLogs();
  }, [filters, page]);

  const fetchEmployees = async () => {
    try {
      const response = await apiClient.get('/candidates/users'); // Adjust endpoint if needed
      setEmployees(response || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchTeamLogs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/employee-logs/team/logs', {
        params: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          employeeId: filters.employeeId || undefined,
          limit: pageSize,
          offset: page * pageSize,
        },
      });

      setLogs(response.data || []);
      setTotalCount(response.count || 0);
    } catch (error) {
      console.error('Failed to fetch team logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // CSV export
    const headers = ['Date', 'Employee', 'Candidate', 'Task Type', 'Description', 'Time Spent', 'Status'];
    const rows = logs.map((log) => [
      log.log_date,
      log.employee_name,
      log.candidate_name,
      log.task_type,
      log.description.substring(0, 100),
      `${log.time_spent_minutes} min`,
      log.status,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `team-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredLogs = logs.filter((log) => {
    if (filters.candidateName && !log.candidate_name.toLowerCase().includes(filters.candidateName.toLowerCase())) {
      return false;
    }
    return true;
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading && logs.length === 0) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded-lg"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">👥 Team Work Logs</h1>
        <p className="text-gray-600 mt-1">View and monitor team member activities</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }));
                  setPage(0);
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }));
                  setPage(0);
                }}
              />
            </div>

            {/* Employee Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Employee</label>
              <Select
                value={filters.employeeId}
                onValueChange={(value) => {
                  setFilters((prev) => ({ ...prev, employeeId: value }));
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All employees</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Candidate Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Candidate</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search candidate..."
                  value={filters.candidateName}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, candidateName: e.target.value }));
                    setPage(0);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end pt-2">
            <Button onClick={handleExport} variant="outline" className="gap-2" disabled={logs.length === 0}>
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{totalCount}</p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(filters.startDate).toLocaleDateString()} to {new Date(filters.endDate).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {Math.round(logs.reduce((sum, log) => sum + log.time_spent_minutes, 0) / 60)} hrs
            </p>
            <p className="text-xs text-gray-500 mt-1">{logs.reduce((sum, log) => sum + log.time_spent_minutes, 0)} minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Flagged</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {logs.filter((log) => log.is_flagged).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Requires review</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Team Activity</CardTitle>
          <CardDescription>All logs from team members</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No logs found</p>
              <p className="text-sm text-gray-500">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-700 font-medium">
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Employee</th>
                    <th className="text-left p-3">Candidate</th>
                    <th className="text-left p-3">Task</th>
                    <th className="text-left p-3">Description</th>
                    <th className="text-left p-3">Time</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 whitespace-nowrap text-gray-600">
                        {new Date(log.log_date).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{log.employee_name}</span>
                        </div>
                      </td>
                      <td className="p-3 font-medium">{log.candidate_name}</td>
                      <td className="p-3">
                        <Badge variant="secondary">{log.task_type}</Badge>
                      </td>
                      <td className="p-3 max-w-xs text-gray-600 truncate">{log.description}</td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="w-4 h-4" />
                          {log.time_spent_minutes} min
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={log.status === 'completed' ? 'default' : 'outline'}>
                            {log.status}
                          </Badge>
                          {log.is_flagged && <Badge variant="destructive">Flagged</Badge>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
              <p className="text-sm text-gray-600">
                Page {page + 1} of {totalPages} ({totalCount} total)
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page === totalPages - 1}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
