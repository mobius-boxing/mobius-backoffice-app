export interface CompanyPermissionNavEntry {
  path: string;
  code: string;
  allowReadOnly: boolean;
  labelKey: string;
  icon: string;
}

/**
 * Single source of truth for "company actor" nav items gated by a permission
 * code rather than the legacy `role` string: Sidebar visibility, the App.tsx
 * route guard, and the post-login default redirect all read this list, so a
 * new permission-gated entry is a one-line addition here instead of three
 * separate edits.
 */
export const COMPANY_PERMISSION_NAV: Record<string, CompanyPermissionNavEntry> = {
  users: {
    path: '/users',
    code: 'users.edit',
    allowReadOnly: true,
    labelKey: 'nav.userManagement',
    icon: 'Users',
  },
  roles: {
    path: '/roles',
    code: 'roles.edit',
    allowReadOnly: true,
    labelKey: 'nav.roleManagement',
    icon: 'ShieldCheck',
  },
  devices: {
    path: '/devices',
    code: 'devices.approve',
    allowReadOnly: false,
    labelKey: 'nav.devices',
    icon: 'Smartphone',
  },
};

export const COMPANY_PERMISSION_NAV_ORDER = ['users', 'roles', 'devices'] as const;
