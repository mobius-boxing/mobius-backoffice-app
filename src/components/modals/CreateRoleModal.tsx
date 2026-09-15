import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreateRoleForm } from '../../types';
import { rolesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import { createRoleSchema } from '../../validation/schemas/role';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** superAdmin only — the company the new role belongs to. */
  companyId?: string;
}

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  companyId,
}) => {
  const { t } = useTranslation();

  const {
    form: {
      register,
      handleSubmit: formSubmit,
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
    schema: createRoleSchema(t),
  });

  const onSubmit = handleSubmit((data) => rolesApi.createRole({ ...data, companyId }));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('roles.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="gd-alert gd-alert-danger">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Input
          {...register('name')}
          label={t('roles.name')}
          placeholder={t('roles.namePlaceholder')}
          error={errors.name?.message as string}
          required
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={loading}>
            {t('roles.createButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateRoleModal;
