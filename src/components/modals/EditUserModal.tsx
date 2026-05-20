import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { User, Company, UpdateUserRequest } from '../../types';
import { usersApi, companiesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSuccess: (updatedUser: User) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);

  // useModalForm's onSuccess takes no args, but the parent's onSuccess needs the updated user.
  // We skip the hook's onSuccess and invoke the parent's callback manually after the API call.
  const {
    form: {
      register,
      handleSubmit: formSubmit,
      formState: { errors },
      watch,
      setValue,
    },
    loading,
    error,
    handleSubmit,
    handleClose,
  } = useModalForm<UpdateUserRequest>({ onClose });

  const selectedRole = watch('role');

  useEffect(() => {
    if (isOpen) {
      setValue('firstName', user.firstName || '');
      setValue('lastName', user.lastName || '');
      setValue('email', user.email);
      setValue('role', user.role);
      setValue('isActive', user.isActive);

      if (currentUser?.role === 'superAdmin') {
        companiesApi
          .getCompanies()
          .then((r) => setCompanies(r.data))
          .catch(() => {
            /* silent — dropdown empty */
          });
      }
    }
  }, [isOpen, user, setValue, currentUser]);

  // Company dropdown is populated asynchronously; sync the selected value once companies arrive
  useEffect(() => {
    if (isOpen && companies.length > 0 && user.companyId) {
      const userCompany = companies.find(c => String(c.id) === String(user.companyId));
      if (userCompany) {
        setValue('companyId', userCompany.uuid);
      }
    }
  }, [isOpen, companies, user.companyId, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    // Only superAdmins can reassign companies; for everyone else preserve the original companyId
    const updateData: UpdateUserRequest = {
      ...data,
      companyId: currentUser?.role === 'superAdmin' ? data.companyId : user.companyId,
    };

    // Empty password field must be dropped — sending it would overwrite with an empty value
    if (!updateData.password) {
      delete updateData.password;
    }

    const updatedUser = await usersApi.updateUser(user.uuid, updateData);
    onSuccess(updatedUser);
    return updatedUser;
  });

  const canEditRole = () => {
    if (currentUser?.role === 'superAdmin') return true;
    if (currentUser?.role === 'admin' && user.role !== 'superAdmin') return true;
    return false;
  };

  const canEditStatus = () => {
    if (currentUser?.uuid === user.uuid) return false; // Can't deactivate self
    if (currentUser?.role === 'superAdmin') return true;
    if (currentUser?.role === 'admin' && user.role !== 'superAdmin') return true;
    return false;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('users.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            {...register('firstName', {
              required: t('users.validation.firstNameRequired'),
              minLength: {
                value: 2,
                message: t('users.validation.firstNameMinLength'),
              },
            })}
            label={t('users.firstName')}
            placeholder={t('users.firstNamePlaceholder')}
            error={errors.firstName?.message as string}
          />

          <Input
            {...register('lastName', {
              required: t('users.validation.lastNameRequired'),
              minLength: {
                value: 2,
                message: t('users.validation.lastNameMinLength'),
              },
            })}
            label={t('users.lastName')}
            placeholder={t('users.lastNamePlaceholder')}
            error={errors.lastName?.message as string}
          />
        </div>

        <Input
          {...register('email', {
            required: t('users.validation.emailRequired'),
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: t('users.validation.emailInvalid'),
            },
          })}
          type="email"
          label={t('users.email')}
          placeholder={t('users.emailPlaceholder')}
          error={errors.email?.message as string}
        />

        {canEditRole() && (
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              {t('users.role')}
            </label>
            <select
              {...register('role', { required: t('users.validation.roleRequired') })}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="member">{t('users.roles.member')}</option>
              <option value="admin">{t('users.roles.admin')}</option>
              {currentUser?.role === 'superAdmin' && (
                <option value="superAdmin">{t('users.roles.superAdmin')}</option>
              )}
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message as string}</p>
            )}
          </div>
        )}

        {currentUser?.role === 'superAdmin' && selectedRole !== 'superAdmin' && (
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              {t('users.company')}
            </label>
            <select
              {...register('companyId', { required: t('users.validation.companyRequired') })}
              className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">{t('users.selectCompany')}</option>
              {companies.map((company) => (
                <option key={company.uuid} value={company.uuid}>
                  {company.name}
                </option>
              ))}
            </select>
            {errors.companyId && (
              <p className="mt-1 text-sm text-red-600">{errors.companyId.message as string}</p>
            )}
          </div>
        )}

        {selectedRole === 'superAdmin' && currentUser?.role === 'superAdmin' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>{t('common.note')}:</strong> {t('users.superAdminNote')}
            </p>
          </div>
        )}

        {canEditStatus() && (
          <div className="flex items-center">
            <input
              {...register('isActive')}
              type="checkbox"
              id="isActive"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-secondary-900">
              {t('users.isActive')}
            </label>
          </div>
        )}

        {currentUser?.role === 'superAdmin' && (
          <div>
            <Input
              {...register('password', {
                minLength: {
                  value: 8,
                  message: t('users.validation.passwordMinLength'),
                },
              })}
              type="password"
              label={t('users.newPassword')}
              placeholder={t('users.newPasswordPlaceholder')}
              error={errors.password?.message as string}
            />
            <p className="mt-1 text-xs text-secondary-500">
              {t('users.passwordHint')}
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={loading}>
            {t('users.updateButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditUserModal;
