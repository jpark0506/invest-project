/**
 * Ticker search service
 * Cache-first approach with background fetching via SQS
 */

import { type Market, MARKET_CONFIGS } from '@invest-assist/core';
import type { TickerInfo, TickerSearchResult } from './types';
import { logger } from '../../shared/logger';
import {
  getCachedTicker,
  searchCachedTickers,
  cacheTicker,
  cacheTickersBatch,
  isCacheFresh,
  type CachedTicker,
} from './repo';
import { queueTickerFetch } from './queue';

/**
 * Validate ticker format for a given market
 */
export function validateTickerFormat(ticker: string, market: Market): boolean {
  const config = MARKET_CONFIGS[market];
  if (!config) return false;
  return config.tickerPattern.test(ticker);
}

// Yahoo Finance API types
interface YahooQuote {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchange: string;
  quoteType: string;
}

interface YahooSearchResponse {
  quotes?: YahooQuote[];
}

function mapYahooExchangeToMarket(exchange: string): Market | null {
  const exchangeMap: Record<string, Market> = {
    'NYQ': 'NYSE',
    'NYSE': 'NYSE',
    'NMS': 'NASDAQ',
    'NGM': 'NASDAQ',
    'NASDAQ': 'NASDAQ',
    'NAS': 'NASDAQ',
  };
  return exchangeMap[exchange] || null;
}

function mapYahooTypeToType(quoteType: string): 'STOCK' | 'ETF' | 'FUND' {
  const typeMap: Record<string, 'STOCK' | 'ETF' | 'FUND'> = {
    'EQUITY': 'STOCK',
    'ETF': 'ETF',
    'MUTUALFUND': 'FUND',
  };
  return typeMap[quoteType] || 'STOCK';
}

/**
 * Fetch ticker info from Yahoo Finance
 */
async function fetchFromYahooFinance(query: string): Promise<TickerInfo[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=20&newsCount=0&enableFuzzyQuery=false`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      logger.warn('Yahoo Finance API error', { status: response.status });
      return [];
    }

    const data = (await response.json()) as YahooSearchResponse;
    const quotes = data.quotes || [];

    return quotes
      .map((quote): TickerInfo | null => {
        const market = mapYahooExchangeToMarket(quote.exchange);
        if (!market) return null;

        return {
          ticker: quote.symbol,
          name: quote.longname || quote.shortname || quote.symbol,
          market,
          type: mapYahooTypeToType(quote.quoteType),
          currency: 'USD',
        };
      })
      .filter((item): item is TickerInfo => item !== null);
  } catch (error) {
    logger.error('Yahoo Finance search failed', { error });
    return [];
  }
}

/**
 * Fetch Korean stock info from NAVER Finance
 * Note: This is a simplified implementation. In production, use official KRX API.
 */
async function fetchFromNaverFinance(ticker: string): Promise<TickerInfo | null> {
  try {
    // NAVER Finance stock info API (unofficial)
    const url = `https://m.stock.naver.com/api/stock/${ticker}/basic`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as {
      stockName?: string;
      stockNameEng?: string;
      marketName?: string;
      stockEndType?: string;
    };

    if (!data.stockName) return null;

    const market: Market = data.marketName === 'KOSDAQ' ? 'KOSDAQ' : 'KRX';
    const type = data.stockEndType === 'ETF' ? 'ETF' : 'STOCK';

    return {
      ticker,
      name: data.stockName,
      market,
      type,
      currency: 'KRW',
    };
  } catch (error) {
    logger.debug('NAVER Finance fetch failed', { ticker, error });
    return null;
  }
}

/**
 * Search Korean stocks from NAVER Finance
 */
