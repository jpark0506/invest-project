import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/shared/api';
import { useUserStore } from '@/entities/user/model';
import { authApi } from '@/features/auth/login-by-email/model';

export function AuthCallbackPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError(t('auth.loginFailed'));
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await authApi.verify(token);

        // Set access token in API client
        apiClient.setAccessToken(response.accessToken);

        // Set user in store
        setUser({
          id: response.user.id,
          email: response.user.email,
          locale: response.user.locale,
        });

        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setError(t('auth.loginFailed'));
      }
    };

    verifyToken();
  }, [searchParams, navigate, t, setUser]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-error text-6xl mb-4">✕</div>
          <p className="text-text-primary font-medium">{error}</p>
          <button
            className="mt-4 text-primary underline"
            onClick={() => navigate('/login')}
          >
            {t('auth.login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-text-secondary">{t('auth.verifying')}</p>
      </div>
    </div>
  );
}
