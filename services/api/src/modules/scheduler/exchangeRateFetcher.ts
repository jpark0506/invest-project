/**
 * Exchange rate fetcher - fetches USD/KRW exchange rate
 * Uses public APIs with fallback to default rate
 */

import type { ExchangeRates } from '@invest-assist/core';
import { logger } from '../../shared/logger';

/**
 * Default exchange rates (fallback when API fails)
 */
export const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  KRW: 1,
  USD: 1350,
};

interface ExchangeRateAPIResponse {
  rates?: {
    KRW?: number;
  };
  result?: string;
}

/**
 * Fetch current USD to KRW exchange rate from exchangerate-api.com
 * Falls back to default rate on failure
 */
async function fetchUSDtoKRWRate(): Promise<number> {
  try {
    // Using free exchangerate-api endpoint
    const url = 'https://open.er-api.com/v6/latest/USD';

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'invest-assist/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }

    const data = (await response.json()) as ExchangeRateAPIResponse;

    if (data.result !== 'success' || !data.rates?.KRW) {
      throw new Error('Invalid response from exchange rate API');
    }

    const rate = data.rates.KRW;

    if (rate <= 0) {
      throw new Error(`Invalid exchange rate: ${rate}`);
    }

    logger.info('Fetched USD/KRW exchange rate', { rate });
    return rate;
  } catch (error) {
    logger.warn('Failed to fetch exchange rate, using default', {
      error: error instanceof Error ? error.message : String(error),
      defaultRate: DEFAULT_EXCHANGE_RATES.USD,
    });
    return DEFAULT_EXCHANGE_RATES.USD;
  }
}

/**
 * Fetch all exchange rates relative to KRW (base currency)
 * Returns rates in format: { KRW: 1, USD: 1350 }
 * Meaning: 1 USD = 1350 KRW
 */
export async function fetchExchangeRates(): Promise<ExchangeRates> {
  const usdRate = await fetchUSDtoKRWRate();

  const rates: ExchangeRates = {
    KRW: 1,
    USD: usdRate,
  };

  logger.info('Exchange rates fetched', { rates });
  return rates;
}

/**
 * Get exchange rates with optional caching
 * For now, always fetches fresh rates
 * TODO: Add caching layer for production
 */
export async function getExchangeRates(): Promise<ExchangeRates> {
  return fetchExchangeRates();
}
