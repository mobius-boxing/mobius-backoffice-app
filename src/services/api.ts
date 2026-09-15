import axios, { AxiosResponse } from 'axios';
import { getDeviceToken, getToken, clearToken } from '../utils/session';
import {
  ApiResponse,
  PaginatedResponse,
  LoginCredentials,
  LoginResponse,
  User,
  UserDevice,
  Company,
  CompanyBranding,
  FileRecord,
  Invitation,
  CreateCompanyForm,
  InviteUserRequest,
  InviteCompanyUserRequest,
  UpdateUserRequest,
  ChangePasswordForm,
  UserStats,
  CompanyStats,
  InvitationStats,
  Module,
  CompanyModule,
  TenantDatabase,
  DbServer,
  DbServerKind,
  DbServerStatus,
  Role,
  CreateRoleForm,
  Permission,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const deviceToken = getDeviceToken();
  if (deviceToken) {
    config.headers['X-Device-Token'] = deviceToken;
  }
  return config;
});

// A 401 from these endpoints is an expected response the calling component renders inline
// (bad credentials, wrong current password, invalid/expired reset token), NOT a stale
// session. Only a 401 from another (token-authenticated) request means the session expired,
// which is what should clear local auth and bounce to the login page.
const SELF_HANDLED_401_PATHS = [
  '/api/auth/login',
  '/api/auth/password',
  '/api/auth/request-password-reset',
  '/api/auth/reset-password',
];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url || '';
    const isSelfHandled = SELF_HANDLED_401_PATHS.some((path) => url.includes(path));
    if (error.response?.status === 401 && !isSelfHandled) {
      clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response: AxiosResponse<ApiResponse<LoginResponse>> = await api.post('/api/auth/login', credentials);
    return response.data.data!;
  },

  logout: async (): Promise<void> => {
    await api.post('/api/auth/logout');
    clearToken();
  },

  getCurrentUser: async (): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get('/api/auth/me');
    return response.data.data!;
  },

  changePassword: async (data: ChangePasswordForm): Promise<void> => {
    await api.put('/api/auth/password', {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await api.post('/api/auth/request-password-reset', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/api/auth/reset-password', { token, newPassword });
  },
};

export const usersApi = {
  getUsers: async (params: {
    page?: number;
    limit?: number;
    role?: string;
    isActive?: boolean;
    companyId?: string;
    roleUuid?: string;
  } = {}): Promise<PaginatedResponse<User>> => {
    const response = await api.get('/api/users', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getUserById: async (id: string): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.get(`/api/users/${id}`);
    return response.data.data!;
  },

  inviteUser: async (data: InviteUserRequest): Promise<any> => {
    const response: AxiosResponse<ApiResponse> = await api.post('/api/users/invite', data);
    return response.data.data;
  },

  updateUser: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.put(`/api/users/${id}`, data);
    return response.data.data!;
  },

  updateUserRole: async (id: string, role: 'member' | 'admin'): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.put(`/api/users/${id}/role`, { role });
    return response.data.data!;
  },

  // Sends isActive only — the API ignores `role`/`roleId` in this body;
  // assignment is the separate `/roles/assign` call below.
  updateUserStatus: async (id: string, isActive: boolean): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.put(`/api/users/${id}`, { isActive });
    return response.data.data!;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/api/users/${id}`);
  },

  getUserStats: async (companyId?: string): Promise<UserStats> => {
    const params = companyId ? { companyId } : {};
    const response: AxiosResponse<ApiResponse<UserStats>> = await api.get('/api/users/stats', { params });
    return response.data.data!;
  },
};

export const devicesApi = {
  getDevices: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    companyId?: string;
  } = {}): Promise<PaginatedResponse<UserDevice>> => {
    const response = await api.get('/api/devices', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  approveDevice: async (uuid: string): Promise<UserDevice> => {
    const response: AxiosResponse<ApiResponse<UserDevice>> = await api.patch(`/api/devices/${uuid}/approve`);
    return response.data.data!;
  },

  revokeDevice: async (uuid: string): Promise<UserDevice> => {
    const response: AxiosResponse<ApiResponse<UserDevice>> = await api.patch(`/api/devices/${uuid}/revoke`);
    return response.data.data!;
  },
};

export const companiesApi = {
  getCompanies: async (params: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  } = {}): Promise<PaginatedResponse<Company>> => {
    const response = await api.get('/api/companies', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  getCompanyById: async (id: string): Promise<Company> => {
    const response: AxiosResponse<ApiResponse<Company>> = await api.get(`/api/companies/${id}`);
    return response.data.data!;
  },

  createCompany: async (data: CreateCompanyForm): Promise<Company> => {
    const response: AxiosResponse<ApiResponse<Company>> = await api.post('/api/companies', data);
    return response.data.data!;
  },

  updateCompany: async (id: string, data: Partial<CreateCompanyForm>): Promise<Company> => {
    const response: AxiosResponse<ApiResponse<Company>> = await api.put(`/api/companies/${id}`, data);
    return response.data.data!;
  },

  updateCompanyStatus: async (id: string, isActive: boolean): Promise<Company> => {
    const response: AxiosResponse<ApiResponse<Company>> = await api.put(`/api/companies/${id}`, { isActive });
    return response.data.data!;
  },

  deleteCompany: async (id: string): Promise<void> => {
    await api.delete(`/api/companies/${id}`);
  },

  getCompanyStats: async (): Promise<CompanyStats> => {
    const response: AxiosResponse<ApiResponse<CompanyStats>> = await api.get('/api/companies/stats');
    return response.data.data!;
  },

  // Whitelabel identity of the company. Sent WHOLESALE: the API replaces all
  // five fields, so an omitted key clears the stored value — the form always
  // submits the complete set.
  updateBranding: async (uuid: string, branding: CompanyBranding): Promise<Company> => {
    const response: AxiosResponse<ApiResponse<Company>> =
      await api.put(`/api/companies/${uuid}/branding`, {
        displayName: branding.displayName,
        brandColor: branding.brandColor,
        accentColor: branding.accentColor,
        logoFileUuid: branding.logoFileUuid,
        loginMessage: branding.loginMessage,
      });
    return response.data.data!;
  },

  getCompanyUsers: async (id: string, params: {
    page?: number;
    limit?: number;
    role?: string;
    isActive?: boolean;
  } = {}): Promise<PaginatedResponse<User>> => {
    const response = await api.get(`/api/companies/${id}/users`, { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },
};

// db-per-company (T10, model D-24/D-46/D-47): status/provision/suspend/resume
// only — no move, no migrate (CLI-only). SuperAdmin-only on the API side;
// this client adds no screen, no nav entry (D-47's "types and API client
// only" — a future feature wires these into the UI).
export const tenantDatabaseApi = {
  getTenantDatabase: async (companyUuid: string): Promise<TenantDatabase> => {
    const response: AxiosResponse<ApiResponse<TenantDatabase>> =
      await api.get(`/api/companies/${companyUuid}/tenant-database`);
    return response.data.data!;
  },

  provisionTenantDatabase: async (
    companyUuid: string,
    serverUuid?: string
  ): Promise<TenantDatabase> => {
    const response: AxiosResponse<ApiResponse<TenantDatabase>> = await api.post(
      `/api/companies/${companyUuid}/tenant-database/provision`,
      serverUuid ? { serverUuid } : {}
    );
    return response.data.data!;
  },

  suspendTenantDatabase: async (
    companyUuid: string,
    reason: string
  ): Promise<TenantDatabase> => {
    const response: AxiosResponse<ApiResponse<TenantDatabase>> = await api.post(
      `/api/companies/${companyUuid}/tenant-database/suspend`,
      { reason }
    );
    return response.data.data!;
  },

  resumeTenantDatabase: async (companyUuid: string): Promise<TenantDatabase> => {
    const response: AxiosResponse<ApiResponse<TenantDatabase>> = await api.post(
      `/api/companies/${companyUuid}/tenant-database/resume`
    );
    return response.data.data!;
  },
};

export const dbServersApi = {
  getDbServers: async (params: {
    page?: number;
    limit?: number;
    kind?: DbServerKind;
    status?: DbServerStatus;
  } = {}): Promise<PaginatedResponse<DbServer>> => {
    const response = await api.get('/api/db-servers', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  createDbServer: async (data: {
    name: string;
    kind: DbServerKind;
    host?: string;
    port?: number;
    sslMode?: string;
    adminUser?: string;
    adminCredentialRef?: string;
    connectionBudget: number;
    isDefaultPlacement?: boolean;
  }): Promise<DbServer> => {
    const response: AxiosResponse<ApiResponse<DbServer>> = await api.post('/api/db-servers', data);
    return response.data.data!;
  },

  // The only status this feature writes through the API (model, T10/D-50):
  // draining marks a server as accepting no new placements.
  setDbServerDraining: async (uuid: string): Promise<DbServer> => {
    const response: AxiosResponse<ApiResponse<DbServer>> = await api.patch(
      `/api/db-servers/${uuid}`,
      { status: 'draining' }
    );
    return response.data.data!;
  },
};

export const invitationsApi = {
  getInvitations: async (params: {
    page?: number;
    limit?: number;
    isUsed?: boolean;
    includeExpired?: boolean;
    companyId?: string;
  } = {}): Promise<PaginatedResponse<Invitation>> => {
    const response = await api.get('/api/invitations', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  createInvitation: async (data: InviteUserRequest): Promise<Invitation> => {
    const response: AxiosResponse<ApiResponse<Invitation>> = await api.post('/api/users/invite', data);
    return response.data.data!;
  },

  // A company actor invites with roleUuid, gated `users.edit`. Separate from
  // `createInvitation` above, which stays on the legacy superAdmin path
  // (`/api/users/invite`, role enum incl. superAdmin).
  createRoleInvitation: async (data: InviteCompanyUserRequest): Promise<Invitation> => {
    const response: AxiosResponse<ApiResponse<Invitation>> = await api.post('/api/invitations', data);
    return response.data.data!;
  },

  resendInvitation: async (id: string): Promise<any> => {
    const response: AxiosResponse<ApiResponse> = await api.post(`/api/invitations/${id}/resend`);
    return response.data.data;
  },

  cancelInvitation: async (id: string): Promise<void> => {
    await api.delete(`/api/invitations/${id}`);
  },

  getInvitationStats: async (companyId?: string): Promise<InvitationStats> => {
    const params = companyId ? { companyId } : {};
    const response: AxiosResponse<ApiResponse<InvitationStats>> = await api.get('/api/invitations/stats', { params });
    return response.data.data!;
  },
};

// Maps the backend paginator shape to the app's PaginatedResponse (same unwrap as usersApi)
const toPaginated = <T,>(backendData: any): PaginatedResponse<T> => ({
  data: backendData.data,
  total: backendData.totalCount,
  page: backendData.page,
  limit: backendData.limit,
  totalPages: backendData.totalPages,
});

// Defensive cap mirrored from the API (MAX_FILE_SIZE_BYTES in file.controller.ts)
// so a too-big file fails here instead of after a 25 MB upload.
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export const filesApi = {
  // companyUuid travels in the multipart BODY: the API honours it only for
  // superAdmins (who have no company of their own) and ignores it for everyone
  // else, who always get their JWT company.
  uploadFile: async (file: File, companyUuid: string): Promise<FileRecord> => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error('FILE_TOO_LARGE');
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('companyId', companyUuid);

    // The API resolves the company before it reads the multipart body, so a
    // superAdmin's target company must travel in the query string.
    const response: AxiosResponse<ApiResponse<FileRecord>> = await api.post(
      '/api/files',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { companyId: companyUuid },
      }
    );
    return response.data.data!;
  },

  // Used to show the name of an already-referenced logo. Returns null rather
  // than throwing: a missing or unreadable file must not break the form.
  getFile: async (uuid: string, companyUuid: string): Promise<FileRecord | null> => {
    try {
      const response: AxiosResponse<ApiResponse<FileRecord>> =
        await api.get(`/api/files/${uuid}`, { params: { companyId: companyUuid } });
      return response.data.data ?? null;
    } catch {
      return null;
    }
  },
};

export const modulesApi = {
  getAll: async (): Promise<Module[]> => {
    const response: AxiosResponse<ApiResponse<Module[]>> = await api.get('/api/modules');
    return response.data.data!;
  },

  getCompanyModules: async (companyUuid: string): Promise<CompanyModule[]> => {
    const response: AxiosResponse<ApiResponse<CompanyModule[]>> =
      await api.get(`/api/companies/${companyUuid}/modules`);
    return response.data.data!;
  },

  enableModule: async (companyUuid: string, slug: string): Promise<CompanyModule> => {
    const response: AxiosResponse<ApiResponse<CompanyModule>> =
      await api.post(`/api/companies/${companyUuid}/modules/${slug}`);
    return response.data.data!;
  },

  disableModule: async (companyUuid: string, slug: string): Promise<CompanyModule> => {
    const response: AxiosResponse<ApiResponse<CompanyModule>> =
      await api.delete(`/api/companies/${companyUuid}/modules/${slug}`);
    return response.data.data!;
  },
};

// ── Role management ───────────────────────────────────────────────────────

export const rolesApi = {
  getRoles: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    // superAdmin has no company of their own — the Roles page scopes with
    // this the same way companiesApi.getCompanyUsers already does.
    companyId?: string;
    // Server-side subset rule: only roles the caller may assign.
    assignable?: boolean;
  } = {}): Promise<PaginatedResponse<Role>> => {
    const response = await api.get('/api/roles', { params });
    const backendData = response.data;
    return {
      data: backendData.data,
      total: backendData.totalCount,
      page: backendData.page,
      limit: backendData.limit,
      totalPages: backendData.totalPages,
    };
  },

  // Roles live in each company's tenant database, so every call below needs
  // companyId from a superAdmin (400 COMPANY_REQUIRED otherwise); the API
  // ignores it for everyone else.
  getRole: async (uuid: string, companyId?: string): Promise<Role> => {
    const params = companyId ? { companyId } : {};
    const response: AxiosResponse<ApiResponse<Role>> = await api.get(`/api/roles/${uuid}`, { params });
    return response.data.data!;
  },

  createRole: async (data: CreateRoleForm & { companyId?: string }): Promise<Role> => {
    const response: AxiosResponse<ApiResponse<Role>> = await api.post('/api/roles', data);
    return response.data.data!;
  },

  // 409 SYSTEM_ROLE when the role has a systemKey — caller disables the field instead of relying on this alone.
  renameRole: async (uuid: string, name: string, companyId?: string): Promise<Role> => {
    const params = companyId ? { companyId } : {};
    const response: AxiosResponse<ApiResponse<Role>> = await api.put(`/api/roles/${uuid}`, { name }, { params });
    return response.data.data!;
  },

  // 409 SYSTEM_ROLE (systemKey set) or ROLE_IN_USE (users/pending invitations reference it).
  deleteRole: async (uuid: string, companyId?: string): Promise<void> => {
    const params = companyId ? { companyId } : {};
    await api.delete(`/api/roles/${uuid}`, { params });
  },

  // 400 UNKNOWN_PERMISSION, 403 GRANT_CEILING/OWN_ROLE.
  setRolePermissions: async (uuid: string, codes: string[], companyId?: string): Promise<string[]> => {
    const params = companyId ? { companyId } : {};
    const response: AxiosResponse<ApiResponse<{ codes: string[] }>> = await api.put(
      `/api/roles/${uuid}/permissions`,
      { codes },
      { params }
    );
    return response.data.data!.codes;
  },

  // roleUuid is required (null is a 400). 403 GRANT_CEILING/OWN_ROLE, 409 LAST_ADMIN.
  assignRole: async (userUuid: string, roleUuid: string, companyId?: string): Promise<void> => {
    const params = companyId ? { companyId } : {};
    await api.put('/api/roles/assign', { userUuid, roleUuid }, { params });
  },
};

export const permissionsApi = {
  // The catalogue can exceed the API's page cap — page through until
  // totalPages so the permissions grid always gets the full set (same
  // approach as mobius-web-app's permissionsApi.getPermissions).
  getPermissions: async (params: { companyId?: string } = {}): Promise<Permission[]> => {
    const pageSize = 100;
    const first = await api.get('/api/permissions', { params: { ...params, limit: pageSize, page: 1 } });
    const all: Permission[] = [...first.data.data];
    const totalPages: number = first.data.totalPages ?? 1;
    for (let page = 2; page <= totalPages; page++) {
      const next = await api.get('/api/permissions', { params: { ...params, limit: pageSize, page } });
      all.push(...next.data.data);
    }
    return all;
  },
};

export default api;
