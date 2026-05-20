import React from 'react';
import { useTranslation } from 'react-i18next';
import { StoreUserForm } from '../../types';
import { storeUsersApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface CreateStoreUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  effectiveCompanyId?: string;
}

const CreateStoreUserModal: React.FC<CreateStoreUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  effectiveCompanyId,
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
  } = useModalForm<StoreUserForm>({
    onSuccess,
    onClose,
    defaultValues: { isActive: true } as Partial<StoreUserForm> as any,
  });

  const onSubmit = handleSubmit((data) => {
    // Drop an empty password so the backend falls back to the invite flow
    const payload: StoreUserForm = { ...data, companyId: effectiveCompanyId };
    if (!payload.password) {
      delete payload.password;
    }
    return storeUsersApi.create(payload);
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('store.users.createTitle')}>
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

        <div>
          <Input
            {...register('password', {
              minLength: {
                value: 8,
                message: t('store.users.validation.passwordMinLength'),
              },
            })}
            type="password"
            label={t('store.users.password')}
            error={errors.password?.message as string}
          />
          <p className="mt-1 text-xs text-secondary-500">
            {t('store.users.passwordOptionalHint')}
          </p>
        </div>

        <div className="flex items-center">
          <input
            {...register('isActive')}
            type="checkbox"
            id="store-user-isActive"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
          />
          <label htmlFor="store-user-isActive" className="ml-2 block text-sm text-secondary-900">
            {t('store.users.isActive')}
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={loading}>
            {t('store.users.createButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateStoreUserModal;
