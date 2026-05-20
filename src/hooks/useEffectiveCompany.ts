import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';

export interface UseEffectiveCompanyResult {
  /**
   * Company UUID to send as query param for API filtering.
   * - For SuperAdmins: selected company UUID (or undefined if none selected)
   * - For regular users: undefined (backend extracts from JWT)
   */
  effectiveCompanyId: string | undefined;
  isSuperAdmin: boolean;
  /**
   * Whether the user has a company context available.
   * - For SuperAdmins: true if they've selected a company
   * - For regular users: true if they have a companyId in their profile
   */
  hasCompanySelected: boolean;
  selectedCompany: ReturnType<typeof useCompany>['selectedCompany'];
}

export const useEffectiveCompany = (): UseEffectiveCompanyResult => {
  const { user } = useAuth();
  const { selectedCompany, effectiveCompanyId } = useCompany();

  const isSuperAdmin = user?.role === 'superAdmin';
  // Regular users always have their company from JWT, SuperAdmins need to select
  const hasCompanySelected = isSuperAdmin ? !!selectedCompany : !!user?.companyId;

  return {
    effectiveCompanyId,
    isSuperAdmin,
    hasCompanySelected,
    selectedCompany,
  };
};

export default useEffectiveCompany;
