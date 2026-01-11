/**
 * Execution module types (re-export from core + API specific)
 */

import type {
  Execution,
  ExecutionSummary,
  ConfirmExecutionInput,
} from '@invest-assist/core';

export type { Execution, ExecutionSummary, ConfirmExecutionInput };

export interface GetExecutionsResponse {
  executions: ExecutionSummary[];
}

export interface GetExecutionDetailResponse {
  execution: Execution | null;
}

export interface ConfirmExecutionResponse {
  execution: Execution;
}
