/**
 * Currency utilities for price normalization and exchange rate handling
 */

import { Currency, ExchangeRates, Market, BASE_CURRENCY, getMarketCurrency } from './types';

/**
 * Default exchange rates (fallback values)
 * KRW is the base currency with rate 1
 */
export const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  KRW: 1,
  USD: 1350, // Default fallback rate
};

/**
 * Convert a price from its original currency to KRW
 *
 * @param price - Price in original currency
 * @param currency - Currency of the price
 * @param exchangeRates - Exchange rates (currency -> KRW)
 * @returns Price in KRW
 */
export function convertToKRW(
  price: number,
  currency: Currency,
  exchangeRates: ExchangeRates
): number {
  if (currency === BASE_CURRENCY) {
    return price;
  }

  const rate = exchangeRates[currency];
  if (rate === undefined || rate <= 0) {
    throw new Error(`Invalid exchange rate for currency: ${currency}`);
  }

  return price * rate;
}

/**
 * Convert a price from KRW to a target currency
 *
 * @param priceInKRW - Price in KRW
 * @param targetCurrency - Target currency
 * @param exchangeRates - Exchange rates (currency -> KRW)
 * @returns Price in target currency
 */
export function convertFromKRW(
  priceInKRW: number,
  targetCurrency: Currency,
  exchangeRates: ExchangeRates
): number {
  if (targetCurrency === BASE_CURRENCY) {
    return priceInKRW;
  }

  const rate = exchangeRates[targetCurrency];
  if (rate === undefined || rate <= 0) {
    throw new Error(`Invalid exchange rate for currency: ${targetCurrency}`);
  }

  return priceInKRW / rate;
}

/**
 * Get the currency for a given market
 *
 * @param market - Market identifier
 * @returns Currency for the market
 */
export function getCurrencyForMarket(market: Market): Currency {
  return getMarketCurrency(market);
}

/**
 * Normalize a price to KRW based on market
 *
 * @param price - Price in market's native currency
 * @param market - Market of the ticker
 * @param exchangeRates - Exchange rates
 * @returns Price in KRW
 */
export function normalizePriceToKRW(
  price: number,
  market: Market,
  exchangeRates: ExchangeRates
): number {
  const currency = getMarketCurrency(market);
  return convertToKRW(price, currency, exchangeRates);
}

/**
 * Validate exchange rates
 *
 * @param exchangeRates - Exchange rates to validate
 * @returns true if valid
 * @throws Error if invalid
 */
export function validateExchangeRates(exchangeRates: ExchangeRates): boolean {
  // KRW rate must be 1
  if (exchangeRates.KRW !== 1) {
    throw new Error('KRW exchange rate must be 1 (base currency)');
  }

  // All rates must be positive
  for (const [currency, rate] of Object.entries(exchangeRates)) {
    if (rate <= 0) {
      throw new Error(`Exchange rate for ${currency} must be positive`);
    }
  }

  return true;
}
