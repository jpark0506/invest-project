import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Layout, toast, CardSkeleton, LoadingWrapper, ConfirmModal } from '@/shared/ui';
import { usePortfolio, useUpdatePortfolio } from '@/entities/portfolio/model';
import { usePlan, useUpdatePlan } from '@/entities/plan/model';
import { useUserStore } from '@/entities/user/model';
import { userApi } from '@/entities/user/api';
import { EditPortfolioForm } from '@/features/portfolio/edit-portfolio/ui';
import { EditPlanForm } from '@/features/plan/edit-plan/ui';
import { useTriggerScheduler } from '@/features/scheduler/trigger-scheduler/model';

export function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const clearUser = useUserStore((state) => state.clearUser);
  const queryClient = useQueryClient();
  const [dryRun, setDryRun] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        <LoadingWrapper isLoading={isPortfolioLoading} skeleton={<CardSkeleton />}>
          <EditPortfolioForm
            portfolio={portfolioData?.portfolio ?? null}
            isLoading={false}
            onSubmit={handlePortfolioSubmit}
            isPending={updatePortfolio.isPending}
          />
        </LoadingWrapper>
      </section>

      {/* Plan Settings */}
      <section className="mb-8">
        <h3 className="section-title">{t('settings.plan.title')}</h3>
        <LoadingWrapper isLoading={isPlanLoading} skeleton={<CardSkeleton />}>
          <EditPlanForm
            plan={planData?.plan ?? null}
            isLoading={false}
            onSubmit={handlePlanSubmit}
            isPending={updatePlan.isPending}
            userEmail={user?.email}
          />
        </LoadingWrapper>
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

      {/* Account Deletion */}
      <section className="mb-8">
        <h3 className="section-title">{t('settings.account.title')}</h3>
        <div className="card p-4 space-y-4">
          <p className="text-sm text-text-secondary">
            {t('settings.account.description')}
          </p>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-error text-sm font-medium hover:underline"
          >
            {t('settings.account.delete')}
          </button>
        </div>
      </section>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          setIsDeleting(true);
          try {
            await userApi.deleteAccount();
            clearUser();
            navigate('/login');
            toast.success(t('settings.account.deleted'));
          } catch {
            toast.error(t('common.error'));
          } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
          }
        }}
        title={t('settings.account.delete')}
        message={t('settings.account.confirmMessage')}
        confirmText={t('settings.account.confirmDelete')}
        cancelText={t('common.cancel')}
        isLoading={isDeleting}
        variant="danger"
      />
    </Layout>
  );
}
