/**
 * Ticker search service
 * Uses Yahoo Finance API for US stocks and static data for Korean stocks
 */

import type { Market } from '@invest-assist/core';
import type { TickerInfo, TickerSearchResult } from './types';
import { logger } from '../../shared/logger';

// Popular Korean ETFs and stocks for quick search
const KOREAN_TICKERS: TickerInfo[] = [
  // ETFs - KOSPI
  { ticker: '069500', name: 'KODEX 200', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '102110', name: 'TIGER 200', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '229200', name: 'KODEX 코스닥150', market: 'KOSDAQ', type: 'ETF', currency: 'KRW' },
  { ticker: '252670', name: 'KODEX 200선물인버스2X', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '122630', name: 'KODEX 레버리지', market: 'KRX', type: 'ETF', currency: 'KRW' },

  // US Market ETFs (Korean-listed)
  { ticker: '379800', name: 'KODEX 미국S&P500TR', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '439870', name: 'TIGER 미국나스닥100', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '381180', name: 'TIGER 미국S&P500', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '133690', name: 'TIGER 미국나스닥100', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '360750', name: 'TIGER 미국S&P500TR', market: 'KRX', type: 'ETF', currency: 'KRW' },

  // Sector ETFs
  { ticker: '091160', name: 'KODEX 반도체', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '091170', name: 'KODEX 은행', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '091180', name: 'KODEX 자동차', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '117700', name: 'KODEX 건설', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '266360', name: 'KODEX 2차전지산업', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '364980', name: 'TIGER AI코리아그로스', market: 'KRX', type: 'ETF', currency: 'KRW' },

  // Major Korean stocks
  { ticker: '005930', name: '삼성전자', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '000660', name: 'SK하이닉스', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '373220', name: 'LG에너지솔루션', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '207940', name: '삼성바이오로직스', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '005380', name: '현대차', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '006400', name: '삼성SDI', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '035420', name: 'NAVER', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '035720', name: '카카오', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '051910', name: 'LG화학', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '066570', name: 'LG전자', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '105560', name: 'KB금융', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '055550', name: '신한지주', market: 'KRX', type: 'STOCK', currency: 'KRW' },

  // KOSDAQ stocks
  { ticker: '247540', name: '에코프로비엠', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
  { ticker: '086520', name: '에코프로', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
  { ticker: '041510', name: 'SM엔터테인먼트', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
  { ticker: '293490', name: '카카오게임즈', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
  { ticker: '263750', name: '펄어비스', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
];

interface YahooQuote {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchange: string;
  quoteType: string;
  typeDisp?: string;
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

async function searchYahooFinance(query: string): Promise<TickerInfo[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=20&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      logger.warn('Yahoo Finance API error', { status: response.status });
      return [];
    }

    const data = await response.json() as { quotes?: YahooQuote[] };
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

function searchKoreanTickers(query: string): TickerInfo[] {
  const lowerQuery = query.toLowerCase();

  return KOREAN_TICKERS.filter((ticker) => {
    return (
      ticker.ticker.includes(query) ||
      ticker.name.toLowerCase().includes(lowerQuery)
    );
  });
}

export async function searchTickers(
  query: string,
  market?: Market
): Promise<TickerSearchResult> {
  if (!query || query.length < 1) {
    return { results: [], query };
  }

  const results: TickerInfo[] = [];

  // Search based on market filter
  const searchKorean = !market || market === 'KRX' || market === 'KOSDAQ';
  const searchUS = !market || market === 'NYSE' || market === 'NASDAQ';

  // Search Korean stocks
  if (searchKorean) {
    const koreanResults = searchKoreanTickers(query);
    results.push(...koreanResults);
  }

  // Search US stocks via Yahoo Finance
  if (searchUS) {
    const yahooResults = await searchYahooFinance(query);
    results.push(...yahooResults);
  }

  // Filter by specific market if provided
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
