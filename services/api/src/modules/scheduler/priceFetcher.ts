/**
 * Price fetcher - fetches stock prices from multiple sources
 * - Korean stocks (KRX/KOSDAQ): NAVER Finance
 * - US stocks (NYSE/NASDAQ): Yahoo Finance
 */

import type { Market } from '@invest-assist/core';
import { logger } from '../../shared/logger';
import type { PriceData } from './types';

const NAVER_FINANCE_URL = 'https://finance.naver.com/item/main.naver';

interface HoldingWithMarket {
  ticker: string;
  market: Market;
}

/**
 * Fetch current price for a Korean stock ticker
 * Uses Naver Finance page scraping
 */
async function fetchKoreanPrice(ticker: string): Promise<number> {
  const url = `${NAVER_FINANCE_URL}?code=${ticker}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const html = await response.text();

  // Parse price from HTML
  // Looking for pattern like: <dd class="no_today"><span>37,250</span>
  const priceMatch = html.match(/<dd class="no_today">\s*<span[^>]*>([0-9,]+)/);

  if (!priceMatch) {
    throw new Error('Price not found in response');
  }

  const priceStr = priceMatch[1].replace(/,/g, '');
  const price = parseInt(priceStr, 10);

  if (isNaN(price) || price <= 0) {
    throw new Error(`Invalid price parsed: ${priceStr}`);
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
    throw new Error(`HTTP error: ${response.status}`);
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

    if (market === 'KRX' || market === 'KOSDAQ') {
      price = await fetchKoreanPrice(ticker);
    } else if (market === 'NYSE' || market === 'NASDAQ') {
      price = await fetchUSPrice(ticker);
    } else {
      throw new Error(`Unsupported market: ${market}`);
    }

    return {
      ticker,
      price,
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
    } catch (error) {
      logger.error('Failed to fetch price for ticker', {
        ticker,
        market,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Failed to fetch price for ${ticker} (${market})`);
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
