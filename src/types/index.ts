export interface User {
  id: string;
  uuid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'member' | 'admin' | 'superAdmin';
  // null for superAdmin or a company user with no role assigned yet.
  roleUuid?: string | null;
  roleName?: string | null;
  companyId?: string;
  companyName?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  modules?: string[];
  // Granted permission codes from `/auth/me`. See utils/rbac.ts.
  permissions?: string[];
}

// A company's whitelabel identity, shared by every module it has. Written by
// PUT /api/companies/:uuid/branding — always all five keys, replaced wholesale.
export interface CompanyBranding {
  displayName: string | null;
  brandColor: string | null;
  // Second tenant colour. null means "same as brandColor": the modules fall
  // back to it, so it is never pre-filled with a copy of the brand value.
  accentColor: string | null;
  logoFileUuid: string | null;
  loginMessage: string | null;
}

// db-per-company (T10, model): `db_servers.kind` / `.status`, `tenant_databases.status`.
export type DbServerKind = 'shared_container' | 'rds' | 'external';
export type DbServerSslMode = 'disable' | 'require' | 'verify-full';
export type DbServerStatus = 'active' | 'draining' | 'retired';
export type TenantDatabaseStatus =
  | 'provisioning'
  | 'failed'
  | 'active'
  | 'suspended'
  | 'decommissioning'
  | 'retired';
export type TenantMigrationState = 'unknown' | 'current' | 'behind' | 'running' | 'failed';

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
  // `null` = not registered (T10, model): `GET/POST /api/companies` left-joins
  // the live `tenant_databases` row. `undefined` on responses that never
  // populate it (there are none today, but the field stays optional so a
  // future endpoint that omits it does not need a type change).
  tenantDatabase?: { status: TenantDatabaseStatus; placement: DbServerKind } | null;
  createdAt: string;
  updatedAt: string;
}

// `GET/POST/PATCH /api/db-servers` response shape (T10, model). Never carries
// `adminUser`/`adminCredentialRef` — those never leave the API (model I-6).
export interface DbServer {
  uuid: string;
  name: string;
  kind: DbServerKind;
  host: string | null;
  port: number | null;
  sslMode: DbServerSslMode;
  status: DbServerStatus;
  isDefaultPlacement: boolean;
  connectionBudget: number;
  provisionable: boolean;
  tenantCount: number;
  createdAt: string;
  updatedAt: string;
}

// `GET/POST .../tenant-database[/provision|/suspend|/resume]` response shape
// (T10, model). Never carries `dbUser`/`credentialRef`/`credentialCiphertext`
// or a tenant `host` (model I-6).
export interface TenantDatabase {
  uuid: string;
  status: TenantDatabaseStatus;
  placement: DbServerKind;
  server: { uuid: string; name: string };
  databaseName: string;
  schemaVersion: string | null;
  migrationState: TenantMigrationState;
  lastMigrationAt: string | null;
  lastMigrationError: string | null;
  pool: { open: boolean; used: number; free: number; max: number };
  provisionedAt: string | null;
  suspendedAt: string | null;
  suspendReason: string | null;
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
  roleUuid?: string | null;
  roleName?: string | null;
  companyId: string;
  companyName?: string;
  inviterName?: string;
  inviterEmail?: string;
  expiresAt: string;
  isUsed: boolean;
  createdAt: string;
}

export type DeviceStatus = 'pending' | 'approved' | 'revoked';

export interface UserRef {
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface UserDevice {
  uuid: string;
  status: DeviceStatus;
  userAgent: string | null;
  requestIp: string | null;
  requestedAt: string;
  approvedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: UserRef;
  approvedBy: UserRef | null;
  revokedBy: UserRef | null;
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
  roleUuid?: string | null;
  roleName?: string | null;
  companyId?: string;
  companyName?: string;
  modules?: string[];
  permissions?: string[];
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

// A company actor invites with a role rather than the legacy `role` enum —
// the API maps roleUuid to a company's Admin/Member/custom role directly.
export interface InviteCompanyUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  roleUuid: string;
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
  // Whether the current session should see this item — computed by the
  // caller (role and/or permission code), not a static list.
  visible: boolean;
  children?: NavItem[];
}

// ── Role management ───────────────────────────────────────────────────────

export interface Role {
  uuid: string;
  name: string;
  // 'admin' | 'member' for the two system roles, null for a custom role.
  systemKey: 'admin' | 'member' | null;
  // Admin's grants are locked (no rename, no grant edits, no delete).
  isProtected: boolean;
  // Computed by the API: users with this roleId.
  userCount: number;
  // Populated by GET /api/roles/:uuid only.
  permissionCodes?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoleForm {
  name: string;
}

export interface Permission {
  uuid: string;
  code: string;
  name: string;
  description?: string;
  readOnly: boolean;
  area?: string;
  deprecated?: boolean;
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
