import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Layout, Card, Button, toast } from '@/shared/ui';
import { insightsApi, type RebalancingResult, type RebalancingRequest } from '@/entities/insights/api';

export function RebalancingPage() {
  const { t } = useTranslation();
  const [result, setResult] = useState<RebalancingResult | null>(null);

  const [totalValue] = useState(10000000);
  const [targetAllocations] = useState([
    { assetClass: 'US Stocks', targetWeight: 0.4 },
    { assetClass: 'Korean Stocks', targetWeight: 0.3 },
    { assetClass: 'Bonds', targetWeight: 0.2 },
    { assetClass: 'Cash', targetWeight: 0.1 },
  ]);
  const [currentHoldings] = useState([
    { ticker: 'SPY', assetClass: 'US Stocks', value: 5000000, weight: 0.5 },
    { ticker: 'KODEX200', assetClass: 'Korean Stocks', value: 2000000, weight: 0.2 },
    { ticker: 'TLT', assetClass: 'Bonds', value: 2000000, weight: 0.2 },
    { ticker: 'CASH', assetClass: 'Cash', value: 1000000, weight: 0.1 },
  ]);

  const analyzeMutation = useMutation({
    mutationFn: insightsApi.getRebalancingAdvice,
    onSuccess: (data) => {
      setResult(data.advice);
    },
    onError: () => {
      toast.error(t('common.error'));
    },
  });

  const handleAnalyze = () => {
    const request: RebalancingRequest = {
      totalValue,
      targetAllocations,
      currentHoldings,
    };
    analyzeMutation.mutate(request);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY':
        return 'text-success bg-success/10';
      case 'SELL':
        return 'text-error bg-error/10';
      default:
        return 'text-text-secondary bg-text-secondary/10';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
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

  return (
    <Layout showBackButton title={t('insights.rebalancing.title')}>
      <div className="space-y-6">
        {/* Current Portfolio */}
        <Card>
          <h3 className="font-semibold text-text-primary mb-4">현재 포트폴리오</h3>
          <div className="space-y-3">
            {currentHoldings.map((holding, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-text-primary">{holding.ticker}</span>
                  <span className="text-text-secondary text-sm ml-2">({holding.assetClass})</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">{holding.value.toLocaleString()}원</p>
                  <p className="text-xs text-text-secondary">{(holding.weight * 100).toFixed(0)}%</p>
                </div>
              </div>
            ))}
            <div className="border-t border-border pt-3 flex justify-between font-semibold">
              <span>총 자산</span>
              <span className="text-primary">{totalValue.toLocaleString()}원</span>
            </div>
          </div>
        </Card>

        {/* Target Allocation */}
        <Card>
          <h3 className="font-semibold text-text-primary mb-4">목표 배분</h3>
          <div className="flex flex-wrap gap-2">
            {targetAllocations.map((target, index) => (
              <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                {target.assetClass}: {(target.targetWeight * 100).toFixed(0)}%
              </span>
            ))}
          </div>
        </Card>

        <Button
          fullWidth
          onClick={handleAnalyze}
          loading={analyzeMutation.isPending}
        >
          {analyzeMutation.isPending ? t('insights.rebalancing.analyzing') : t('insights.rebalancing.analyze')}
        </Button>

        {/* Result */}
        {result && (
          <div className="space-y-4">
            {/* Urgency */}
            <Card className="flex items-center justify-between">
              <span className="text-text-secondary">{t('insights.rebalancing.urgency')}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(result.urgency)}`}>
                {result.urgency}
              </span>
            </Card>

            {/* Actions */}
            <Card>
              <h3 className="font-semibold text-text-primary mb-4">
                {t('insights.rebalancing.actions')}
              </h3>
              <div className="space-y-3">
                {result.actions.map((action, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(action.action)}`}>
                        {t(`insights.rebalancing.${action.action.toLowerCase()}`)}
                      </span>
                      <span className="font-medium">{action.ticker}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{action.amount.toLocaleString()}원</p>
                      <p className="text-xs text-text-secondary">{action.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Summary */}
            <Card>
              <h3 className="font-semibold text-text-primary mb-4">요약</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">총 매수 금액</span>
                  <span className="text-success font-medium">+{result.summary.totalBuyAmount.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">총 매도 금액</span>
                  <span className="text-error font-medium">-{result.summary.totalSellAmount.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-text-secondary">순 현금 흐름</span>
                  <span className="font-medium">
                    {result.summary.netCashFlow >= 0 ? '+' : ''}{result.summary.netCashFlow.toLocaleString()}원
                  </span>
                </div>
              </div>
            </Card>

            {/* Explanation */}
            <Card>
              <h3 className="font-semibold text-text-primary mb-2">전략 설명</h3>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {result.explanation}
              </p>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
