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
} from './types';
import { validateInputs } from './validators';

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

  const { monthlyBudget, cycleWeight, holdings, prices, carryInByTicker } = input;
  // Rounding policy can be used for future customization
  // const _roundingPolicy = input.roundingPolicy ?? DEFAULT_ROUNDING_POLICY;

  // Step 1: Calculate cycle budget
  const cycleBudget = computeCycleBudget(monthlyBudget, cycleWeight);

  // Step 2: Calculate items for each holding
  const items = computeItems(holdings, cycleBudget, prices, carryInByTicker);

  // Step 3: Build carry-out map
  const carryOutByTicker = buildCarryOutMap(items);

  // Step 4: Calculate totals
  const totals = computeTotals(items);

  return {
    cycleBudget,
    items,
    carryOutByTicker,
    totals,
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
 */
function computeItems(
  holdings: CalculateExecutionInput['holdings'],
  cycleBudget: number,
  prices: Record<string, number>,
  carryInByTicker: Record<string, number>
): ExecutionItem[] {
  return holdings.map((holding) => {
    const { ticker, name, market, targetWeight } = holding;
    const price = prices[ticker];
    const carryIn = carryInByTicker[ticker] ?? 0;

    // Target amount for this holding in this cycle
    const targetAmount = cycleBudget * targetWeight;

    // Budget available including carry-in
    const budgetForTicker = targetAmount + carryIn;

    // Calculate shares (floor)
    const shares = Math.floor(budgetForTicker / price);

    // Estimated cost
    const estCost = shares * price;

    // Carry-out for next cycle
    const carryOut = budgetForTicker - estCost;

    return {
      ticker,
      name,
      market,
      price,
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
