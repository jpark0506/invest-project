import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Card } from '@/shared/ui';
import { config } from '@/shared/config';
import { authApi } from '../model';

export function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      await authApi.start(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleKakaoLogin = () => {
    // Redirect to backend Kakao OAuth endpoint
    window.location.href = `${config.apiBaseUrl}/auth/kakao`;
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">✉️</div>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            {t('auth.checkEmail')}
          </h2>
          <p className="text-text-secondary text-sm">
            {t('auth.magicLinkSent', { email })}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-text-primary text-center mb-8">
          Invest Assist
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label={t('auth.email')}
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error || undefined}
            required
          />

          <Button type="submit" fullWidth loading={loading}>
            {t('auth.sendMagicLink')}
          </Button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-border"></div>
          <span className="px-4 text-text-secondary text-sm">{t('auth.or')}</span>
          <div className="flex-1 border-t border-border"></div>
        </div>

        <button
          type="button"
          onClick={handleKakaoLogin}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-[#191919] transition-colors"
          style={{ backgroundColor: '#FEE500' }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9 0.5C4.02944 0.5 0 3.69167 0 7.63889C0 10.1278 1.55833 12.3139 3.93333 13.5972L2.93333 17.0417C2.85556 17.3028 3.15 17.5139 3.37778 17.3528L7.43889 14.6278C7.95556 14.7028 8.47222 14.7778 9 14.7778C13.9706 14.7778 18 11.5861 18 7.63889C18 3.69167 13.9706 0.5 9 0.5Z"
              fill="#191919"
            />
          </svg>
          {t('auth.kakaoLogin')}
        </button>
      </Card>
    </div>
  );
}
