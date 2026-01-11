import { useState, useCallback } from 'react';
import type { PortfolioHolding, Market } from '@invest-assist/core';

export interface HoldingFormData {
  id: string;
  ticker: string;
  name: string;
  market: Market;
  targetWeight: number;
}

export function useHoldingsForm(initialHoldings: PortfolioHolding[] = []) {
  const [holdings, setHoldings] = useState<HoldingFormData[]>(() =>
    initialHoldings.map((h, i) => ({
      id: `holding-${i}`,
      ...h,
    }))
  );

  const addHolding = useCallback(() => {
    setHoldings((prev) => [
      ...prev,
      {
        id: `holding-${Date.now()}`,
        ticker: '',
        name: '',
        market: 'KRX' as Market,
        targetWeight: 0,
      },
    ]);
  }, []);

  const removeHolding = useCallback((id: string) => {
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const updateHolding = useCallback(
    (id: string, field: keyof HoldingFormData, value: string | number) => {
      setHoldings((prev) =>
        prev.map((h) => (h.id === id ? { ...h, [field]: value } : h))
      );
    },
    []
  );

  const resetHoldings = useCallback((newHoldings: PortfolioHolding[]) => {
    setHoldings(
      newHoldings.map((h, i) => ({
        id: `holding-${i}`,
        ...h,
      }))
    );
  }, []);

  const totalWeight = holdings.reduce((sum, h) => sum + (h.targetWeight || 0), 0);

  const toPortfolioHoldings = (): PortfolioHolding[] =>
    holdings.map(({ ticker, name, market, targetWeight }) => ({
      ticker,
      name,
      market,
      targetWeight: targetWeight / 100, // convert from percentage to decimal
    }));

  const isValid =
    holdings.length > 0 &&
    holdings.every((h) => h.ticker && h.name && h.targetWeight > 0) &&
    Math.abs(totalWeight - 100) < 0.01;

  return {
    holdings,
    addHolding,
    removeHolding,
    updateHolding,
    resetHoldings,
    totalWeight,
    toPortfolioHoldings,
    isValid,
  };
}
