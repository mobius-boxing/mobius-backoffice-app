import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../validation/schemas/auth';
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
    <div className="gd-auth">
      <div className="gd-auth__inner enter-up">
        <div className="gd-auth__mark">M</div>
        <span className="gd-auth__eyebrow">Mobius Backoffice</span>
        <h1 className="gd-auth__title">{t('login.title')}</h1>
        <p className="gd-auth__sub">{t('login.subtitle')}</p>

        <div className="gd-auth__card">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="gd-alert gd-alert-danger">
                <p>{error}</p>
              </div>
            )}

            <Input
              {...register('email')}
              type="email"
              label={t('login.email')}
              placeholder={t('login.emailPlaceholder')}
              error={errors.email?.message as string}
              autoComplete="email"
            />

            <Input
              {...register('password')}
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
                className="gd-link"
              >
                {t('login.forgotPassword')}
              </button>
            </div>

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              {t('login.signIn')}
            </Button>
          </form>
        </div>

        <div className="gd-auth__foot">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
};

export default Login;
