import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EditSuperAdminForm, User } from '../../types';
import { usersApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface EditSuperAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isCurrentUser: boolean;
  onSuccess: () => void;
}

const EditSuperAdminModal: React.FC<EditSuperAdminModalProps> = ({ isOpen, onClose, user, isCurrentUser, onSuccess }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<EditSuperAdminForm>({ firstName: '', lastName: '', isActive: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      setForm({ firstName: user.firstName || '', lastName: user.lastName || '', isActive: user.isActive });
      setError('');
    }
  }, [isOpen, user]);

  if (!user) return null;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await usersApi.updateUser(user.uuid, form);
      onSuccess();
    } catch (err: unknown) {
      const response = err as { response?: { data?: { message?: string } } };
      setError(response.response?.data?.message || t('superAdmins.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => !loading && onClose()} title={t('superAdmins.editTitle')}>
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="gd-alert gd-alert-danger"><p className="text-sm text-red-800">{error}</p></div>}
        <Input name="firstName" data-testid="edit-super-admin-first-name" required label={t('superAdmins.firstName')} value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
        <Input name="lastName" data-testid="edit-super-admin-last-name" required label={t('superAdmins.lastName')} value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
        <label className="flex items-center gap-3 text-sm text-secondary-700" htmlFor="edit-super-admin-is-active">
          <input id="edit-super-admin-is-active" name="isActive" data-testid="edit-super-admin-is-active" type="checkbox" checked={form.isActive} disabled={isCurrentUser} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
          {t('superAdmins.active')}
        </label>
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
          <Button type="submit" loading={loading}>{t('common.save')}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditSuperAdminModal;
