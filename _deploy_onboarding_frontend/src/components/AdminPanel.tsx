import { useState, useEffect } from 'react';
import { Users, Plus, Lock, Trash2, Eye, EyeOff, AlertCircle, CheckCircle, X, Smartphone, Download, Mail, RefreshCw } from 'lucide-react';
import { apiClient, HostingerPollingStatus } from '../lib/apiClient';
import { useAuth } from '../lib/authContext';

const AGENT_APK_URL = 'https://expo.dev/artifacts/eas/nGLFf9bYmd4R7fzXcgGpNM.apk';

interface Employee {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt?: string;
}

interface FormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export function AdminPanel() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'manage' | 'email'>('list');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [hostingerStatus, setHostingerStatus] = useState<HostingerPollingStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    employeeId: '',
    newPassword: ''
  });

  // Load employees on mount
  useEffect(() => {
    loadEmployees();
    loadHostingerStatus();
  }, []);

  const loadHostingerStatus = async () => {
    try {
      setStatusLoading(true);
      const data = await apiClient.getHostingerPollingStatus();
      setHostingerStatus(data);
    } catch (err: any) {
      console.error('Error loading Hostinger status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const triggerHostingerPoll = async () => {
    try {
      setStatusLoading(true);
      await apiClient.triggerHostingerPolling();
      await loadHostingerStatus();
      setSuccess('Hostinger mailbox poll completed');
    } catch (err: any) {
      setError(err.message || 'Failed to trigger Hostinger mailbox poll');
    } finally {
      setStatusLoading(false);
    }
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return 'Never';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const formatDuration = (value?: number | null) => {
    if (!value || value < 0) return 'n/a';
    if (value < 1000) return `${value} ms`;
    const seconds = value / 1000;
    if (seconds < 60) return `${seconds.toFixed(1)} s`;
    return `${(seconds / 60).toFixed(1)} min`;
  };

  const getAuthHeaders = () => {
    const token = session?.session?.access_token || session?.access_token;

    if (!token) {
      throw new Error('No authentication token available');
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiClient.get<{ employees?: Employee[] }>('/auth/employees', {
        headers: getAuthHeaders(),
      });

      if (data.employees && Array.isArray(data.employees)) {
        setEmployees(data.employees);
      } else {
        setEmployees([]);
      }
    } catch (err: any) {
      console.error('Error loading employees:', err);
      setError(`Failed to load employees: ${err.message}`);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await apiClient.post('/auth/register-employee', formData);
      setSuccess(`Employee ${formData.email} created successfully! Reloading employee list...`);
      
      // Clear form
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: ''
      });
      
      // Switch to list tab
      setActiveTab('list');
      
      // Reload employees to show the new one
      await loadEmployees();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (!selectedEmployee) {
        throw new Error('No employee selected');
      }

      await apiClient.post('/auth/change-employee-password', {
          employeeId: selectedEmployee.id,
          newPassword: passwordForm.newPassword
        }, {
          headers: getAuthHeaders(),
        }
      );

      setSuccess('Password changed successfully');
      setPasswordForm({ employeeId: '', newPassword: '' });
      setSelectedEmployee(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (employeeId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to delete ${email}? This action cannot be undone.`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      await apiClient.post('/auth/delete-employee', { employeeId }, {
        headers: getAuthHeaders(),
      });

      setSuccess(`Employee ${email} deleted successfully`);
      loadEmployees();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600">Manage employee accounts and settings</p>
        </div>

        {/* â”€â”€ Agent Android App Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="mb-6 sm:mb-8 rounded-xl border border-[#075E54]/25 bg-gradient-to-r from-[#075E54]/5 to-[#25D366]/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#075E54] rounded-xl flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Falisha Agent App - Android</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 leading-snug">WhatsApp-style mobile app for agents. Manage conversations and send messages from their phone.</p>
            </div>
          </div>
          {AGENT_APK_URL && (
            <a
              href={AGENT_APK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-[#075E54] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#064d45] transition-colors shadow-sm w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              Download APK
            </a>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1 break-words">{error}</p>
            </div>
            <button onClick={() => setError('')} className="ml-auto text-red-600 hover:text-red-700 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-900">Success</p>
              <p className="text-sm text-green-700 mt-1 break-words">{success}</p>
            </div>
            <button onClick={() => setSuccess('')} className="ml-auto text-green-600 hover:text-green-700 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-0 mb-6 sm:mb-8 border-b border-gray-200 overflow-x-auto -mb-px">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 font-medium transition-colors border-b-2 text-sm whitespace-nowrap ${
              activeTab === 'list'
                ? 'text-purple-600 border-purple-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>Employees</span>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 font-medium transition-colors border-b-2 text-sm whitespace-nowrap ${
              activeTab === 'create'
                ? 'text-purple-600 border-purple-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span>Create</span>
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 font-medium transition-colors border-b-2 text-sm whitespace-nowrap ${
              activeTab === 'manage'
                ? 'text-purple-600 border-purple-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            <Lock className="w-4 h-4 flex-shrink-0" />
            <span>Manage Access</span>
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 font-medium transition-colors border-b-2 text-sm whitespace-nowrap ${
              activeTab === 'email'
                ? 'text-purple-600 border-purple-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span>Email Ops</span>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'list' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Employees</h2>

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No employees found</p>
                </div>
              ) : (
                <>
                  {/* Mobile card list */}
                  <div className="sm:hidden space-y-3">
                    {employees.map((employee) => (
                      <div key={employee.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {employee.firstName} {employee.lastName}
                            </p>
                            <p className="text-xs text-gray-500 break-all">{employee.email}</p>
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : '-'}
                          </span>
                        </div>
                        {employee.phone && (
                          <p className="text-xs text-gray-500 mb-3">{employee.phone}</p>
                        )}
                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                          <button
                            onClick={() => { setSelectedEmployee(employee); setActiveTab('manage'); }}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 py-1.5 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            Change Password
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(employee.id, employee.email)}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 py-1.5 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600">Name</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600">Email</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600">Phone</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600">Created</th>
                          <th className="px-6 py-3 text-right font-semibold text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map((employee) => (
                          <tr key={employee.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">
                                {employee.firstName} {employee.lastName}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{employee.email}</td>
                            <td className="px-6 py-4 text-gray-600">{employee.phone || '-'}</td>
                            <td className="px-6 py-4 text-gray-600 text-xs">
                              {employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => { setSelectedEmployee(employee); setActiveTab('manage'); }}
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm mr-4"
                              >
                                <Lock className="w-4 h-4 inline mr-1" />
                                Change Password
                              </button>
                              <button
                                onClick={() => handleDeleteEmployee(employee.id, employee.email)}
                                className="text-red-600 hover:text-red-700 font-medium text-sm"
                              >
                                <Trash2 className="w-4 h-4 inline mr-1" />
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 max-w-2xl">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-5 sm:mb-6">Create New Employee Account</h2>

            <form onSubmit={handleCreateEmployee} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="Ahmed"
                  />
                </div>
                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="Khan"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  placeholder="employee@falisha.com"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  placeholder="Secure password"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  placeholder="+971501234567"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2.5 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                >
                  {loading ? 'Creating...' : 'Create Employee'}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ email: '', password: '', firstName: '', lastName: '', phone: '' })}
                  className="sm:px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 max-w-2xl">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-5 sm:mb-6">Manage Employee Access</h2>

            {selectedEmployee ? (
              <div className="space-y-5 sm:space-y-6">
                {/* Selected Employee Info */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-700 break-words">
                    <strong>Current Employee:</strong> {selectedEmployee.firstName} {selectedEmployee.lastName} ({selectedEmployee.email})
                  </p>
                </div>

                {/* Change Password Form */}
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                    <Lock className="w-4 h-4" />
                    Change Password
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      New Password <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword['change'] ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10 text-sm"
                        placeholder="Enter new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, change: !showPassword['change'] })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword['change'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedEmployee(null); setPasswordForm({ employeeId: '', newPassword: '' }); }}
                      className="sm:px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>

                {/* Delete Option */}
                <div className="border-t border-gray-200 pt-5 sm:pt-6">
                  <h3 className="font-semibold text-red-600 flex items-center gap-2 mb-3 text-sm sm:text-base">
                    <Trash2 className="w-4 h-4" />
                    Danger Zone
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    This action cannot be undone. The employee account will be permanently deleted.
                  </p>
                  <button
                    onClick={() => handleDeleteEmployee(selectedEmployee.id, selectedEmployee.email)}
                    className="w-full sm:w-auto bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition-all font-medium text-sm"
                  >
                    Delete This Employee
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Lock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">Select an employee from the list to manage their access</p>
                <button
                  onClick={() => setActiveTab('list')}
                  className="mt-4 text-purple-600 hover:text-purple-700 font-medium text-sm"
                >
                  Go to Employee List
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'email' && (
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Hostinger Mailbox Status</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Direct inbox polling for candidate replies to support@falishajobs.com</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadHostingerStatus}
                  disabled={statusLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${statusLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={triggerHostingerPoll}
                  disabled={statusLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" />
                  Poll Now
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Configured</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{hostingerStatus?.configured ? 'Yes' : 'No'}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Polling Enabled</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{hostingerStatus?.enabled ? 'Yes' : 'No'}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Unread Replies</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{hostingerStatus?.unreadCount ?? 0}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Last Poll</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{formatDateTime(hostingerStatus?.polling?.lastPollCompletedAt)}</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Last Heartbeat</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{formatDateTime(hostingerStatus?.polling?.lastHeartbeatAt)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Checkpoint UID</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{hostingerStatus?.checkpoint?.lastSeenUid ?? 0}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Stale Runs</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{hostingerStatus?.watchdog?.staleRunCount ?? 0}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Running Rows</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{hostingerStatus?.watchdog?.runningRunCount ?? 0}</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Last Result</p>
                <p className="mt-1 text-sm text-gray-700">
                  Success: <span className="font-semibold text-gray-900">{hostingerStatus?.polling?.lastResult?.successCount ?? 0}</span>
                  {' '}| Errors: <span className="font-semibold text-gray-900">{hostingerStatus?.polling?.lastResult?.errorCount ?? 0}</span>
                </p>
                {hostingerStatus?.polling?.lastError && (
                  <p className="mt-2 text-xs text-red-600">{hostingerStatus.polling.lastError}</p>
                )}
                <p className="mt-2 text-xs text-gray-600">Checkpoint updated: {formatDateTime(hostingerStatus?.checkpoint?.updatedAt)}</p>
                <p className="mt-1 text-xs text-gray-600">Last checkpointed message: {hostingerStatus?.checkpoint?.lastSeenMessageId || 'n/a'}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Last Matched Reply</p>
                {hostingerStatus?.lastMatchedReply ? (
                  <div className="mt-1 text-sm text-gray-700 space-y-1">
                    <p className="font-semibold text-gray-900">{hostingerStatus.lastMatchedReply.subject || 'No subject'}</p>
                    <p>{hostingerStatus.lastMatchedReply.from || 'Unknown sender'}</p>
                    <p>Matched by {hostingerStatus.lastMatchedReply.matchedBy || 'unknown'} at {formatDateTime(hostingerStatus.lastMatchedReply.receivedAt)}</p>
                    {hostingerStatus.lastMatchedReply.bodyPreview && (
                      <div className="mt-2 rounded-md bg-gray-50 p-2 text-xs text-gray-600 whitespace-pre-wrap">
                        {hostingerStatus.lastMatchedReply.bodyPreview}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">No matched reply yet</p>
                )}
                <p className="mt-2 text-xs text-gray-600">Last abandoned run: {formatDateTime(hostingerStatus?.watchdog?.lastAbandonedRunAt)}</p>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Poll Run History</h4>
                <div className="space-y-3">
                  {(hostingerStatus?.recentRuns || []).length === 0 ? (
                    <p className="text-sm text-gray-500">No polling runs recorded yet.</p>
                  ) : hostingerStatus!.recentRuns.map((run) => (
                    <div key={run.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-gray-900">{run.trigger === 'manual' ? 'Manual Poll' : 'Scheduled Poll'}</p>
                        <span className="text-xs text-gray-500">{formatDateTime(run.startedAt)}</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-600">Status: <span className="font-semibold text-gray-900">{run.status}</span> · Duration: <span className="font-semibold text-gray-900">{formatDuration(run.durationMs)}</span></p>
                      <p className="mt-1 text-xs text-gray-600">Heartbeat: <span className="font-semibold text-gray-900">{formatDateTime(run.lastHeartbeatAt)}</span></p>
                      <p className="mt-1 text-xs text-gray-600">
                        Success: <span className="font-semibold text-gray-900">{run.successCount}</span>
                        {' '}| Errors: <span className="font-semibold text-gray-900">{run.errorCount}</span>
                      </p>
                      <p className="mt-1 text-xs text-gray-600">Unread before/after: <span className="font-semibold text-gray-900">{run.unreadCountBefore}</span> / <span className="font-semibold text-gray-900">{run.unreadCountAfter}</span></p>
                      <p className="mt-1 text-xs text-gray-600">Messages: discovered <span className="font-semibold text-gray-900">{run.messagesDiscovered}</span>, processed <span className="font-semibold text-gray-900">{run.messagesProcessed}</span>, matched <span className="font-semibold text-gray-900">{run.messagesMatched}</span>, unmatched <span className="font-semibold text-gray-900">{run.messagesUnmatched}</span></p>
                      <p className="mt-1 text-xs text-gray-600">Attachment uploads: success <span className="font-semibold text-gray-900">{run.attachmentUploadSuccessCount}</span>, errors <span className="font-semibold text-gray-900">{run.attachmentUploadErrorCount}</span></p>
                      {run.workerInstanceId && <p className="mt-1 text-xs text-gray-600">Worker: {run.workerInstanceId}</p>}
                      <p className="mt-1 text-xs text-gray-600">Completed: {formatDateTime(run.completedAt)}</p>
                      {run.abandonedAt && <p className="mt-1 text-xs text-red-600">Abandoned: {formatDateTime(run.abandonedAt)}</p>}
                      {run.errorCode && <p className="mt-2 text-xs text-red-600">{run.errorCode}</p>}
                      {run.errorMessage && <p className="mt-2 text-xs text-red-600">{run.errorMessage}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Per-Message Run Items</h4>
                <div className="space-y-3">
                  {(hostingerStatus?.recentRunItems || []).length === 0 ? (
                    <p className="text-sm text-gray-500">No per-message run items recorded yet.</p>
                  ) : hostingerStatus!.recentRunItems.map((item) => (
                    <div key={item.id} className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">UID {item.messageUid ?? 'n/a'} · {item.status}</p>
                          <p className="mt-1 text-xs text-gray-600">Message ID: {item.providerMessageId || 'n/a'}</p>
                          <p className="mt-1 text-xs text-gray-600">Received: {formatDateTime(item.receivedAt)}</p>
                          <p className="mt-1 text-xs text-gray-600">Candidate: {item.candidateName || item.candidateId || 'Not matched'}</p>
                          <p className="mt-1 text-xs text-gray-600">Matched by: {item.matchedBy || 'n/a'}</p>
                          <p className="mt-1 text-xs text-gray-600">Attachments: {item.attachmentCount} total, {item.attachmentUploadSuccessCount} uploaded, {item.attachmentUploadErrorCount} failed</p>
                          <p className="mt-1 text-xs text-gray-600">Completed: {formatDateTime(item.completedAt)}</p>
                        </div>
                        {item.candidateId && (
                          <a
                            href={`/admin/candidates?candidateId=${encodeURIComponent(item.candidateId)}&candidateTab=missing-data`}
                            className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-amber-700 border border-amber-200 hover:bg-amber-100"
                          >
                            Open Trace
                          </a>
                        )}
                      </div>
                      {item.errorCode && <p className="mt-2 text-xs text-red-600">{item.errorCode}</p>}
                      {item.errorMessage && <p className="mt-1 text-xs text-red-600">{item.errorMessage}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Recent Matched Replies</h4>
                <div className="space-y-3">
                  {(hostingerStatus?.recentMatchedReplies || []).length === 0 ? (
                    <p className="text-sm text-gray-500">No matched replies recorded yet.</p>
                  ) : hostingerStatus!.recentMatchedReplies.map((reply) => (
                    <div key={reply.id} className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{reply.subject || 'No subject'}</p>
                          <p className="mt-1 text-xs text-gray-600">{reply.from || 'Unknown sender'} · {formatDateTime(reply.receivedAt)}</p>
                          <p className="mt-1 text-xs text-gray-600">Candidate: {reply.candidateName || reply.candidateId || 'Unknown'} · {reply.attachmentCount} attachment{reply.attachmentCount === 1 ? '' : 's'}</p>
                        </div>
                        {reply.candidateId && (
                          <a
                            href={`/admin/candidates?candidateId=${encodeURIComponent(reply.candidateId)}&candidateTab=missing-data`}
                            className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-200 hover:bg-blue-100"
                          >
                            Open Trace
                          </a>
                        )}
                      </div>
                      {reply.bodyPreview && (
                        <div className="mt-2 rounded-md bg-white/80 p-2 text-xs text-gray-700 whitespace-pre-wrap">
                          {reply.bodyPreview}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

