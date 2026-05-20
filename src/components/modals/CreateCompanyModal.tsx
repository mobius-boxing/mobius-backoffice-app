import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreateCompanyForm } from '../../types';
import { companiesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
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
  } = useModalForm<CreateCompanyForm>({ onSuccess, onClose });

  const onSubmit = handleSubmit((data) => companiesApi.createCompany(data));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('companies.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Input
          {...register('name', {
            required: t('companies.validation.nameRequired'),
            minLength: {
              value: 2,
              message: t('companies.validation.nameMinLength'),
            },
            maxLength: {
              value: 100,
              message: t('companies.validation.nameMaxLength'),
            },
          })}
          label={t('companies.name')}
          placeholder={t('companies.namePlaceholder')}
          error={errors.name?.message as string}
        />

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {t('companies.description')} ({t('common.optional')})
          </label>
          <textarea
            {...register('description', {
              maxLength: {
                value: 500,
                message: t('companies.validation.descriptionMaxLength'),
              },
            })}
            rows={3}
            placeholder={t('companies.descriptionPlaceholder')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
          )}
        </div>

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
            {t('companies.createButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateCompanyModal;
