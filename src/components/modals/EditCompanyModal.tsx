import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Company, CreateCompanyForm } from '../../types';
import { companiesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import { editCompanySchema } from '../../validation/schemas/company';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface EditCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  onSuccess: () => void;
}

const EditCompanyModal: React.FC<EditCompanyModalProps> = ({
  isOpen,
  onClose,
  company,
  onSuccess,
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
  } = useModalForm<CreateCompanyForm>({ onSuccess, onClose, schema: editCompanySchema(t) });

  // Kept outside the form schema: the resolver would strip a field it does not list.
  const [isTerminadora, setIsTerminadora] = useState(false);

  useEffect(() => {
    if (isOpen && company) {
      setValue('name', company.name);
      setValue('description', company.description || '');
      setIsTerminadora(company.isTerminadora === true);
    }
  }, [isOpen, company, setValue]);

  const onSubmit = handleSubmit((data) =>
    companiesApi.updateCompany(company!.uuid, { ...data, isTerminadora }, company!.product)
  );

  if (!company) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('companies.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="gd-alert gd-alert-danger">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Input
          {...register('name')}
          label={t('companies.name')}
          placeholder={t('companies.namePlaceholder')}
          error={errors.name?.message as string}
        />

        <div>
          <label className="gd-label">
            {t('companies.description')} ({t('common.optional')})
          </label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder={t('companies.descriptionPlaceholder')}
            className="w-full border border-secondary-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message as string}</p>
          )}
        </div>


        <label className="flex items-center gap-2 text-sm text-secondary-700">
          <input
            type="checkbox"
            checked={isTerminadora}
            onChange={(e) => setIsTerminadora(e.target.checked)}
            disabled={loading}
            data-testid="company-terminadora-checkbox"
          />
          {t('companies.terminadora')}
        </label>
        <p className="-mt-2 text-xs text-secondary-500">{t('companies.terminadoraHint')}</p>

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
            {t('companies.updateButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditCompanyModal;
