import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { executionApi, ConfirmExecutionInput } from '../api';

export function useExecutions(yearMonth?: string) {
  return useSuspenseQuery({
    queryKey: ['executions', yearMonth],
    queryFn: () => executionApi.list(yearMonth),
  });
}

export function useExecutionDetail(ymCycle: string) {
  return useSuspenseQuery({
    queryKey: ['execution', ymCycle],
    queryFn: () => executionApi.getDetail(ymCycle),
  });
}

export function useConfirmExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ymCycle, data }: { ymCycle: string; data: ConfirmExecutionInput }) =>
      executionApi.confirm(ymCycle, data),
    onSuccess: (_, { ymCycle }) => {
      queryClient.invalidateQueries({ queryKey: ['execution', ymCycle] });
      queryClient.invalidateQueries({ queryKey: ['executions'] });
    },
  });
}

export function useDeleteExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ymCycle: string) => executionApi.delete(ymCycle),
    onSuccess: (_, ymCycle) => {
      queryClient.invalidateQueries({ queryKey: ['execution', ymCycle] });
      queryClient.invalidateQueries({ queryKey: ['executions'] });
    },
  });
}
