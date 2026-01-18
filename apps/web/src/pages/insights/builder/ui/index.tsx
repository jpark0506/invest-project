import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Layout, Card, Button, toast } from '@/shared/ui';
import { useUserStore } from '@/entities/user/model';
import { insightsApi, type PortfolioRecommendation, type PortfolioBuilderRequest } from '@/entities/insights/api';

export function PortfolioBuilderPage() {
  const { t } = useTranslation();
  const user = useUserStore((state) => state.user);
  const [result, setResult] = useState<PortfolioRecommendation | null>(null);

  const profile = user?.profile;

  const generateMutation = useMutation({
    mutationFn: insightsApi.generatePortfolio,
    onSuccess: (data) => {
      setResult(data.recommendation);
    },
    onError: () => {
      toast.error(t('common.error'));
    },
  });

  const handleGenerate = () => {
    if (!profile?.investmentStyle || !profile?.investmentPeriod || !profile?.investmentAmount || !profile?.interestedMarkets?.length) {
      toast.error('온보딩에서 투자 정보를 먼저 설정해주세요.');
      return;
    }

    const request: PortfolioBuilderRequest = {
      investmentStyle: profile.investmentStyle,
      investmentPeriod: profile.investmentPeriod,
      investmentAmount: profile.investmentAmount,
      interestedMarkets: profile.interestedMarkets,
    };

    generateMutation.mutate(request);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW':
        return 'text-success bg-success/10';
      case 'MEDIUM':
        return 'text-warning bg-warning/10';
      case 'HIGH':
        return 'text-error bg-error/10';
      default:
        return 'text-text-secondary bg-text-secondary/10';
    }
  };

  const hasProfile = profile?.investmentStyle && profile?.investmentPeriod && profile?.investmentAmount && profile?.interestedMarkets?.length;

  return (
    <Layout showBackButton title={t('insights.portfolioBuilder.title')}>
      <div className="space-y-6">
        {/* Profile Summary */}
        <Card>
          <h3 className="font-semibold text-text-primary mb-4">나의 투자 프로필</h3>
          {hasProfile ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">투자 성향</span>
                <span className="font-medium">{t(`onboarding.profile.styles.${profile.investmentStyle}.title`)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">투자 기간</span>
                <span className="font-medium">{t(`onboarding.period.options.${profile.investmentPeriod}.title`)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">투자금</span>
                <span className="font-medium">{profile.investmentAmount?.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">관심 시장</span>
                <span className="font-medium">
                  {profile.interestedMarkets?.map((m) => t(`onboarding.markets.options.${m}.title`)).join(', ')}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-text-secondary text-sm">
              온보딩에서 투자 정보를 먼저 설정해주세요.
            </p>
          )}
        </Card>

        {/* Generate Button */}
        <Button
          fullWidth
          onClick={handleGenerate}
          loading={generateMutation.isPending}
          disabled={!hasProfile}
        >
          {generateMutation.isPending ? t('insights.portfolioBuilder.generating') : t('insights.portfolioBuilder.generate')}
        </Button>

        {/* Result */}
        {result && (
          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-text-primary">
                  {t('insights.portfolioBuilder.allocation')}
                </h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(result.riskLevel)}`}>
                  {t('insights.portfolioBuilder.riskLevel')}: {result.riskLevel}
                </span>
              </div>

              <div className="space-y-3">
                {result.allocations.map((allocation, index) => (
                  <div key={index} className="border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-text-primary">{allocation.assetClass}</span>
                      <span className="text-primary font-bold">{(allocation.weight * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-xs text-text-secondary">{allocation.description}</p>
                    {allocation.suggestedTickers && allocation.suggestedTickers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {allocation.suggestedTickers.map((ticker) => (
                          <span key={ticker} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                            {ticker}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-text-primary mb-2">
                {t('insights.portfolioBuilder.expectedReturn')}
              </h3>
              <p className="text-primary text-lg font-bold">
                {(result.expectedReturn.min * 100).toFixed(1)}% ~ {(result.expectedReturn.max * 100).toFixed(1)}%
              </p>
            </Card>

            <Card>
              <h3 className="font-semibold text-text-primary mb-2">
                {t('insights.portfolioBuilder.rationale')}
              </h3>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {result.rationale}
              </p>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
