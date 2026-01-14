import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';

interface TriggerResponse {
  ok: boolean;
  status: 'created' | 'skipped' | 'exists' | 'error';
  message: string;
  dryRun: boolean;
  execution: {
    ymCycle: string;
    yearMonth: string;
    cycleIndex: number;
    cycleBudget: number;
    itemCount: number;
  } | null;
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
