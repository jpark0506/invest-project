/**
 * Price fetcher - fetches stock prices from Naver Finance
 */

import { logger } from '../../shared/logger';
import type { PriceData } from './types';

const NAVER_FINANCE_URL = 'https://finance.naver.com/item/main.naver';

/**
 * Fetch current price for a Korean stock ticker
 * Uses Naver Finance page scraping
 */
export async function fetchPrice(ticker: string): Promise<PriceData> {
  try {
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

    return {
      ticker,
      price,
      source: 'naver',
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Failed to fetch price', {
      ticker,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Fetch prices for multiple tickers
 */
export async function fetchPrices(tickers: string[]): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};

  // Fetch prices sequentially to avoid rate limiting
  for (const ticker of tickers) {
    try {
      const data = await fetchPrice(ticker);
      prices[ticker] = data.price;
    } catch (error) {
      logger.error('Failed to fetch price for ticker', {
        ticker,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Failed to fetch price for ${ticker}`);
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return prices;
}
