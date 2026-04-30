import { useEffect, useMemo, useState } from 'react';
import { Edit, Mail, Plus, RefreshCcw, Search, Shield, Trash2, UserCheck, Users as UsersIcon, X } from 'lucide-react';
import { getRoleLabel, rolePermissions, type UserRole } from '../lib/authData';
import { apiClient, type AdminUsersResponse, type AppUserProfile, type Candidate, type CreateAdminUserPayload } from '../lib/apiClient';
import { useAuth } from '../lib/authContext';

type EditableUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  department: string;
  status: string;
};

type NewUser = {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  phone: string;
  department: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  candidateId: string;
};

const statusOptions = ['Active', 'Inactive', 'Suspended'] as const;
const emptyNewUser: NewUser = {
  email: '',
  password: '',
  role: 'worker',
  name: '',
  phone: '',
  department: '',
  status: 'Active',
  candidateId: '',
};

function toEditableUser(user: AppUserProfile): EditableUser {
  return {
    id: user.id,
    name: user.name || '',
    email: user.email || '',
    role: user.role,
    phone: user.phone || '',
    department: user.department || '',
    status: user.status || 'Active',
  };
}

function badgeClass(role: UserRole) {
  if (role === 'admin') return 'bg-slate-100 text-slate-800';
  if (role === 'worker') return 'bg-sky-100 text-sky-700';
  if (role === 'partner') return 'bg-emerald-100 text-emerald-700';
  if (role === 'employer') return 'bg-violet-100 text-violet-700';
  return 'bg-amber-100 text-amber-700';
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function computeStats(users: AppUserProfile[]) {
  return {
    total: users.length,
    active: users.filter((user) => user.status === 'Active').length,
    admins: users.filter((user) => user.role === 'admin').length,
    workers: users.filter((user) => user.role === 'worker').length,
    candidates: users.filter((user) => user.role === 'candidate').length,
    partners: users.filter((user) => user.role === 'partner').length,
    employers: users.filter((user) => user.role === 'employer').length,
  };
}

export function UserManagement() {
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const currentUserId = session?.user?.id;

  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingUser, setEditingUser] = useState<EditableUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState<NewUser>(emptyNewUser);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateResults, setCandidateResults] = useState<Candidate[]>([]);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [deletingUser, setDeletingUser] = useState<AppUserProfile | null>(null);
  const [permissionUser, setPermissionUser] = useState<AppUserProfile | null>(null);

  const loadUsers = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getAdminUsers(accessToken);
      setData(response);
    } catch (err: any) {
      setError(err?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [accessToken]);

  useEffect(() => {
    if (!creating || newUser.role !== 'candidate' || candidateSearch.trim().length < 2) {
      setCandidateResults([]);
      return;
    }

    let active = true;
    setCandidateLoading(true);
    apiClient.getCandidates({ search: candidateSearch, limit: 5 })
      .then((response) => {
        if (active) {
          setCandidateResults(response.candidates || []);
        }
      })
      .catch(() => {
        if (active) {
          setCandidateResults([]);
        }
      })
      .finally(() => {
        if (active) {
          setCandidateLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [candidateSearch, creating, newUser.role]);

  const users = data?.users || [];
  const stats = data?.stats || computeStats(users);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        (user.name || '').toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch);
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, search, statusFilter, users]);

  const updateData = (nextUsers: AppUserProfile[]) => {
    setData({ users: nextUsers, stats: computeStats(nextUsers) });
  };

  const handleEditSave = async () => {
    if (!accessToken || !editingUser) return;
    setSaving(true);
    setError(null);
    try {
      const response = await apiClient.updateAdminUser(
        editingUser.id,
        {
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          phone: editingUser.phone,
          department: editingUser.department,
          status: editingUser.status,
        },
        accessToken,
      );
      updateData(users.map((user) => (user.id === response.user.id ? response.user : user)));
      setEditingUser(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!accessToken) return;
    if (!newUser.email || !newUser.password) {
      setError('Email and password are required');
      return;
    }
    if (newUser.role === 'candidate' && !newUser.candidateId) {
      setError('Candidate account creation requires a linked candidate');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: CreateAdminUserPayload = {
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        name: newUser.name,
        phone: newUser.phone,
        department: newUser.department,
        status: newUser.status,
        candidateId: newUser.role === 'candidate' ? newUser.candidateId : undefined,
      };
      const response = await apiClient.createAdminUser(payload, accessToken);
      updateData([response.user, ...users]);
      setCreating(false);
      setNewUser(emptyNewUser);
      setCandidateSearch('');
      setCandidateResults([]);
    } catch (err: any) {
      setError(err?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!accessToken || !deletingUser) return;
    setSaving(true);
    setError(null);
    try {
      await apiClient.deleteAdminUser(deletingUser.id, accessToken);
      updateData(users.filter((user) => user.id !== deletingUser.id));
      setDeletingUser(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to delete user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl">User Management</h1>
          <p className="mt-1 text-gray-600">Manage canonical admin, worker, candidate, partner, and employer accounts backed by the live backend users table.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => {
              setCreating(true);
              setNewUser(emptyNewUser);
              setCandidateSearch('');
              setCandidateResults([]);
            }}
            className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Create User
          </button>
          <button onClick={() => void loadUsers()} className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-slate-700 hover:bg-slate-50">
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <div className="rounded-xl bg-slate-900 p-5 text-white">
          <div className="flex items-center justify-between text-sm opacity-90">
            <span>Total Users</span>
            <UsersIcon className="h-6 w-6" />
          </div>
          <div className="mt-3 text-3xl">{stats.total}</div>
        </div>
        <div className="rounded-xl bg-green-600 p-5 text-white">
          <div className="flex items-center justify-between text-sm opacity-90">
            <span>Active Users</span>
            <UserCheck className="h-6 w-6" />
          </div>
          <div className="mt-3 text-3xl">{stats.active}</div>
        </div>
        <div className="rounded-xl bg-blue-600 p-5 text-white">
          <div className="flex items-center justify-between text-sm opacity-90">
            <span>Admins</span>
            <Shield className="h-6 w-6" />
          </div>
          <div className="mt-3 text-3xl">{stats.admins}</div>
        </div>
        <div className="rounded-xl bg-cyan-600 p-5 text-white">
          <div className="flex items-center justify-between text-sm opacity-90">
            <span>Workers</span>
            <UsersIcon className="h-6 w-6" />
          </div>
          <div className="mt-3 text-3xl">{stats.workers}</div>
        </div>
        <div className="rounded-xl bg-violet-600 p-5 text-white">
          <div className="flex items-center justify-between text-sm opacity-90">
            <span>Employers</span>
            <UsersIcon className="h-6 w-6" />
          </div>
          <div className="mt-3 text-3xl">{stats.employers || 0}</div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="rounded-lg border border-gray-300 px-4 py-3">
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="worker">Worker</option>
            <option value="candidate">Candidate</option>
            <option value="partner">Partner</option>
            <option value="employer">Employer</option>
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-gray-300 px-4 py-3">
            <option value="all">All Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <div className="relative sm:col-span-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or email" className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-4" />
          </div>
        </div>
        {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Active</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">No users found for the current filters.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-slate-900 font-semibold text-white">
                          {(user.name || user.email || 'U')[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 font-medium text-gray-900">
                            {user.name || 'Unnamed user'}
                            {user.id === currentUserId && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">You</span>}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${badgeClass(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{user.department || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${user.status === 'Active' ? 'bg-green-100 text-green-700' : user.status === 'Inactive' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'}`}>
                        {user.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(user.last_active || user.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setPermissionUser(user)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" title="Permissions">
                          <Shield className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditingUser(toEditableUser(user))} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100" title="Edit user">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeletingUser(user)} disabled={user.id === currentUserId} className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:text-gray-300 disabled:hover:bg-transparent" title="Delete user">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {permissionUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-slate-900 p-6 text-white">
              <div>
                <h2 className="text-2xl">Role Permissions</h2>
                <p className="mt-1 text-slate-300">{permissionUser.name || permissionUser.email} - {getRoleLabel(permissionUser.role)}</p>
              </div>
              <button onClick={() => setPermissionUser(null)} className="rounded-full bg-white/10 p-2 hover:bg-white/20">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-6 p-6">
              {Object.entries(rolePermissions[permissionUser.role]).map(([resource, permissions]) => (
                <div key={resource}>
                  <h3 className="mb-3 text-lg font-semibold capitalize text-gray-900">{resource}</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {Object.entries(permissions).map(([action, allowed]) => (
                      <div key={action} className={`flex items-center justify-between rounded-lg border p-3 ${allowed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        <span className="text-sm capitalize text-gray-900">{action}</span>
                        <span className={`text-xs font-semibold ${allowed ? 'text-green-700' : 'text-red-700'}`}>{allowed ? 'Allowed' : 'Blocked'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(editingUser || creating || deletingUser) && <div className="fixed inset-0 z-40 bg-black/40" />}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Edit User</h2>
                <p className="mt-1 text-sm text-gray-600">Update the canonical user profile stored in the backend users table.</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="rounded-lg p-2 hover:bg-gray-100"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">Name</label>
                <input value={editingUser.name} onChange={(event) => setEditingUser({ ...editingUser, name: event.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-3" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={editingUser.email} onChange={(event) => setEditingUser({ ...editingUser, email: event.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-3" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Role</label>
                <select value={editingUser.role} onChange={(event) => setEditingUser({ ...editingUser, role: event.target.value as UserRole })} className="w-full rounded-lg border border-gray-300 px-4 py-3">
                  <option value="admin">Admin</option>
                  <option value="worker">Worker</option>
                  <option value="candidate">Candidate</option>
                  <option value="partner">Partner</option>
                  <option value="employer">Employer</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
                <select value={editingUser.status} onChange={(event) => setEditingUser({ ...editingUser, status: event.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-3">
                  {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Phone</label>
                <input value={editingUser.phone} onChange={(event) => setEditingUser({ ...editingUser, phone: event.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-3" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Department</label>
                <input value={editingUser.department} onChange={(event) => setEditingUser({ ...editingUser, department: event.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-3" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditingUser(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => void handleEditSave()} disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Create User</h2>
                <p className="mt-1 text-sm text-gray-600">Create canonical admin, worker, candidate, partner, or employer accounts backed by Supabase auth and the users table.</p>
              </div>
              <button onClick={() => setCreating(false)} className="rounded-lg p-2 hover:bg-gray-100"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">Name</label>
                <input value={newUser.name} onChange={(event) => setNewUser({ ...newUser, name: event.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-3" placeholder="Full name" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-3" placeholder="user@falisha.com" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Temporary Password</label>
                <input value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-3" placeholder="Create a password" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={newUser.role}
                  onChange={(event) => setNewUser({ ...newUser, role: event.target.value as UserRole, candidateId: event.target.value === 'candidate' ? newUser.candidateId : '' })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3"
                >
                  <option value="admin">Admin</option>
                  <option value="worker">Worker</option>
                  <option value="candidate">Candidate</option>
                  <option value="partner">Partner</option>
                  <option value="employer">Employer</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
                <select value={newUser.status} onChange={(event) => setNewUser({ ...newUser, status: event.target.value as NewUser['status'] })} className="w-full rounded-lg border border-gray-300 px-4 py-3">
                  {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Phone</label>
                <input value={newUser.phone} onChange={(event) => setNewUser({ ...newUser, phone: event.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-3" placeholder="Phone number" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Department</label>
                <input value={newUser.department} onChange={(event) => setNewUser({ ...newUser, department: event.target.value })} className="w-full rounded-lg border border-gray-300 px-4 py-3" placeholder="Department" />
              </div>
            </div>

            {newUser.role === 'candidate' && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900">Link candidate account</p>
                <p className="mt-1 text-sm text-slate-600">Candidate accounts require an existing candidate record so the portal resolves to a live profile.</p>
                <div className="mt-4 space-y-3">
                  <input value={candidateSearch} onChange={(event) => setCandidateSearch(event.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-3" placeholder="Search candidates by name, email, phone, or ID" />
                  {candidateLoading && <p className="text-sm text-slate-500">Searching candidates...</p>}
                  {candidateResults.length > 0 && (
                    <div className="max-h-52 space-y-2 overflow-y-auto">
                      {candidateResults.map((candidate) => (
                        <button
                          key={candidate.id}
                          onClick={() => setNewUser({
                            ...newUser,
                            candidateId: candidate.id,
                            name: candidate.name || newUser.name,
                            email: candidate.email || newUser.email,
                            phone: candidate.phone || newUser.phone,
                          })}
                          className={`w-full rounded-xl border px-4 py-3 text-left ${newUser.candidateId === candidate.id ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                        >
                          <p className="text-sm font-medium text-slate-900">{candidate.name || 'Unnamed candidate'}</p>
                          <p className="mt-1 text-xs text-slate-500">{candidate.id} • {candidate.email || 'No email'} • {candidate.phone || 'No phone'}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    Linked candidate: <strong>{newUser.candidateId || 'None selected'}</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setCreating(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => void handleCreate()} disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60">{saving ? 'Creating...' : 'Create User'}</button>
            </div>
          </div>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-gray-900">Delete User</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">Delete <strong>{deletingUser.name || deletingUser.email}</strong>. Candidate accounts will be unlinked from their candidate record during deletion.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeletingUser(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => void handleDelete()} disabled={saving} className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60">{saving ? 'Deleting...' : 'Delete User'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
