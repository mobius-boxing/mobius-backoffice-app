import React from 'react';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { useAuth } from '../../contexts/AuthContext';

const CompanySwitcher: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { companies, selectedCompany, selectCompany, isLoading } = useCompany();

  if (user?.role !== 'superAdmin') {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const companyUuid = e.target.value;
    const company = companies.find(c => c.uuid === companyUuid);
    if (company) {
      selectCompany(company);
    }
  };

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-secondary-500 mb-1">
        {t('companySelector.label')}
      </label>
      <div className="flex items-center space-x-2 overflow-hidden">
        <Building2 className="h-4 w-4 flex-shrink-0 text-secondary-500" />
        <select
          value={selectedCompany?.uuid || ''}
          onChange={handleChange}
          disabled={isLoading}
          className="flex-1 min-w-0 bg-transparent border border-secondary-300 rounded-lg px-2 py-1 text-sm text-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer truncate"
          aria-label={t('companySelector.label')}
        >
          {companies.length === 0 && (
            <option value="" disabled>{t('companySelector.placeholder')}</option>
          )}
          {companies.map((company) => (
            <option key={company.uuid} value={company.uuid}>
              {company.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default CompanySwitcher;
