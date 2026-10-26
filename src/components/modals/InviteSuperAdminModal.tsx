import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InviteSuperAdminForm } from '../../types';
import { usersApi } from '../../services/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface InviteSuperAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EMPTY_FORM: InviteSuperAdminForm = { email: '', firstName: '', lastName: '' };

const InviteSuperAdminModal: React.FC<InviteSuperAdminModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<InviteSuperAdminForm>(EMPTY_FORM);
  const [sentTo, setSentTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setSentTo('');
      setError('');
    }
  }, [isOpen]);

  const close = () => {
    if (!loading) onClose();
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      // The API never returns the invitation token, so the email is the only way to deliver the link.
      await usersApi.inviteUser(form);
      setSentTo(form.email);
      onSuccess();
    } catch (err: unknown) {
      const response = err as { response?: { data?: { message?: string } } };
      setError(response.response?.data?.message || t('superAdmins.inviteFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title={t('superAdmins.inviteTitle')}>
      {sentTo ? (
        <div className="space-y-4">
          <p className="text-sm text-secondary-700" data-testid="super-admin-invitation-sent">{t('superAdmins.invitationSent', { email: sentTo })}</p>
          <div className="flex justify-end">
            <Button type="button" onClick={onClose}>{t('common.close')}</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <div className="gd-alert gd-alert-danger"><p className="text-sm text-red-800">{error}</p></div>}
          <Input name="email" data-testid="invite-super-admin-email" type="email" required label={t('superAdmins.email')} placeholder={t('superAdmins.emailPlaceholder')} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <Input name="firstName" data-testid="invite-super-admin-first-name" required label={t('superAdmins.firstName')} placeholder={t('superAdmins.firstNamePlaceholder')} value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
          <Input name="lastName" data-testid="invite-super-admin-last-name" required label={t('superAdmins.lastName')} placeholder={t('superAdmins.lastNamePlaceholder')} value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={close} disabled={loading}>{t('common.cancel')}</Button>
            <Button type="submit" loading={loading}>{t('superAdmins.invite')}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default InviteSuperAdminModal;
