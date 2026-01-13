/**
 * Ticker search types
 */

import type { Market } from '@invest-assist/core';

export interface TickerInfo {
  ticker: string;
  name: string;
  market: Market;
  type: 'STOCK' | 'ETF' | 'FUND';
  currency: 'KRW' | 'USD';
}

export interface TickerSearchResult {
  results: TickerInfo[];
  query: string;
}
