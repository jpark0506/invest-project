import { apiClient } from '@/shared/api';
import type { Execution, ExecutionSummary, ConfirmExecutionInput } from '@invest-assist/core';

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

export interface DeleteExecutionResponse {
  ok: boolean;
  message: string;
}

export const executionApi = {
  list: (yearMonth?: string) => {
    const params = yearMonth ? `?ym=${yearMonth}` : '';
    return apiClient.get<GetExecutionsResponse>(`/executions${params}`);
  },

  getDetail: (ymCycle: string) => {
    const encoded = encodeURIComponent(ymCycle);
    return apiClient.get<GetExecutionDetailResponse>(`/executions/${encoded}`);
  },

  confirm: (ymCycle: string, data: ConfirmExecutionInput) => {
    const encoded = encodeURIComponent(ymCycle);
    return apiClient.post<ConfirmExecutionResponse>(`/executions/${encoded}/confirm`, data);
  },

  delete: (ymCycle: string) => {
    const encoded = encodeURIComponent(ymCycle);
    return apiClient.delete<DeleteExecutionResponse>(`/executions/${encoded}`);
  },
};
