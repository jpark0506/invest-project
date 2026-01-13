import { apiClient } from '@/shared/api';
import type { Market } from '@invest-assist/core';

export interface TickerInfo {
  ticker: string;
  name: string;
  market: Market;
  type: 'STOCK' | 'ETF' | 'FUND';
  currency: 'KRW' | 'USD';
}

export interface TickerSearchResponse {
  results: TickerInfo[];
  query: string;
}

export const tickerApi = {
  search: (query: string, market?: Market) => {
    const params = new URLSearchParams({ q: query });
    if (market) {
      params.append('market', market);
    }
    return apiClient.get<TickerSearchResponse>(`/tickers/search?${params.toString()}`);
  },
};
