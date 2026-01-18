import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout, toast, CardSkeleton, QueryErrorBoundary } from '@/shared/ui';
import { usePlan, useUpdatePlan } from '@/entities/plan/model';
import { useUserStore } from '@/entities/user/model';
import { EditPlanForm } from '@/features/plan/edit-plan/ui';

function PlanContent() {
  const { t } = useTranslation();
  const user = useUserStore((state) => state.user);
  const { data: planData } = usePlan();
  const updatePlan = useUpdatePlan();

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
    <EditPlanForm
      plan={planData?.plan ?? null}
      isLoading={false}
      onSubmit={handlePlanSubmit}
      isPending={updatePlan.isPending}
      userEmail={user?.email}
    />
  );
}

export function SettingsPlanPage() {
  const { t } = useTranslation();

  return (
    <Layout hideBottomNav showBackButton title={t('settings.plan.title')}>
      <QueryErrorBoundary>
        <Suspense fallback={<CardSkeleton />}>
          <PlanContent />
        </Suspense>
      </QueryErrorBoundary>
    </Layout>
  );
}
