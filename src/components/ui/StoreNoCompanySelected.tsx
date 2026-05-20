import React from 'react';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';

// Presentational prompt shown to superAdmins who have not yet picked a company.
// Rendered in place of a Store list table; not a reusable design-system primitive.
const StoreNoCompanySelected: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="bg-white shadow-md rounded-xl border border-secondary-200 p-12 text-center">
      <Building2 className="mx-auto h-10 w-10 text-secondary-400" />
      <h3 className="mt-3 text-sm font-medium text-secondary-900">
        {t('store.selectCompany.title')}
      </h3>
      <p className="mt-1 text-sm text-secondary-500">
        {t('store.selectCompany.message')}
      </p>
    </div>
  );
};

export default StoreNoCompanySelected;
