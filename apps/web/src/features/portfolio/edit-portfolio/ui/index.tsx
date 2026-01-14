import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Input, Button, TickerSelectSheet } from '@/shared/ui';
import { useHoldingsForm, HoldingFormData } from '../model';
import type { Portfolio, Market } from '@invest-assist/core';
import type { TickerInfo } from '@/entities/ticker';

interface EditPortfolioFormProps {
  portfolio: Portfolio | null;
  isLoading: boolean;
  onSubmit: (data: { name: string; holdings: Array<{ ticker: string; name: string; market: Market; targetWeight: number }> }) => void;
  isPending: boolean;
}

export function EditPortfolioForm({ portfolio, isLoading, onSubmit, isPending }: EditPortfolioFormProps) {
  const { t } = useTranslation();
  const [tickerSheetOpen, setTickerSheetOpen] = useState(false);
  const [editingHoldingId, setEditingHoldingId] = useState<string | null>(null);

  const {
    holdings,
    addHolding,
    removeHolding,
    updateHolding,
    selectTicker,
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
          targetWeight: h.targetWeight * 100,
        }))
      );
    }
  }, [portfolio, resetHoldings]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('portfolioName') as string;

    onSubmit({
      name: name || portfolio?.name || '내 포트폴리오',
      holdings: toPortfolioHoldings(),
    });
  };

  const handleAddHolding = useCallback(() => {
    const newId = `holding-${Date.now()}`;
    addHolding();
    setEditingHoldingId(newId);
    setTickerSheetOpen(true);
  }, [addHolding]);

  const handleTickerClick = useCallback((holdingId: string) => {
    setEditingHoldingId(holdingId);
    setTickerSheetOpen(true);
  }, []);

  const handleTickerSelect = useCallback((ticker: TickerInfo) => {
    if (editingHoldingId) {
      selectTicker(editingHoldingId, ticker);
    }
    setTickerSheetOpen(false);
    setEditingHoldingId(null);
  }, [editingHoldingId, selectTicker]);

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-32 bg-gray-100 rounded-xl" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Card>
          <div className="space-y-6">
            {/* Portfolio Name */}
            <Input
              name="portfolioName"
              label={t('settings.portfolio.name')}
              placeholder="내 포트폴리오"
              defaultValue={portfolio?.name || '내 포트폴리오'}
            />

            {/* Holdings Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-text-secondary text-xs font-medium">
                  {t('settings.portfolio.holdings')}
                </label>
                <div className="text-sm">
                  <span className="text-text-secondary">합계: </span>
                  <span
                    className={`font-semibold ${
                      Math.abs(totalWeight - 100) < 0.01
                        ? 'text-green-600'
                        : 'text-orange-500'
                    }`}
                  >
                    {totalWeight.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Holdings List */}
              <div className="space-y-2">
                {holdings.map((holding) => (
                  <HoldingCard
                    key={holding.id}
                    holding={holding}
                    onTickerClick={() => handleTickerClick(holding.id)}
                    onWeightChange={(value) => updateHolding(holding.id, 'targetWeight', value)}
                    onRemove={() => removeHolding(holding.id)}
                  />
                ))}
              </div>

              {/* Add Holding Button */}
              <button
                type="button"
                onClick={handleAddHolding}
                className="w-full mt-3 py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                종목 추가
              </button>
            </div>

            {/* Submit Button */}
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

      {/* Ticker Select Sheet */}
      <TickerSelectSheet
        isOpen={tickerSheetOpen}
        onClose={() => {
          setTickerSheetOpen(false);
          setEditingHoldingId(null);
        }}
        onSelect={handleTickerSelect}
      />
    </>
  );
}

interface HoldingCardProps {
  holding: HoldingFormData;
  onTickerClick: () => void;
  onWeightChange: (value: number) => void;
  onRemove: () => void;
}

function HoldingCard({ holding, onTickerClick, onWeightChange, onRemove }: HoldingCardProps) {
  const isEmpty = !holding.ticker;

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-start gap-3">
        {/* Ticker Info - Clickable */}
        <button
          type="button"
          onClick={onTickerClick}
          className="flex-1 text-left min-w-0"
        >
          {isEmpty ? (
            <div className="py-2">
              <span className="text-gray-400">종목을 선택하세요</span>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-text-primary">{holding.ticker}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                  {holding.market}
                </span>
              </div>
              <p className="text-sm text-gray-500 truncate">{holding.name}</p>
            </div>
          )}
        </button>

        {/* Weight Input */}
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="number"
            value={holding.targetWeight || ''}
            onChange={(e) => onWeightChange(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="w-16 h-10 px-2 text-right text-lg font-semibold bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            min={0}
            max={100}
            step={0.1}
          />
          <span className="text-gray-500">%</span>
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={onRemove}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 hover:text-red-500 transition-colors shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
