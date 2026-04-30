export type UserRole = 'admin' | 'worker' | 'candidate' | 'partner' | 'employer';

export interface Permission {
  candidates: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    export: boolean;
  };
  employers: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  jobs: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  documents: {
    view: boolean;
    upload: boolean;
    delete: boolean;
  };
  analytics: {
    view: boolean;
    export: boolean;
  };
  users: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  settings: {
    view: boolean;
    edit: boolean;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  department?: string;
  joinedDate: string;
  lastActive: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  permissions?: Partial<Permission>;
}

export const rolePermissions: Record<UserRole, Permission> = {
  admin: {
    candidates: { view: true, create: true, edit: true, delete: true, export: true },
    employers: { view: true, create: true, edit: true, delete: true },
    jobs: { view: true, create: true, edit: true, delete: true },
    documents: { view: true, upload: true, delete: true },
    analytics: { view: true, export: true },
    users: { view: true, create: true, edit: true, delete: true },
    settings: { view: true, edit: true },
  },
  worker: {
    candidates: { view: true, create: true, edit: true, delete: false, export: true },
    employers: { view: true, create: true, edit: true, delete: false },
    jobs: { view: true, create: true, edit: true, delete: false },
    documents: { view: true, upload: true, delete: false },
    analytics: { view: true, export: false },
    users: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, edit: false },
  },
  candidate: {
    candidates: { view: false, create: false, edit: false, delete: false, export: false },
    employers: { view: false, create: false, edit: false, delete: false },
    jobs: { view: false, create: false, edit: false, delete: false },
    documents: { view: true, upload: true, delete: false },
    analytics: { view: false, export: false },
    users: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, edit: false },
  },
  partner: {
    candidates: { view: true, create: true, edit: true, delete: false, export: true },
    employers: { view: false, create: false, edit: false, delete: false },
    jobs: { view: false, create: false, edit: false, delete: false },
    documents: { view: true, upload: true, delete: false },
    analytics: { view: true, export: true },
    users: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, edit: false },
  },
  employer: {
    candidates: { view: false, create: false, edit: false, delete: false, export: false },
    employers: { view: true, create: false, edit: true, delete: false },
    jobs: { view: true, create: false, edit: false, delete: false },
    documents: { view: false, upload: false, delete: false },
    analytics: { view: true, export: false },
    users: { view: false, create: false, edit: false, delete: false },
    settings: { view: true, edit: true },
  },
};

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Admin',
    email: 'admin@falisha.com',
    password: 'admin123',
    role: 'admin',
    phone: '+1 (555) 100-0001',
    department: 'Management',
    joinedDate: '2023-01-15',
    lastActive: '2 minutes ago',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Amina Operations',
    email: 'worker@falisha.com',
    password: 'worker123',
    role: 'worker',
    phone: '+1 (555) 100-0002',
    department: 'Operations',
    joinedDate: '2023-03-20',
    lastActive: '15 minutes ago',
    status: 'Active',
  },
  {
    id: '3',
    name: 'Muhammad Candidate',
    email: 'candidate@falisha.com',
    password: 'candidate123',
    role: 'candidate',
    phone: '+1 (555) 100-0003',
    department: 'Candidates',
    joinedDate: '2024-02-10',
    lastActive: '1 hour ago',
    status: 'Active',
  },
  {
    id: '4',
    name: 'ABC Overseas',
    email: 'partner@falisha.com',
    password: 'partner123',
    role: 'partner',
    phone: '+1 (555) 100-0004',
    department: 'Partner Network',
    joinedDate: '2024-06-01',
    lastActive: '3 hours ago',
    status: 'Active',
  },
];

export function normalizeUserRole(role?: string | null): UserRole {
  const normalized = String(role || '').trim().toLowerCase();

  if (normalized === 'admin' || normalized === 'super_admin') {
    return 'admin';
  }

  if (normalized === 'partner') {
    return 'partner';
  }

  if (normalized === 'employer' || normalized === 'client') {
    return 'employer';
  }

  if (normalized === 'candidate') {
    return 'candidate';
  }

  if (['worker', 'employee', 'manager', 'recruiter', 'viewer', 'staff'].includes(normalized)) {
    return 'worker';
  }

  return 'candidate';
}

export function getRoleLabel(role: UserRole): string {
  if (role === 'admin') return 'Admin';
  if (role === 'worker') return 'Worker';
  if (role === 'candidate') return 'Candidate';
  if (role === 'employer') return 'Employer';
  return 'Partner';
}

export function getUserPermissions(user: User): Permission {
  const basePermissions = rolePermissions[user.role] ?? rolePermissions.candidate;
  if (user.permissions) {
    return {
      candidates: { ...basePermissions.candidates, ...user.permissions.candidates },
      employers: { ...basePermissions.employers, ...user.permissions.employers },
      jobs: { ...basePermissions.jobs, ...user.permissions.jobs },
      documents: { ...basePermissions.documents, ...user.permissions.documents },
      analytics: { ...basePermissions.analytics, ...user.permissions.analytics },
      users: { ...basePermissions.users, ...user.permissions.users },
      settings: { ...basePermissions.settings, ...user.permissions.settings },
    };
  }
  return basePermissions;
}

export function hasPermission(user: User, resource: keyof Permission, action: string): boolean {
  const permissions = getUserPermissions(user);
  const resourcePermissions = permissions[resource] as Record<string, boolean>;
  return resourcePermissions?.[action] || false;
}

export function hasRolePermission(role: UserRole, resource: keyof Permission, action: string): boolean {
  const permissions = rolePermissions[role] ?? rolePermissions.candidate;
  const resourcePermissions = permissions[resource] as Record<string, boolean>;
  return resourcePermissions?.[action] || false;
}