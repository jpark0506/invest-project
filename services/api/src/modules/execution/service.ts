/**
 * Execution service
 */

import * as executionRepo from './repo';
import type {
  GetExecutionsResponse,
  GetExecutionDetailResponse,
  ConfirmExecutionResponse,
  ConfirmExecutionInput,
} from './types';

/**
 * Get executions for a month
 */
export async function getExecutions(
  userId: string,
  yearMonth?: string
): Promise<GetExecutionsResponse> {
  // Default to current month
  const ym = yearMonth || getCurrentYearMonth();
  const executions = await executionRepo.getExecutionsByMonth(userId, ym);
  return { executions };
}

/**
 * Get execution detail
 */
export async function getExecutionDetail(
  userId: string,
  ymCycle: string
): Promise<GetExecutionDetailResponse> {
  const execution = await executionRepo.getExecution(userId, ymCycle);
  return { execution };
}

/**
 * Confirm execution
 */
export async function confirmExecution(
  userId: string,
  ymCycle: string,
  input: ConfirmExecutionInput
): Promise<ConfirmExecutionResponse> {
  const existing = await executionRepo.getExecution(userId, ymCycle);
  if (!existing) {
    throw new Error('Execution not found');
  }

  if (existing.status === 'CONFIRMED') {
    throw new Error('Execution is already confirmed');
  }

  const confirmedAt = input.confirmedAt || new Date().toISOString();
  const execution = await executionRepo.confirmExecution(
    userId,
    ymCycle,
    input.note || null,
    confirmedAt
  );

  if (!execution) {
    throw new Error('Failed to confirm execution');
  }

  return { execution };
}

/**
 * Get current year-month in YYYY-MM format
 */
function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
