/**
 * Calculation types for execution order sheet generation
 * Based on calc.md specification
 */

/** Market/Exchange types */
export type Market = 'KRX' | 'KOSDAQ' | 'NYSE' | 'NASDAQ';

/** Market region for grouping */
export type MarketRegion = 'KR' | 'US';

/** Currency types */
export type Currency = 'KRW' | 'USD';

/** Base currency for all calculations */
export const BASE_CURRENCY: Currency = 'KRW';

/**
 * Exchange rates relative to base currency (KRW)
 * Example: { KRW: 1, USD: 1350 } means 1 USD = 1350 KRW
 */
export type ExchangeRates = Record<Currency, number>;

/** Market configuration */
export interface MarketConfig {
  market: Market;
  region: MarketRegion;
  currency: Currency;
  name: string;
  tickerPattern: RegExp;
}

/** Market configurations */
export const MARKET_CONFIGS: Record<Market, MarketConfig> = {
  KRX: {
    market: 'KRX',
    region: 'KR',
    currency: 'KRW',
    name: '한국거래소 (유가증권)',
    tickerPattern: /^\d{6}$/,
  },
  KOSDAQ: {
    market: 'KOSDAQ',
    region: 'KR',
    currency: 'KRW',
    name: '한국거래소 (코스닥)',
    tickerPattern: /^\d{6}$/,
  },
  NYSE: {
    market: 'NYSE',
    region: 'US',
    currency: 'USD',
    name: 'New York Stock Exchange',
    tickerPattern: /^[A-Z]{1,5}$/,
  },
  NASDAQ: {
    market: 'NASDAQ',
    region: 'US',
    currency: 'USD',
    name: 'NASDAQ',
    tickerPattern: /^[A-Z]{1,5}$/,
  },
};

/** Get market region from market */
export function getMarketRegion(market: Market): MarketRegion {
  return MARKET_CONFIGS[market].region;
}

/** Get currency for market */
export function getMarketCurrency(market: Market): Currency {
  return MARKET_CONFIGS[market].currency;
}

/** Rounding policy for shares */
export type ShareRounding = 'FLOOR';

/** Currency rounding policy */
export type CurrencyRounding = 'NONE';

/** Holding in a portfolio */
export interface Holding {
  ticker: string;
  name: string;
  market: Market;
  targetWeight: number; // 0~1
}

/** Rounding policy configuration */
export interface RoundingPolicy {
  shareRounding: ShareRounding;
  currencyRounding: CurrencyRounding;
}

/** Input for execution calculation */
export interface CalculateExecutionInput {
  monthlyBudget: number; // KRW
  cycleWeight: number; // 0~1, weight for this cycle
  holdings: Holding[];
  prices: Record<string, number>; // ticker -> price (in original currency)
  carryInByTicker: Record<string, number>; // ticker -> carry amount (in KRW)
  exchangeRates: ExchangeRates; // currency -> KRW rate (e.g., USD: 1350 means 1 USD = 1350 KRW)
  roundingPolicy?: RoundingPolicy;
}

/** Single item in execution result */
export interface ExecutionItem {
  ticker: string;
  name: string;
  market: Market;
  price: number; // Original price in market currency
  priceCurrency: Currency; // Currency of the original price
  priceInKRW: number; // Price converted to KRW
  targetWeight: number;
  targetAmount: number; // in KRW
  carryIn: number; // in KRW
  shares: number;
  estCost: number; // in KRW
  carryOut: number; // in KRW
}

/** Totals in execution result */
export interface ExecutionTotals {
  totalEstCost: number;
  totalCarryOut: number;
}

/** Output from execution calculation */
export interface CalculateExecutionOutput {
  cycleBudget: number; // in KRW
  items: ExecutionItem[];
  carryOutByTicker: Record<string, number>; // in KRW
  totals: ExecutionTotals; // in KRW
  exchangeRates: ExchangeRates; // rates used for this calculation
}

/** Validation error codes */
export type ValidationErrorCode =
  | 'EMPTY_HOLDINGS'
  | 'INVALID_CYCLE_WEIGHT'
  | 'INVALID_MONTHLY_BUDGET'
  | 'INVALID_TARGET_WEIGHT_SUM'
  | 'MISSING_PRICE'
  | 'INVALID_PRICE'
  | 'NEGATIVE_CARRY_IN';

/** Validation error */
export class ValidationError extends Error {
  constructor(
    public readonly code: ValidationErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
