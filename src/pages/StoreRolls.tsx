import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { StoreRoll } from '../types';
import { storeRollsApi } from '../services/api';
import { useEntityList, FetchParams } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { useEffectiveCompany } from '../hooks/useEffectiveCompany';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import ConfirmModal from '../components/ui/ConfirmModal';
import StoreNoCompanySelected from '../components/ui/StoreNoCompanySelected';
import CreateStoreRollModal from '../components/modals/CreateStoreRollModal';
import EditStoreRollModal from '../components/modals/EditStoreRollModal';

const StoreRolls: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId, hasCompanySelected, isSuperAdmin } = useEffectiveCompany();
  const confirm = useConfirmModal();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selected, setSelected] = useState<StoreRoll | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchRolls = useCallback(
    (params: FetchParams) =>
      storeRollsApi.getAll(
        effectiveCompanyId ? { ...params, companyId: effectiveCompanyId } : params
      ),
    [effectiveCompanyId]
  );

  const {
    filteredData,
    loading,
    search,
    setSearch,
    refresh,
  } = useEntityList<StoreRoll>({
    fetchFn: fetchRolls,
    searchFields: ['description'],
    initialLimit: 100,
  });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const showEmpty = isSuperAdmin && !hasCompanySelected;

  const handleEdit = (roll: StoreRoll) => {
    setSelected(roll);
    setIsEditOpen(true);
  };

  const handleDelete = (roll: StoreRoll) => {
    confirm.showConfirm({
      title: t('common.confirmDelete'),
      message: t('store.rolls.deleteConfirm', { description: roll.description }),
      variant: 'danger',
      onConfirm: async () => {
        setActionLoading(roll.uuid);
        setActionError(null);
        try {
          await storeRollsApi.remove(roll.uuid, effectiveCompanyId);
          await refresh();
        } catch (err: any) {
          setActionError(err.response?.data?.message || t('store.rolls.deleteFailed'));
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    refresh();
  };

  const handleEditSuccess = () => {
    setIsEditOpen(false);
    setSelected(null);
    refresh();
  };

  const columns = [
    {
      header: t('store.rolls.description'),
      accessor: (roll: StoreRoll) => (
        <span className="text-sm font-medium text-secondary-900">{roll.description}</span>
      ),
    },
    {
      header: t('store.rolls.minQuantity'),
      accessor: (roll: StoreRoll) => (
        <span className="text-sm text-secondary-700">{roll.minQuantity}</span>
      ),
    },
    {
      header: t('store.fields.status'),
      accessor: (roll: StoreRoll) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            roll.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {roll.isActive ? t('store.fields.active') : t('store.fields.inactive')}
        </span>
      ),
    },
    {
      header: t('common.actions'),
      accessor: (roll: StoreRoll) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEdit(roll)}
            className="text-secondary-400 hover:text-primary-600 transition-colors"
            title={t('common.edit')}
            aria-label={t('common.edit')}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(roll)}
            disabled={actionLoading === roll.uuid}
            className="text-secondary-400 hover:text-red-600 transition-colors disabled:opacity-50"
            title={t('common.delete')}
            aria-label={t('common.delete')}
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
          <h1 className="text-2xl font-bold text-secondary-900">{t('store.rolls.title')}</h1>
          <p className="mt-1 text-sm text-secondary-500">{t('store.rolls.subtitle')}</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} disabled={showEmpty}>
          <Plus className="h-4 w-4 mr-2" />
          {t('store.rolls.create')}
        </Button>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{actionError}</p>
        </div>
      )}

      {showEmpty ? (
        <StoreNoCompanySelected />
      ) : (
        <div className="bg-white shadow-md rounded-xl border border-secondary-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-secondary-200 bg-secondary-50/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input
                type="text"
                placeholder={t('store.rolls.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <Table
            data={filteredData}
            columns={columns}
            loading={loading}
            emptyMessage={t('store.rolls.noRolls')}
          />
        </div>
      )}

      <CreateStoreRollModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
        effectiveCompanyId={effectiveCompanyId}
      />

      <EditStoreRollModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelected(null);
        }}
        roll={selected}
        onSuccess={handleEditSuccess}
        effectiveCompanyId={effectiveCompanyId}
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

export default StoreRolls;
