import axios, { AxiosResponse } from 'axios';
import { getToken, clearToken } from '../utils/session';
import {
  ApiResponse,
  PaginatedResponse,
  LoginCredentials,
  LoginResponse,
  User,
  Company,
  CompanyBranding,
  FileRecord,
  Invitation,
  CreateCompanyForm,
  InviteUserRequest,
  UpdateUserRequest,
  ChangePasswordForm,
  UserStats,
  CompanyStats,
  InvitationStats,
  Module,
  CompanyModule,
  StoreBox,
  StoreRoll,
  StoreUser,
  StoreBoxForm,
  StoreRollForm,
  StoreUserForm,
  StoreOrder,
  StoreOrderDetail,
  StoreOrderStatus,
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

  updateUserStatus: async (id: string, isActive: boolean): Promise<User> => {
    const response: AxiosResponse<ApiResponse<User>> = await api.put(`/api/users/${id}/status`, { isActive });
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

// Query params shared by the store list endpoints. companyId is only sent by
// superAdmins; company admins omit it so the backend scopes via the JWT.
interface StoreListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  companyId?: string;
}

export const storeBoxesApi = {
  getAll: async (params: StoreListParams = {}): Promise<PaginatedResponse<StoreBox>> => {
    const response = await api.get('/api/store-boxes', { params });
    return toPaginated<StoreBox>(response.data);
  },

  getByUuid: async (uuid: string, companyId?: string): Promise<StoreBox> => {
    const response: AxiosResponse<ApiResponse<StoreBox>> =
      await api.get(`/api/store-boxes/${uuid}`, { params: companyId ? { companyId } : {} });
    return response.data.data!;
  },

  create: async (data: StoreBoxForm): Promise<StoreBox> => {
    // companyId travels in the body (getCompanyForCreate reads it there) AND as a
    // query param (the requireModule gate reads query/body). The create DTO ignores
    // companyId in the body.
    const response: AxiosResponse<ApiResponse<StoreBox>> =
      await api.post('/api/store-boxes', data, { params: data.companyId ? { companyId: data.companyId } : {} });
    return response.data.data!;
  },

  update: async (uuid: string, data: Partial<StoreBoxForm>, companyId?: string): Promise<StoreBox> => {
    const response: AxiosResponse<ApiResponse<StoreBox>> =
      await api.put(`/api/store-boxes/${uuid}`, data, { params: companyId ? { companyId } : {} });
    return response.data.data!;
  },

  remove: async (uuid: string, companyId?: string): Promise<void> => {
    await api.delete(`/api/store-boxes/${uuid}`, { params: companyId ? { companyId } : {} });
  },
};

export const storeRollsApi = {
  getAll: async (params: StoreListParams = {}): Promise<PaginatedResponse<StoreRoll>> => {
    const response = await api.get('/api/store-rolls', { params });
    return toPaginated<StoreRoll>(response.data);
  },

  getByUuid: async (uuid: string, companyId?: string): Promise<StoreRoll> => {
    const response: AxiosResponse<ApiResponse<StoreRoll>> =
      await api.get(`/api/store-rolls/${uuid}`, { params: companyId ? { companyId } : {} });
    return response.data.data!;
  },

  create: async (data: StoreRollForm): Promise<StoreRoll> => {
    const response: AxiosResponse<ApiResponse<StoreRoll>> =
      await api.post('/api/store-rolls', data, { params: data.companyId ? { companyId: data.companyId } : {} });
    return response.data.data!;
  },

  update: async (uuid: string, data: Partial<StoreRollForm>, companyId?: string): Promise<StoreRoll> => {
    const response: AxiosResponse<ApiResponse<StoreRoll>> =
      await api.put(`/api/store-rolls/${uuid}`, data, { params: companyId ? { companyId } : {} });
    return response.data.data!;
  },

  remove: async (uuid: string, companyId?: string): Promise<void> => {
    await api.delete(`/api/store-rolls/${uuid}`, { params: companyId ? { companyId } : {} });
  },
};

export const storeUsersApi = {
  getAll: async (params: StoreListParams = {}): Promise<PaginatedResponse<StoreUser>> => {
    const response = await api.get('/api/store-users', { params });
    return toPaginated<StoreUser>(response.data);
  },

  getByUuid: async (uuid: string, companyId?: string): Promise<StoreUser> => {
    const response: AxiosResponse<ApiResponse<StoreUser>> =
      await api.get(`/api/store-users/${uuid}`, { params: companyId ? { companyId } : {} });
    return response.data.data!;
  },

  create: async (data: StoreUserForm): Promise<StoreUser> => {
    const response: AxiosResponse<ApiResponse<StoreUser>> =
      await api.post('/api/store-users', data, { params: data.companyId ? { companyId: data.companyId } : {} });
    return response.data.data!;
  },

  update: async (
    uuid: string,
    data: Partial<Omit<StoreUserForm, 'password'>>,
    companyId?: string
  ): Promise<StoreUser> => {
    const response: AxiosResponse<ApiResponse<StoreUser>> =
      await api.put(`/api/store-users/${uuid}`, data, { params: companyId ? { companyId } : {} });
    return response.data.data!;
  },

  remove: async (uuid: string, companyId?: string): Promise<void> => {
    await api.delete(`/api/store-users/${uuid}`, { params: companyId ? { companyId } : {} });
  },

  updateStatus: async (uuid: string, isActive: boolean, companyId?: string): Promise<StoreUser> => {
    const response: AxiosResponse<ApiResponse<StoreUser>> =
      await api.put(`/api/store-users/${uuid}/status`, { isActive }, { params: companyId ? { companyId } : {} });
    return response.data.data!;
  },

  resendInvite: async (uuid: string, companyId?: string): Promise<void> => {
    await api.post(`/api/store-users/${uuid}/resend-invite`, {}, { params: companyId ? { companyId } : {} });
  },

  setPassword: async (uuid: string, password: string, companyId?: string): Promise<void> => {
    await api.put(`/api/store-users/${uuid}/password`, { password }, { params: companyId ? { companyId } : {} });
  },
};

export const storeOrdersApi = {
  getAll: async (params: StoreListParams = {}): Promise<PaginatedResponse<StoreOrder>> => {
    const response = await api.get('/api/store-orders', { params });
    return toPaginated<StoreOrder>(response.data);
  },

  getByUuid: async (uuid: string, companyId?: string): Promise<StoreOrderDetail> => {
    const response: AxiosResponse<ApiResponse<StoreOrderDetail>> =
      await api.get(`/api/store-orders/${uuid}`, { params: companyId ? { companyId } : {} });
    return response.data.data!;
  },

  updateStatus: async (
    uuid: string,
    status: StoreOrderStatus,
    companyId?: string
  ): Promise<StoreOrderDetail> => {
    const response: AxiosResponse<ApiResponse<StoreOrderDetail>> =
      await api.put(`/api/store-orders/${uuid}/status`, { status }, { params: companyId ? { companyId } : {} });
    return response.data.data!;
  },
};

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

    const response: AxiosResponse<ApiResponse<FileRecord>> = await api.post(
      '/api/files',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data!;
  },

  // Used to show the name of an already-referenced logo. Returns null rather
  // than throwing: a missing or unreadable file must not break the form.
  getFile: async (uuid: string): Promise<FileRecord | null> => {
    try {
      const response: AxiosResponse<ApiResponse<FileRecord>> =
        await api.get(`/api/files/${uuid}`);
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
