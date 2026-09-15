import { useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { hasPermissionCode, HasPermissionOptions } from '../utils/rbac';

export type { HasPermissionOptions };

/** RBAC permission checks for the current session (see `utils/rbac.ts`). */
export function usePermissions() {
  const { user } = useAuth();

  const permissions = useMemo<string[]>(() => user?.permissions ?? [], [user?.permissions]);
  const isSuperAdmin = user?.role === 'superAdmin';

  const has = useCallback(
    (code: string, opts?: HasPermissionOptions): boolean => hasPermissionCode(user, code, opts),
    [user]
  );

  return { permissions, has, isSuperAdmin };
}

export default usePermissions;
