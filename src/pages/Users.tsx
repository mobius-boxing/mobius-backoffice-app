import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { usersApi } from '../services/api';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { usePermissions } from '../hooks/usePermissions';
import { useAssignableRoles } from '../hooks/useAssignableRoles';
import Button from '../components/ui/Button';
import ActionButton from '../components/ui/ActionButton';
import Table from '../components/ui/Table';
import ConfirmModal from '../components/ui/ConfirmModal';
import InviteUserModal from '../components/modals/InviteUserModal';
import InviteCompanyUserModal from '../components/modals/InviteCompanyUserModal';
import EditUserModal from '../components/modals/EditUserModal';
import UserRolePicker from '../components/users/UserRolePicker';

const Users: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { has } = usePermissions();
  const isSuperAdmin = currentUser?.role === 'superAdmin';
  const canWriteUsers = has('users.edit');

  // superAdmin's Users list mixes every company (see the `companyName` column
  // below), so a single role-filter dropdown has no one company to scope
  // against and is omitted for them. A company actor's filter list is their
  // own company (no companyId param, JWT-inferred).
  const { roles: filterRoles } = useAssignableRoles(isSuperAdmin ? undefined : currentUser?.companyId);
  const [roleFilter, setRoleFilter] = useState('');

  const {
    filteredData: filteredUsers,
    loading,
    search: searchTerm,
    setSearch: setSearchTerm,
    setFilters,
    refresh: refetch,
  } = useEntityList<User>({
    fetchFn: (params) => usersApi.getUsers(params as any),
    searchFields: ['firstName', 'lastName', 'email', 'companyName'],
    initialLimit: 100,
  });

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setFilters(value ? { roleUuid: value } : {});
  };

  const confirm = useConfirmModal();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
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

  const handleToggleActive = async (user: User) => {
    setStatusLoading(user.uuid);
    setActionError(null);
    try {
      await usersApi.updateUserStatus(user.uuid, !user.isActive);
      await refetch();
    } catch (err: any) {
      setActionError(err.response?.data?.message || t('users.statusFailed'));
    } finally {
      setStatusLoading(null);
    }
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
    if (has('users.edit') && user.role !== 'superAdmin') return true;
    return false;
  };

  // Company actors never delete users — user lifecycle for them is invite/deactivate only.
  const canDeleteUser = (user: User) => {
    if (user.uuid === currentUser?.uuid) return false;
    return currentUser?.role === 'superAdmin';
  };

  const canToggleActive = (user: User) => {
    if (user.uuid === currentUser?.uuid) return false;
    if (isSuperAdmin) return true;
    return canWriteUsers;
  };

  const canAssignRole = (user: User) => canWriteUsers && user.uuid !== currentUser?.uuid;

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
      accessor: (user: User) =>
        user.role === 'superAdmin' ? (
          <span className="gd-badge gd-badge-brand">{t('users.roles.superAdmin')}</span>
        ) : (
          <UserRolePicker
            user={user}
            disabled={!canAssignRole(user)}
            onAssigned={refetch}
            onError={setActionError}
          />
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
          className={`gd-badge ${
            user.isActive ? 'gd-badge-positive' : 'gd-badge-negative'
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
            <ActionButton
              onClick={() => handleEditUser(user)}
              className="text-secondary-400 hover:text-primary-600 transition-colors"
              label={t('common.edit')}
            >
              <Edit className="h-4 w-4" />
            </ActionButton>
          )}
          {canToggleActive(user) && (
            <ActionButton
              onClick={() => handleToggleActive(user)}
              disabled={statusLoading === user.uuid}
              className="text-secondary-400 hover:text-primary-600 transition-colors disabled:opacity-50"
              label={user.isActive ? t('users.deactivate') : t('users.reactivate')}
            >
              {user.isActive ? (
                <ToggleRight className="h-5 w-5 text-green-600" />
              ) : (
                <ToggleLeft className="h-5 w-5" />
              )}
            </ActionButton>
          )}
          {canDeleteUser(user) && (
            <ActionButton
              onClick={() => handleDeleteUser(user)}
              disabled={deleteLoading === user.uuid}
              tone="danger"
              className="disabled:opacity-50"
              label={t('common.delete')}
            >
              <Trash2 className="h-4 w-4" />
            </ActionButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="gd-page-head">
        <div>
          <h1 className="gd-page-title">{t('users.title')}</h1>
          <p className="gd-page-sub">{t('users.subtitle')}</p>
        </div>
        {canWriteUsers && (
          <Button onClick={() => setIsInviteModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('users.inviteUser')}
          </Button>
        )}
      </div>

      {actionError && (
        <div className="gd-alert gd-alert-danger">
          <p className="text-sm text-red-800">{actionError}</p>
        </div>
      )}

      <div className="gd-surface overflow-hidden">
        <div className="gd-surface-head flex flex-wrap items-center gap-3">
          <div className="gd-search relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              placeholder={t('users.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>
          {!isSuperAdmin && filterRoles.length > 0 && (
            <select
              value={roleFilter}
              onChange={(e) => handleRoleFilterChange(e.target.value)}
              className="border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">{t('users.filterByRole')}</option>
              {filterRoles.map((role) => (
                <option key={role.uuid} value={role.uuid}>
                  {role.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <Table
          data={filteredUsers}
          columns={columns}
          loading={loading}
          emptyMessage={t('users.noUsers')}
        />
      </div>

      {isSuperAdmin ? (
        <InviteUserModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          onSuccess={handleInviteSuccess}
        />
      ) : (
        <InviteCompanyUserModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          onSuccess={handleInviteSuccess}
        />
      )}

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
