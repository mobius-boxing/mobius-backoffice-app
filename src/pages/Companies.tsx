import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, SlidersHorizontal } from 'lucide-react';
import { Company } from '../types';
import { companiesApi } from '../services/api';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import ConfirmModal from '../components/ui/ConfirmModal';
import CreateCompanyModal from '../components/modals/CreateCompanyModal';
import EditCompanyModal from '../components/modals/EditCompanyModal';
import ManageCompanyModulesModal from '../components/modals/ManageCompanyModulesModal';

const Companies: React.FC = () => {
  const { t } = useTranslation();

  const {
    filteredData: filteredCompanies,
    loading,
    search: searchTerm,
    setSearch: setSearchTerm,
    refresh: refetch,
  } = useEntityList<Company>({
    fetchFn: (params) => companiesApi.getCompanies(params as any),
    searchFields: ['name', 'description'],
    initialLimit: 100,
  });

  const confirm = useConfirmModal();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isModulesModalOpen, setIsModulesModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setIsEditModalOpen(true);
  };

  const handleToggleStatus = async (company: Company) => {
    setActionLoading(company.uuid);
    setActionError(null);
    try {
      await companiesApi.updateCompanyStatus(company.uuid, !company.isActive);
      await refetch();
    } catch (err: any) {
      setActionError(
        err.response?.data?.message || t('companies.toggleFailed')
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCompany = (company: Company) => {
    confirm.showConfirm({
      title: t('common.confirmDelete'),
      message: t('companies.deleteConfirm', { name: company.name }),
      variant: 'danger',
      onConfirm: async () => {
        setActionLoading(company.uuid);
        setActionError(null);
        try {
          await companiesApi.deleteCompany(company.uuid);
          await refetch();
        } catch (err: any) {
          setActionError(
            err.response?.data?.message || t('companies.deleteFailed')
          );
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    refetch();
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedCompany(null);
    refetch();
  };

  const columns = [
    {
      header: t('companies.name'),
      accessor: (company: Company) => (
        <div>
          <div className="text-sm font-medium text-secondary-900">{company.name}</div>
          {company.description && (
            <div className="text-sm text-secondary-500 truncate max-w-xs">
              {company.description}
            </div>
          )}
        </div>
      ),
    },
    {
      header: t('companies.status'),
      accessor: (company: Company) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            company.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {company.isActive ? t('companies.active') : t('companies.inactive')}
        </span>
      ),
    },
    {
      header: t('companies.createdAt'),
      accessor: (company: Company) => (
        <span className="text-sm text-secondary-500">
          {new Date(company.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: t('common.actions'),
      accessor: (company: Company) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleToggleStatus(company)}
            disabled={actionLoading === company.uuid}
            className="text-secondary-400 hover:text-primary-600 transition-colors disabled:opacity-50"
            title={company.isActive ? t('companies.deactivate') : t('companies.activate')}
          >
            {company.isActive ? (
              <ToggleRight className="h-5 w-5 text-green-600" />
            ) : (
              <ToggleLeft className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={() => handleEditCompany(company)}
            className="text-secondary-400 hover:text-primary-600 transition-colors"
            title={t('common.edit')}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSelectedCompany(company);
              setIsModulesModalOpen(true);
            }}
            className="text-secondary-400 hover:text-primary-600 transition-colors"
            title={t('modules.manageButton')}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteCompany(company)}
            disabled={actionLoading === company.uuid}
            className="text-secondary-400 hover:text-red-600 transition-colors disabled:opacity-50"
            title={t('common.delete')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">{t('companies.title')}</h1>
          <p className="mt-1 text-sm text-secondary-500">{t('companies.subtitle')}</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('companies.createCompany')}
        </Button>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{actionError}</p>
        </div>
      )}

      <div className="bg-white shadow-md rounded-xl border border-secondary-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-secondary-200 bg-secondary-50/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              placeholder={t('companies.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <Table
          data={filteredCompanies}
          columns={columns}
          loading={loading}
          emptyMessage={t('companies.noCompanies')}
        />
      </div>

      <CreateCompanyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <EditCompanyModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCompany(null);
        }}
        company={selectedCompany}
        onSuccess={handleEditSuccess}
      />

      <ManageCompanyModulesModal
        isOpen={isModulesModalOpen}
        onClose={() => {
          setIsModulesModalOpen(false);
          setSelectedCompany(null);
        }}
        company={selectedCompany}
      />

      <ConfirmModal
        isOpen={confirm.isOpen}
        onClose={confirm.handleClose}
        onConfirm={confirm.handleConfirm}
        title={confirm.title}
        message={confirm.message}
        confirmText={confirm.confirmText}
        cancelText={confirm.cancelText}
        variant={confirm.variant}
        loading={confirm.loading}
      />
    </div>
  );
};

export default Companies;
