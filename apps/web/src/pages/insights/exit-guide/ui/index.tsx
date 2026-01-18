import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Layout, Card, Button, toast } from '@/shared/ui';
import { useUserStore } from '@/entities/user/model';
import { insightsApi, type ExitGuideResult, type ExitGuideRequest } from '@/entities/insights/api';

type InvestmentStyle = 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';

export function ExitGuidePage() {
  const { t } = useTranslation();
  const user = useUserStore((state) => state.user);
  const [result, setResult] = useState<ExitGuideResult | null>(null);

  const [ticker, setTicker] = useState('AAPL');
  const [purchasePrice, setPurchasePrice] = useState('150000');
  const [currentPrice, setCurrentPrice] = useState('165000');
  const [quantity, setQuantity] = useState('10');

  const investmentStyle = user?.profile?.investmentStyle || 'BALANCED';

  const analyzeMutation = useMutation({
    mutationFn: insightsApi.generateExitGuide,
    onSuccess: (data) => {
      setResult(data.guide);
    },
    onError: () => {
      toast.error(t('common.error'));
    },
  });

  const handleAnalyze = () => {
    const request: ExitGuideRequest = {
      ticker,
      purchasePrice: parseInt(purchasePrice, 10),
      currentPrice: parseInt(currentPrice, 10),
      quantity: parseInt(quantity, 10),
      investmentStyle: investmentStyle as InvestmentStyle,
    };
    analyzeMutation.mutate(request);
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-success';
    if (change < 0) return 'text-error';
    return 'text-text-secondary';
  };

  return (
    <Layout showBackButton title={t('insights.exitGuide.title')}>
      <div className="space-y-6">
        {/* Input Form */}
        <Card>
          <h3 className="font-semibold text-text-primary mb-4">종목 정보 입력</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">종목 코드</label>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="w-full p-3 rounded-xl border border-border focus:border-primary focus:outline-none"
                placeholder="AAPL"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-text-secondary mb-2">매수가</label>
                <input
                  type="text"
                  value={parseInt(purchasePrice, 10).toLocaleString()}
                  onChange={(e) => setPurchasePrice(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full p-3 rounded-xl border border-border focus:border-primary focus:outline-none"
                  placeholder="150,000"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">현재가</label>
                <input
                  type="text"
                  value={parseInt(currentPrice, 10).toLocaleString()}
                  onChange={(e) => setCurrentPrice(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full p-3 rounded-xl border border-border focus:border-primary focus:outline-none"
                  placeholder="165,000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-2">보유 수량</label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full p-3 rounded-xl border border-border focus:border-primary focus:outline-none"
                placeholder="10"
              />
            </div>
          </div>
        </Card>

        <Button
          fullWidth
          onClick={handleAnalyze}
          loading={analyzeMutation.isPending}
        >
          {analyzeMutation.isPending ? t('insights.exitGuide.analyzing') : t('insights.exitGuide.analyze')}
        </Button>

        {/* Result */}
        {result && (
          <div className="space-y-4">
            {/* Current Status */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <h3 className="font-semibold text-text-primary mb-3">
                {t('insights.exitGuide.currentStatus')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-secondary mb-1">평가손익</p>
                  <p className={`text-lg font-bold ${getChangeColor(result.currentStatus.unrealizedPnL)}`}>
                    {result.currentStatus.unrealizedPnL >= 0 ? '+' : ''}{result.currentStatus.unrealizedPnL.toLocaleString()}원
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary mb-1">수익률</p>
                  <p className={`text-lg font-bold ${getChangeColor(result.currentStatus.percentChange)}`}>
                    {result.currentStatus.percentChange >= 0 ? '+' : ''}{(result.currentStatus.percentChange * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-text-primary">
                {result.currentStatus.recommendation}
              </p>
            </Card>

            {/* Take Profit Levels */}
            <Card>
              <h3 className="font-semibold text-success mb-3">
                {t('insights.exitGuide.takeProfit')}
              </h3>
              <div className="space-y-3">
                {result.takeProfitLevels.map((level) => (
                  <div key={level.level} className="flex items-center justify-between p-3 bg-success/5 rounded-lg">
                    <div>
                      <p className="font-medium text-text-primary">
                        {level.price.toLocaleString()}원
                        <span className="ml-2 text-success text-sm">+{(level.percentGain * 100).toFixed(1)}%</span>
                      </p>
                      <p className="text-xs text-text-secondary">{level.suggestedAction}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-success font-medium">+{level.potentialProfit.toLocaleString()}원</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Stop Loss Levels */}
            <Card>
              <h3 className="font-semibold text-error mb-3">
                {t('insights.exitGuide.stopLoss')}
              </h3>
              <div className="space-y-3">
                {result.stopLossLevels.map((level) => (
                  <div key={level.level} className="flex items-center justify-between p-3 bg-error/5 rounded-lg">
                    <div>
                      <p className="font-medium text-text-primary">
                        {level.price.toLocaleString()}원
                        <span className="ml-2 text-error text-sm">{(level.percentLoss * 100).toFixed(1)}%</span>
                      </p>
                      <p className="text-xs text-text-secondary">{level.suggestedAction}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-error font-medium">{level.potentialLoss.toLocaleString()}원</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Strategy */}
            <Card>
              <h3 className="font-semibold text-text-primary mb-2">
                {t('insights.exitGuide.strategy')}
              </h3>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {result.strategy}
              </p>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
