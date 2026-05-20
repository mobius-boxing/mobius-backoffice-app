import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Company, InviteUserRequest } from '../../types';
import { invitationsApi, companiesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);

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
  } = useModalForm<InviteUserRequest>({ onSuccess, onClose });

  const selectedRole = watch('role');

  useEffect(() => {
    if (isOpen && currentUser?.role === 'superAdmin') {
      companiesApi
        .getCompanies()
        .then((r) => setCompanies(r.data))
        .catch(() => {
          /* silent — dropdown empty */
        });
    }
  }, [isOpen, currentUser]);

  const onSubmit = handleSubmit((data) => {
    // SuperAdmins belong to no company; superAdmin inviters may pick any; regular admins
    // are locked to their own company regardless of what the (hidden) form field contains
    let companyId: string | undefined;

    if (data.role === 'superAdmin') {
      companyId = undefined;
    } else if (currentUser?.role === 'superAdmin') {
      companyId = data.companyId;
    } else {
      companyId = currentUser?.companyId;
    }

    return invitationsApi.createInvitation({ ...data, companyId });
  });

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('users.inviteTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-5">
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

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('users.role')}
          </label>
          <select
            {...register('role', { required: t('users.validation.roleRequired') })}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">{t('users.selectRole')}</option>
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

        <div className="flex justify-end space-x-3 pt-6 mt-2 border-t border-secondary-100">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
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

export default InviteUserModal;
