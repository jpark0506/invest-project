import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';

interface TriggerResponse {
  ok: boolean;
  dryRun: boolean;
}

interface TriggerRequest {
  dryRun?: boolean;
}

export function useTriggerScheduler() {
  return useMutation({
    mutationFn: async (request?: TriggerRequest) => {
      return apiClient.post<TriggerResponse>('/scheduler/trigger', request ?? {});
    },
  });
}