async function searchNaverFinance(query: string): Promise<TickerInfo[]> {
  try {
    const url = `https://m.stock.naver.com/api/json/search/searchListJson.nhn?keyword=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      },
    });

    if (!response.ok) return [];

    const data = await response.json() as {
      result?: {
        d?: Array<{
          cd: string; // ticker code
          nm: string; // name
          nv: string; // market
          mt: string; // type
        }>;
      };
    };

    const items = data.result?.d || [];

    return items.map((item): TickerInfo => ({
      ticker: item.cd,
      name: item.nm,
      market: item.nv === 'KOSDAQ' ? 'KOSDAQ' : 'KRX',
      type: item.mt === 'ETF' ? 'ETF' : 'STOCK',
      currency: 'KRW',
    }));
  } catch (error) {
    logger.debug('NAVER search failed', { query, error });
    return [];
  }
}

/**
 * Convert cached ticker to ticker info
 */
function cachedToTickerInfo(cached: CachedTicker): TickerInfo {
  return {
    ticker: cached.ticker,
    name: cached.name,
    market: cached.market,
    type: cached.type,
    currency: cached.currency,
  };
}

/**
 * Search tickers - cache first, then external API
 */
export async function searchTickers(
  query: string,
  market?: Market
): Promise<TickerSearchResult> {
  if (!query || query.length < 1) {
    return { results: [], query };
  }

  const results: TickerInfo[] = [];
  const tickersToCache: TickerInfo[] = [];

  // 1. Search cache first
  const cachedResults = await searchCachedTickers(query, market, 20);
  results.push(...cachedResults.map(cachedToTickerInfo));

  // 2. If not enough results, fetch from external APIs
  if (results.length < 10) {
    const searchKorean = !market || market === 'KRX' || market === 'KOSDAQ';
    const searchUS = !market || market === 'NYSE' || market === 'NASDAQ';

    // Search Korean stocks
    if (searchKorean) {
      const naverResults = await searchNaverFinance(query);
      for (const ticker of naverResults) {
        // Check if already in results
        if (!results.some((r) => r.ticker === ticker.ticker && r.market === ticker.market)) {
          results.push(ticker);
          tickersToCache.push(ticker);
        }
      }
    }

    // Search US stocks
    if (searchUS) {
      const yahooResults = await fetchFromYahooFinance(query);
      for (const ticker of yahooResults) {
        if (!results.some((r) => r.ticker === ticker.ticker && r.market === ticker.market)) {
          results.push(ticker);
          tickersToCache.push(ticker);
        }
      }
    }

    // Cache new results asynchronously
    if (tickersToCache.length > 0) {
      cacheTickersBatch(tickersToCache).catch((err) =>
        logger.error('Failed to cache tickers', { error: err })
      );
    }
  }

  // Filter by market if specified
  const filteredResults = market
    ? results.filter((r) => r.market === market)
    : results;

  // Sort: exact ticker match first, then by name
  filteredResults.sort((a, b) => {
    const aExact = a.ticker.toUpperCase() === query.toUpperCase();
    const bExact = b.ticker.toUpperCase() === query.toUpperCase();
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;
    return a.name.localeCompare(b.name);
  });

  return {
    results: filteredResults.slice(0, 20),
    query,
  };
}

/**
 * Get ticker info - cache first, then fetch and cache
 */
export async function getTickerInfo(
  ticker: string,
  market: Market
): Promise<TickerInfo | null> {
  // 1. Check cache
  const cached = await getCachedTicker(ticker, market);
  if (cached) {
    // Queue refresh if stale (but return cached data)
    const fresh = await isCacheFresh(ticker, market);
    if (!fresh) {
      queueTickerFetch({ ticker, market, source: 'search' }).catch(() => {});
    }
    return cachedToTickerInfo(cached);
  }

  // 2. Fetch from external API
  let tickerInfo: TickerInfo | null = null;

  if (market === 'KRX' || market === 'KOSDAQ') {
    tickerInfo = await fetchFromNaverFinance(ticker);
  } else {
    // For US stocks, search by exact ticker
    const results = await fetchFromYahooFinance(ticker);
    tickerInfo = results.find((r) => r.ticker === ticker && r.market === market) || null;
  }

  // 3. Cache if found
  if (tickerInfo) {
    await cacheTicker(tickerInfo);
  }

  return tickerInfo;
}

/**
 * Check if ticker exists in our known database (from cache)
 */
export async function isKnownTicker(ticker: string, market?: Market): Promise<TickerInfo | null> {
  if (market) {
    const cached = await getCachedTicker(ticker, market);
    return cached ? cachedToTickerInfo(cached) : null;
  }

  // Search all markets
  for (const m of ['KRX', 'KOSDAQ', 'NYSE', 'NASDAQ'] as Market[]) {
    const cached = await getCachedTicker(ticker, m);
    if (cached) return cachedToTickerInfo(cached);
  }

  return null;
}

/**
 * Fetch ticker from external source and cache
 * Used by SQS worker
 */
export async function fetchAndCacheTicker(ticker: string, market: Market): Promise<TickerInfo | null> {
  let tickerInfo: TickerInfo | null = null;

  if (market === 'KRX' || market === 'KOSDAQ') {
    tickerInfo = await fetchFromNaverFinance(ticker);
  } else {
    const results = await fetchFromYahooFinance(ticker);
    tickerInfo = results.find((r) => r.ticker === ticker && r.market === market) || null;
  }

  if (tickerInfo) {
    await cacheTicker(tickerInfo);
    logger.info('Fetched and cached ticker', { ticker, market });
  } else {
    logger.warn('Failed to fetch ticker info', { ticker, market });
  }

  return tickerInfo;
}
