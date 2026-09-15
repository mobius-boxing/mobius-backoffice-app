import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../../types';
import { rolesApi } from '../../services/api';
import { useAssignableRoles } from '../../hooks/useAssignableRoles';

interface UserRolePickerProps {
  user: User;
  disabled?: boolean;
  onAssigned: () => void;
  onError: (message: string) => void;
}

/**
 * Inline role picker for a Users row. `user.companyId` scopes the assignable
 * list for a superAdmin actor viewing users across companies; the API
 * ignores the companyId param for a company actor and infers their own
 * company from the JWT (same convention as filesApi.uploadFile).
 */
const UserRolePicker: React.FC<UserRolePickerProps> = ({ user, disabled, onAssigned, onError }) => {
  const { t } = useTranslation();
  const { roles, loading } = useAssignableRoles(user.companyId);
  const [saving, setSaving] = useState(false);

  if (!disabled && !loading && roles.length === 0) {
    return <span className="text-sm text-secondary-500">{user.roleName || '-'}</span>;
  }

  if (disabled) {
    return <span className="text-sm text-secondary-700">{user.roleName || '-'}</span>;
  }

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const roleUuid = e.target.value;
    if (!roleUuid || roleUuid === user.roleUuid) return;
    setSaving(true);
    try {
      await rolesApi.assignRole(user.uuid, roleUuid);
      onAssigned();
    } catch (err: any) {
      onError(err.response?.data?.message || t('users.assignRoleFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      value={user.roleUuid || ''}
      onChange={handleChange}
      disabled={saving || loading}
      className="border border-secondary-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
    >
      {!user.roleUuid && <option value="">{user.roleName || '-'}</option>}
      {roles.map((role) => (
        <option key={role.uuid} value={role.uuid}>
          {role.name}
        </option>
      ))}
    </select>
  );
};

export default UserRolePicker;
