/**
 * Ticker search service
 * Uses Yahoo Finance API for US stocks and static data for Korean stocks
 */

import { type Market, MARKET_CONFIGS } from '@invest-assist/core';
import type { TickerInfo, TickerSearchResult } from './types';
import { logger } from '../../shared/logger';

/**
 * Validate ticker format for a given market
 */
export function validateTickerFormat(ticker: string, market: Market): boolean {
  const config = MARKET_CONFIGS[market];
  if (!config) return false;
  return config.tickerPattern.test(ticker);
}

/**
 * Check if ticker exists in our known database
 */
export function isKnownTicker(ticker: string, market?: Market): TickerInfo | null {
  const found = KOREAN_TICKERS.find(
    (t) => t.ticker === ticker && (!market || t.market === market)
  );
  return found || null;
}

// Popular Korean ETFs and stocks for quick search
const KOREAN_TICKERS: TickerInfo[] = [
  // Index ETFs
  { ticker: '069500', name: 'KODEX 200', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '102110', name: 'TIGER 200', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '229200', name: 'KODEX 코스닥150', market: 'KOSDAQ', type: 'ETF', currency: 'KRW' },
  { ticker: '252670', name: 'KODEX 200선물인버스2X', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '122630', name: 'KODEX 레버리지', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '251340', name: 'KODEX 코스닥150레버리지', market: 'KOSDAQ', type: 'ETF', currency: 'KRW' },
  { ticker: '114800', name: 'KODEX 인버스', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '233740', name: 'KODEX 코스닥150선물인버스', market: 'KOSDAQ', type: 'ETF', currency: 'KRW' },

  // US Market ETFs (Korean-listed)
  { ticker: '379800', name: 'KODEX 미국S&P500TR', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '360750', name: 'TIGER 미국S&P500TR', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '381180', name: 'TIGER 미국S&P500', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '133690', name: 'TIGER 미국나스닥100', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '409820', name: 'KODEX 미국나스닥100TR', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '453850', name: 'TIGER 미국테크TOP10 INDXX', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '381170', name: 'TIGER 미국다우존스30', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '143850', name: 'TIGER 미국S&P500선물(H)', market: 'KRX', type: 'ETF', currency: 'KRW' },

  // Sector ETFs
  { ticker: '091160', name: 'KODEX 반도체', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '091170', name: 'KODEX 은행', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '091180', name: 'KODEX 자동차', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '117700', name: 'KODEX 건설', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '266360', name: 'KODEX 2차전지산업', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '364980', name: 'TIGER AI코리아그로스', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '091230', name: 'TIGER 반도체', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '305720', name: 'KODEX 2차전지핵심소재', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '371160', name: 'TIGER 2차전지테마', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '448290', name: 'TIGER 2차전지TOP10', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '455850', name: 'KODEX AI반도체핵심장비', market: 'KRX', type: 'ETF', currency: 'KRW' },

  // Bond/Dividend ETFs
  { ticker: '148070', name: 'KOSEF 국고채10년', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '152380', name: 'KODEX 국고채3년', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '214980', name: 'KODEX 단기채권', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '211560', name: 'TIGER 배당성장', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '161510', name: 'ARIRANG 고배당주', market: 'KRX', type: 'ETF', currency: 'KRW' },
  { ticker: '458760', name: 'KODEX 미국배당다우존스', market: 'KRX', type: 'ETF', currency: 'KRW' },

  // Major Korean stocks - Top 30
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
  { ticker: '000270', name: '기아', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '012330', name: '현대모비스', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '068270', name: '셀트리온', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '028260', name: '삼성물산', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '003550', name: 'LG', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '017670', name: 'SK텔레콤', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '086790', name: '하나금융지주', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '096770', name: 'SK이노베이션', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '032830', name: '삼성생명', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '034730', name: 'SK', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '003670', name: '포스코홀딩스', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '030200', name: 'KT', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '010130', name: '고려아연', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '009150', name: '삼성전기', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '033780', name: 'KT&G', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '011170', name: '롯데케미칼', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '015760', name: '한국전력', market: 'KRX', type: 'STOCK', currency: 'KRW' },
  { ticker: '018260', name: '삼성에스디에스', market: 'KRX', type: 'STOCK', currency: 'KRW' },

  // KOSDAQ stocks - Top 20
  { ticker: '247540', name: '에코프로비엠', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
  { ticker: '086520', name: '에코프로', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
  { ticker: '041510', name: 'SM엔터테인먼트', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
  { ticker: '293490', name: '카카오게임즈', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
  { ticker: '263750', name: '펄어비스', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
  { ticker: '196170', name: '알테오젠', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
  { ticker: '357780', name: '솔브레인', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
  { ticker: '035900', name: 'JYP엔터테인먼트', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
  { ticker: '328130', name: '루닛', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
  { ticker: '112040', name: '위메이드', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
  { ticker: '068760', name: '셀트리온제약', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
  { ticker: '066970', name: '엘앤에프', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
  { ticker: '145020', name: '휴젤', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
  { ticker: '036570', name: '엔씨소프트', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
  { ticker: '095340', name: 'ISC', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
  { ticker: '352820', name: '하이브', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
  { ticker: '058470', name: '리노공업', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
  { ticker: '039030', name: '이오테크닉스', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
  { ticker: '348210', name: '넥스틴', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
  { ticker: '067160', name: '아프리카TV', market: 'KOSDAQ', type: 'STOCK', currency: 'KRW' },
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
