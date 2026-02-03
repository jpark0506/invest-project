/**
 * Price fetcher - fetches stock prices from multiple sources
 * - Korean stocks (KRX/KOSDAQ): NAVER Finance Mobile API
 * - US stocks (NYSE/NASDAQ): Yahoo Finance
 */

import type { Market } from '@invest-assist/core';
import { logger } from '../../shared/logger';
import type { PriceData } from './types';

interface HoldingWithMarket {
  ticker: string;
  market: Market;
}

interface NaverBasicResponse {
  closePrice?: string;
  stockName?: string;
}

/**
 * Fetch current price for a Korean stock ticker
 * Uses NAVER Finance Mobile API
 */
async function fetchKoreanPrice(ticker: string): Promise<number> {
  const url = `https://m.stock.naver.com/api/stock/${ticker}/basic`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    },
  });

  if (!response.ok) {
    throw new Error(`NAVER API error: ${response.status}`);
  }

  const data = (await response.json()) as NaverBasicResponse;

  if (!data.closePrice) {
    throw new Error('Price not found in NAVER response');
  }

  // Remove commas and parse
  const priceStr = data.closePrice.replace(/,/g, '');
  const price = parseInt(priceStr, 10);

  if (isNaN(price) || price <= 0) {
    throw new Error(`Invalid price parsed: ${data.closePrice}`);
  }

  return price;
}

/**
 * Fetch current price for a US stock ticker
 * Uses Yahoo Finance API
 */
async function fetchUSPrice(ticker: string): Promise<number> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`Yahoo API error: ${response.status}`);
  }

  const data = await response.json() as {
    chart?: {
      result?: Array<{
        meta?: {
          regularMarketPrice?: number;
        };
      }>;
    };
  };

  const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;

  if (!price || price <= 0) {
    throw new Error('Price not found in Yahoo Finance response');
  }

  return price;
}

/**
 * Fetch price for a single ticker based on market
 */
export async function fetchPrice(ticker: string, market: Market): Promise<PriceData> {
  try {
    let price: number;
    let currency: 'KRW' | 'USD';

    if (market === 'KRX' || market === 'KOSDAQ') {
      price = await fetchKoreanPrice(ticker);
      currency = 'KRW';
    } else if (market === 'NYSE' || market === 'NASDAQ') {
      price = await fetchUSPrice(ticker);
      currency = 'USD';
    } else {
      throw new Error(`Unsupported market: ${market}`);
    }

    return {
      ticker,
      price,
      currency,
      source: market === 'KRX' || market === 'KOSDAQ' ? 'naver' : 'yahoo',
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Failed to fetch price', {
      ticker,
      market,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Fetch prices for multiple tickers with market info
 */
export async function fetchPricesWithMarket(
  holdings: HoldingWithMarket[]
): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};

  // Fetch prices sequentially to avoid rate limiting
  for (const { ticker, market } of holdings) {
    try {
      const data = await fetchPrice(ticker, market);
      prices[ticker] = data.price;
      logger.info('Fetched price', { ticker, market, price: data.price });
    } catch (error) {
      logger.error('Failed to fetch price for ticker', {
        ticker,
        market,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`${ticker} (${market}) 가격 조회 실패`);
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return prices;
}

/**
 * Legacy function - fetches prices assuming all tickers are Korean stocks
 * @deprecated Use fetchPricesWithMarket instead
 */
export async function fetchPrices(tickers: string[]): Promise<Record<string, number>> {
  logger.warn('Using deprecated fetchPrices - all tickers assumed to be Korean stocks');
  return fetchPricesWithMarket(
    tickers.map((ticker) => ({ ticker, market: 'KRX' as Market }))
  );
}
