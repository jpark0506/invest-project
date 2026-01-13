import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/shared/api';
import { useUserStore } from '@/entities/user/model';
import { userApi } from '@/entities/user/api';
import { authApi } from '@/features/auth/login-by-email/model';

export function AuthCallbackPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    const token = searchParams.get('token');
    const provider = searchParams.get('provider');
    const accessToken = searchParams.get('accessToken');
    const errorParam = searchParams.get('error');

    // Handle OAuth errors
    if (errorParam) {
      setError(t('auth.loginFailed'));
      return;
    }

    // Handle Kakao OAuth callback
    if (provider === 'kakao' && accessToken) {
      handleKakaoCallback(accessToken);
      return;
    }

    // Handle magic link callback
    if (token) {
      handleMagicLinkCallback(token);
      return;
    }

    // No valid auth data
    setError(t('auth.loginFailed'));
  }, [searchParams, navigate, t, setUser]);

  const handleKakaoCallback = async (accessToken: string) => {
    try {
      // Set access token first (refresh cookie was already set by backend redirect)
      apiClient.setAccessToken(accessToken);

      // Fetch user info
      const response = await userApi.getMe();

      // Set user in store
      setUser(response.user);

      // Redirect based on onboarding status
      if (response.user.onboardingCompletedAt) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    } catch {
      setError(t('auth.loginFailed'));
    }
  };

  const handleMagicLinkCallback = async (token: string) => {
    try {
      const response = await authApi.verify(token);

      // Set access token in API client
      apiClient.setAccessToken(response.accessToken);

      // Set user in store
      setUser(response.user);

      // Redirect based on onboarding status
      if (response.user.onboardingCompletedAt) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    } catch {
      setError(t('auth.loginFailed'));
    }
  };

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
