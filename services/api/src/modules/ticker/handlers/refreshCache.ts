/**
 * Scheduled Lambda - Refresh popular ticker cache
 * Runs every 6 hours to keep popular tickers fresh
 */

import type { ScheduledHandler } from 'aws-lambda';
import type { Market } from '@invest-assist/core';
import { logger } from '../../../shared/logger';
import { fetchAndCacheTicker } from '../service';

// Popular tickers to pre-cache (top Korean stocks and ETFs)
const POPULAR_KOREAN_TICKERS = [
  // Major stocks
  '005930', '000660', '373220', '207940', '005380',
  '006400', '035420', '035720', '051910', '066570',
  '105560', '055550', '000270', '012330', '068270',
  '028260', '003550', '017670', '086790', '096770',
  // Popular ETFs
  '069500', '102110', '229200', '122630', '252670',
  '379800', '360750', '381180', '133690', '091160',
];

const POPULAR_KOSDAQ_TICKERS = [
  '247540', '086520', '196170', '357780', '035900',
  '328130', '352820', '066970', '145020', '067160',
];

const POPULAR_US_TICKERS = [
  // Mega caps
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA',
  // Popular ETFs
  'SPY', 'QQQ', 'VOO', 'VTI', 'IWM', 'DIA',
  // Other popular
  'AMD', 'INTC', 'NFLX', 'CRM', 'PYPL',
];

interface RefreshResult {
  market: Market;
  total: number;
  succeeded: number;
  failed: number;
}

async function refreshMarket(
  tickers: string[],
  market: Market
): Promise<RefreshResult> {
  const results = await Promise.allSettled(
    tickers.map((ticker) => fetchAndCacheTicker(ticker, market))
  );

  return {
    market,
    total: tickers.length,
    succeeded: results.filter((r) => r.status === 'fulfilled' && r.value !== null).length,
    failed: results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && r.value === null)).length,
  };
}

export const handler: ScheduledHandler = async (event) => {
  logger.info('Starting ticker cache refresh', { event });

  const startTime = Date.now();
  const results: RefreshResult[] = [];

  try {
    // Refresh Korean stocks (KRX)
    logger.info('Refreshing KRX tickers', { count: POPULAR_KOREAN_TICKERS.length });
    results.push(await refreshMarket(POPULAR_KOREAN_TICKERS, 'KRX'));

    // Refresh KOSDAQ stocks
    logger.info('Refreshing KOSDAQ tickers', { count: POPULAR_KOSDAQ_TICKERS.length });
    results.push(await refreshMarket(POPULAR_KOSDAQ_TICKERS, 'KOSDAQ'));

    // Refresh US stocks (split between NYSE and NASDAQ)
    logger.info('Refreshing US tickers', { count: POPULAR_US_TICKERS.length });
    // Most of these are NASDAQ, but fetchAndCacheTicker will determine correct market
    results.push(await refreshMarket(POPULAR_US_TICKERS, 'NASDAQ'));

    const totalSucceeded = results.reduce((sum, r) => sum + r.succeeded, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
    const duration = Date.now() - startTime;

    logger.info('Ticker cache refresh completed', {
      duration,
      results,
      totalSucceeded,
      totalFailed,
    });
  } catch (error) {
    logger.error('Ticker cache refresh failed', { error });
    throw error;
  }
};
