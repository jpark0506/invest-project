import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Layout, toast } from '@/shared/ui';
import { usePortfolio, useUpdatePortfolio } from '@/entities/portfolio/model';
import { usePlan, useUpdatePlan } from '@/entities/plan/model';
import { useUserStore } from '@/entities/user/model';
import { EditPortfolioForm } from '@/features/portfolio/edit-portfolio/ui';
import { EditPlanForm } from '@/features/plan/edit-plan/ui';
import { useTriggerScheduler } from '@/features/scheduler/trigger-scheduler/model';

export function SettingsPage() {
  const { t } = useTranslation();
  const user = useUserStore((state) => state.user);
  const queryClient = useQueryClient();
  const [dryRun, setDryRun] = useState(true);

  const { data: portfolioData, isLoading: isPortfolioLoading } = usePortfolio();
  const { data: planData, isLoading: isPlanLoading } = usePlan();

  const updatePortfolio = useUpdatePortfolio();
  const updatePlan = useUpdatePlan();
  const triggerScheduler = useTriggerScheduler();

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
          userEmail={user?.email}
        />
      </section>

      {/* Manual Scheduler Trigger - for testing */}
      <section className="mb-8">
        <h3 className="section-title">{t('settings.scheduler.title')}</h3>
        <div className="card p-4 space-y-4">
          <p className="text-sm text-text-secondary">
            {t('settings.scheduler.description')}
          </p>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dryRun"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="dryRun" className="text-sm text-text-secondary">
              {t('settings.scheduler.dryRun')}
            </label>
          </div>
          <button
            onClick={() =>
              triggerScheduler.mutate(
                { dryRun },
                {
                  onSuccess: () => {
                    toast.success(t('settings.scheduler.success'));
                    if (!dryRun) {
                      queryClient.invalidateQueries({ queryKey: ['executions'] });
                    }
                  },
                  onError: (error) => {
                    toast.error(error.message || t('common.error'));
                  },
                }
              )
            }
            disabled={triggerScheduler.isPending}
            className="btn-primary w-full"
          >
            {triggerScheduler.isPending
              ? t('common.loading')
              : t('settings.scheduler.trigger')}
          </button>
        </div>
      </section>
    </Layout>
  );
}
