/**
 * Portfolio module types (re-export from core + API specific)
 */

import type {
  Portfolio,
  CreatePortfolioInput,
  UpdatePortfolioInput,
} from '@invest-assist/core';

export type { Portfolio, CreatePortfolioInput, UpdatePortfolioInput };

export interface GetPortfolioResponse {
  portfolio: Portfolio | null;
}

export interface PutPortfolioResponse {
  portfolio: Portfolio;
}
