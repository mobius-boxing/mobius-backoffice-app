import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CreateRoleForm, Role } from '../../types';
import { rolesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import { renameRoleSchema } from '../../validation/schemas/role';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: Role | null;
  /** superAdmin only — the company the role belongs to. */
  companyId?: string;
}

/**
 * Rename only. `role.systemKey` set means Admin or Member, and rename is
 * blocked for both, so the input renders disabled rather than letting a
 * doomed PUT reach the server (409 SYSTEM_ROLE is still the source of truth
 * if this ever drifts from the server's rule).
 */
const EditRoleModal: React.FC<EditRoleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  role,
  companyId,
}) => {
  const { t } = useTranslation();
  const locked = !!role?.systemKey;

  const {
    form: {
      register,
      handleSubmit: formSubmit,
      reset,
      formState: { errors },
    },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<CreateRoleForm>({
    defaultValues: { name: '' },
    onSuccess,
    onClose,
    schema: renameRoleSchema(t),
  });

  useEffect(() => {
    if (role) {
      reset({ name: role.name });
    }
  }, [role, reset]);

  const onSubmit = handleSubmit((data) => {
    if (!role) return Promise.reject(new Error('No role selected'));
    return rolesApi.renameRole(role.uuid, data.name, companyId);
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('roles.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="gd-alert gd-alert-danger">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {locked && (
          <div className="gd-alert gd-alert-info">
            <p className="text-sm text-blue-800">{t('roles.systemRoleLocked')}</p>
          </div>
        )}

        <Input
          {...register('name')}
          label={t('roles.name')}
          placeholder={t('roles.namePlaceholder')}
          error={errors.name?.message as string}
          disabled={locked}
          required
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          {!locked && (
            <Button type="submit" loading={loading}>
              {t('roles.updateButton')}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default EditRoleModal;
