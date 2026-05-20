import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { usersApi } from '../services/api';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import ConfirmModal from '../components/ui/ConfirmModal';
import InviteUserModal from '../components/modals/InviteUserModal';
import EditUserModal from '../components/modals/EditUserModal';

const Users: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();

  const {
    filteredData: filteredUsers,
    loading,
    search: searchTerm,
    setSearch: setSearchTerm,
    refresh: refetch,
  } = useEntityList<User>({
    fetchFn: (params) => usersApi.getUsers(params as any),
    searchFields: ['firstName', 'lastName', 'email', 'companyName'],
    initialLimit: 100,
  });

  const confirm = useConfirmModal();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    confirm.showConfirm({
      title: t('common.confirmDelete'),
      message: t('users.deleteConfirm', { name: `${user.firstName} ${user.lastName}` }),
      variant: 'danger',
      onConfirm: async () => {
        setDeleteLoading(user.uuid);
        setActionError(null);
        try {
          await usersApi.deleteUser(user.uuid);
          await refetch();
        } catch (err: any) {
          setActionError(
            err.response?.data?.message || t('users.deleteFailed')
          );
        } finally {
          setDeleteLoading(null);
        }
      },
    });
  };

  const handleInviteSuccess = () => {
    setIsInviteModalOpen(false);
    refetch();
  };

  const handleEditSuccess = (_updatedUser: User) => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
    refetch();
  };

  const canEditUser = (user: User) => {
    if (currentUser?.role === 'superAdmin') return true;
    if (currentUser?.role === 'admin' && user.role !== 'superAdmin') return true;
    return false;
  };

  const canDeleteUser = (user: User) => {
    if (user.uuid === currentUser?.uuid) return false;
    if (currentUser?.role === 'superAdmin') return true;
    if (currentUser?.role === 'admin' && user.role !== 'superAdmin' && user.role !== 'admin') return true;
    return false;
  };

  const columns = [
    {
      header: t('users.name'),
      accessor: (user: User) => (
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
      header: t('users.role'),
      accessor: (user: User) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            user.role === 'superAdmin'
              ? 'bg-purple-100 text-purple-800'
              : user.role === 'admin'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-secondary-100 text-secondary-800'
          }`}
        >
          {t(`users.roles.${user.role}`)}
        </span>
      ),
    },
    ...(currentUser?.role === 'superAdmin'
      ? [
          {
            header: t('users.company'),
            accessor: (user: User) => (
              <span className="text-sm text-secondary-900">
                {user.companyName || '-'}
              </span>
            ),
          },
        ]
      : []),
    {
      header: t('users.status'),
      accessor: (user: User) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            user.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {user.isActive ? t('users.active') : t('users.inactive')}
        </span>
      ),
    },
    {
      header: t('common.actions'),
      accessor: (user: User) => (
        <div className="flex items-center space-x-2">
          {canEditUser(user) && (
            <button
              onClick={() => handleEditUser(user)}
              className="text-secondary-400 hover:text-primary-600 transition-colors"
              title={t('common.edit')}
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          {canDeleteUser(user) && (
            <button
              onClick={() => handleDeleteUser(user)}
              disabled={deleteLoading === user.uuid}
              className="text-secondary-400 hover:text-red-600 transition-colors disabled:opacity-50"
              title={t('common.delete')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">{t('users.title')}</h1>
          <p className="mt-1 text-sm text-secondary-500">{t('users.subtitle')}</p>
        </div>
        <Button onClick={() => setIsInviteModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('users.inviteUser')}
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
              placeholder={t('users.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <Table
          data={filteredUsers}
          columns={columns}
          loading={loading}
          emptyMessage={t('users.noUsers')}
        />
      </div>

      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={handleInviteSuccess}
      />

      {selectedUser && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onSuccess={handleEditSuccess}
        />
      )}

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

export default Users;
