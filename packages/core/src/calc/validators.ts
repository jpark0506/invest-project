/**
 * Validation functions for execution calculation
 * Based on calc.md specification
 */

import { CalculateExecutionInput, ValidationError } from './types';

const EPSILON = 0.001;

/**
 * Validate all inputs for execution calculation
 * @throws ValidationError if validation fails
 */
export function validateInputs(input: CalculateExecutionInput): void {
  validateHoldings(input.holdings);
  validateCycleWeight(input.cycleWeight);
  validateMonthlyBudget(input.monthlyBudget);
  validateTargetWeightSum(input.holdings);
  validatePrices(input.holdings, input.prices);
  validateCarryIn(input.carryInByTicker);
}

function validateHoldings(holdings: CalculateExecutionInput['holdings']): void {
  if (!holdings || holdings.length === 0) {
    throw new ValidationError('EMPTY_HOLDINGS', 'Holdings array must not be empty');
  }
}

function validateCycleWeight(cycleWeight: number): void {
  if (cycleWeight <= 0 || cycleWeight > 1) {
    throw new ValidationError(
      'INVALID_CYCLE_WEIGHT',
      `Cycle weight must be between 0 (exclusive) and 1 (inclusive), got ${cycleWeight}`,
      { cycleWeight }
    );
  }
}

function validateMonthlyBudget(monthlyBudget: number): void {
  if (monthlyBudget < 0) {
    throw new ValidationError(
      'INVALID_MONTHLY_BUDGET',
      `Monthly budget must be non-negative, got ${monthlyBudget}`,
      { monthlyBudget }
    );
  }
}

function validateTargetWeightSum(holdings: CalculateExecutionInput['holdings']): void {
  const sum = holdings.reduce((acc, h) => acc + h.targetWeight, 0);
  if (Math.abs(sum - 1.0) > EPSILON) {
    throw new ValidationError(
      'INVALID_TARGET_WEIGHT_SUM',
      `Sum of target weights must be 1.0 (±${EPSILON}), got ${sum}`,
      { sum, holdings: holdings.map((h) => ({ ticker: h.ticker, targetWeight: h.targetWeight })) }
    );
  }
}

function validatePrices(
  holdings: CalculateExecutionInput['holdings'],
  prices: Record<string, number>
): void {
  for (const holding of holdings) {
    const price = prices[holding.ticker];
    if (price === undefined) {
      throw new ValidationError('MISSING_PRICE', `Price missing for ticker ${holding.ticker}`, {
        ticker: holding.ticker,
      });
    }
    if (price <= 0) {
      throw new ValidationError(
        'INVALID_PRICE',
        `Price must be positive for ticker ${holding.ticker}, got ${price}`,
        { ticker: holding.ticker, price }
      );
    }
  }
}

function validateCarryIn(carryInByTicker: Record<string, number>): void {
  for (const [ticker, amount] of Object.entries(carryInByTicker)) {
    if (amount < 0) {
      throw new ValidationError(
        'NEGATIVE_CARRY_IN',
        `Carry-in amount must be non-negative for ticker ${ticker}, got ${amount}`,
        { ticker, amount }
      );
    }
  }
}
