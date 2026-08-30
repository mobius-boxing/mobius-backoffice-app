import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema } from '../validation/schemas/auth';
import { useTranslation } from 'react-i18next';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { authApi } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface ResetPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema(t)) as never,
    mode: 'onBlur',
  });

  const newPassword = watch('newPassword');

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError(t('resetPassword.invalidToken'));
    } else {
      setToken(tokenParam);
    }
  }, [searchParams, t]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      setError(t('resetPassword.invalidToken'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authApi.resetPassword(token, data.newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.response?.data?.message || t('resetPassword.resetFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="gd-auth">
      <div className="gd-auth__inner enter-up">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100">
            <Lock className="h-6 w-6 text-primary-600" />
          </div>
          <h1 className="gd-auth__title">
            {t('resetPassword.title')}
          </h1>
          <p className="gd-auth__sub">
            {t('resetPassword.subtitle')}
          </p>
        </div>

        {success ? (
          <div className="gd-alert gd-alert-success">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-green-800 mb-2">
                {t('resetPassword.successTitle')}
              </h3>
              <p className="text-sm text-green-700">
                {t('resetPassword.successMessage')}
              </p>
            </div>
          </div>
        ) : (
          <form
            className="space-y-6 bg-white border border-secondary-200 rounded-2xl shadow-lg p-8"
            onSubmit={handleSubmit(onSubmit)}
          >
            {error && (
              <div className="gd-alert gd-alert-danger">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <Input
                  {...register('newPassword')}
                  type={showPassword ? 'text' : 'password'}
                  label={t('resetPassword.newPasswordLabel')}
                  placeholder={t('resetPassword.newPasswordPlaceholder')}
                  error={errors.newPassword?.message as string}
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  className="absolute right-3 top-8 text-secondary-400 hover:text-secondary-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  label={t('resetPassword.confirmPasswordLabel')}
                  placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                  error={errors.confirmPassword?.message as string}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-8 text-secondary-400 hover:text-secondary-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <div className="text-xs text-secondary-600 space-y-1">
                <p>{t('resetPassword.passwordRequirements')}</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>{t('resetPassword.requirement1')}</li>
                  <li>{t('resetPassword.requirement2')}</li>
                  <li>{t('resetPassword.requirement3')}</li>
                </ul>
              </div>
            </div>

            <Button type="submit" loading={isLoading} disabled={!token} className="w-full" size="lg">
              {t('resetPassword.submitButton')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
