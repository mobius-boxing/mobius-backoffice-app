import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Company } from '../types';
import { companiesApi } from '../services/api';
import { useAuth } from './AuthContext';

interface CompanyContextType {
  selectedCompany: Company | null;
  companies: Company[];
  isLoading: boolean;
  selectCompany: (company: Company | null) => void;
  refreshCompanies: () => Promise<void>;
  effectiveCompanyId: string | undefined;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const STORAGE_KEY = 'selected_company_uuid';

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isSuperAdmin = user?.role === 'superAdmin';

  const fetchCompanies = useCallback(async () => {
    if (!isSuperAdmin) {
      setCompanies([]);
      setSelectedCompany(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await companiesApi.getCompanies({ limit: 100 });
      const fetchedCompanies = response.data || [];
      setCompanies(fetchedCompanies);

      const savedCompanyUuid = localStorage.getItem(STORAGE_KEY);
      let companyToSelect: Company | null = null;

      if (savedCompanyUuid) {
        companyToSelect = fetchedCompanies.find(c => c.uuid === savedCompanyUuid) || null;
        if (!companyToSelect) {
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      if (!companyToSelect && fetchedCompanies.length > 0) {
        companyToSelect = fetchedCompanies[0];
        localStorage.setItem(STORAGE_KEY, companyToSelect.uuid);
      }

      setSelectedCompany(companyToSelect);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (user) {
      fetchCompanies();
    } else {
      setCompanies([]);
      setSelectedCompany(null);
    }
  }, [user, fetchCompanies]);

  const selectCompany = useCallback((company: Company | null) => {
    setSelectedCompany(company);
    if (company) {
      localStorage.setItem(STORAGE_KEY, company.uuid);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const refreshCompanies = useCallback(async () => {
    await fetchCompanies();
  }, [fetchCompanies]);

  // Calculate effective company ID for API filtering
  // Only SuperAdmins need to send companyId - regular users' company is in JWT
  // Backend extracts company from JWT for non-SuperAdmins (secure by design)
  const effectiveCompanyId = isSuperAdmin ? selectedCompany?.uuid : undefined;

  const value: CompanyContextType = {
    selectedCompany,
    companies,
    isLoading,
    selectCompany,
    refreshCompanies,
    effectiveCompanyId,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};
