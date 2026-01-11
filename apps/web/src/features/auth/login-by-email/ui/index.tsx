import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Card } from '@/shared/ui';

export function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    setLoading(true);

    // TODO: Call API
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSent(true);
    setLoading(false);
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
            required
          />

          <Button type="submit" fullWidth loading={loading}>
            {t('auth.sendMagicLink')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
