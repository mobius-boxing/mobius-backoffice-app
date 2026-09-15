import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Edit, Trash2, KeyRound, ShieldCheck } from 'lucide-react';
import { Company, Role } from '../types';
import { rolesApi, companiesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useEntityList } from '../hooks/useEntityList';
import { useConfirmModal } from '../hooks/useConfirmModal';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import ConfirmModal from '../components/ui/ConfirmModal';
import CreateRoleModal from '../components/modals/CreateRoleModal';
import EditRoleModal from '../components/modals/EditRoleModal';
import RolePermissionsModal from '../components/modals/RolePermissionsModal';

const Roles: React.FC = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { has } = usePermissions();
  const isSuperAdmin = currentUser?.role === 'superAdmin';
  // Admin's grants can't be edited and system roles can't be renamed/deleted
  // regardless of `canWrite` — this only gates create/rename/delete.
  const canWrite = has('roles.edit');

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState<string>('');

  // Roles are inherently one company at a time; superAdmin has none of their
  // own, so — mirroring EditUserModal/InviteUserModal's inline company
  // dropdown — they pick one here before the list loads.
  React.useEffect(() => {
    if (isSuperAdmin) {
      companiesApi
        .getCompanies()
        .then((r) => setCompanies(r.data))
        .catch(() => {});
    }
  }, [isSuperAdmin]);

  const fetchRoles = useCallback(
    (params: Record<string, unknown>) =>
      rolesApi.getRoles(companyId ? { ...params, companyId } : params),
    [companyId]
  );

  const {
    filteredData: roles,
    loading,
    search: searchTerm,
    setSearch: setSearchTerm,
    refresh: refetch,
  } = useEntityList<Role>({
    fetchFn: fetchRoles,
    searchFields: ['name'],
    initialLimit: 100,
    autoFetch: !isSuperAdmin,
  });

  React.useEffect(() => {
    if (isSuperAdmin && companyId) refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const confirm = useConfirmModal();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setIsEditModalOpen(true);
  };

  const handlePermissions = (role: Role) => {
    setSelectedRole(role);
    setIsPermissionsModalOpen(true);
  };

  const handleDelete = (role: Role) => {
    confirm.showConfirm({
      title: t('common.confirmDelete'),
      message: t('roles.deleteConfirm', { name: role.name }),
      variant: 'danger',
      onConfirm: async () => {
        setActionLoading(role.uuid);
        setActionError(null);
        try {
          await rolesApi.deleteRole(role.uuid);
          await refetch();
        } catch (err: any) {
          setActionError(err.response?.data?.message || t('roles.deleteFailed'));
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const columns = [
    {
      header: t('roles.columns.name'),
      accessor: (role: Role) => (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-secondary-900">{role.name}</span>
          {role.systemKey && (
            <span className="gd-badge gd-badge-info">
              <ShieldCheck className="h-3 w-3 mr-1 inline" />
              {t(`roles.systemKeys.${role.systemKey}`)}
            </span>
          )}
        </div>
      ),
    },
    {
      header: t('roles.columns.userCount'),
      accessor: (role: Role) => <span className="text-sm text-secondary-700">{role.userCount}</span>,
    },
    {
      header: t('common.actions'),
      accessor: (role: Role) => {
        const locked = !!role.systemKey;
        return (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePermissions(role)}
              className="text-secondary-400 hover:text-primary-600 transition-colors"
              title={t('roles.editPermissions')}
            >
              <KeyRound className="h-4 w-4" />
            </button>
            {canWrite && (
              <>
                <button
                  onClick={() => handleEdit(role)}
                  disabled={locked}
                  className="text-secondary-400 hover:text-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title={t('roles.editRole')}
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(role)}
                  disabled={actionLoading === role.uuid || locked || role.userCount > 0}
                  className="text-secondary-400 hover:text-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title={t('roles.deleteRole')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-8">
      <div className="gd-page-head">
        <div>
          <h1 className="gd-page-title">{t('roles.title')}</h1>
          <p className="gd-page-sub">{t('roles.subtitle')}</p>
        </div>
        {canWrite && (!isSuperAdmin || companyId) && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('roles.addRole')}
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
          {isSuperAdmin && (
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full sm:w-64 border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">{t('users.selectCompany')}</option>
              {companies.map((company) => (
                <option key={company.uuid} value={company.uuid}>
                  {company.name}
                </option>
              ))}
            </select>
          )}
          <div className="gd-search relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              placeholder={t('roles.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        {isSuperAdmin && !companyId ? (
          <p className="gd-page-sub p-6">{t('roles.selectCompanyPrompt')}</p>
        ) : (
          <Table data={roles} columns={columns} loading={loading} emptyMessage={t('roles.noRoles')} />
        )}
      </div>

      <CreateRoleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          refetch();
        }}
        companyId={isSuperAdmin ? companyId : undefined}
      />

      <EditRoleModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedRole(null);
        }}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setSelectedRole(null);
          refetch();
        }}
        role={selectedRole}
      />

      <RolePermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => {
          setIsPermissionsModalOpen(false);
          setSelectedRole(null);
        }}
        onSuccess={() => {
          setIsPermissionsModalOpen(false);
          setSelectedRole(null);
          refetch();
        }}
        role={selectedRole}
        companyId={isSuperAdmin ? companyId : undefined}
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

export default Roles;
