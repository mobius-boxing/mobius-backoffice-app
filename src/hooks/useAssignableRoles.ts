import { useEffect, useState } from 'react';
import { Role } from '../types';
import { rolesApi } from '../services/api';

/**
 * Roles the current actor may assign (`GET /api/roles?assignable=true`).
 * `companyId` is only needed for a superAdmin acting on a specific company —
 * a company actor's own company is inferred from the JWT and the param is
 * omitted (undefined).
 */
export function useAssignableRoles(companyId?: string) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    rolesApi
      .getRoles({ assignable: true, ...(companyId ? { companyId } : {}), limit: 100 })
      .then((r) => {
        if (!cancelled) setRoles(r.data);
      })
      .catch(() => {
        if (!cancelled) setRoles([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return { roles, loading };
}

export default useAssignableRoles;
