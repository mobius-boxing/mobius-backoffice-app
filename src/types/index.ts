export interface User {
  id: string;
  uuid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'member' | 'admin' | 'superAdmin';
  companyId?: string;
  companyName?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  modules?: string[];
}

// A company's whitelabel identity, shared by every module it has. Written by
// PUT /api/companies/:uuid/branding — always every key, replaced wholesale.
export interface CompanyBranding {
  displayName: string | null;
  brandColor: string | null;
  // Second tenant colour. null means "same as brandColor": the modules fall
  // back to it, so it is never pre-filled with a copy of the brand value.
  accentColor: string | null;
  // App chrome (the module top bar) and page background. null means "use the
  // stylesheet default", which the public branding endpoint resolves for the
  // module — the backoffice never needs to know what the default is.
  shellColor: string | null;
  canvasColor: string | null;
  logoFileUuid: string | null;
  loginMessage: string | null;
}

export interface Company {
  id: string;
  uuid: string;
  name: string;
  // DNS label of this client — the `{client}` in the public module URL.
  // Read-only here (D-3): changing it moves a live customer URL.
  slug: string;
  description?: string;
  isActive: boolean;
  // `{}` for a company that never set any branding, hence Partial.
  branding?: Partial<CompanyBranding>;
  createdAt: string;
  updatedAt: string;
}

// Metadata of an uploaded file (POST /api/files). No numeric ids: the API is
// uuid-only.
export interface FileRecord {
  uuid: string;
  originalName: string;
  sizeBytes?: number;
  contentType?: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: 'member' | 'admin';
  companyId: string;
  companyName?: string;
  inviterName?: string;
  inviterEmail?: string;
  expiresAt: string;
  isUsed: boolean;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  uuid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'member' | 'admin' | 'superAdmin';
  companyId?: string;
  companyName?: string;
  modules?: string[];
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  details?: Array<{ field: string; message: string }>;
}

export interface CreateCompanyForm {
  name: string;
  description?: string;
}

export interface InviteUserForm {
  email: string;
  role: 'member' | 'admin';
  companyId?: string;
}

export interface InviteUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: 'member' | 'admin' | 'superAdmin';
  companyId?: string;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: 'member' | 'admin' | 'superAdmin';
  isActive: boolean;
  companyId?: string;
  password?: string;
}

export interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface NavItem {
  id: string;
  label: string;
  path?: string;
  icon: string;
  roles: string[];
  children?: NavItem[];
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  usersByRole: { role: string; count: number }[];
  recentInvitations: number;
}

export interface CompanyStats {
  totalCompanies: number;
  activeCompanies: number;
  companiesWithUsers: number;
  averageUsersPerCompany: number;
}

export interface InvitationStats {
  totalInvitations: number;
  pendingInvitations: number;
  acceptedInvitations: number;
  expiredInvitations: number;
}

export type SubscriptionStatus =
  | 'comp'
  | 'trial'
  | 'active'
  | 'past_due'
  | 'canceled';

export interface ModuleInfo {
  uuid: string;
  slug: string;
  name: string;
  description?: string | null;
  isCore: boolean;
  // Hostname label of the module's customer-facing app — NOT the slug
  // (`countdown` is served from `vencimientos`). null for modules with no
  // public app, which show no URL at all.
  publicDomainLabel?: string | null;
}

export interface Module {
  id?: number;
  uuid: string;
  slug: string;
  name: string;
  description?: string | null;
  isCore: boolean;
  publicDomainLabel?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Per-company module entry returned by the API. Nested shape:
// the embedded `module` carries identity/catalog fields, while the
// outer fields describe the company-link state.
export interface CompanyModule {
  module: ModuleInfo;
  enabled: boolean;
  enabledAt: string | null;
  disabledAt: string | null;
  subscriptionStatus: SubscriptionStatus | null;
}
