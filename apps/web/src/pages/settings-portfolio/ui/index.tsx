import { useTranslation } from 'react-i18next';
import { Layout, toast, CardSkeleton, LoadingWrapper } from '@/shared/ui';
import { usePortfolio, useUpdatePortfolio } from '@/entities/portfolio/model';
import { EditPortfolioForm } from '@/features/portfolio/edit-portfolio/ui';

export function SettingsPortfolioPage() {
  const { t } = useTranslation();

  const { data: portfolioData, isLoading: isPortfolioLoading } = usePortfolio();
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
    <Layout hideBottomNav showBackButton title={t('settings.portfolio.title')}>
      <LoadingWrapper isLoading={isPortfolioLoading} skeleton={<CardSkeleton />}>
        <EditPortfolioForm
          portfolio={portfolioData?.portfolio ?? null}
          isLoading={false}
          onSubmit={handlePortfolioSubmit}
          isPending={updatePortfolio.isPending}
        />
      </LoadingWrapper>
    </Layout>
  );
}
