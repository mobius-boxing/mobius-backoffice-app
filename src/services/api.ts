import axios, { AxiosResponse } from 'axios';
import {
  ApiResponse,
  PaginatedResponse,
  LoginCredentials,
  LoginResponse,
  User,
  Company,
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
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('backoffice_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 means the token is no longer valid — drop local session and force re-auth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('backoffice_token');
      localStorage.removeItem('backoffice_user');
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
    localStorage.removeItem('backoffice_token');
    localStorage.removeItem('backoffice_user');
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
    const response: AxiosResponse<ApiResponse<Company>> = await api.put(`/api/companies/${id}/status`, { isActive });
    return response.data.data!;
  },

  deleteCompany: async (id: string): Promise<void> => {
    await api.delete(`/api/companies/${id}`);
  },

  getCompanyStats: async (): Promise<CompanyStats> => {
    const response: AxiosResponse<ApiResponse<CompanyStats>> = await api.get('/api/companies/stats');
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
