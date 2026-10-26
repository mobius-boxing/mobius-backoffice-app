import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Plus, Search, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { User } from '../types';
import { usersApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { useEntityList } from '../hooks/useEntityList';
import Button from '../components/ui/Button';
import ActionButton from '../components/ui/ActionButton';
import ConfirmModal from '../components/ui/ConfirmModal';
import Table from '../components/ui/Table';
import InviteSuperAdminModal from '../components/modals/InviteSuperAdminModal';
import EditSuperAdminModal from '../components/modals/EditSuperAdminModal';

type Toast = { message: string; tone: 'success' | 'danger' } | null;

const errorMessage = (error: unknown, fallback: string, t: (key: string) => string) => {
  const response = error as { response?: { data?: { code?: string; message?: string } } };
  const code = response.response?.data?.code;
  if (code === 'SELF_SUPERADMIN_CHANGE') return t('superAdmins.selfSuperAdminChange');
  if (code === 'LAST_SUPERADMIN') return t('superAdmins.lastSuperAdmin');
  return response.response?.data?.message || fallback;
};

const SuperAdmins: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const confirm = useConfirmModal();
  const {
    filteredData: superAdmins,
    loading,
    search,
    setSearch,
    refresh,
  } = useEntityList<User>({
    fetchFn: (params) => usersApi.getUsers({ ...params, role: 'superAdmin' }),
    searchFields: ['firstName', 'lastName', 'email'],
    initialLimit: 100,
    defaultFilters: { role: 'superAdmin' },
  });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const isCurrentUser = (superAdmin: User) => superAdmin.uuid === currentUser?.uuid;

  const updateStatus = async (superAdmin: User) => {
    setActionLoading(superAdmin.uuid);
    setToast(null);
    try {
      await usersApi.updateUser(superAdmin.uuid, {
        firstName: superAdmin.firstName || '',
        lastName: superAdmin.lastName || '',
        isActive: !superAdmin.isActive,
      });
      await refresh();
    } catch (error: unknown) {
      setToast({ message: errorMessage(error, t('superAdmins.updateFailed'), t), tone: 'danger' });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = (superAdmin: User) => {
    confirm.showConfirm({
      title: t('common.confirmDelete'),
      message: t('superAdmins.deleteConfirm', { name: `${superAdmin.firstName || ''} ${superAdmin.lastName || ''}`.trim() || superAdmin.email }),
      variant: 'danger',
      onConfirm: async () => {
        setActionLoading(superAdmin.uuid);
        setToast(null);
        try {
          await usersApi.deleteUser(superAdmin.uuid);
          await refresh();
        } catch (error: unknown) {
          setToast({ message: errorMessage(error, t('superAdmins.deleteFailed'), t), tone: 'danger' });
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const columns = [
    {
      header: t('superAdmins.firstName'),
      accessor: (superAdmin: User) => (
        <div className="text-sm font-medium text-secondary-900">
          {`${superAdmin.firstName || ''} ${superAdmin.lastName || ''}`.trim() || superAdmin.email}
          {isCurrentUser(superAdmin) && <span className="ml-2 text-secondary-500">{t('superAdmins.you')}</span>}
        </div>
      ),
    },
    {
      header: t('superAdmins.email'),
      accessor: (superAdmin: User) => <span className="text-sm text-secondary-500">{superAdmin.email}</span>,
    },
    {
      header: t('superAdmins.status'),
      accessor: (superAdmin: User) => (
        <span className={`gd-badge ${superAdmin.isActive ? 'gd-badge-positive' : 'gd-badge-negative'}`}>
          {superAdmin.isActive ? t('superAdmins.active') : t('superAdmins.inactive')}
        </span>
      ),
    },
    {
      header: t('superAdmins.createdAt'),
      accessor: (superAdmin: User) => <span className="text-sm text-secondary-500">{new Date(superAdmin.createdAt).toLocaleDateString()}</span>,
    },
    {
      header: t('common.actions'),
      accessor: (superAdmin: User) => {
        const ownRow = isCurrentUser(superAdmin);
        const actionIsLoading = actionLoading === superAdmin.uuid;
        return (
          <div className="flex items-center space-x-2">
            <ActionButton onClick={() => updateStatus(superAdmin)} disabled={ownRow || actionIsLoading} className="text-secondary-400 hover:text-primary-600 transition-colors disabled:opacity-50" label={superAdmin.isActive ? t('superAdmins.deactivate') : t('superAdmins.activate')}>
              {superAdmin.isActive ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5" />}
            </ActionButton>
            <ActionButton onClick={() => setEditingUser(superAdmin)} className="text-secondary-400 hover:text-primary-600 transition-colors" label={t('common.edit')}>
              <Edit className="h-4 w-4" />
            </ActionButton>
            <ActionButton onClick={() => deleteUser(superAdmin)} disabled={ownRow || actionIsLoading} tone="danger" className="disabled:opacity-50" label={t('common.delete')}>
              <Trash2 className="h-4 w-4" />
            </ActionButton>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-8">
      <div className="gd-page-head">
        <div>
          <h1 className="gd-page-title">{t('superAdmins.title')}</h1>
          <p className="gd-page-sub">{t('superAdmins.subtitle')}</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}><Plus className="h-4 w-4 mr-2" />{t('superAdmins.invite')}</Button>
      </div>

      {toast && <div className={`fixed right-4 top-4 z-50 gd-alert ${toast.tone === 'danger' ? 'gd-alert-danger' : 'gd-alert-positive'}`} role="status"><p className="text-sm">{toast.message}</p></div>}

      <div className="gd-surface overflow-hidden">
        <div className="gd-surface-head">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input name="search" data-testid="super-admin-search" type="search" placeholder={t('superAdmins.searchPlaceholder')} value={search} onChange={(event) => setSearch(event.target.value)} className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
        </div>
        <Table data={superAdmins} columns={columns} loading={loading} emptyMessage={t('superAdmins.noSuperAdmins')} />
      </div>

      <InviteSuperAdminModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} onSuccess={refresh} />
      <EditSuperAdminModal isOpen={!!editingUser} onClose={() => setEditingUser(null)} user={editingUser} isCurrentUser={!!editingUser && isCurrentUser(editingUser)} onSuccess={async () => { setEditingUser(null); await refresh(); }} />
      <ConfirmModal isOpen={confirm.isOpen} onClose={confirm.handleClose} onConfirm={confirm.handleConfirm} title={confirm.title} message={confirm.message} confirmText={confirm.confirmText} cancelText={confirm.cancelText} variant={confirm.variant} loading={confirm.loading} />
    </div>
  );
};

export default SuperAdmins;
