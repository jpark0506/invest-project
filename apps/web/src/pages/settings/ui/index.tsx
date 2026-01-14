import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { Execution, ExecutionItemRecord } from '@invest-assist/core';
import { Layout, toast, CardSkeleton, LoadingWrapper, ConfirmModal, Button, BottomSheet, Card } from '@/shared/ui';
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
  const [previewExecution, setPreviewExecution] = useState<Execution | null>(null);

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
          <Button
            fullWidth
            loading={triggerScheduler.isPending}
            onClick={() =>
              triggerScheduler.mutate(
                { dryRun },
                {
                  onSuccess: (response) => {
                    if (response.ok && response.execution) {
                      if (dryRun) {
                        // 테스트 모드: 미리보기 열기
                        setPreviewExecution(response.execution);
                      } else {
                        // 실제 모드: 성공 메시지 표시
                        toast.success(response.message);
                        queryClient.invalidateQueries({ queryKey: ['executions'] });
                      }
                    } else {
                      toast.error(response.message);
                    }
                  },
                  onError: (error) => {
                    toast.error(error.message || t('common.error'));
                  },
                }
              )
            }
          >
            {t('settings.scheduler.trigger')}
          </Button>
        </div>
      </section>

      {/* Account Deletion */}
      <section className="mb-8">
        <h3 className="section-title">{t('settings.account.title')}</h3>
        <div className="card p-4 space-y-4">
          <p className="text-sm text-text-secondary">
            {t('settings.account.description')}
          </p>
          <Button
            variant="danger"
            size="md"
            onClick={() => setShowDeleteConfirm(true)}
          >
            {t('settings.account.delete')}
          </Button>
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

      {/* Preview BottomSheet */}
      <BottomSheet
        isOpen={!!previewExecution}
        onClose={() => setPreviewExecution(null)}
        title={t('settings.scheduler.previewTitle')}
      >
        {previewExecution && (
          <div className="px-5 pb-5">
            {/* Summary */}
            <Card className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-text-secondary text-sm">
                  {t('execution.cycleBudget')}
                </span>
                <span className="text-text-primary font-semibold">
                  {previewExecution.cycleBudget.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">
                  {previewExecution.yearMonth} {previewExecution.cycleIndex}차
                </span>
                <span className="text-xs text-text-tertiary">
                  {previewExecution.asOfDate.split('T')[0]}
                </span>
              </div>
            </Card>

            {/* Order Table */}
            <Card padding="sm" className="mb-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-text-secondary text-xs border-b border-border">
                    <th className="text-left py-3 px-2">{t('execution.table.ticker')}</th>
                    <th className="text-right py-3 px-2">{t('execution.table.price')}</th>
                    <th className="text-right py-3 px-2">{t('execution.table.shares')}</th>
                    <th className="text-right py-3 px-2">{t('execution.table.estCost')}</th>
                  </tr>
                </thead>
                <tbody>
                  {previewExecution.items.map((item: ExecutionItemRecord) => (
                    <tr key={item.ticker} className="border-b border-border-light">
                      <td className="py-3 px-2">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-text-tertiary">{item.ticker}</div>
                      </td>
                      <td className="text-right py-3 px-2">
                        {item.price.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-2 font-medium">{item.shares}</td>
                      <td className="text-right py-3 px-2">
                        {item.estCost.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-background">
                    <td colSpan={3} className="py-3 px-2 font-medium">
                      {t('execution.totalEstCost')}
                    </td>
                    <td className="text-right py-3 px-2 font-semibold">
                      {previewExecution.items.reduce((sum, item) => sum + item.estCost, 0).toLocaleString()}원
                    </td>
                  </tr>
                  <tr className="bg-background">
                    <td colSpan={3} className="py-3 px-2 text-text-secondary">
                      {t('execution.totalCarryOut')}
                    </td>
                    <td className="text-right py-3 px-2 text-text-secondary">
                      {previewExecution.items.reduce((sum, item) => sum + item.carryOut, 0).toLocaleString()}원
                    </td>
                  </tr>
                </tfoot>
              </table>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setPreviewExecution(null)}
              >
                {t('settings.scheduler.close')}
              </Button>
              <Button
                fullWidth
                loading={triggerScheduler.isPending}
                onClick={() => {
                  setDryRun(false);
                  triggerScheduler.mutate(
                    { dryRun: false },
                    {
                      onSuccess: (response) => {
                        if (response.ok) {
                          toast.success(response.message);
                          queryClient.invalidateQueries({ queryKey: ['executions'] });
                          setPreviewExecution(null);
                        } else {
                          toast.error(response.message);
                        }
                      },
                      onError: (error) => {
                        toast.error(error.message || t('common.error'));
                      },
                    }
                  );
                }}
              >
                {t('settings.scheduler.saveAndSend')}
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </Layout>
  );
}
