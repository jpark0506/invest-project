import { useTranslation } from 'react-i18next';
import { Layout, toast } from '@/shared/ui';
import { usePortfolio, useUpdatePortfolio } from '@/entities/portfolio/model';
import { usePlan, useUpdatePlan } from '@/entities/plan/model';
import { EditPortfolioForm } from '@/features/portfolio/edit-portfolio/ui';
import { EditPlanForm } from '@/features/plan/edit-plan/ui';

export function SettingsPage() {
  const { t } = useTranslation();

  const { data: portfolioData, isLoading: isPortfolioLoading } = usePortfolio();
  const { data: planData, isLoading: isPlanLoading } = usePlan();

  const updatePortfolio = useUpdatePortfolio();
  const updatePlan = useUpdatePlan();

  const handlePortfolioSubmit = (data: Parameters<typeof updatePortfolio.mutate>[0]) => {
    updatePortfolio.mutate(data, {
      onSuccess: () => {
        toast.success(t('settings.portfolio.title') + ' ' + t('common.save') + ' ✓');
      },
      onError: () => {
        toast.error(t('common.error'));
      },
    });
  };

  const handlePlanSubmit = (data: Parameters<typeof updatePlan.mutate>[0]) => {
    updatePlan.mutate(data, {
      onSuccess: () => {
        toast.success(t('settings.plan.title') + ' ' + t('common.save') + ' ✓');
      },
      onError: () => {
        toast.error(t('common.error'));
      },
    });
  };

  return (
    <Layout>
      <h2 className="text-xl font-bold text-text-primary mb-6">
        {t('settings.title')}
      </h2>

      {/* Portfolio Settings */}
      <section className="mb-8">
        <h3 className="section-title">{t('settings.portfolio.title')}</h3>
        <EditPortfolioForm
          portfolio={portfolioData?.portfolio ?? null}
          isLoading={isPortfolioLoading}
          onSubmit={handlePortfolioSubmit}
          isPending={updatePortfolio.isPending}
        />
      </section>

      {/* Plan Settings */}
      <section className="mb-8">
        <h3 className="section-title">{t('settings.plan.title')}</h3>
        <EditPlanForm
          plan={planData?.plan ?? null}
          isLoading={isPlanLoading}
          onSubmit={handlePlanSubmit}
          isPending={updatePlan.isPending}
        />
      </section>
    </Layout>
  );
}
