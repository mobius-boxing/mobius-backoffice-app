import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Send,
  KeyRound,
} from 'lucide-react';
import { StoreUser } from '../types';
import { storeUsersApi } from '../services/api';
import { useEntityList, FetchParams } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { useEffectiveCompany } from '../hooks/useEffectiveCompany';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import ConfirmModal from '../components/ui/ConfirmModal';
import StoreNoCompanySelected from '../components/ui/StoreNoCompanySelected';
import CreateStoreUserModal from '../components/modals/CreateStoreUserModal';
import EditStoreUserModal from '../components/modals/EditStoreUserModal';
import SetStoreUserPasswordModal from '../components/modals/SetStoreUserPasswordModal';

const StoreUsers: React.FC = () => {
  const { t } = useTranslation();
  const { effectiveCompanyId, hasCompanySelected, isSuperAdmin } = useEffectiveCompany();
  const confirm = useConfirmModal();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [selected, setSelected] = useState<StoreUser | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchUsers = useCallback(
    (params: FetchParams) =>
      storeUsersApi.getAll(
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
  } = useEntityList<StoreUser>({
    fetchFn: fetchUsers,
    searchFields: ['firstName', 'lastName', 'email'],
    initialLimit: 100,
  });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCompanyId]);

  const showEmpty = isSuperAdmin && !hasCompanySelected;

  const fullName = (u: StoreUser) =>
    `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;

  const handleEdit = (user: StoreUser) => {
    setSelected(user);
    setIsEditOpen(true);
  };

  const handleSetPassword = (user: StoreUser) => {
    setSelected(user);
    setIsPasswordOpen(true);
  };

  const handleToggleStatus = async (user: StoreUser) => {
    setActionLoading(user.uuid);
    setActionError(null);
    setActionSuccess(null);
    try {
      await storeUsersApi.updateStatus(user.uuid, !user.isActive, effectiveCompanyId);
      await refresh();
    } catch (err: any) {
      setActionError(err.response?.data?.message || t('store.users.statusFailed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendInvite = async (user: StoreUser) => {
    setActionLoading(user.uuid);
    setActionError(null);
    setActionSuccess(null);
    try {
      await storeUsersApi.resendInvite(user.uuid, effectiveCompanyId);
      setActionSuccess(t('store.users.inviteResent'));
    } catch (err: any) {
      setActionError(err.response?.data?.message || t('store.users.resendFailed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = (user: StoreUser) => {
    confirm.showConfirm({
      title: t('common.confirmDelete'),
      message: t('store.users.deleteConfirm', { name: fullName(user) }),
      variant: 'danger',
      onConfirm: async () => {
        setActionLoading(user.uuid);
        setActionError(null);
        setActionSuccess(null);
        try {
          await storeUsersApi.remove(user.uuid, effectiveCompanyId);
          await refresh();
        } catch (err: any) {
          setActionError(err.response?.data?.message || t('store.users.deleteFailed'));
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

  const handlePasswordSuccess = () => {
    setIsPasswordOpen(false);
    setSelected(null);
  };

  const columns = [
    {
      header: t('store.users.name'),
      accessor: (user: StoreUser) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-600">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-secondary-900">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-sm text-secondary-500">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: t('store.fields.status'),
      accessor: (user: StoreUser) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {user.isActive ? t('store.fields.active') : t('store.fields.inactive')}
        </span>
      ),
    },
    {
      header: t('store.users.createdAt'),
      accessor: (user: StoreUser) => (
        <span className="text-sm text-secondary-500">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: t('common.actions'),
      accessor: (user: StoreUser) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleToggleStatus(user)}
            disabled={actionLoading === user.uuid}
            className="text-secondary-400 hover:text-primary-600 transition-colors disabled:opacity-50"
            title={user.isActive ? t('store.users.disable') : t('store.users.enable')}
            aria-label={user.isActive ? t('store.users.disable') : t('store.users.enable')}
          >
            {user.isActive ? (
              <ToggleRight className="h-5 w-5 text-green-600" />
            ) : (
              <ToggleLeft className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={() => handleResendInvite(user)}
            disabled={actionLoading === user.uuid}
            className="text-secondary-400 hover:text-primary-600 transition-colors disabled:opacity-50"
            title={t('store.users.resendInvite')}
            aria-label={t('store.users.resendInvite')}
          >
            <Send className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleSetPassword(user)}
            className="text-secondary-400 hover:text-primary-600 transition-colors"
            title={t('store.users.setPassword')}
            aria-label={t('store.users.setPassword')}
          >
            <KeyRound className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEdit(user)}
            className="text-secondary-400 hover:text-primary-600 transition-colors"
            title={t('common.edit')}
            aria-label={t('common.edit')}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleRevoke(user)}
            disabled={actionLoading === user.uuid}
            className="text-secondary-400 hover:text-red-600 transition-colors disabled:opacity-50"
            title={t('store.users.revoke')}
            aria-label={t('store.users.revoke')}
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
          <h1 className="text-2xl font-bold text-secondary-900">{t('store.users.title')}</h1>
          <p className="mt-1 text-sm text-secondary-500">{t('store.users.subtitle')}</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} disabled={showEmpty}>
          <Plus className="h-4 w-4 mr-2" />
          {t('store.users.create')}
        </Button>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{actionError}</p>
        </div>
      )}

      {actionSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4" role="status" aria-live="polite">
          <p className="text-sm text-green-800">{actionSuccess}</p>
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
                placeholder={t('store.users.searchPlaceholder')}
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
            emptyMessage={t('store.users.noUsers')}
          />
        </div>
      )}

      <CreateStoreUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
        effectiveCompanyId={effectiveCompanyId}
      />

      <EditStoreUserModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelected(null);
        }}
        user={selected}
        onSuccess={handleEditSuccess}
        effectiveCompanyId={effectiveCompanyId}
      />

      <SetStoreUserPasswordModal
        isOpen={isPasswordOpen}
        onClose={() => {
          setIsPasswordOpen(false);
          setSelected(null);
        }}
        user={selected}
        onSuccess={handlePasswordSuccess}
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

export default StoreUsers;
