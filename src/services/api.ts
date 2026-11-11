import axios, { AxiosResponse } from 'axios';
import { getDeviceToken, getToken, setToken, clearToken } from '../utils/session';
import {
  ApiResponse,
  PaginatedResponse,
  LoginCredentials,
  LoginResponse,
  User,
  InviteSuperAdminForm,
  EditSuperAdminForm,
  Company,
  CompanyBranding,
  FileRecord,
  CreateCompanyForm,
  ChangePasswordForm,
  CompanyStats,
  Module,
  CompanyModule,
  TenantDatabase,
  DbServer,
  DbServerKind,
  DbServerStatus,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    // The API refuses refresh/logout without it; a cross-site form cannot set a custom header.
    'X-Requested-With': 'mobius',
  },
});

/** Login, accept-invitation and refresh all answer with this shape. */
export type SessionPayload = LoginResponse & { expiresIn: number };

/** The refresh cookie is gone, expired or revoked: the user has to sign in again. */
class SessionEndedError extends Error {}

const MAX_TRANSIENT_RETRIES = 3;
const REFRESH_LEAD_SECONDS = 60;
const REFRESH_JITTER_SECONDS = 30;

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let refreshInFlight: Promise<SessionPayload> | null = null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransient = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return true;
  const status = error.response?.status;
  return status === undefined || status === 429 || status >= 500;
};

const retryDelayMs = (error: unknown, attempt: number): number => {
  const retryAfter = axios.isAxiosError(error) ? Number(error.response?.headers?.['retry-after']) : NaN;
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter, 10) * 1000;
  return 500 * 2 ** attempt + Math.random() * 500;
};

export const cancelScheduledRefresh = (): void => {
  if (refreshTimer !== null) clearTimeout(refreshTimer);
  refreshTimer = null;
};

const redirectToLogin = (): void => {
  if (window.location.pathname !== '/login') window.location.href = '/login';
};

const requestRefresh = async (): Promise<SessionPayload> => {
  for (let attempt = 0; ; attempt++) {
    try {
      // Bare axios: the instance's interceptors would attach the dead bearer and re-enter this flow.
      const response: AxiosResponse<ApiResponse<SessionPayload>> = await axios.post(
        `${API_BASE_URL}/api/auth/refresh`,
        undefined,
        { withCredentials: true, headers: { 'X-Requested-With': 'mobius' } }
      );
      return response.data.data!;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) throw new SessionEndedError();
      if (!isTransient(error) || attempt >= MAX_TRANSIENT_RETRIES) throw error;
      await sleep(retryDelayMs(error, attempt));
    }
  }
};

export const scheduleRefresh = (expiresIn: number): void => {
  cancelScheduledRefresh();
  const jitter = (Math.random() * 2 - 1) * REFRESH_JITTER_SECONDS;
  const delayMs = Math.max(5, expiresIn - REFRESH_LEAD_SECONDS + jitter) * 1000;
  refreshTimer = setTimeout(() => {
    refreshSession().catch((error) => {
      if (error instanceof SessionEndedError) redirectToLogin();
    });
  }, delayMs);
};

/** Single-flight: the timer, the bootstrap and the 401 interceptor share one request per tab. */
export const refreshSession = (): Promise<SessionPayload> => {
  if (refreshInFlight === null) {
    refreshInFlight = requestRefresh()
      .then((session) => {
        adoptSessionToken(session);
        return session;
      })
      .catch((error) => {
        if (error instanceof SessionEndedError) {
          clearToken();
          cancelScheduledRefresh();
        }
        throw error;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
};

export const isSessionEnded = (error: unknown): boolean => error instanceof SessionEndedError;

const adoptSessionToken = (session: SessionPayload): void => {
  setToken(session.token);
  scheduleRefresh(session.expiresIn);
};

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

const NEVER_REFRESH_PATHS = ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout'];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const url: string = error.config?.url || '';
    const isSelfHandled = SELF_HANDLED_401_PATHS.some((path) => url.includes(path));
    // A self-handled 401 is normally a wrong password; only an expired token is worth a refresh.
    const tokenFailure = !isSelfHandled || error.response?.data?.code === 'TOKEN_EXPIRED';
    if (
      error.response?.status === 401 &&
      error.config &&
      !error.config.retriedAfterRefresh &&
      tokenFailure &&
      !NEVER_REFRESH_PATHS.some((path) => url.includes(path))
    ) {
      try {
        const session = await refreshSession();
        error.config.retriedAfterRefresh = true;
        error.config.headers.Authorization = `Bearer ${session.token}`;
        return api.request(error.config);
      } catch (refreshError) {
        // Throttled or offline: the session may well be alive, so surface the original failure.
        if (!isSessionEnded(refreshError)) return Promise.reject(error);
      }
    }
    if (error.response?.status === 401 && !isSelfHandled) {
      clearToken();
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);

const avatarForm = (image: Blob): FormData => {
  const formData = new FormData();
  formData.append('file', image, 'avatar.jpg');
  return formData;
};

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<SessionPayload> => {
    const response: AxiosResponse<ApiResponse<SessionPayload>> = await api.post('/api/auth/login', credentials);
    adoptSessionToken(response.data.data!);
    return response.data.data!;
  },

  uploadAvatar: async (image: Blob): Promise<string> => {
    const response: AxiosResponse<ApiResponse<{ avatarUuid: string }>> = await api.put(
      '/api/auth/avatar',
      avatarForm(image),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data!.avatarUuid;
  },

  removeAvatar: async (): Promise<void> => {
    await api.delete('/api/auth/avatar');
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      cancelScheduledRefresh();
      clearToken();
    }
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

  inviteUser: async (data: InviteSuperAdminForm): Promise<void> => {
    await api.post('/api/users/invite', { ...data, role: 'superAdmin' });
  },

  updateUser: async (uuid: string, data: EditSuperAdminForm): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.put(`/api/users/${uuid}`, data);
    return response.data.data!;
  },

  deleteUser: async (uuid: string): Promise<void> => {
    await api.delete(`/api/users/${uuid}`);
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

  // Whitelabel identity of the company. Sent WHOLESALE: the API replaces every
  // field, so an omitted key clears the stored value — the form always submits
  // the complete set.
  updateBranding: async (uuid: string, branding: CompanyBranding): Promise<Company> => {
    const response: AxiosResponse<ApiResponse<Company>> =
      await api.put(`/api/companies/${uuid}/branding`, {
        displayName: branding.displayName,
        brandColor: branding.brandColor,
        accentColor: branding.accentColor,
        shellColor: branding.shellColor,
        canvasColor: branding.canvasColor,
        logoFileUuid: branding.logoFileUuid,
        loginMessage: branding.loginMessage,
      });
    return response.data.data!;
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

export default api;
