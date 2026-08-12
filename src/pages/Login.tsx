import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';

interface LoginForm {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError('');

    try {
      await login({ email: data.email, password: data.password });
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      // Prefer the API's message (e.g. "Invalid credentials", "Account is inactive"), then a
      // thrown client-side message (e.g. the admin-only guard), then a generic fallback.
      setError(err.response?.data?.message || err.message || t('login.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 shadow-sm">
            <span className="text-xl font-bold text-white">M</span>
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-secondary-900">
            {t('login.title')}
          </h2>
          <p className="mt-1.5 text-sm text-secondary-500">
            {t('login.subtitle')}
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-2xl border border-secondary-200 sm:px-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Input
              {...register('email', {
                required: t('login.emailRequired'),
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: t('login.emailInvalid'),
                },
              })}
              type="email"
              label={t('login.email')}
              placeholder={t('login.emailPlaceholder')}
              error={errors.email?.message as string}
              autoComplete="email"
            />

            <Input
              {...register('password', {
                required: t('login.passwordRequired'),
                minLength: {
                  value: 6,
                  message: t('login.passwordMinLength'),
                },
              })}
              type="password"
              label={t('login.password')}
              placeholder={t('login.passwordPlaceholder')}
              error={errors.password?.message as string}
              autoComplete="current-password"
            />

            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {t('login.forgotPassword')}
              </button>
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              {t('login.signIn')}
            </Button>
          </form>

          <div className="mt-6 flex justify-center">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
