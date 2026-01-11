import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function AuthCallbackPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError(t('auth.loginFailed'));
      return;
    }

    // TODO: Call verify API
    // For now, simulate success
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  }, [searchParams, navigate, t]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-error text-6xl mb-4">✕</div>
          <p className="text-text-primary font-medium">{error}</p>
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
