/**
 * Execution model types
 * Based on schema.md specification
 */

import { Currency, ExchangeRates, Market } from '../calc/types';

/** Execution status */
export type ExecutionStatus = 'GENERATED' | 'SENT' | 'CONFIRMED';

/** Signal label */
export type SignalLabel = 'COOL' | 'NEUTRAL' | 'OVERHEAT';

/** Execution item (order sheet row) */
export interface ExecutionItemRecord {
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

/** Signal metrics */
export interface SignalMetrics {
  rsi14?: number;
  ma20Gap?: number;
  vol20?: number;
  pos52w?: number;
}

/** Signals for execution */
export interface ExecutionSignals {
  overheatScore: number; // 0~100
  label: SignalLabel;
  metrics?: SignalMetrics;
}

/** User confirmation */
export interface UserConfirm {
  confirmedAt: string | null; // ISO
  note: string | null;
}

/** Execution entity (order sheet) */
export interface Execution {
  userId: string;
  ymCycle: string; // '2026-02#1' format (PK: userId, SK: ymCycle)
  portfolioId: string;
  planId: string;
  asOfDate: string; // ISO
  yearMonth: string; // '2026-02'
  cycleIndex: number; // 1, 2, or 3
  cycleWeight: number;
  totalBudget: number; // in KRW
  cycleBudget: number; // in KRW
  items: ExecutionItemRecord[];
  carryByTicker: Record<string, number>; // in KRW
  exchangeRates?: ExchangeRates; // Exchange rates used for this execution
  signals: ExecutionSignals;
  aiComment: string | null;
  status: ExecutionStatus;
  userConfirm: UserConfirm;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  deletedAt?: string | null; // ISO, soft delete timestamp
}

/** Execution summary for list view */
export interface ExecutionSummary {
  ymCycle: string;
  yearMonth: string;
  cycleIndex: number;
  asOfDate: string;
  status: ExecutionStatus;
  cycleBudget: number;
  signals: Pick<ExecutionSignals, 'overheatScore' | 'label'>;
}

/** Confirm execution input */
export interface ConfirmExecutionInput {
  note?: string;
  confirmedAt?: string; // ISO, defaults to server time
}
