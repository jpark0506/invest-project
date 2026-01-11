/**
 * Portfolio model types
 * Based on schema.md specification
 */

import { Market } from '../calc/types';

/** Account type */
export type AccountType = 'ISA' | 'GENERAL' | 'OVERSEAS';

/** Investment theme */
export type Theme =
  | 'AI_SEMI'
  | 'ROBOTICS'
  | 'HEALTHCARE'
  | 'COPPER'
  | 'POWER'
  | 'BATTERY'
  | 'CLEAN_ENERGY'
  | 'FINANCE'
  | 'CONSUMER';

/** Portfolio holding item */
export interface PortfolioHolding {
  ticker: string;
  name: string;
  market: Market;
  targetWeight: number; // 0~1, sum should be 1.0
}

/** Portfolio entity */
export interface Portfolio {
  portfolioId: string;
  userId: string;
  name: string;
  accountTypes: AccountType[];
  markets: Market[];
  themes: Theme[];
  holdings: PortfolioHolding[];
  isActive: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** Portfolio creation input */
export interface CreatePortfolioInput {
  name: string;
  accountTypes?: AccountType[];
  markets?: Market[];
  themes?: Theme[];
  holdings: PortfolioHolding[];
  isActive?: boolean;
}

/** Portfolio update input */
export interface UpdatePortfolioInput {
  name?: string;
  accountTypes?: AccountType[];
  markets?: Market[];
  themes?: Theme[];
  holdings?: PortfolioHolding[];
  isActive?: boolean;
}
