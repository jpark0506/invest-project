import { useTranslation } from 'react-i18next';
import { Layout, Card, Input, Button } from '@/shared/ui';

export function SettingsPage() {
  const { t } = useTranslation();

  return (
    <Layout>
      <h2 className="text-xl font-bold text-text-primary mb-6">
        {t('settings.title')}
      </h2>

      {/* Portfolio Settings */}
      <section className="mb-8">
        <h3 className="section-title">{t('settings.portfolio.title')}</h3>
        <Card>
          <div className="space-y-4">
            <Input
              label={t('settings.portfolio.name')}
              placeholder="My Portfolio"
              defaultValue="My Portfolio"
            />

            <div>
              <label className="block text-text-secondary text-xs font-medium mb-3">
                {t('settings.portfolio.holdings')}
              </label>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-2 px-3 bg-background rounded">
                  <span>KODEX 200 (069500)</span>
                  <span className="font-medium">50%</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-background rounded">
                  <span>KODEX 미국 S&P500 TR (379800)</span>
                  <span className="font-medium">30%</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-background rounded">
                  <span>TIGER 미국나스닥100 (439870)</span>
                  <span className="font-medium">20%</span>
                </div>
              </div>
              <Button variant="secondary" size="md" className="mt-3">
                {t('settings.portfolio.addHolding')}
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Plan Settings */}
      <section className="mb-8">
        <h3 className="section-title">{t('settings.plan.title')}</h3>
        <Card>
          <div className="space-y-4">
            <Input
              label={t('settings.plan.monthlyBudget')}
              type="number"
              placeholder="1000000"
              defaultValue="1000000"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('settings.plan.cycleCount')}
                type="number"
                min={2}
                max={3}
                defaultValue="2"
              />
              <Input
                label={t('settings.plan.scheduleDays')}
                placeholder="5, 19"
                defaultValue="5, 19"
              />
            </div>

            <Input
              label={t('settings.plan.email')}
              type="email"
              placeholder="your@email.com"
            />
          </div>
        </Card>
      </section>

      {/* Save Button */}
      <Button fullWidth>{t('common.save')}</Button>
    </Layout>
  );
}
