import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { InviteCompanyUserRequest } from '../../types';
import { invitationsApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import { useAssignableRoles } from '../../hooks/useAssignableRoles';
import { inviteCompanyUserSchema } from '../../validation/schemas/invitation';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface InviteCompanyUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Invite flow for a company actor: role is required, options come from the
 * assignable-roles list, and Member is preselected. superAdmin keeps the
 * separate, unchanged `InviteUserModal` (legacy role enum, any company).
 */
const InviteCompanyUserModal: React.FC<InviteCompanyUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { roles } = useAssignableRoles();

  const {
    form: {
      register,
      handleSubmit: formSubmit,
      formState: { errors },
      setValue,
    },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<InviteCompanyUserRequest>({
    onSuccess,
    onClose,
    schema: inviteCompanyUserSchema(t),
  });

  useEffect(() => {
    if (!isOpen || roles.length === 0) return;
    const member = roles.find((role) => role.systemKey === 'member');
    setValue('roleUuid', member?.uuid || roles[0].uuid);
  }, [isOpen, roles, setValue]);

  const onSubmit = handleSubmit((data) => invitationsApi.createRoleInvitation(data));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('users.inviteTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div className="gd-alert gd-alert-danger">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            {...register('firstName')}
            label={t('users.firstName')}
            placeholder={t('users.firstNamePlaceholder')}
            error={errors.firstName?.message as string}
          />

          <Input
            {...register('lastName')}
            label={t('users.lastName')}
            placeholder={t('users.lastNamePlaceholder')}
            error={errors.lastName?.message as string}
          />
        </div>

        <Input
          {...register('email')}
          type="email"
          label={t('users.email')}
          placeholder={t('users.emailPlaceholder')}
          error={errors.email?.message as string}
        />

        <div>
          <label className="gd-label">{t('users.role')}</label>
          <select
            {...register('roleUuid')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {roles.map((role) => (
              <option key={role.uuid} value={role.uuid}>
                {role.name}
              </option>
            ))}
          </select>
          {errors.roleUuid && (
            <p className="mt-1 text-sm text-red-600">{errors.roleUuid.message as string}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-6 mt-2 border-t border-secondary-100">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={loading}>
            {t('users.sendInvitation')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default InviteCompanyUserModal;
