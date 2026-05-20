import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StoreBox, StoreBoxForm } from '../../types';
import { storeBoxesApi } from '../../services/api';
import { useModalForm } from '../../hooks/useModalForm';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface EditStoreBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  box: StoreBox | null;
  onSuccess: () => void;
  effectiveCompanyId?: string;
}

const EditStoreBoxModal: React.FC<EditStoreBoxModalProps> = ({
  isOpen,
  onClose,
  box,
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
  } = useModalForm<StoreBoxForm>({ onSuccess, onClose });

  useEffect(() => {
    if (isOpen && box) {
      setValue('description', box.description);
      setValue('unitsPerPackage', box.unitsPerPackage);
      setValue('unitsPerPallet', box.unitsPerPallet);
      setValue('isActive', box.isActive);
    }
  }, [isOpen, box, setValue]);

  const onSubmit = handleSubmit((data) =>
    storeBoxesApi.update(box!.uuid, data, effectiveCompanyId)
  );

  if (!box) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('store.boxes.editTitle')}>
      <form onSubmit={formSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Input
          {...register('description', {
            required: t('store.boxes.validation.descriptionRequired'),
            maxLength: {
              value: 255,
              message: t('store.boxes.validation.descriptionMaxLength'),
            },
          })}
          label={t('store.boxes.description')}
          placeholder={t('store.boxes.descriptionPlaceholder')}
          error={errors.description?.message as string}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            {...register('unitsPerPackage', {
              required: t('store.boxes.validation.unitsPerPackageMin'),
              valueAsNumber: true,
              min: {
                value: 1,
                message: t('store.boxes.validation.unitsPerPackageMin'),
              },
            })}
            type="number"
            min={1}
            label={t('store.boxes.unitsPerPackage')}
            error={errors.unitsPerPackage?.message as string}
          />

          <Input
            {...register('unitsPerPallet', {
              required: t('store.boxes.validation.unitsPerPalletMin'),
              valueAsNumber: true,
              min: {
                value: 1,
                message: t('store.boxes.validation.unitsPerPalletMin'),
              },
            })}
            type="number"
            min={1}
            label={t('store.boxes.unitsPerPallet')}
            error={errors.unitsPerPallet?.message as string}
          />
        </div>

        <div className="flex items-center">
          <input
            {...register('isActive')}
            type="checkbox"
            id="edit-box-isActive"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
          />
          <label htmlFor="edit-box-isActive" className="ml-2 block text-sm text-secondary-900">
            {t('store.boxes.isActive')}
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={loading}>
            {t('store.boxes.updateButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditStoreBoxModal;
