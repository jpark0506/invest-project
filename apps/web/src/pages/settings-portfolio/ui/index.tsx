import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout, toast, CardSkeleton, QueryErrorBoundary } from '@/shared/ui';
import { usePortfolio, useUpdatePortfolio } from '@/entities/portfolio/model';
import { EditPortfolioForm } from '@/features/portfolio/edit-portfolio/ui';

function PortfolioContent() {
  const { t } = useTranslation();
  const { data: portfolioData } = usePortfolio();
  const updatePortfolio = useUpdatePortfolio();

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

  return (
    <EditPortfolioForm
      portfolio={portfolioData?.portfolio ?? null}
      isLoading={false}
      onSubmit={handlePortfolioSubmit}
      isPending={updatePortfolio.isPending}
    />
  );
}

export function SettingsPortfolioPage() {
  const { t } = useTranslation();

  return (
    <Layout hideBottomNav showBackButton title={t('settings.portfolio.title')}>
      <QueryErrorBoundary>
        <Suspense fallback={<CardSkeleton />}>
          <PortfolioContent />
        </Suspense>
      </QueryErrorBoundary>
    </Layout>
  );
}
