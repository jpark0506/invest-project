import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Layout, Card, Button, toast } from '@/shared/ui';
import { insightsApi, type RiskSimulationResult, type RiskSimulationRequest } from '@/entities/insights/api';

export function RiskSimulatorPage() {
  const { t } = useTranslation();
  const [result, setResult] = useState<RiskSimulationResult | null>(null);
  const [portfolioValue, setPortfolioValue] = useState('5000000');
  const [holdings, setHoldings] = useState([
    { ticker: 'AAPL', value: 2000000, weight: 0.4 },
    { ticker: 'TSLA', value: 1500000, weight: 0.3 },
    { ticker: 'BTC', value: 1500000, weight: 0.3 },
  ]);

  const simulateMutation = useMutation({
    mutationFn: insightsApi.simulateRisk,
    onSuccess: (data) => {
      setResult(data.simulation);
    },
    onError: () => {
      toast.error(t('common.error'));
    },
  });

  const handleSimulate = () => {
    const request: RiskSimulationRequest = {
      currentPortfolioValue: parseInt(portfolioValue, 10),
      holdings,
    };
    simulateMutation.mutate(request);
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-success';
    if (change < 0) return 'text-error';
    return 'text-text-secondary';
  };

  return (
    <Layout showBackButton title={t('insights.riskSimulator.title')}>
      <div className="space-y-6">
        {/* Input Form */}
        <Card>
          <h3 className="font-semibold text-text-primary mb-4">포트폴리오 정보</h3>

          <div className="mb-4">
            <label className="block text-sm text-text-secondary mb-2">총 포트폴리오 가치</label>
            <input
              type="text"
              value={parseInt(portfolioValue, 10).toLocaleString()}
              onChange={(e) => setPortfolioValue(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full p-3 rounded-xl border border-border focus:border-primary focus:outline-none"
              placeholder="5,000,000"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm text-text-secondary">보유 종목</label>
            {holdings.map((holding, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={holding.ticker}
                  onChange={(e) => {
                    const newHoldings = [...holdings];
                    newHoldings[index].ticker = e.target.value;
                    setHoldings(newHoldings);
                  }}
                  className="flex-1 p-2 rounded-lg border border-border focus:border-primary focus:outline-none text-sm"
                  placeholder="종목코드"
                />
                <input
                  type="text"
                  value={holding.value.toLocaleString()}
                  onChange={(e) => {
                    const value = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
                    const newHoldings = [...holdings];
                    newHoldings[index].value = value;
                    newHoldings[index].weight = value / parseInt(portfolioValue, 10);
                    setHoldings(newHoldings);
                  }}
                  className="w-28 p-2 rounded-lg border border-border focus:border-primary focus:outline-none text-sm text-right"
                  placeholder="금액"
                />
                <span className="flex items-center text-sm text-text-secondary w-12">
                  {(holding.weight * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Button
          fullWidth
          onClick={handleSimulate}
          loading={simulateMutation.isPending}
        >
          {simulateMutation.isPending ? t('insights.riskSimulator.simulating') : t('insights.riskSimulator.simulate')}
        </Button>

        {/* Result */}
        {result && (
          <div className="space-y-4">
            <Card>
              <h3 className="font-semibold text-text-primary mb-4">
                {t('insights.riskSimulator.scenarios')}
              </h3>
              <div className="space-y-4">
                {result.scenarios.map((scenario, index) => (
                  <div key={index} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{scenario.name}</span>
                      <span className={`font-bold ${getChangeColor(scenario.percentChange)}`}>
                        {scenario.percentChange >= 0 ? '+' : ''}{(scenario.percentChange * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mb-2">{scenario.description}</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">{t('insights.riskSimulator.resultValue')}</span>
                      <span className={`font-medium ${getChangeColor(scenario.percentChange)}`}>
                        {scenario.resultingValue.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-text-primary mb-2">리스크 평가</h3>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {result.riskAssessment}
              </p>
            </Card>

            {result.recommendations.length > 0 && (
              <Card>
                <h3 className="font-semibold text-text-primary mb-2">추천 사항</h3>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary">•</span>
                      <span className="text-text-secondary">{rec}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
