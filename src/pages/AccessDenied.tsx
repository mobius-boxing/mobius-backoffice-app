import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';

const WEB_APP_URL = process.env.REACT_APP_WEB_APP_URL || 'https://app.mobiusboxing.com';

/**
 * Shown to a signed-in user the backoffice does not admit. The shared session
 * is deliberately left alone (it is also their web-app session); signing out
 * is an explicit choice here.
 */
const AccessDenied: React.FC = () => {
  const { t } = useTranslation();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 mb-4">
          <ShieldAlert className="h-8 w-8 text-red-600" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-secondary-900 mb-2">{t('accessDenied.title')}</h1>
        <p className="text-secondary-600 mb-6">{t('accessDenied.message')}</p>
        <div className="flex items-center justify-center gap-3">
          <a href={WEB_APP_URL} className="gd-b gd-b-solid gd-b-md">
            {t('accessDenied.goToApp')}
          </a>
          <Button variant="outline" onClick={() => logout()}>
            {t('nav.signOut')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
