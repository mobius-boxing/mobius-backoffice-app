import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft } from 'lucide-react';
import { authApi } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface ForgotPasswordForm {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      await authApi.requestPasswordReset(data.email);
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset request error:', err);
      setError(err.response?.data?.message || t('forgotPassword.requestFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100">
            <Mail className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-secondary-900">
            {t('forgotPassword.title')}
          </h2>
          <p className="mt-1.5 text-sm text-secondary-500">
            {t('forgotPassword.subtitle')}
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 mb-4">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-green-800 mb-2">
                {t('forgotPassword.successTitle')}
              </h3>
              <p className="text-sm text-green-700 mb-6">
                {t('forgotPassword.successMessage')}
              </p>
              <Button onClick={() => navigate('/login')} variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('forgotPassword.backToLogin')}
              </Button>
            </div>
          </div>
        ) : (
          <form
            className="space-y-6 bg-white border border-secondary-200 rounded-2xl shadow-lg p-8"
            onSubmit={handleSubmit(onSubmit)}
          >
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Input
              {...register('email', {
                required: t('forgotPassword.validation.emailRequired'),
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: t('forgotPassword.validation.emailInvalid'),
                },
              })}
              type="email"
              label={t('forgotPassword.emailLabel')}
              placeholder={t('forgotPassword.emailPlaceholder')}
              error={errors.email?.message as string}
              autoComplete="email"
              autoFocus
            />

            <div className="space-y-4">
              <Button type="submit" loading={isLoading} className="w-full" size="lg">
                {t('forgotPassword.submitButton')}
              </Button>

              <Button
                type="button"
                onClick={() => navigate('/login')}
                variant="ghost"
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('forgotPassword.backToLogin')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
