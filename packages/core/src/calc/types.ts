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
  prices: Record<string, number>; // ticker -> price
  carryInByTicker: Record<string, number>; // ticker -> carry amount
  roundingPolicy?: RoundingPolicy;
}

/** Single item in execution result */
export interface ExecutionItem {
  ticker: string;
  name: string;
  market: Market;
  price: number;
  targetWeight: number;
  targetAmount: number;
  carryIn: number;
  shares: number;
  estCost: number;
  carryOut: number;
}

/** Totals in execution result */
export interface ExecutionTotals {
  totalEstCost: number;
  totalCarryOut: number;
}

/** Output from execution calculation */
export interface CalculateExecutionOutput {
  cycleBudget: number;
  items: ExecutionItem[];
  carryOutByTicker: Record<string, number>;
  totals: ExecutionTotals;
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
