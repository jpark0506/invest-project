/**
 * Scheduler module types
 */

export interface RunSchedulerInput {
  dryRun?: boolean;
}

export interface RunSchedulerOutput {
  processed: number;
  succeeded: number;
  failed: number;
  errors: SchedulerError[];
}

export interface SchedulerError {
  userId: string;
  planId: string;
  message: string;
}

export interface PriceData {
  ticker: string;
  price: number;
  currency: 'KRW' | 'USD'; // Currency of the price
  source: string;
  fetchedAt: string;
}
