import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StoreUser } from '../../types';
import { storeUsersApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

// Edit form has no password field — password changes go through SetStoreUserPasswordModal,
// which keeps "never display password" trivially true.
interface EditStoreUserFormValues {
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

interface EditStoreUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: StoreUser | null;
  onSuccess: () => void;
  effectiveCompanyId?: string;
}

const EditStoreUserModal: React.FC<EditStoreUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
  effectiveCompanyId,
}) => {
  const { t } = useTranslation();

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
  } = useModalForm<EditStoreUserFormValues>({ onSuccess, onClose });

  useEffect(() => {
    if (isOpen && user) {
      setValue('firstName', user.firstName || '');
      setValue('lastName', user.lastName || '');
      setValue('email', user.email);
      setValue('isActive', user.isActive);
    }
  }, [isOpen, user, setValue]);

  const onSubmit = handleSubmit((data) =>
    storeUsersApi.update(user!.uuid, data, effectiveCompanyId)
  );

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('store.users.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            {...register('firstName', {
              required: t('store.users.validation.firstNameRequired'),
            })}
            label={t('store.users.firstName')}
            placeholder={t('store.users.firstNamePlaceholder')}
            error={errors.firstName?.message as string}
          />

          <Input
            {...register('lastName', {
              required: t('store.users.validation.lastNameRequired'),
            })}
            label={t('store.users.lastName')}
            placeholder={t('store.users.lastNamePlaceholder')}
            error={errors.lastName?.message as string}
          />
        </div>

        <Input
          {...register('email', {
            required: t('store.users.validation.emailRequired'),
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: t('store.users.validation.emailInvalid'),
            },
          })}
          type="email"
          label={t('store.users.email')}
          placeholder={t('store.users.emailPlaceholder')}
          error={errors.email?.message as string}
        />

        <div className="flex items-center">
          <input
            {...register('isActive')}
            type="checkbox"
            id="edit-store-user-isActive"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
          />
          <label htmlFor="edit-store-user-isActive" className="ml-2 block text-sm text-secondary-900">
            {t('store.users.isActive')}
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={loading}>
            {t('store.users.updateButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditStoreUserModal;
