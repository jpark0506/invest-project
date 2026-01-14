import { useMutation } from '@tanstack/react-query';
import type { Execution } from '@invest-assist/core';
import { apiClient } from '@/shared/api';

export interface TriggerResponse {
  ok: boolean;
  status: 'created' | 'skipped' | 'exists' | 'error';
  message: string;
  dryRun: boolean;
  execution: Execution | null;
}

interface TriggerRequest {
  dryRun?: boolean;
  force?: boolean;
}

export function useTriggerScheduler() {
  return useMutation({
    mutationFn: async (request?: TriggerRequest) => {
      return apiClient.post<TriggerResponse>('/scheduler/trigger', request ?? {});
    },
  });
}
