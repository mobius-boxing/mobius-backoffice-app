import React from 'react';
import { useTranslation } from 'react-i18next';
import { StoreRollForm } from '../../types';
import { storeRollsApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface CreateStoreRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  effectiveCompanyId?: string;
}

const CreateStoreRollModal: React.FC<CreateStoreRollModalProps> = ({
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
  } = useModalForm<StoreRollForm>({
    onSuccess,
    onClose,
    defaultValues: { isActive: true, minQuantity: 50 } as Partial<StoreRollForm> as any,
  });

  const onSubmit = handleSubmit((data) =>
    storeRollsApi.create({ ...data, companyId: effectiveCompanyId })
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('store.rolls.createTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Input
          {...register('description', {
            required: t('store.rolls.validation.descriptionRequired'),
            maxLength: {
              value: 255,
              message: t('store.rolls.validation.descriptionMaxLength'),
            },
          })}
          label={t('store.rolls.description')}
          placeholder={t('store.rolls.descriptionPlaceholder')}
          error={errors.description?.message as string}
        />

        <Input
          {...register('minQuantity', {
            required: t('store.rolls.validation.minQuantityMin'),
            valueAsNumber: true,
            min: {
              value: 1,
              message: t('store.rolls.validation.minQuantityMin'),
            },
          })}
          type="number"
          min={1}
          label={t('store.rolls.minQuantity')}
          error={errors.minQuantity?.message as string}
        />

        <div className="flex items-center">
          <input
            {...register('isActive')}
            type="checkbox"
            id="roll-isActive"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
          />
          <label htmlFor="roll-isActive" className="ml-2 block text-sm text-secondary-900">
            {t('store.rolls.isActive')}
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={loading}>
            {t('store.rolls.createButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateStoreRollModal;
