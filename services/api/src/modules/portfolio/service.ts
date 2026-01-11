/**
 * Portfolio service
 */

import * as portfolioRepo from './repo';
import type { Portfolio, UpdatePortfolioInput, GetPortfolioResponse, PutPortfolioResponse } from './types';

const EPSILON = 0.001;

/**
 * Get active portfolio for user
 */
export async function getPortfolio(userId: string): Promise<GetPortfolioResponse> {
  const portfolio = await portfolioRepo.getActivePortfolio(userId);
  return { portfolio };
}

/**
 * Create or update portfolio
 * If user has no active portfolio, create one
 * If user has active portfolio, update it
 */
export async function upsertPortfolio(
  userId: string,
  input: UpdatePortfolioInput
): Promise<PutPortfolioResponse> {
  // Validate holdings weight sum if provided
  if (input.holdings) {
    validateHoldingsWeight(input.holdings);
  }

  const existing = await portfolioRepo.getActivePortfolio(userId);

  let portfolio: Portfolio;

  if (existing) {
    // Update existing
    const updated = await portfolioRepo.updatePortfolio(userId, existing.portfolioId, input);
    if (!updated) {
      throw new Error('Failed to update portfolio');
    }
    portfolio = updated;
  } else {
    // Create new
    if (!input.holdings || input.holdings.length === 0) {
      throw new Error('Holdings are required when creating a new portfolio');
    }
    portfolio = await portfolioRepo.createPortfolio(userId, {
      name: input.name || 'My Portfolio',
      accountTypes: input.accountTypes,
      markets: input.markets,
      themes: input.themes,
      holdings: input.holdings,
      isActive: true,
    });
  }

  return { portfolio };
}

/**
 * Validate that holdings weights sum to 1.0
 */
function validateHoldingsWeight(holdings: UpdatePortfolioInput['holdings']): void {
  if (!holdings || holdings.length === 0) {
    return;
  }

  const sum = holdings.reduce((acc, h) => acc + h.targetWeight, 0);
  if (Math.abs(sum - 1.0) > EPSILON) {
    throw new Error(`Holdings weights must sum to 1.0, got ${sum.toFixed(4)}`);
  }

  // Check for negative weights
  for (const holding of holdings) {
    if (holding.targetWeight < 0) {
      throw new Error(`Holding weight cannot be negative: ${holding.ticker}`);
    }
  }
}
