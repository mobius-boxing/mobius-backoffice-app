import React from 'react';
import { useTranslation } from 'react-i18next';
import { StoreUser } from '../../types';
import { storeUsersApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

// Write-only password modal. There is no existing password to read or display;
// both fields are type="password" and the form never echoes any stored value.
interface SetStoreUserPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

interface SetStoreUserPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: StoreUser | null;
  onSuccess: () => void;
  effectiveCompanyId?: string;
}

const SetStoreUserPasswordModal: React.FC<SetStoreUserPasswordModalProps> = ({
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
      watch,
    },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<SetStoreUserPasswordFormValues>({ onSuccess, onClose });

  const onSubmit = handleSubmit((data) =>
    storeUsersApi.setPassword(user!.uuid, data.newPassword, effectiveCompanyId)
  );

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('store.users.setPasswordTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Input
          {...register('newPassword', {
            required: t('store.users.validation.passwordMinLength'),
            minLength: {
              value: 8,
              message: t('store.users.validation.passwordMinLength'),
            },
          })}
          type="password"
          label={t('store.users.newPassword')}
          error={errors.newPassword?.message as string}
        />

        <Input
          {...register('confirmPassword', {
            required: t('store.users.validation.passwordMismatch'),
            validate: (value) =>
              value === watch('newPassword') ||
              (t('store.users.validation.passwordMismatch') as string),
          })}
          type="password"
          label={t('store.users.confirmPassword')}
          error={errors.confirmPassword?.message as string}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={loading}>
            {t('store.users.setPasswordButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SetStoreUserPasswordModal;
