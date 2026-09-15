/**
 * Pure RBAC helpers shared by `AuthContext` (session-level gate, cannot import
 * `usePermissions` — that hook depends on `useAuth`, which would be circular)
 * and `usePermissions` (per-page/action checks). Mirrors the API's
 * `RbacService.isAllowed`: superAdmin always passes; otherwise the code, or
 * its `.readonly` sibling when the caller allows it, must be present.
 *
 * A user with no permission codes and the legacy `role === 'admin'` mirror
 * also passes — a temporary fallback for accounts not yet migrated to a
 * roleId, removed once every user carries one.
 */

export interface PermissionSubject {
  role?: string;
  permissions?: string[];
}

export interface HasPermissionOptions {
  /** Also accept the `<code>.readonly` variant (use for view-only surfaces). */
  allowReadOnly?: boolean;
}

/** The codes that admit a company user into the backoffice at all. */
export const BACKOFFICE_ENTRY_CODES = [
  'users.edit',
  'users.edit.readonly',
  'roles.edit',
  'roles.edit.readonly',
  'devices.approve',
] as const;

export function hasPermissionCode(
  subject: PermissionSubject | null | undefined,
  code: string,
  opts?: HasPermissionOptions
): boolean {
  if (!subject) return false;
  if (subject.role === 'superAdmin') return true;

  const permissions = subject.permissions ?? [];
  if (permissions.length === 0 && subject.role === 'admin') return true;
  if (permissions.includes(code)) return true;
  if (opts?.allowReadOnly && permissions.includes(`${code}.readonly`)) return true;
  return false;
}

/**
 * Session-level gate: superAdmin, or any entry code (checked as an exact
 * code so a `.readonly` grant is enough on its own without `allowReadOnly`),
 * or the legacy fallback.
 */
export function canAccessBackoffice(subject: PermissionSubject | null | undefined): boolean {
  if (!subject) return false;
  if (subject.role === 'superAdmin') return true;
  return BACKOFFICE_ENTRY_CODES.some((code) => hasPermissionCode(subject, code));
}
