import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Input, Button } from '@/shared/ui';
import { useHoldingsForm, HoldingFormData } from '../model';
import type { Portfolio, Market } from '@invest-assist/core';

interface EditPortfolioFormProps {
  portfolio: Portfolio | null;
  isLoading: boolean;
  onSubmit: (data: { name: string; holdings: Array<{ ticker: string; name: string; market: Market; targetWeight: number }> }) => void;
  isPending: boolean;
}

export function EditPortfolioForm({ portfolio, isLoading, onSubmit, isPending }: EditPortfolioFormProps) {
  const { t } = useTranslation();
  const {
    holdings,
    addHolding,
    removeHolding,
    updateHolding,
    resetHoldings,
    totalWeight,
    toPortfolioHoldings,
    isValid,
  } = useHoldingsForm([]);

  useEffect(() => {
    if (portfolio?.holdings) {
      resetHoldings(
        portfolio.holdings.map((h) => ({
          ...h,
          targetWeight: h.targetWeight * 100, // convert to percentage
        }))
      );
    }
  }, [portfolio, resetHoldings]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('portfolioName') as string;
    
    onSubmit({
      name: name || portfolio?.name || 'My Portfolio',
      holdings: toPortfolioHoldings(),
    });
  };

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <div className="space-y-6">
          <Input
            name="portfolioName"
            label={t('settings.portfolio.name')}
            placeholder="My Portfolio"
            defaultValue={portfolio?.name || 'My Portfolio'}
          />

          <div>
            <label className="block text-text-secondary text-xs font-medium mb-3">
              {t('settings.portfolio.holdings')}
            </label>

            <div className="space-y-3">
              {holdings.map((holding) => (
                <HoldingRow
                  key={holding.id}
                  holding={holding}
                  onUpdate={updateHolding}
                  onRemove={removeHolding}
                />
              ))}
            </div>

            <div className="flex items-center justify-between mt-4">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={addHolding}
              >
                {t('settings.portfolio.addHolding')}
              </Button>

              <div className="text-sm">
                <span className="text-text-secondary">{t('settings.portfolio.weightSum')}: </span>
                <span
                  className={`font-semibold ${
                    Math.abs(totalWeight - 100) < 0.01
                      ? 'text-success'
                      : 'text-error'
                  }`}
                >
                  {totalWeight.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            disabled={!isValid || isPending}
          >
            {isPending ? t('common.loading') : t('common.save')}
          </Button>
        </div>
      </Card>
    </form>
  );
}

interface HoldingRowProps {
  holding: HoldingFormData;
  onUpdate: (id: string, field: keyof HoldingFormData, value: string | number) => void;
  onRemove: (id: string) => void;
}

function HoldingRow({ holding, onUpdate, onRemove }: HoldingRowProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-12 gap-2 items-center p-3 bg-background rounded-lg">
      <div className="col-span-3">
        <Input
          placeholder={t('settings.portfolio.ticker')}
          value={holding.ticker}
          onChange={(e) => onUpdate(holding.id, 'ticker', e.target.value)}
          className="text-sm"
        />
      </div>
      <div className="col-span-4">
        <Input
          placeholder={t('settings.portfolio.holdingName')}
          value={holding.name}
          onChange={(e) => onUpdate(holding.id, 'name', e.target.value)}
          className="text-sm"
        />
      </div>
      <div className="col-span-2">
        <select
          value={holding.market}
          onChange={(e) => onUpdate(holding.id, 'market', e.target.value)}
          className="input text-sm"
        >
          <option value="KRX">KRX</option>
          <option value="NYSE">NYSE</option>
          <option value="NASDAQ">NASDAQ</option>
        </select>
      </div>
      <div className="col-span-2">
        <Input
          type="number"
          placeholder={t('settings.portfolio.weight')}
          value={holding.targetWeight || ''}
          onChange={(e) =>
            onUpdate(holding.id, 'targetWeight', parseFloat(e.target.value) || 0)
          }
          className="text-sm text-right"
          min={0}
          max={100}
          step={0.1}
        />
      </div>
      <div className="col-span-1 flex justify-center">
        <button
          type="button"
          onClick={() => onRemove(holding.id)}
          className="p-1.5 text-text-secondary hover:text-error transition-colors"
          aria-label="Remove holding"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
