/**
 * Pure RBAC helpers shared by `AuthContext` (session-level gate, cannot import
 * `usePermissions` — that hook depends on `useAuth`, which would be circular)
 * and `usePermissions` (per-page/action checks). Mirrors the API's
 * `RbacService.isAllowed`: superAdmin always passes; otherwise the code, or
 * its `.readonly` sibling when the caller allows it, must be present.
 */

export interface PermissionSubject {
  role?: string;
  permissions?: string[];
}

export interface HasPermissionOptions {
  /** Also accept the `<code>.readonly` variant (use for view-only surfaces). */
  allowReadOnly?: boolean;
}

export function hasPermissionCode(
  subject: PermissionSubject | null | undefined,
  code: string,
  opts?: HasPermissionOptions
): boolean {
  if (!subject) return false;
  if (subject.role === 'superAdmin') return true;

  const permissions = subject.permissions ?? [];
  if (permissions.includes(code)) return true;
  if (opts?.allowReadOnly && permissions.includes(`${code}.readonly`)) return true;
  return false;
}

/**
 * Session-level gate: the backoffice is the platform-operator console, so only
 * a superAdmin gets in. Company actors manage their users, roles and devices
 * in the web app.
 */
export function canAccessBackoffice(subject: PermissionSubject | null | undefined): boolean {
  return subject?.role === 'superAdmin';
}
