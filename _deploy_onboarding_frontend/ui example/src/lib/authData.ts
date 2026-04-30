// User roles and permissions system
export type UserRole = 'Admin' | 'Recruiter' | 'Viewer' | 'Manager';

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
  password: string; // In production, this would be hashed
  role: UserRole;
  avatar?: string;
  phone?: string;
  department?: string;
  joinedDate: string;
  lastActive: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  permissions?: Partial<Permission>; // Custom permissions override
}

// Role-based permission templates
export const rolePermissions: Record<UserRole, Permission> = {
  Admin: {
    candidates: { view: true, create: true, edit: true, delete: true, export: true },
    employers: { view: true, create: true, edit: true, delete: true },
    jobs: { view: true, create: true, edit: true, delete: true },
    documents: { view: true, upload: true, delete: true },
    analytics: { view: true, export: true },
    users: { view: true, create: true, edit: true, delete: true },
    settings: { view: true, edit: true },
  },
  Manager: {
    candidates: { view: true, create: true, edit: true, delete: false, export: true },
    employers: { view: true, create: true, edit: true, delete: false },
    jobs: { view: true, create: true, edit: true, delete: false },
    documents: { view: true, upload: true, delete: false },
    analytics: { view: true, export: true },
    users: { view: true, create: false, edit: false, delete: false },
    settings: { view: true, edit: false },
  },
  Recruiter: {
    candidates: { view: true, create: true, edit: true, delete: false, export: true },
    employers: { view: true, create: true, edit: true, delete: false },
    jobs: { view: true, create: true, edit: true, delete: false },
    documents: { view: true, upload: true, delete: false },
    analytics: { view: true, export: false },
    users: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, edit: false },
  },
  Viewer: {
    candidates: { view: true, create: false, edit: false, delete: false, export: false },
    employers: { view: true, create: false, edit: false, delete: false },
    jobs: { view: true, create: false, edit: false, delete: false },
    documents: { view: true, upload: false, delete: false },
    analytics: { view: true, export: false },
    users: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, edit: false },
  },
};

// Mock users database
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Admin',
    email: 'admin@falisha.com',
    password: 'admin123', // In production, use hashed passwords
    role: 'Admin',
    phone: '+1 (555) 100-0001',
    department: 'Management',
    joinedDate: '2023-01-15',
    lastActive: '2 minutes ago',
    status: 'Active',
  },
  {
    id: '2',
    name: 'John Recruiter',
    email: 'john@falisha.com',
    password: 'recruiter123',
    role: 'Recruiter',
    phone: '+1 (555) 100-0002',
    department: 'Recruitment',
    joinedDate: '2023-03-20',
    lastActive: '15 minutes ago',
    status: 'Active',
  },
  {
    id: '3',
    name: 'Maria Manager',
    email: 'maria@falisha.com',
    password: 'manager123',
    role: 'Manager',
    phone: '+1 (555) 100-0003',
    department: 'Operations',
    joinedDate: '2023-02-10',
    lastActive: '1 hour ago',
    status: 'Active',
  },
  {
    id: '4',
    name: 'David Viewer',
    email: 'david@falisha.com',
    password: 'viewer123',
    role: 'Viewer',
    phone: '+1 (555) 100-0004',
    department: 'Support',
    joinedDate: '2023-06-01',
    lastActive: '3 hours ago',
    status: 'Active',
  },
  {
    id: '5',
    name: 'Lisa Recruiter',
    email: 'lisa@falisha.com',
    password: 'recruiter123',
    role: 'Recruiter',
    phone: '+1 (555) 100-0005',
    department: 'Recruitment',
    joinedDate: '2023-04-15',
    lastActive: '30 minutes ago',
    status: 'Active',
  },
  {
    id: '6',
    name: 'James Inactive',
    email: 'james@falisha.com',
    password: 'inactive123',
    role: 'Recruiter',
    phone: '+1 (555) 100-0006',
    department: 'Recruitment',
    joinedDate: '2023-05-01',
    lastActive: '2 days ago',
    status: 'Inactive',
  },
];

// Helper function to get user permissions
export function getUserPermissions(user: User): Permission {
  // If user has custom permissions, merge with role permissions
  const basePermissions = rolePermissions[user.role];
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

// Helper function to check if user has permission
export function hasPermission(
  user: User,
  resource: keyof Permission,
  action: string
): boolean {
  const permissions = getUserPermissions(user);
  const resourcePermissions = permissions[resource] as any;
  return resourcePermissions?.[action] || false;
}
