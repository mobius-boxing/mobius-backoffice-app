import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { Company, CompanyModule, SubscriptionStatus } from '../../types';
import { modulesApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface ManageCompanyModulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
}

// Inline badge — single-use, kept here to avoid creating a one-off shared primitive.
const SubscriptionBadge: React.FC<{ status: SubscriptionStatus }> = ({ status }) => {
  const { t } = useTranslation();
  const styles: Record<SubscriptionStatus, string> = {
    comp: 'bg-blue-100 text-blue-800',
    trial: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    past_due: 'bg-orange-100 text-orange-800',
    canceled: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {t(`modules.subscription.${status}`)}
    </span>
  );
};

const ManageCompanyModulesModal: React.FC<ManageCompanyModulesModalProps> = ({
  isOpen,
  onClose,
  company,
}) => {
  const { t } = useTranslation();

  const [modules, setModules] = useState<CompanyModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchModules = useCallback(
    async (companyUuid: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await modulesApi.getCompanyModules(companyUuid);
        setModules(data);
      } catch (err: any) {
        setError(
          err?.response?.data?.message || t('modules.error.fetchFailed')
        );
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    if (isOpen && company) {
      fetchModules(company.uuid);
    } else if (!isOpen) {
      // Clear state on close so the next open starts clean.
      setModules([]);
      setError(null);
      setTogglingSlug(null);
    }
  }, [isOpen, company, fetchModules]);

  const handleToggle = async (mod: CompanyModule) => {
    if (!company) return;

    setTogglingSlug(mod.module.slug);
    setError(null);
    try {
      if (mod.enabled) {
        await modulesApi.disableModule(company.uuid, mod.module.slug);
      } else {
        await modulesApi.enableModule(company.uuid, mod.module.slug);
      }
      // Refetch to pick up fresh audit timestamps and subscription state.
      await fetchModules(company.uuid);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || t('modules.error.toggleFailed')
      );
    } finally {
      setTogglingSlug(null);
    }
  };

  if (!company) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('modules.title', { companyName: company.name })}
      size="lg"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <svg
            className="animate-spin h-6 w-6 text-primary-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      ) : (
        <ul className="divide-y divide-secondary-200">
          {modules.map((mod) => (
            <li
              key={mod.module.slug}
              className="py-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-medium text-secondary-900">
                    {mod.module.name}
                  </h4>
                  {mod.module.isCore && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700">
                      {t('modules.core')}
                    </span>
                  )}
                  {mod.enabled && mod.subscriptionStatus && (
                    <SubscriptionBadge status={mod.subscriptionStatus} />
                  )}
                </div>
                {mod.module.description && (
                  <p className="mt-1 text-sm text-secondary-500">
                    {mod.module.description}
                  </p>
                )}
                {mod.enabled && mod.enabledAt && (
                  <p className="mt-1 text-xs text-secondary-400">
                    {t('modules.enabledAt', {
                      date: new Date(mod.enabledAt).toLocaleDateString(),
                    })}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleToggle(mod)}
                disabled={togglingSlug === mod.module.slug}
                className="text-secondary-400 hover:text-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                aria-label={
                  mod.enabled ? t('modules.disable') : t('modules.enable')
                }
              >
                {mod.enabled ? (
                  <ToggleRight className="h-6 w-6 text-green-600" />
                ) : (
                  <ToggleLeft className="h-6 w-6" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-end pt-4 border-t border-secondary-200 mt-4">
        <Button variant="outline" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>
    </Modal>
  );
};

export default ManageCompanyModulesModal;
