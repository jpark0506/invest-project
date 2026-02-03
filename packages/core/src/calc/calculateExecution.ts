/**
 * Core execution calculation logic
 * Based on calc.md specification
 *
 * Pure function that calculates the order sheet for a given cycle
 */

import {
  CalculateExecutionInput,
  CalculateExecutionOutput,
  ExecutionItem,
  ExchangeRates,
  Holding,
  getMarketCurrency,
} from './types';
import { validateInputs } from './validators';
import { normalizePriceToKRW, validateExchangeRates } from './currency';

// Rounding policy can be used for future customization
// const DEFAULT_ROUNDING_POLICY: RoundingPolicy = {
//   shareRounding: 'FLOOR',
//   currencyRounding: 'NONE',
// };

/**
 * Calculate execution order sheet for a single cycle
 *
 * @param input - Calculation input parameters
 * @returns Execution output with items, carry-outs, and totals
 * @throws ValidationError if input validation fails
 */
export function calculateExecution(input: CalculateExecutionInput): CalculateExecutionOutput {
  // Validate all inputs first
  validateInputs(input);

  const { monthlyBudget, cycleWeight, holdings, prices, carryInByTicker, exchangeRates } = input;

  // Validate exchange rates
  validateExchangeRates(exchangeRates);

  // Step 1: Calculate cycle budget (in KRW)
  const cycleBudget = computeCycleBudget(monthlyBudget, cycleWeight);

  // Step 2: Calculate items for each holding (with currency conversion)
  const items = computeItems(holdings, cycleBudget, prices, carryInByTicker, exchangeRates);

  // Step 3: Build carry-out map
  const carryOutByTicker = buildCarryOutMap(items);

  // Step 4: Calculate totals
  const totals = computeTotals(items);

  return {
    cycleBudget,
    items,
    carryOutByTicker,
    totals,
    exchangeRates,
  };
}

/**
 * Calculate the budget for this cycle
 */
function computeCycleBudget(monthlyBudget: number, cycleWeight: number): number {
  return monthlyBudget * cycleWeight;
}

/**
 * Calculate execution items for all holdings
 * All monetary values are normalized to KRW for consistent calculation
 */
function computeItems(
  holdings: Holding[],
  cycleBudget: number,
  prices: Record<string, number>,
  carryInByTicker: Record<string, number>,
  exchangeRates: ExchangeRates
): ExecutionItem[] {
  return holdings.map((holding) => {
    const { ticker, name, market, targetWeight } = holding;
    const price = prices[ticker]; // Price in original currency
    const priceCurrency = getMarketCurrency(market);
    const carryIn = carryInByTicker[ticker] ?? 0; // Already in KRW

    // Convert price to KRW for calculation
    const priceInKRW = normalizePriceToKRW(price, market, exchangeRates);

    // Target amount for this holding in this cycle (in KRW)
    const targetAmount = cycleBudget * targetWeight;

    // Budget available including carry-in (in KRW)
    const budgetForTicker = targetAmount + carryIn;

    // Calculate shares using KRW-normalized price
    const shares = Math.floor(budgetForTicker / priceInKRW);

    // Estimated cost in KRW
    const estCost = shares * priceInKRW;

    // Carry-out for next cycle (in KRW)
    const carryOut = budgetForTicker - estCost;

    return {
      ticker,
      name,
      market,
      price, // Original price in market currency
      priceCurrency,
      priceInKRW,
      targetWeight,
      targetAmount,
      carryIn,
      shares,
      estCost,
      carryOut,
    };
  });
}

/**
 * Build carry-out map from execution items
 */
function buildCarryOutMap(items: ExecutionItem[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of items) {
    map[item.ticker] = item.carryOut;
  }
  return map;
}

/**
 * Calculate totals from execution items
 */
function computeTotals(items: ExecutionItem[]): CalculateExecutionOutput['totals'] {
  let totalEstCost = 0;
  let totalCarryOut = 0;

  for (const item of items) {
    totalEstCost += item.estCost;
    totalCarryOut += item.carryOut;
  }

  return {
    totalEstCost,
    totalCarryOut,
  };
}
