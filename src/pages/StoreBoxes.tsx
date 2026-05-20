import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { StoreBox } from '../types';
import { storeBoxesApi } from '../services/api';
import { useEntityList, FetchParams } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { useEffectiveCompany } from '../hooks/useEffectiveCompany';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import ConfirmModal from '../components/ui/ConfirmModal';
import StoreNoCompanySelected from '../components/ui/StoreNoCompanySelected';
import CreateStoreBoxModal from '../components/modals/CreateStoreBoxModal';
import EditStoreBoxModal from '../components/modals/EditStoreBoxModal';

const StoreBoxes: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId, hasCompanySelected, isSuperAdmin } = useEffectiveCompany();
  const confirm = useConfirmModal();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selected, setSelected] = useState<StoreBox | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchBoxes = useCallback(
    (params: FetchParams) =>
      storeBoxesApi.getAll(
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
  } = useEntityList<StoreBox>({
    fetchFn: fetchBoxes,
    searchFields: ['description'],
    initialLimit: 100,
  });

  // Refetch whenever the selected company changes (superAdmin company switch)
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const showEmpty = isSuperAdmin && !hasCompanySelected;

  const handleEdit = (box: StoreBox) => {
    setSelected(box);
    setIsEditOpen(true);
  };

  const handleDelete = (box: StoreBox) => {
    confirm.showConfirm({
      title: t('common.confirmDelete'),
      message: t('store.boxes.deleteConfirm', { description: box.description }),
      variant: 'danger',
      onConfirm: async () => {
        setActionLoading(box.uuid);
        setActionError(null);
        try {
          await storeBoxesApi.remove(box.uuid, effectiveCompanyId);
          await refresh();
        } catch (err: any) {
          setActionError(err.response?.data?.message || t('store.boxes.deleteFailed'));
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
      header: t('store.boxes.description'),
      accessor: (box: StoreBox) => (
        <span className="text-sm font-medium text-secondary-900">{box.description}</span>
      ),
    },
    {
      header: t('store.boxes.unitsPerPackage'),
      accessor: (box: StoreBox) => (
        <span className="text-sm text-secondary-700">{box.unitsPerPackage}</span>
      ),
    },
    {
      header: t('store.boxes.unitsPerPallet'),
      accessor: (box: StoreBox) => (
        <span className="text-sm text-secondary-700">{box.unitsPerPallet}</span>
      ),
    },
    {
      header: t('store.fields.status'),
      accessor: (box: StoreBox) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            box.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {box.isActive ? t('store.fields.active') : t('store.fields.inactive')}
        </span>
      ),
    },
    {
      header: t('common.actions'),
      accessor: (box: StoreBox) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEdit(box)}
            className="text-secondary-400 hover:text-primary-600 transition-colors"
            title={t('common.edit')}
            aria-label={t('common.edit')}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(box)}
            disabled={actionLoading === box.uuid}
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
          <h1 className="text-2xl font-bold text-secondary-900">{t('store.boxes.title')}</h1>
          <p className="mt-1 text-sm text-secondary-500">{t('store.boxes.subtitle')}</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} disabled={showEmpty}>
          <Plus className="h-4 w-4 mr-2" />
          {t('store.boxes.create')}
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
                placeholder={t('store.boxes.searchPlaceholder')}
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
            emptyMessage={t('store.boxes.noBoxes')}
          />
        </div>
      )}

      <CreateStoreBoxModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
        effectiveCompanyId={effectiveCompanyId}
      />

      <EditStoreBoxModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelected(null);
        }}
        box={selected}
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

export default StoreBoxes;
